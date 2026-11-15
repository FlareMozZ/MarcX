import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Serve uploaded assets statically
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

console.log(`[INIT] Using Supabase: ${SUPABASE_URL}`);

// Helper function to make Supabase REST API calls
async function supabaseQuery(table: string, options: any = {}) {
  const {
    method = "GET",
    select = "*",
    limit = 100,
    offset = 0,
    filters = {},
  } = options;

  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=${limit}&offset=${offset}`;

  // Add filters to URL
  for (const [key, value] of Object.entries(filters)) {
    url += `&${key}=eq.${value}`;
  }

  const headers: any = {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
  };

  try {
    console.log(`[API] ${method} ${table}`);
    const response = await axios({
      method,
      url,
      headers,
      timeout: 10000,
    });
    return response.data;
  } catch (err: any) {
    console.error(`[ERROR] Supabase query failed: ${err.message}`);
    throw err;
  }
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get categories
app.get("/api/categories", async (req, res) => {
  try {
    console.log("[ROUTE] GET /api/categories");
    const data = await supabaseQuery("categories", { limit: 100 });
    res.json(data);
  } catch (err: any) {
    console.error("[ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get ideas
app.get("/api/ideas", async (req, res) => {
  try {
    console.log("[ROUTE] GET /api/ideas");
    const { type, limit = 50 } = req.query;
    const options: any = { limit };

    if (type) {
      options.filters = { type };
    }

    const data = await supabaseQuery("ideas", options);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get canvases
app.get("/api/canvases", async (req, res) => {
  try {
    console.log("[ROUTE] GET /api/canvases");
    const data = await supabaseQuery("canvases", { limit: 100 });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get canvas nodes
app.get("/api/canvases/:canvasId/nodes", async (req, res) => {
  try {
    console.log(`[ROUTE] GET /api/canvases/${req.params.canvasId}/nodes`);
    const { canvasId } = req.params;
    const options: any = {
      filters: { canvas_id: canvasId },
      limit: 500,
    };
    const data = await supabaseQuery("canvas_nodes", options);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// File upload
app.post("/api/upload", async (req, res) => {
  try {
    const { filename, base64 } = req.body;
    if (!filename || !base64) {
      return res.status(400).json({ error: "Missing filename or base64" });
    }

    const buffer = Buffer.from(base64, "base64");
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    console.log(`[UPLOAD] Saved ${filename}`);
    res.json({ url: `/uploads/${filename}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SUCCESS] ✅ Backend running on http://localhost:${PORT}`);
});
