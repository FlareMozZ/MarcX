import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Ensure upload folders exist for localized, high-performance static asset ingestion
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded assets statically
app.use("/uploads", express.static(uploadDir));

// POST /api/upload: Store file buffers in Supabase Storage or fallback locally
app.post("/api/upload", async (req, res) => {
  const { filename, base64 } = req.body || {};
  if (!base64) {
    return res.status(400).json({ error: "Missing file buffer payload." });
  }

  const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
  const rawBuffer = Buffer.from(cleanBase64, "base64");
  const ext = (filename || "image.png").split(".").pop() || "png";
  const secureName = `${crypto.randomUUID()}.${ext}`;

  try {
    // Check if Supabase client is configured and active
    const supabase = getSupabaseClient();
    if (supabase) {
      const bucketName = "blueprints";
      console.log(`Supabase Client Active: Ingesting file '${filename}' directly to Storage Bucket '${bucketName}'...`);
      
      let mimeType = "image/png";
      const e = ext.toLowerCase();
      if (e === "jpg" || e === "jpeg") mimeType = "image/jpeg";
      else if (e === "gif") mimeType = "image/gif";
      else if (e === "svg") mimeType = "image/svg+xml";
      else if (e === "pdf") mimeType = "application/pdf";
      else if (e === "zip") mimeType = "application/zip";
      
      // Try uploading to public bucket
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(secureName, rawBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        // Automatically create bucket if it does not exist (custom user integration friendly)
        if (error.message && (error.message.includes("not found") || error.message.includes("does not exist") || (error as any).statusCode === 404)) {
          console.log(`Bucket '${bucketName}' missing. Creating dynamic public store bucket...`);
          try {
            await supabase.storage.createBucket(bucketName, { public: true });
            
            // Retry upload
            const { data: retryData, error: retryError } = await supabase.storage
              .from(bucketName)
              .upload(secureName, rawBuffer, {
                contentType: mimeType,
                upsert: true
              });
            if (retryError) throw retryError;
          } catch (createErr: any) {
            console.error("Failed creating bucket dynamically:", createErr);
            throw error;
          }
        } else {
          throw error;
        }
      }
      
      // Successfully uploaded! Retrieve public path link immediately
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(secureName);
      if (urlData && urlData.publicUrl) {
        console.log(`File uploaded successfully to Supabase. Domain resolution: ${urlData.publicUrl}`);
        return res.json({ success: true, url: urlData.publicUrl });
      }
    }
  } catch (supabaseErr: any) {
    console.warn("⚠️ Supabase ingestion pipeline warning. Falling back to safe local file storage system:", supabaseErr.message || supabaseErr);
  }

  // Fallback local file system operation
  try {
    const targetPath = path.join(uploadDir, secureName);
    fs.writeFileSync(targetPath, rawBuffer);
    const fileUrl = `/uploads/${secureName}`;
    return res.json({ success: true, url: fileUrl });
  } catch (err: any) {
    console.error("Local file writer routing failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

// In-memory fallback database to guarantee functional UI preview in dev without keys
let localInMemoryCategories: any[] = [
  {
    id: "55d810f2-5174-4770-ae38-ca4badd69c3f",
    name: "Computer Science",
    description: "Core architectures, modular analysis, and harmless LLM frameworks.",
    icon_color: "#938ab3"
  },
  {
    id: "c9b1fec0-e374-4b5c-a212-be2069eeb7d2",
    name: "Quantum Sandbox",
    description: "Experimental processing units and raw quantum mechanical simulations.",
    icon_color: "#6293a3"
  }
];

let localInMemoryIdeas: any[] = [
  {
    id: '62b9a117-90f1-4db8-b4b1-9f939eafbef1',
    domain_id: '55d810f2-5174-4770-ae38-ca4badd69c3f',
    title: "The Hitchhiker's Guide to Program Analysis, Part III: Mostly Harmless LLMs",
    description: "An elegant exposition of recursive state machines combined with transformer predictions, showcasing full-stack telemetry and safe prompt execution patterns.",
    domain_tag: "Computer Science",
    feasibility: "Macro-MVP",
    status: "Raw",
    tech_stacks: ['Recursive State Machines', 'Transformer Predictions', 'Full-Stack Telemetry', 'Safe Prompt Execution'],
    year: "2026",
    type: "notebook",
    color: "lilac",
    comments: [],
    created_at: new Date().toISOString(),
    notion_blocks: [],
    canvas_nodes: []
  },
  {
    id: 'f9a1fec0-e374-4b5c-a212-be2069eeb7d2',
    domain_id: '55d810f2-5174-4770-ae38-ca4badd69c3f',
    title: "Trust by design -- in praise of modularization: a case study",
    description: "Exploring how architectural design isolation boundaries prevent systemic cascade failure in distributed backend environments.",
    domain_tag: "Computer Science",
    feasibility: "Medium-Scope",
    status: "In-Progress",
    tech_stacks: ['Design Isolation Boundaries', 'Cascade Prevention', 'Distributed Backend'],
    year: "2026",
    type: "item",
    color: "mint",
    comments: [],
    created_at: new Date().toISOString(),
    notion_blocks: [],
    canvas_nodes: []
  }
];

// Fallback in-memory databases for canvases and canvas_nodes
let localInMemoryCanvases: any[] = [];
let localInMemoryCanvasNodes: any[] = [];

// Lazy helpers for secure integrations
const getGeminiClient = () => {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY environment variable is missing. Ingestion pipeline will simulate analysis.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
    // Explicitly forces the SDK to route traffic to the AI Studio developer REST engine 
    // rather than the cloud enterprise engine which demands OAuth access tokens.
    baseUrl: "https://generativelanguage.googleapis.com",
    apiVersion: "v1beta",

  }
  });
};

const getSupabaseClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) {
    console.warn("⚠️ SUPABASE_URL or SUPABASE_KEY environment variables are missing. Defaulting to local in-memory storage.");
    return null;
  }
  return createClient(url, key);
};

// Compliant UUID v4 checks and generation
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str || "");
};

const getStableUUID = (str: string): string => {
  if (isUUID(str)) return str;
  const hash = crypto.createHash('md5').update(str || "").digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};

const generateUUID = (): string => {
  return crypto.randomUUID();
};

const getRandomIdeaColor = (): "lilac" | "sky" | "mint" | "peach" => {
  const colors = ["lilac", "sky", "mint", "peach"] as const;
  return colors[Math.floor(Math.random() * colors.length)];
};

const getStableIdeaColor = (id: string): "lilac" | "sky" | "mint" | "peach" => {
  const colors = ["lilac", "sky", "mint", "peach"] as const;
  if (!id) return "peach";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Robust helper to insert canvas nodes into Supabase, handling schema variations dynamically
const safeInsertCanvasNodes = async (supabase: any, nodes: any[]): Promise<void> => {
  if (!supabase || !nodes || nodes.length === 0) return;
  
  // Clone nodes to avoid modifying parameters
  const clonedNodes = JSON.parse(JSON.stringify(nodes));
  
  // 1. Ensure absolute uniqueness of IDs within the batch itself
  const seenIds = new Set<string>();
  clonedNodes.forEach((n: any) => {
    if (seenIds.has(n.id)) {
      n.id = generateUUID();
    }
    seenIds.add(n.id);
  });

  // 2. Query Supabase to see if any of these IDs already exist under another canvas to prevent PKey constraint violations
  try {
    const ids = clonedNodes.map((n: any) => n.id);
    const { data: existingRows, error: checkError } = await supabase
      .from("canvas_nodes")
      .select("id, canvas_id")
      .in("id", ids);

    if (!checkError && existingRows && existingRows.length > 0) {
      const existingMap = new Map<string, string>(); // id -> canvas_id
      existingRows.forEach((r: any) => {
        existingMap.set(r.id, r.canvas_id);
      });

      clonedNodes.forEach((n: any) => {
        const existingCanvasId = existingMap.get(n.id);
        // If the ID exists in another canvas, we must regenerate it to prevent unique key violation
        if (existingCanvasId && existingCanvasId !== n.canvas_id) {
          console.log(`⚠️ Regenerating node ID ${n.id} because it already exists in canvas ${existingCanvasId} to prevent duplicate key violations.`);
          n.id = generateUUID();
        }
      });
    }
  } catch (checkErr) {
    console.warn("Could not check existing canvas node IDs in database:", checkErr);
  }
  
  console.log(`Attempting to insert ${clonedNodes.length} canvas nodes...`);
  const { error } = await supabase.from("canvas_nodes").insert(clonedNodes);
  if (!error) {
    console.log("Canvas nodes inserted successfully on first attempt.");
    return;
  }
  
  console.warn("⚠️ Canvas nodes insertion failed. Schema discrepancy detected, attempting recovery:", error.message || error);
  
  // Progressively drop columns that might be missing in older schemas (such as in supabase_setup.sql)
  const columnsToTryDropping = ["resource_url", "resource_title", "code_snippet", "item_id", "files"];
  let currentNodes = clonedNodes;
  
  for (const col of columnsToTryDropping) {
    currentNodes = currentNodes.map((n: any) => {
      const { [col]: _, ...rest } = n;
      return rest;
    });
    
    console.log(`Retrying canvas nodes insert without column '${col}'...`);
    const { error: retryError } = await supabase.from("canvas_nodes").insert(currentNodes);
    if (!retryError) {
      console.log(`Successfully recovered and inserted canvas nodes without column '${col}'.`);
      return;
    }
    console.warn(`Retry without column '${col}' failed:`, retryError.message || retryError);
  }
  
  // Last resort fallback: insert using only standard columns guaranteed to be in both schemas
  const bareMinimumNodes = clonedNodes.map((n: any) => ({
    id: n.id,
    canvas_id: n.canvas_id,
    type: n.type || "note",
    title: n.title || "Node",
    content: n.content || "",
    x: Math.round(n.x) || 0,
    y: Math.round(n.y) || 0,
    width: Math.round(n.width) || 300,
    height: Math.round(n.height) || 250
  }));
  
  console.log("Executing last resort fallback with minimum schema...");
  const { error: finalError } = await supabase.from("canvas_nodes").insert(bareMinimumNodes);
  if (finalError) {
    console.error("❌ All canvas nodes database insertion attempts failed:", finalError.message || finalError);
    throw finalError;
  }
  console.log("Successfully recovered and inserted canvas nodes with minimum schema.");
};

// Convert a database idea row back to the React app's DomainItem
const convertToDomainItem = (row: any) => {
  const domainId = row.domain_id || row.domainId || "computer-science";
  const domainTag = row.domain_tag || row.domainTag || "Full-Stack";
  const title = row.title || "Unnamed";
  const description = row.description || "";
  const feasibility = row.feasibility || "Medium-Scope";
  const status = row.status || "Inbox";
  const techStacks = Array.isArray(row.tech_stacks) ? row.tech_stacks : (Array.isArray(row.techStacks) ? row.techStacks : []);
  const year = row.year || (row.created_at ? new Date(row.created_at).getFullYear().toString() : "2026");
  const type = row.type || "item";
  const color = row.color || getStableIdeaColor(row.id);
  const comments = Array.isArray(row.comments) ? row.comments : [];
  const createdAt = row.created_at || row.createdAt || new Date().toISOString();

  // Fallback system for notion blocks
  const notionBlocksField = row.notion_blocks || row.notionBlocks;
  let notionBlocks = Array.isArray(notionBlocksField) ? notionBlocksField : [];
  if (notionBlocks.length === 0) {
    notionBlocks = [
      {
        id: `b-head-main-${row.id}`,
        type: "heading" as const,
        content: "Abstract Blueprint Thesis",
      },
      {
        id: `b-paragraph-main-${row.id}`,
        type: "paragraph" as const,
        content: description || "No thesis proposed yet.",
      },
      {
        id: `b-head-tech-${row.id}`,
        type: "heading" as const,
        content: "Recommended Technology Architecture Stack",
      },
      ...techStacks.map((tech: string, i: number) => ({
        id: `b-bullet-${row.id}-${i}`,
        type: "bullet" as const,
        content: `System Core Dependency: ${tech} integration module.`,
      })),
      {
        id: `b-head-action-${row.id}`,
        type: "heading" as const,
        content: "Ingestion Milestones",
      },
      {
        id: `b-todo-1-${row.id}`,
        type: "todo" as const,
        content: `Spin up initial sandbox environment for ${techStacks[0] || "FastAPI"} development service.`,
        completed: true,
      },
      {
        id: `b-todo-2-${row.id}`,
        type: "todo" as const,
        content: `Integrate and parse ingestion inputs and verify web links.`,
        completed: false,
      },
      {
        id: `b-code-${row.id}`,
        type: "code" as const,
        content: `// Automatically structured backend service entrypoint\nconst bootstrap = async (config) => {\n  console.log("Igniting ${techStacks.join(', ')} container context...");\n};`,
      }
    ];
  }

  const canvasNodesField = row.canvas_nodes || row.canvasNodes;
  const canvasNodes = Array.isArray(canvasNodesField) ? canvasNodesField : [];

  // Fallback connections decoding from description serialization pattern
  let connections = Array.isArray(row.connections) ? row.connections : [];
  let cleanDesc = description;
  if (connections.length === 0 && description.includes('__CONNECTIONS__')) {
    try {
      const parts = description.split('__CONNECTIONS__');
      cleanDesc = parts[0];
      connections = JSON.parse(parts[1]);
    } catch (e) {
      connections = [];
    }
  }

  return {
    id: row.id,
    domainId,
    title,
    description: cleanDesc,
    domainTag,
    feasibility,
    status,
    techStacks,
    year,
    type,
    color,
    comments,
    createdAt,
    notionBlocks,
    canvasNodes,
    connections,
  };
};

// Simple web scraper utility (Node version)
const scrapeWebPage = async (urlStr: string): Promise<string> => {
  try {
    console.log(`Node Core Scraper: Fetching page ${urlStr}`);
    const response = await fetch(urlStr, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP Error Status: ${response.status}`);
    }
    const htmlText = await response.text();
    
    // Quick regex based html-stripper to extract readable text
    let plainText = htmlText
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return plainText.slice(0, 60000); // chunk content limit
  } catch (err: any) {
    console.error("Scraper Error:", err);
    return `[Website content retrieval issue for ${urlStr}]: ${err.message}`;
  }
};

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// GET /api/categories: Retrieve categories from Supabase or in-memory seeds
app.get("/api/categories", async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });
        
      if (error) {
        throw error;
      }
      
      // Auto-seed if empty in active DB so the workspace is alive
      if (!data || data.length === 0) {
        console.log("Categories table empty. Seeding defaults...");
        const seedCategories = localInMemoryCategories.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          icon_color: c.icon_color
        }));
        const { error: seedError } = await supabase.from("categories").insert(seedCategories);
        if (!seedError) {
          return res.json(seedCategories);
        }
      }
      return res.json(data || []);
    } else {
      return res.json(localInMemoryCategories);
    }
  } catch (err: any) {
    console.error("API error fetching categories:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/categories: Create a new category domain dynamically
app.post("/api/categories", async (req, res) => {
  try {
    const { id, name, description, iconColor, icon_color } = req.body;
    const finalIconColor = iconColor || icon_color || "#938ab3";
    const finalId = id && isUUID(id) ? id : generateUUID();
    const newCat = {
      id: finalId,
      name,
      description: description || "Custom Category",
      icon_color: finalIconColor
    };
    
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from("categories").insert(newCat);
      if (error) throw error;
    } else {
      localInMemoryCategories.push(newCat);
    }
    
    return res.json({
      success: true,
      category: {
        id: finalId,
        name: newCat.name,
        description: newCat.description,
        iconColor: finalIconColor
      }
    });
  } catch (err: any) {
    console.error("API error creating category:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/categories/:id: Update active category metadata description
app.post("/api/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, iconColor, icon_color } = req.body;
    const finalIconColor = iconColor || icon_color || "#938ab3";
    const updateData = {
      name,
      description,
      icon_color: finalIconColor
    };
    
    const supabase = getSupabaseClient();
    if (supabase && isUUID(id)) {
      const { error } = await supabase.from("categories").update(updateData).eq("id", id);
      if (error) throw error;
    } else {
      localInMemoryCategories = localInMemoryCategories.map(c => 
        c.id === id ? { ...c, ...updateData } : c
      );
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error("API error updating category:", err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/categories/:id: Delete domain and execute safe cascade deletions on ideas
app.delete("/api/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();
    if (supabase && isUUID(id)) {
      const { error: ideasError } = await supabase.from("ideas").delete().eq("domain_id", id);
      if (ideasError) console.warn("Cascade ideas deletion warning:", ideasError);
      
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    } else {
      localInMemoryCategories = localInMemoryCategories.filter(c => c.id !== id);
      localInMemoryIdeas = localInMemoryIdeas.filter(i => i.domain_id !== id);
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error("API error deleting category:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/ideas: Retrieve structured ideas from Supabase database or in-memory fallback
app.get("/api/ideas", async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      // 1. Fetch ideas where type !== 'canvas'
      const { data: ideasData, error: ideasError } = await supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (ideasError) {
        throw ideasError;
      }

      // 2. Fetch canvases from the canvases table
      const { data: canvasesData, error: canvasesError } = await supabase
        .from("canvases")
        .select("*")
        .order("created_at", { ascending: false });

      if (canvasesError) {
        console.warn("Supabase Canvases query error (might need migration fallback):", canvasesError);
      }

      // 3. Fetch canvas nodes from the canvas_nodes table
      const { data: nodesData, error: nodesError } = await supabase
        .from("canvas_nodes")
        .select("*")
        .order("created_at", { ascending: true });

      if (nodesError) {
        console.warn("Supabase Canvas Nodes query error (might need migration fallback):", nodesError);
      }

      // 4. Fetch categories to map category ID to name
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*");
      
      const catMap = new Map<string, string>();
      if (categoriesData) {
        categoriesData.forEach((c: any) => {
          catMap.set(c.id, c.name);
        });
      }

      const clientIdeas = (ideasData || [])
        .filter((row: any) => row.type !== "canvas")
        .map(convertToDomainItem);

      const clientCanvases = (canvasesData || []).map((canvas: any) => {
        const associatedNodes = (nodesData || [])
          .filter((n: any) => n.canvas_id === canvas.id)
          .map((n: any) => ({
            id: n.id,
            type: n.type || "note",
            title: n.title,
            content: n.content,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            itemId: n.item_id,
            files: Array.isArray(n.files) ? n.files : [],
            codeSnippet: n.code_snippet,
            resourceUrl: n.resource_url,
            resourceTitle: n.resource_title
          }));

        const resolvedTag = catMap.get(canvas.domain_id) || canvas.domain_tag || "Architectural";
        const connections = Array.isArray(canvas.connections) ? canvas.connections : [];
        const cleanDesc = canvas.description || "";

        return {
          id: canvas.id,
          domainId: canvas.domain_id,
          title: canvas.title || "Unnamed Canvas",
          description: cleanDesc,
          domainTag: resolvedTag,
          feasibility: "Medium-Scope",
          status: "Inbox",
          techStacks: [],
          year: canvas.created_at ? new Date(canvas.created_at).getFullYear().toString() : "2026",
          type: "canvas" as const,
          color: canvas.color || "lilac",
          comments: [],
          createdAt: canvas.created_at || new Date().toISOString(),
          canvasNodes: associatedNodes,
          connections
        };
      });

      const combined = [...clientIdeas, ...clientCanvases].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return res.json(combined);
    } else {
      // In-Memory map fallback
      const clientIdeas = localInMemoryIdeas
        .filter(idea => idea.type !== "canvas")
        .map(convertToDomainItem);

      const clientCanvases = localInMemoryCanvases.map((canvas: any) => {
        const associatedNodes = localInMemoryCanvasNodes
          .filter((n: any) => n.canvas_id === canvas.id)
          .map((n: any) => ({
            id: n.id,
            type: n.type || "note",
            title: n.title,
            content: n.content,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            itemId: n.itemId,
            files: n.files || [],
            codeSnippet: n.codeSnippet,
            resourceUrl: n.resourceUrl,
            resourceTitle: n.resourceTitle
          }));

        let connections: any[] = [];
        let cleanDesc = canvas.description || "";
        if (cleanDesc.includes("__CONNECTIONS__")) {
          try {
            const parts = cleanDesc.split("__CONNECTIONS__");
            cleanDesc = parts[0];
            connections = JSON.parse(parts[1]);
          } catch (e) {
            connections = [];
          }
        }

        return {
          id: canvas.id,
          domainId: canvas.domain_id,
          title: canvas.title || "Unnamed Canvas",
          description: cleanDesc,
          domainTag: canvas.domain_tag || "Architectural",
          feasibility: "Medium-Scope",
          status: "Inbox",
          techStacks: [],
          year: "2026",
          type: "canvas" as const,
          color: canvas.color || "lilac",
          comments: [],
          createdAt: canvas.created_at || new Date().toISOString(),
          canvasNodes: associatedNodes,
          connections: connections
        };
      });

      const combined = [...clientIdeas, ...clientCanvases].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return res.json(combined);
    }
  } catch (err: any) {
    console.error("API error fetching ideas list:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/capture: Asynchronous ingestion endpoint
app.post("/api/capture", async (req, res) => {
  const { sourceinput, implementationnotes, domainName } = req.body;
  if (!sourceinput || !sourceinput.trim()) {
    return res.status(400).json({ error: "sourceinput parameter is required." });
  }

  const cleanInput = sourceinput.trim();
  const cleanNotes = implementationnotes ? implementationnotes.trim() : "";
  const categoryName = domainName || "";

  // 1. Immediately return 202 Accepted response to avoid freezing the UI
  res.status(202).json({
    success: true,
    message: "Asynchronous ingestion initiated successfully. Analyzing and cataloging in progress.",
    status: "Queued"
  });

  // 2. Perform the rest of the work in the background (Non-blocking promise)
  Promise.resolve().then(async () => {
    try {
      console.log(`Background Ingestion Pipeline Triggered. Input: ${cleanInput.slice(0, 50)}... Category: ${categoryName}`);
      
      let rawText = cleanInput;
      const isUrl = cleanInput.startsWith("http://") || cleanInput.startsWith("https://") || cleanInput.startsWith("www.");
      
      if (isUrl) {
        const fetchUrl = cleanInput.startsWith("www.") ? `https://${cleanInput}` : cleanInput;
        rawText = await scrapeWebPage(fetchUrl);
      }

      console.log(`Raw Source Text resolved. Length: ${rawText.length}`);

      let aiResult: any = null;
      const ai = getGeminiClient();

      if (ai) {
        const sysPrompt = `You are a strict, engineering-focused project ideation and system architecture analyst. Examine the user's raw thoughts, scraped resource pages, or project files and generate a highly structured specification.
You MUST output a clean, minified valid JSON object containing exactly these fields and no extras:
{
  "title": "A short, catchy, execution-focused project name",
  "domaintag": "A single category like 'Full-Stack', 'Homelab', 'Mobile App', 'Computer Science', etc.",
  "feasibility": "Either 'Micro-MVP', 'Medium Project', or 'Large System'",
  "corethesis": "A clean markdown block deconstructing the core value proposition of the idea",
  "proposedtechstack": ["An array of string tags representing the stack, e.g., 'ReactJS', 'FastAPI', 'Docker'"]
}`;

        console.log("Requesting structured analysis from Gemini (gemini-2.5-flash)...");
        const promptText = `Scraped input source:\n${rawText}\n\nAdditional notes:\n${cleanNotes}${categoryName ? `\n\nTarget Category: ${categoryName}` : ''}`;
        
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptText,
          config: {
            systemInstruction: sysPrompt + (categoryName ? `\n\nIf the user specifies or focuses on a category like "${categoryName}", you should default or prefer to keep "domaintag" as "${categoryName}".` : ''),
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });

        const textOutput = response.text || "";
        console.log("Gemini unstructured response string received:", textOutput);
        aiResult = JSON.parse(textOutput.trim());
      } else {
        // Fallback simulated Gemini parser if no API Key configuration present
        console.log("No Gemini API key present, executing local simulated structuring...");
        const titleComputed = isUrl ? `Analyzed Remote Web Resource` : (cleanInput.length > 30 ? cleanInput.slice(0, 30) + "..." : cleanInput);
        aiResult = {
          title: titleComputed,
          domaintag: categoryName || (isUrl ? "Web Ingest" : "Idea Draft"),
          feasibility: "Micro-MVP",
          corethesis: `### Core Proposition\nThis is a local simulation for testing without configured API keys. Your raw input was: *"${cleanInput}"*\n\nSetup your \`GEMINI_API_KEY\` and \`SUPABASE_URL\` inside your settings panel or \`.env\` file to activate high-fidelity AI-powered classification!`,
          proposedtechstack: ["ReactJS", "NodeJS", "Bootstrap"]
        };
      }

      // Write parsed schema to store
      const dbRow = {
        id: generateUUID(),
        domain_id: getStableUUID(categoryName || aiResult.domaintag || "Computer Science"),
        title: aiResult.title || "Unnamed Ingested Concept",
        description: aiResult.corethesis || "No thesis proposed yet.",
        domain_tag: categoryName || aiResult.domaintag || "Computer Science",
        feasibility: aiResult.feasibility || "Medium-Scope",
        status: "Inbox",
        tech_stacks: aiResult.proposedtechstack || [],
        year: "2026",
        type: "item",
        color: getRandomIdeaColor(),
        comments: [],
        created_at: new Date().toISOString(),
        notion_blocks: [],
        canvas_nodes: []
      };

      const supabase = getSupabaseClient();
      if (supabase) {
        console.log("Writing new row directly into Supabase 'ideas' table.");
        const { error } = await supabase.from("ideas").insert(dbRow);
        if (error) {
          throw error;
        }
        console.log("Persistence complete successfully in Supabase!");
      } else {
        console.log("Writing row locally to In-Memory store.");
        localInMemoryIdeas.unshift(dbRow);
      }
      
    } catch (bgErr) {
      console.error("Background ingestion pipeline failed:", bgErr);
    }
  });
});

// Synchronous, high-fidelity multimodal blueprint ingestion leveraging the Gemini API
app.post("/api/ideas/ingest", async (req, res) => {
  const { sourceinput, implementationnotes, domainId, domainName, images, type } = req.body;
  
  if (!sourceinput && (!images || images.length === 0)) {
    return res.status(400).json({ error: "Input text or an uploaded image is required to ingest." });
  }

  const cleanInput = (sourceinput || "").trim();
  const cleanNotes = (implementationnotes || "").trim();
  const activeDomainId = domainId || "55d810f2-5174-4770-ae38-ca4badd69c3f";
  const activeDomainName = domainName || "Computer Science";
  const finalType = type || "item";

  try {
    let resolvedText = cleanInput;
    const isUrl = cleanInput.startsWith("http://") || cleanInput.startsWith("https://") || cleanInput.startsWith("www.");
    if (isUrl) {
      const fetchUrl = cleanInput.startsWith("www.") ? `https://${cleanInput}` : cleanInput;
      resolvedText = await scrapeWebPage(fetchUrl);
    }

    let aiResult: any = null;
    const ai = getGeminiClient();

    if (ai) {
      const sysPrompt = `You are a world-class system architect and senior mechanical/software design analyst. Your task is deconstructing a user's thoughts and images to produce a professional blueprint spec.
You MUST output a valid JSON object containing exactly these fields:
{
  "title": "catchy execution-focused name for this system",
  "domaintag": "category matching the item",
  "feasibility": "Either 'Micro-MVP', 'Medium-Scope', or 'Large-Scope'",
  "corethesis": "deep-dive markdown text representing core thesis proposition and system model architecture setup",
  "proposedtechstack": ["e.g. TypeScript, ReactJS, FastAPI"],
  "notion_blocks": [
    { "id": "nb-1", "type": "heading", "content": "1. Ingested Spec Scope" },
    { "id": "nb-2", "type": "paragraph", "content": "detailed body notes..." }
  ]
}`;

      const parts: any[] = [];
      if (images && Array.isArray(images)) {
        images.forEach(img => {
          if (img.data) {
            parts.push({
              inlineData: {
                data: img.data,
                mimeType: img.mimeType || "image/png"
              }
            });
          } else if (img.url && img.url.startsWith("/uploads/")) {
            try {
              const fileName = img.url.replace("/uploads/", "");
              const localPath = path.join(uploadDir, fileName);
              if (fs.existsSync(localPath)) {
                const fileType = fileName.split(".").pop() || "png";
                const mimeType = fileType === "jpg" || fileType === "jpeg" ? "image/jpeg" : "image/png";
                const base64Data = fs.readFileSync(localPath).toString("base64");
                parts.push({ inlineData: { data: base64Data, mimeType } });
              }
            } catch (err) {
              console.warn("Failed resolving local image file for Gemini:", err);
            }
          }
        });
      }

      const promptText = `User Raw Input Text:\n${resolvedText}\n\nAdditional Commentary/Notes:\n${cleanNotes}\n\nTarget Container Category: ${activeDomainName}`;
      parts.push({ text: promptText });

      console.log("Querying Gemini...");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
        config: {
          systemInstruction: sysPrompt,
          responseMimeType: "application/json",
          temperature: 0.25
        }
      });

      const textOutput = response.text || "";
      aiResult = JSON.parse(textOutput.trim());
    } else {
      console.log("Gemini API key missing, defaulting to locally simulated cataloger.");
      const cleanedTitle = cleanInput.length > 30 ? cleanInput.slice(0, 30) + "..." : (cleanInput || "Imported Code Module");
      aiResult = {
        title: `Blueprint: ${cleanedTitle}`,
        domaintag: activeDomainName,
        feasibility: "Medium-Scope",
        corethesis: `### Simulated Architectural Blueprint\n\nThis is a mocked model deconstruct. When a valid \`GEMINI_API_KEY\` is configured in your settings, this is fully compiled by the Gemini multimodal vision model.\n\nInput Content Summary: *"${cleanInput}"*`,
        proposedtechstack: ["React", "Express", "Supabase", "Docker"],
        notion_blocks: [
          { id: "nb-1", type: "heading", content: "1. Abstract Blueprint" },
          { id: "nb-2", type: "paragraph", content: "A visual blueprint representation of the ingested nodes." }
        ]
      };
    }

    const id = generateUUID();
    const supabase = getSupabaseClient();

    if (finalType === "canvas") {
      const title = aiResult.title || "Unnamed Ingested Canvas";
      const description = aiResult.corethesis || "No core thesis available.";
      const color = getRandomIdeaColor();
      const createdAt = new Date().toISOString();

      const canvasDbRow = {
        id,
        domain_id: activeDomainId,
        title,
        description,
        color,
        connections: [],
        created_at: createdAt,
        updated_at: createdAt
      };

      const elementNode = {
        id: `node-${id}-1`,
        canvas_id: id,
        type: "note",
        title: title,
        content: description,
        x: -50100,
        y: -50100,
        width: 320,
        height: 280,
        item_id: null,
        code_snippet: null,
        resource_url: null,
        resource_title: null,
        files: []
      };

      localInMemoryCanvases.unshift(canvasDbRow);
      localInMemoryCanvasNodes.push(elementNode);

      if (supabase && isUUID(id)) {
        const { error: canvasError } = await supabase.from("canvases").insert(canvasDbRow);
        if (canvasError) throw canvasError;

        await safeInsertCanvasNodes(supabase, [elementNode]);
      }

      const clientCanvas = {
        id,
        domainId: activeDomainId,
        title,
        description,
        domainTag: activeDomainName,
        feasibility: "Medium-Scope",
        status: "Inbox",
        techStacks: [],
        year: "2026",
        type: "canvas" as const,
        color: color as any,
        comments: [],
        createdAt,
        canvasNodes: [
          {
            id: elementNode.id,
            type: "note" as const,
            title: title,
            content: description,
            x: -50100,
            y: -50100,
            width: 320,
            height: 280,
            files: []
          }
        ],
        connections: []
      };

      return res.json({
        success: true,
        item: clientCanvas
      });
    } else {
      const dbRow = {
        id,
        domain_id: activeDomainId,
        title: aiResult.title || "Unnamed Ingested Module",
        description: aiResult.corethesis || aiResult.description || "No core thesis available.",
        domain_tag: aiResult.domaintag || activeDomainName,
        feasibility: aiResult.feasibility || "Medium-Scope",
        status: "Inbox",
        tech_stacks: aiResult.proposedtechstack || [],
        year: "2026",
        type: finalType,
        color: getRandomIdeaColor(),
        comments: [],
        created_at: new Date().toISOString(),
        notion_blocks: aiResult.notion_blocks || []
      };

      localInMemoryIdeas.unshift(dbRow);

      if (supabase && isUUID(id)) {
        const { error } = await supabase.from("ideas").insert(dbRow);
        if (error) throw error;
      }

      return res.json({
        success: true,
        item: convertToDomainItem(dbRow)
      });
    }

  } catch (err: any) {
    console.error("API error in system ingestion:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Update/Edit an idea: Allows checklist tasks and edits in the document view to persist
app.post("/api/ideas/:id", async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body; // updated DomainItem
  
  try {
    const supabase = getSupabaseClient();
    
    if (updateFields.type === "canvas") {
      const domainId = getStableUUID(updateFields.domainId || "55d810f2-5174-4770-ae38-ca4badd69c3f");
      const title = updateFields.title || "Unnamed";
      const description = updateFields.description || "";
      const color = updateFields.color || "lilac";
      const createdAt = updateFields.createdAt || new Date().toISOString();
      const connections = Array.isArray(updateFields.connections) ? updateFields.connections : [];

      const canvasUpdateRow = {
        id: id,
        domain_id: domainId,
        title,
        description,
        color,
        connections,
        created_at: createdAt,
        updated_at: new Date().toISOString()
      };

      // Always keep local in-memory fallback synchronized
      let found = false;
      localInMemoryCanvases = localInMemoryCanvases.map((canvas) => {
        if (canvas.id === id) {
          found = true;
          return canvasUpdateRow;
        }
        return canvas;
      });
      if (!found) {
        localInMemoryCanvases.push(canvasUpdateRow);
      }

      if (supabase && isUUID(id)) {
        // 1. Update the canvases table
        const { error: canvasError } = await supabase
          .from("canvases")
          .update(canvasUpdateRow)
          .eq("id", id);
          
        if (canvasError) {
          console.error("Error updating canvas metadata:", canvasError);
          throw canvasError;
        }

        // 2. Perform upsert and delete (clean sync) for canvas nodes
        if (updateFields.canvasNodes && updateFields.canvasNodes.length > 0) {
          const nodesToUpsert = updateFields.canvasNodes.map((n: any) => ({
            id: isUUID(n.id) ? n.id : generateUUID(),
            canvas_id: id,
            type: n.type || "note",
            title: n.title || "Node",
            content: n.content || "",
            x: Math.round(n.x) || 0,
            y: Math.round(n.y) || 0,
            width: Math.round(n.width) || 300,
            height: Math.round(n.height) || 250,
            item_id: (n.itemId && isUUID(n.itemId)) ? n.itemId : null,
            code_snippet: n.codeSnippet || null,
            resource_url: n.resourceUrl || null,
            resource_title: n.resourceTitle || null,
            files: n.files || []
          }));

          // Sync in-memory canvas nodes fallback
          localInMemoryCanvasNodes = localInMemoryCanvasNodes.filter(n => n.canvas_id !== id);
          localInMemoryCanvasNodes.push(...nodesToUpsert);

          // Database Upsert
          const { error: upsertError } = await supabase
            .from("canvas_nodes")
            .upsert(nodesToUpsert, { onConflict: "id" });

          if (upsertError) {
            console.error("Error upserting canvas nodes:", upsertError);
            throw upsertError;
          }

          // Database Delete (clean sync)
          const upsertedIds = nodesToUpsert.map((n: any) => n.id);
          const deleteQuery = supabase
            .from("canvas_nodes")
            .delete()
            .eq("canvas_id", id);

          const deleteResult = upsertedIds.length
            ? deleteQuery.not("id", "in", upsertedIds)
            : deleteQuery;

          const { error: deleteError } = await deleteResult;

          if (deleteError) {
            console.error("Error cleaning canvas nodes during update:", deleteError);
            throw deleteError;
          }
        } else {
          localInMemoryCanvasNodes = localInMemoryCanvasNodes.filter(n => n.canvas_id !== id);
          const { error: deleteError } = await supabase
            .from("canvas_nodes")
            .delete()
            .eq("canvas_id", id);

          if (deleteError) {
            console.error("Error cleaning canvas nodes during update:", deleteError);
            throw deleteError;
          }
        }
      } else {
        // Sync in-memory canvas nodes fallback if no supabase is present
        localInMemoryCanvasNodes = localInMemoryCanvasNodes.filter(n => n.canvas_id !== id);
        if (updateFields.canvasNodes && updateFields.canvasNodes.length > 0) {
          updateFields.canvasNodes.forEach((n: any) => {
            localInMemoryCanvasNodes.push({
              id: n.id || generateUUID(),
              canvas_id: id,
              type: n.type || "note",
              title: n.title || "Node",
              content: n.content || "",
              x: Math.round(n.x) || 0,
              y: Math.round(n.y) || 0,
              width: Math.round(n.width) || 300,
              height: Math.round(n.height) || 250,
              itemId: n.itemId || null,
              codeSnippet: n.codeSnippet || null,
              resourceUrl: n.resourceUrl || null,
              resourceTitle: n.resourceTitle || null,
              files: n.files || []
            });
          });
        }
      }
    } else {
      // Update is regular idea/notebook
      const dbRow: any = {
        id: id,
        domain_id: getStableUUID(updateFields.domainId || "55d810f2-5174-4770-ae38-ca4badd69c3f"),
        title: updateFields.title || "Unnamed",
        description: updateFields.description || '',
        domain_tag: updateFields.domainTag || "Full-Stack",
        feasibility: updateFields.feasibility || "Medium-Scope",
        status: updateFields.status || "Inbox",
        tech_stacks: updateFields.techStacks || [],
        year: updateFields.year || "2026",
        type: updateFields.type || "item",
        color: updateFields.color || "lilac",
        comments: updateFields.comments || [],
        notion_blocks: updateFields.notionBlocks || [],
        created_at: updateFields.createdAt || new Date().toISOString()
      };

      // Always keep local in-memory fallback synchronized
      let found = false;
      localInMemoryIdeas = localInMemoryIdeas.map((idea) => {
        if (idea.id === id) {
          found = true;
          return dbRow;
        }
        return idea;
      });
      if (!found) {
        localInMemoryIdeas.push(dbRow);
      }

      if (supabase && isUUID(id)) {
        const { error } = await supabase
          .from("ideas")
          .update(dbRow)
          .eq("id", id);
          
        if (error) {
          console.error("Error updating idea row:", error);
          throw error;
        }
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Error editing persistent idea/canvas:", err);
    return res.status(500).json({ error: err.message });
  }
});

// CREATE /api/ideas: Support instant creation of canvases/items from React UI
app.post("/api/ideas", async (req, res) => {
  try {
    const item = req.body;
    const supabase = getSupabaseClient();
    
    if (item.type === "canvas") {
      const canvasId = item.id || generateUUID();
      const domainId = getStableUUID(item.domainId || "55d810f2-5174-4770-ae38-ca4badd69c3f");
      const title = item.title || "New Canvas";
      const description = item.description || "";
      const color = item.color || "lilac";
      const createdAt = item.createdAt || new Date().toISOString();
      const connections = Array.isArray(item.connections) ? item.connections : [];

      const dbRow = {
        id: canvasId,
        domain_id: domainId,
        title,
        description,
        color,
        connections,
        created_at: createdAt,
        updated_at: createdAt
      };

      // In-memory sync fallback
      localInMemoryCanvases.unshift(dbRow);

      if (supabase && isUUID(canvasId)) {
        const { error } = await supabase.from("canvases").insert(dbRow);
        if (error) {
          console.error("Error inserting canvas:", error);
          throw error;
        }

        // Insert initial canvas nodes if they exist
        if (item.canvasNodes && item.canvasNodes.length > 0) {
          const nodesToInsert = item.canvasNodes.map((n: any) => {
            const dbNode = {
              id: isUUID(n.id) ? n.id : generateUUID(),
              canvas_id: canvasId,
              type: n.type || "note",
              title: n.title || "Node",
              content: n.content || "",
              x: Math.round(n.x) || 0,
              y: Math.round(n.y) || 0,
              width: Math.round(n.width) || 300,
              height: Math.round(n.height) || 250,
              item_id: (n.itemId && isUUID(n.itemId)) ? n.itemId : null,
              code_snippet: n.codeSnippet || null,
              resource_url: n.resourceUrl || null,
              resource_title: n.resourceTitle || null,
              files: n.files || []
            };
            localInMemoryCanvasNodes.push(dbNode);
            return dbNode;
          });

          await safeInsertCanvasNodes(supabase, nodesToInsert);
        }
      } else {
        // Local in-memory canvas nodes sync
        if (item.canvasNodes && item.canvasNodes.length > 0) {
          item.canvasNodes.forEach((n: any) => {
            localInMemoryCanvasNodes.push({
              id: n.id || generateUUID(),
              canvas_id: canvasId,
              type: n.type || "note",
              title: n.title || "Node",
              content: n.content || "",
              x: Math.round(n.x) || 0,
              y: Math.round(n.y) || 0,
              width: Math.round(n.width) || 300,
              height: Math.round(n.height) || 250,
              itemId: n.itemId || null,
              codeSnippet: n.codeSnippet || null,
              resourceUrl: n.resourceUrl || null,
              resourceTitle: n.resourceTitle || null,
              files: n.files || []
            });
          });
        }
      }

      // Return the newly created canvas DomainItem format
      const clientCanvas = {
        id: canvasId,
        domainId,
        title,
        description: item.description || "",
        domainTag: item.domainTag || "Full-Stack",
        feasibility: "Medium-Scope",
        status: "Inbox",
        techStacks: [],
        year: "2026",
        type: "canvas" as const,
        color: color as any,
        comments: [],
        createdAt,
        canvasNodes: item.canvasNodes || [],
        connections: item.connections || []
      };

      return res.json({ success: true, item: clientCanvas });
    } else {
      // Create is regular item/notebook
      const dbRow: any = {
        id: item.id || generateUUID(),
        domain_id: getStableUUID(item.domainId || "computer-science"),
        title: item.title || "Unnamed",
        description: item.description || '',
        domain_tag: item.domainTag || "Full-Stack",
        feasibility: item.feasibility || "Micro-MVP",
        status: item.status || "Inbox",
        tech_stacks: item.techStacks || [],
        year: item.year || "2026",
        type: item.type || "item",
        color: item.color || "lilac",
        comments: item.comments || [],
        notion_blocks: item.notionBlocks || [],
        created_at: item.createdAt || new Date().toISOString()
      };

      localInMemoryIdeas.unshift(dbRow);

      if (supabase && isUUID(dbRow.id)) {
        const { error } = await supabase.from("ideas").insert(dbRow);
        if (error) {
          console.error("Error inserting idea:", error);
          throw error;
        }
      }

      return res.json({ success: true, item: convertToDomainItem(dbRow) });
    }
  } catch (err: any) {
    console.error("Error creating persistent idea/canvas:", err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ideas/:id: Deletes an idea/canvas/notebook from storage
app.delete("/api/ideas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const supabase = getSupabaseClient();
    
    // Always filter in-memory fallback lists to maintain persistent frontend cohesion
    localInMemoryIdeas = localInMemoryIdeas.filter((idea) => idea.id !== id);
    localInMemoryCanvases = localInMemoryCanvases.filter((canvas) => canvas.id !== id);
    localInMemoryCanvasNodes = localInMemoryCanvasNodes.filter((node) => node.canvas_id !== id);

    if (supabase && isUUID(id)) {
      // Attempt safe deletion across both relational tables
      await supabase.from("canvases").delete().eq("id", id);
      await supabase.from("ideas").delete().eq("id", id);
    }
    
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting persistent idea/canvas:", err);
    return res.status(500).json({ error: err.message });
  }
});


// ----------------------------------------------------
// VITE DEV SERVER / PRODUCTION CONFIGURATION
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Node.js/Express full-stack backend running at http://localhost:${PORT}`);
  });
}

startServer();
