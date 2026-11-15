import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Test Supabase client initialization
console.log("[INIT] Starting minimal backend...");
console.log(`[INIT] Supabase URL: ${process.env.SUPABASE_URL}`);

let supabaseClient: any = null;

async function initSupabase() {
  console.log("[INIT] Creating Supabase client...");
  try {
    supabaseClient = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_KEY || ""
    );
    console.log("[INIT] Supabase client created");
    return true;
  } catch (err: any) {
    console.error("[ERROR] Failed to create Supabase client:", err.message);
    return false;
  }
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  console.log("[ROUTE] GET /api/health");
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test categories endpoint
app.get("/api/categories", async (req, res) => {
  console.log("[ROUTE] GET /api/categories - Starting query");

  if (!supabaseClient) {
    console.error("[ERROR] Supabase client not initialized");
    return res.status(500).json({ error: "Database not initialized" });
  }

  try {
    console.log("[ROUTE] Executing Supabase query...");
    const startTime = Date.now();

    // Set a 5-second timeout for the Supabase query
    const queryPromise = supabaseClient
      .from("categories")
      .select("*")
      .limit(10);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout after 5 seconds")), 5000)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    const elapsed = Date.now() - startTime;
    console.log(`[ROUTE] Query completed in ${elapsed}ms`);

    if (error) {
      console.error("[ERROR] Supabase query error:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`[ROUTE] Found ${data?.length || 0} categories`);
    res.json(data || []);
  } catch (err: any) {
    console.error("[ERROR] Exception in /api/categories:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start server
async function start() {
  console.log("[INIT] Initializing Supabase...");
  const success = await initSupabase();

  if (!success) {
    console.error("[ERROR] Failed to initialize Supabase, but continuing anyway...");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SUCCESS] ✅ Minimal backend running on http://localhost:${PORT}`);
    console.log("[READY] Server ready to accept requests");
  });
}

start();
