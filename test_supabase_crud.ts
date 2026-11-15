import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function runTests() {
  console.log("🚀 Starting Supabase CRUD & Storage Testing...\n");

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables");
    process.exit(1);
  }

  console.log(`✓ Using Supabase: ${SUPABASE_URL}`);
  console.log(`✓ Using API Key: ${SUPABASE_KEY.substring(0, 20)}...`);

  // 1. Create Supabase Client
  console.log("\n[TEST 1] Creating Supabase client...");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("✅ Supabase client created successfully");

  // 2. Test Database Connection - Read Categories
  console.log("\n[TEST 2] Fetching categories from database...");
  try {
    const { data, error } = await supabase.from("categories").select("*").limit(5);
    if (error) throw error;
    console.log(`✅ Successfully fetched ${data?.length || 0} categories`);
    if (data && data.length > 0) {
      console.log(`   First category: ${data[0].name}`);
    }
  } catch (err: any) {
    console.error(`❌ Failed to fetch categories: ${err.message}`);
  }

  // 3. Test Database Connection - Read Ideas
  console.log("\n[TEST 3] Fetching ideas from database...");
  try {
    const { data, error } = await supabase.from("ideas").select("id, title, type").limit(5);
    if (error) throw error;
    console.log(`✅ Successfully fetched ${data?.length || 0} ideas`);
    if (data && data.length > 0) {
      console.log(`   First idea: ${data[0].title} (${data[0].type})`);
    }
  } catch (err: any) {
    console.error(`❌ Failed to fetch ideas: ${err.message}`);
  }

  // 4. Test Database Connection - Read Canvases
  console.log("\n[TEST 4] Fetching canvases from database...");
  try {
    const { data, error } = await supabase.from("canvases").select("id, title").limit(5);
    if (error) throw error;
    console.log(`✅ Successfully fetched ${data?.length || 0} canvases`);
    if (data && data.length > 0) {
      console.log(`   First canvas: ${data[0].title}`);
    }
  } catch (err: any) {
    console.error(`❌ Failed to fetch canvases: ${err.message}`);
  }

  // 5. Test Storage - List Files
  console.log("\n[TEST 5] Listing files in 'blueprints' storage bucket...");
  try {
    const { data, error } = await supabase.storage.from("blueprints").list();
    if (error) {
      // Bucket might not exist, try to create it
      if (error.message.includes("not found") || error.message.includes("does not exist")) {
        console.log("   Bucket 'blueprints' does not exist. Creating...");
        const { error: createErr } = await supabase.storage.createBucket("blueprints", {
          public: true,
        });
        if (createErr) throw createErr;
        console.log("✅ Bucket 'blueprints' created successfully");
        return;
      }
      throw error;
    }
    console.log(`✅ Successfully listed ${data?.length || 0} files in blueprints bucket`);
    if (data && data.length > 0) {
      console.log(`   First file: ${data[0].name}`);
    }
  } catch (err: any) {
    console.error(`❌ Failed to list storage: ${err.message}`);
  }

  // 6. Test Storage - Upload Local Image
  console.log("\n[TEST 6] Uploading local image to storage...");
  const uploadDir = path.join(process.cwd(), "uploads");
  try {
    const files = fs.readdirSync(uploadDir).filter((f) => /\.(jpg|jpeg|png|gif)$/i.test(f));
    if (files.length === 0) {
      console.log("   No image files found in ./uploads directory");
    } else {
      const testFile = files[0];
      const filePath = path.join(uploadDir, testFile);
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = `test-upload-${Date.now()}.${testFile.split(".").pop()}`;

      const { error } = await supabase.storage.from("blueprints").upload(fileName, fileBuffer, {
        contentType: `image/${testFile.split(".").pop()}`,
        upsert: true,
      });

      if (error) throw error;
      console.log(`✅ Successfully uploaded ${fileName}`);

      // Get public URL
      const { data: urlData } = supabase.storage.from("blueprints").getPublicUrl(fileName);
      if (urlData) {
        console.log(`   Public URL: ${urlData.publicUrl}`);
      }
    }
  } catch (err: any) {
    console.error(`❌ Failed to upload file: ${err.message}`);
  }

  // 7. Test Insert - Create New Idea
  console.log("\n[TEST 7] Creating a test idea in database...");
  try {
    const testIdea = {
      id: `test-idea-${Date.now()}`,
      domain_id: "55d810f2-5174-4770-ae38-ca4badd69c3f",
      title: `Test Idea ${new Date().toISOString()}`,
      description: "This is a test idea for CRUD validation",
      domain_tag: "Testing",
      feasibility: "Micro-MVP",
      status: "Inbox",
      tech_stacks: ["Node.js", "Supabase"],
      year: "2026",
      type: "item",
      color: "lilac",
      comments: [],
      notion_blocks: [],
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("ideas").insert([testIdea]).select();
    if (error) throw error;
    console.log(`✅ Successfully created test idea: ${testIdea.title}`);
  } catch (err: any) {
    console.error(`❌ Failed to create idea: ${err.message}`);
  }

  // 8. Test Update - Update an Idea
  console.log("\n[TEST 8] Updating a test idea...");
  try {
    const { data: ideas, error: fetchErr } = await supabase
      .from("ideas")
      .select("id")
      .eq("type", "item")
      .limit(1);
    if (fetchErr) throw fetchErr;

    if (ideas && ideas.length > 0) {
      const ideaId = ideas[0].id;
      const { error: updateErr } = await supabase
        .from("ideas")
        .update({ description: `Updated at ${new Date().toISOString()}` })
        .eq("id", ideaId);
      if (updateErr) throw updateErr;
      console.log(`✅ Successfully updated idea ${ideaId}`);
    } else {
      console.log("   No ideas found to update");
    }
  } catch (err: any) {
    console.error(`❌ Failed to update idea: ${err.message}`);
  }

  console.log("\n✨ Supabase CRUD & Storage Testing Complete! ✨\n");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
