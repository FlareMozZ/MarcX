// Comprehensive Environmental & Third-Party Connection Validation Suite
// Run using: npx tsx test_connections.ts

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import dns from "dns";

// Force IPv4 routing priority to bypass local network/ISP packet drops
dns.setDefaultResultOrder("ipv4first");

// Load Environment Configuration
dotenv.config();

const logger = {
  info: (msg: string) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32m✅ SUCCESS:\x1b[0m ${msg}`),
  error: (msg: string) => console.error(`\x1b[31m❌ FAILURE:\x1b[0m ${msg}`),
  heading: (title: string) => console.log(`\n==================================================\n🚀 ${title}\n==================================================`)
};

async function runConnectionDiagnostics() {
  logger.heading("STARTING ARCHITECTURAL ENDPOINT DIAGNOSTICS");
  
  let structuralFailures = 0;

  // --------------------------------------------------------------------
  // UNIT 1: ENVIRONMENT & DNS RESOLUTION
  // --------------------------------------------------------------------
  logger.info("Verifying basic string integrity & network routing paths...");
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logger.error("Supabase environment configuration variables are missing or corrupted in .env");
    structuralFailures++;
  } else {
    // Isolate host string to test real-time structural pathing
    try {
      const host = new URL(supabaseUrl).hostname;
      const dnsResolution = await new Promise<string>((resolve, reject) => {
        dns.lookup(host, (err, address) => err ? reject(err) : resolve(address));
      });
      logger.success(`DNS Routing verified. Domain resolved to target host [${dnsResolution}]`);
    } catch (err: any) {
      logger.error(`DNS routing table mismatch: ${err.message}`);
      structuralFailures++;
    }
  }

  if (!geminiApiKey) {
    logger.error("GEMINI_API_KEY environment variable is not defined.");
    structuralFailures++;
  } else {
    logger.success("Gemini localized token string presence verified.");
  }

  if (structuralFailures > 0) {
    logger.error(`Aborting further testing. Fix ${structuralFailures} root-level structural problems first.`);
    process.exit(1);
  }

  // Initialize clients safely now that keys are verified
  const supabase = createClient(supabaseUrl!, supabaseKey!);
  const ai = new GoogleGenAI({ apiKey: geminiApiKey! });

  // --------------------------------------------------------------------
  // UNIT 2: SUPABASE POSTGRES DB & SCHEMAS
  // --------------------------------------------------------------------
  logger.heading("TESTING SUPABASE POSTGRES TABLE LAYOUTS");
  
  const targetTables = ["categories", "ideas", "canvases", "canvas_nodes"]; // From setup.sql Schema
  
  for (const table of targetTables) {
    try {
      logger.info(`Checking access boundaries for table [${table}]...`);
      
      // Perform a minimal operational limit payload query to verify access/RLS policies
      const { data, error } = await supabase.from(table).select("*").limit(1);
      
      if (error) throw error;
      
      logger.success(`Table [${table}] communication boundary verified online (Found ${data?.length} records).`);
    } catch (dbErr: any) {
      logger.error(`Failed connection check on table [${table}]: ${dbErr.message}`);
    }
  }

  // --------------------------------------------------------------------
  // UNIT 3: SUPABASE STORAGE ENGINE
  // --------------------------------------------------------------------
  logger.heading("TESTING SUPABASE STORAGE ENGINE");
  
  const tempTestBucket = "assets"; // Change to your active project bucket profile if applicable
  const testFileName = `connection_probe_${Date.now()}.txt`;
  const textBuffer = Buffer.from("Connection health-check verification token.");

  try {
    logger.info(`Attempting verification file write into storage bucket [${tempTestBucket}]...`);
    
    // 1. Test Write
    const { error: uploadError } = await supabase.storage
      .from(tempTestBucket)
      .upload(testFileName, textBuffer, { contentType: "text/plain", cacheControl: "3600" });

    if (uploadError) {
      // Check if it's just a bucket-not-found error, or a complete connection failure
      if (uploadError.message.includes("Bucket not found")) {
        logger.info(`⚠️  Storage verification skipped: Bucket '${tempTestBucket}' does not exist on your instance. Create it in your Supabase dashboard to use storage.`);
      } else {
        throw uploadError;
      }
    } else {
      logger.success(`Successfully uploaded validation payload directly to cloud bucket object tree.`);
      
      // 2. Clean up/Delete test file if upload passed
      logger.info("Purging temporary diagnostic storage artifact from remote node...");
      const { error: deleteError } = await supabase.storage.from(tempTestBucket).remove([testFileName]);
      if (deleteError) throw deleteError;
      logger.success("Cloud storage read/write lifecycle complete.");
    }
  } catch (storageErr: any) {
    logger.error(`Storage client layer failed to respond or resolve connection: ${storageErr.message}`);
  }

  // --------------------------------------------------------------------
  // UNIT 4: GOOGLE GEMINI GENAI SDK CONNECTIVITY
  // --------------------------------------------------------------------
  logger.heading("TESTING GOOGLE GEMINI INTELLIGENCE LAYER");
  
  try {
    logger.info("Dispatching dynamic analytical token stream using gemini-2.5-flash...");
    
    // Modern Google GenAI SDK interface execution pattern
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Respond with exactly the phrase: 'Intelligence Engine Online'.",
    });

    const outputText = response.text?.trim();
    if (outputText?.includes("Intelligence Engine Online")) {
      logger.success(`Gemini API connection optimal. Received back: "${outputText}"`);
    } else {
      throw new Error(`Unexpected generation value returned from model stack: ${outputText}`);
    }
  } catch (aiErr: any) {
    logger.error(`Google GenAI abstraction layer threw exception pipeline errors: ${aiErr.message}`);
  }

  logger.heading("DIAGNOSTIC CYCLE EVALUATION COMPLETE");
}

runConnectionDiagnostics();

// curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent" \
//   -H 'Content-Type: application/json' \
//   -H 'X-goog-api-key: AQ.Ab8RN6LJQcP7VaSrG23Q-bF-yVxZUI0-H7du5ZLH7Phh0h4e1A' \
//   -X POST \
//   -d '{
//     "contents": [
//       {
//         "parts": [
//           {
//             "text": "Explain how AI works in a few words"
//           }
//         ]
//       }
//     ]
//   }'