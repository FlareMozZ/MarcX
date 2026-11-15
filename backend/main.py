# ========================================================================
# DEPRECATED: ALL INGESTION AND AI SPEC PROCESSING UNIFIED IN server.ts
# This file is kept only as a reference implementation.
# ========================================================================
import os
import re
import json
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, HttpUrl
from fastapi import FastAPI, BackgroundTasks, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Import standard Google GenAI SDK (Modern equivalent)
from google import genai
from google.genai import types

# Import Supabase
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI App
app = FastAPI(
    title="IdeaBox Backend Ingestion Pipeline",
    description="Asynchronous idea capture, web scraping, Gemini structuring, and Supabase persistence.",
    version="1.0.0"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy client initializations to prevent app crashes when keys are missing on startup
def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not defined.")
    return genai.Client(api_key=api_key)

def get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL or SUPABASE_KEY environment variable is not defined.")
    return create_client(supabase_url, supabase_key)


# Request schemas
class CaptureRequest(BaseModel):
    sourceinput: str
    implementationnotes: Optional[str] = None


# Helper function to check if a string is a valid URL
def is_valid_url(url_str: str) -> bool:
    regex = re.compile(
        r'^(?:http|ftp)s?://' # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|' # domain...
        r'localhost|' # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})' # ...or ip
        r'(?::\d+)?' # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return re.match(regex, url_str) is not None


async def scrape_web_page(url: str) -> str:
    """
    Standard HTML scraping layer using HTTPX and BeautifulSoup4
    to extract main text body content.
    """
    try:
        logger.info(f"Initiating scraping for URL: {url}")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            # Extract content text nicely
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Remove minor scripts/style sections
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
                
            text_content = soup.get_text(separator=" ")
            
            # Clean up whitespace
            cleaned_text = re.sub(r'\s+', ' ', text_content).strip()
            # Constrain to first 60,000 characters to fit Gemini context efficiently
            return cleaned_text[:60000]
    except Exception as e:
        logger.error(f"Error occurred during web scraping: {str(e)}")
        # Fallback to returning url string if scraping fails
        return f"[Scrape Failure for {url}]: {str(e)}"


async def process_ingestion_background(source_input: str, notes: Optional[str]):
    """
    Background worker process: Scrape -> Structure with Gemini -> Insert to Supabase.
    """
    try:
        logger.info("Background task started.")
        raw_text = ""
        
        # 1. Scrape if URL is detected
        if is_valid_url(source_input):
            raw_text = await scrape_web_page(source_input)
        else:
            raw_text = source_input
            
        logger.info(f"Gathered raw text length: {len(raw_text)}")
        
        # Add supplementary user guidelines if they exist
        guideline_context = f"\n\nSupplementary Guideline/Implementation Notes: {notes}" if notes else ""
        
        # 2. Structure using Google Gemini API
        client = get_gemini_client()
        
        system_instruction = (
            "You are a strict, engineering-focused project ideation and system architecture analyst. "
            "Examine the user's raw thoughts, scraped resource pages, or project files and generate a highly "
            "structured specification.\n\n"
            "You MUST output a clean, minified valid JSON object containing exactly these fields and no extras:\n"
            "{\n"
            '  "title": "A short, catchy, execution-focused project name",\n'
            '  "domaintag": "A single category like \'Full-Stack\', \'Homelab\', \'Mobile App\', \'Computer Science\', etc.",\n'
            '  "feasibility": "Either \'Micro-MVP\', \'Medium Project\', or \'Large System\'",\n'
            '  "corethesis": "A clean markdown block deconstructing the core value proposition of the idea",\n'
            '  "proposedtechstack": ["An array of string tags representing the stack, e.g., \'ReactJS\', \'FastAPI\', \'Docker\'"]\n'
            "}"
        )
        
        # Call modern gemini-3.5-flash or gemini-3.1-pro-preview based on configuration
        # gemini-3.5-flash is our standard, efficient text tasks model.
        # Fall back to 'gemini-1.5-pro' if specifically requested, but 'gemini-3.5-flash' is recommended by our platform guidelines
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        
        prompt = f"Scraped source context:\n{raw_text}{guideline_context}"
        
        logger.info(f"Invoking Gemini model: {model_name}")
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.2, # Lower temperature for stable JSON output
            )
        )
        
        json_output_str = response.text.strip()
        logger.info(f"Structured Gemini JSON obtained: {json_output_str}")
        
        parsed_data: Dict[str, Any] = json.loads(json_output_str)
        
        # 3. Store in Supabase storage layer
        supabase: Client = get_supabase_client()
        
        # Map values to their respective schema columns
        db_row = {
            "title": parsed_data.get("title", "Unnamed Captured Idea"),
            "domaintag": parsed_data.get("domaintag", "Uncategorized"),
            "feasibility": parsed_data.get("feasibility", "Medium Project"),
            "status": "Inbox",
            "rawsourcecontent": raw_text[:100000],  # Restrict raw content if excessively large
            "documentbody": parsed_data  # Storing the entire JSON block for Notion Doc view
        }
        
        logger.info("Inserting row to Supabase 'ideas' table.")
        result = supabase.table("ideas").insert(db_row).execute()
        logger.info(f"Successfully persistence complete: {result.data}")
        
    except Exception as e:
        logger.error(f"Failed to process ingestion background task securely: {str(e)}")


@app.post("/api/capture", status_code=status.HTTP_202_ACCEPTED)
async def capture_idea(request: CaptureRequest, background_tasks: BackgroundTasks):
    """
    POST /api/capture
    Receives raw thoughts, bookmarks, or web resources. Returns immediately (202 Accepted)
    while processing content using native FastAPI BackgroundTasks.
    """
    # Validation checks
    if not request.sourceinput.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source Input of a text thought or URL cannot be empty."
        )
        
    # Queue the pipeline processing to avoid UI blocking
    background_tasks.add_task(
        process_ingestion_background,
        request.sourceinput.strip(),
        request.implementationnotes
    )
    
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "success": True,
            "message": "Asynchronous ingestion initiated successfully. Analyzing and cataloging in progress.",
            "status": "Queued"
        }
    )


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "IdeaBox Ingestion API"}


# Local development runner
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
