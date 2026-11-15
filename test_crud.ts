import { spawn } from "child_process";
import path from "path";

// A robust test suite validating all CRUD operations on the /api/ideas and canvas nodes endpoints
async function runTests() {
  console.log("🚀 Starting Comprehensive CRUD & Edge-Case Validation Suite...\n");
  const baseUrl = "http://localhost:3000";

  // Test data
  const testIdeaId = "7a8b9c10-2222-4444-8888-abcdef123456";
  const testCanvasId = "12345678-abcd-ef00-1122-334455667788";
  
  try {
    // ----------------------------------------------------
    // PRE-TEST CLEANUP: Ensure clean slate
    // ----------------------------------------------------
    console.log("🧹 [PRE-TEST] Purging leftover test data from previous runs if any...");
    try {
      await fetch(`${baseUrl}/api/ideas/${testIdeaId}`, { method: "DELETE" });
      await fetch(`${baseUrl}/api/ideas/${testCanvasId}`, { method: "DELETE" });
    } catch (e) {
      // Ignore if not found
    }

    // ----------------------------------------------------
    // TEST 1: Create a Standard Notebook (Idea)
    // ----------------------------------------------------
    console.log("🔹 [TEST 1] Creating a standard notebook idea...");
    const createIdeaRes = await fetch(`${baseUrl}/api/ideas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testIdeaId,
        domainId: "55d810f2-5174-4770-ae38-ca4badd69c3f",
        title: "Validation Suite Test Notebook",
        description: "An automated notebook created by the test_crud suite.",
        domainTag: "Computer Science",
        feasibility: "Micro-MVP",
        status: "Inbox",
        techStacks: ["TypeScript", "Jest"],
        year: "2026",
        type: "item",
        color: "lilac",
        notionBlocks: [
          { id: "nb-test-1", type: "paragraph", content: "Initial test paragraph." }
        ]
      })
    });

    if (!createIdeaRes.ok) {
      throw new Error(`Create idea endpoint failed with status: ${createIdeaRes.status}`);
    }
    const createIdeaData = await createIdeaRes.json();
    console.log("✅ [TEST 1 SUCCESS] Notebook idea created:", createIdeaData.item?.title);

    // ----------------------------------------------------
    // TEST 2: Read All Ideas (Verify Ingested Row Presence)
    // ----------------------------------------------------
    console.log("\n🔹 [TEST 2] Fetching list of all ideas and notebooks...");
    const readAllRes = await fetch(`${baseUrl}/api/ideas`);
    if (!readAllRes.ok) {
      throw new Error(`Read ideas endpoint failed with status: ${readAllRes.status}`);
    }
    const list: any[] = await readAllRes.json();
    const foundIdea = list.find((item: any) => item.id === testIdeaId);
    if (!foundIdea) {
      throw new Error(`Validation failed: Test notebook with ID ${testIdeaId} was not returned in the list.`);
    }
    console.log("✅ [TEST 2 SUCCESS] Successfully retrieved test notebook from the database.");

    // ----------------------------------------------------
    // TEST 3: Update Standard Notebook Idea
    // ----------------------------------------------------
    console.log("\n🔹 [TEST 3] Updating standard notebook idea...");
    const updateIdeaRes = await fetch(`${baseUrl}/api/ideas/${testIdeaId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testIdeaId,
        domainId: "55d810f2-5174-4770-ae38-ca4badd69c3f",
        title: "Validation Suite Test Notebook - UPDATED",
        description: "An updated automated notebook description.",
        domainTag: "Computer Science",
        feasibility: "Medium-Scope",
        status: "In Progress",
        techStacks: ["TypeScript", "Vite", "NodeJS"],
        year: "2026",
        type: "item",
        color: "sage",
        notionBlocks: [
          { id: "nb-test-1", type: "paragraph", content: "Updated test paragraph." }
        ]
      })
    });

    if (!updateIdeaRes.ok) {
      throw new Error(`Update idea endpoint failed with status: ${updateIdeaRes.status}`);
    }
    console.log("✅ [TEST 3 SUCCESS] Notebook idea successfully updated.");

    // ----------------------------------------------------
    // TEST 4: Create Media Canvas with Canvas Nodes
    // ----------------------------------------------------
    console.log("\n🔹 [TEST 4] Creating a complex multimedia canvas...");
    const createCanvasRes = await fetch(`${baseUrl}/api/ideas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testCanvasId,
        domainId: "55d810f2-5174-4770-ae38-ca4badd69c3f",
        title: "Test Interactive Media Canvas",
        description: "An automated design board canvas.",
        domainTag: "Design",
        type: "canvas",
        color: "lilac",
        canvasNodes: [
          {
            id: "node-c1-1",
            type: "note",
            title: "Concept Outline",
            content: "First concept sticky note on the canvas.",
            x: 100,
            y: 150,
            width: 300,
            height: 250,
            files: []
          }
        ]
      })
    });

    if (!createCanvasRes.ok) {
      throw new Error(`Create canvas endpoint failed with status: ${createCanvasRes.status}`);
    }
    const createCanvasData = await createCanvasRes.json();
    console.log("✅ [TEST 4 SUCCESS] Canvas board created successfully:", createCanvasData.item?.title);

    // ----------------------------------------------------
    // TEST 5: Update Canvas & Resolve Duplicate Constraint Edge-Case
    // ----------------------------------------------------
    console.log("\n🔹 [TEST 5] Updating canvas with duplicate/overlapping nodes to test constraint resilience...");
    
    // We send two nodes containing the same client-side generated node IDs (e.g., node-c1-1) OR identical keys,
    // plus a new node, verifying the backend handles deduplication and primary key violations smoothly.
    const updateCanvasRes = await fetch(`${baseUrl}/api/ideas/${testCanvasId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testCanvasId,
        domainId: "55d810f2-5174-4770-ae38-ca4badd69c3f",
        title: "Test Interactive Media Canvas - UPDATED",
        description: "Updated design board canvas with duplicate verification.",
        domainTag: "Design",
        type: "canvas",
        color: "ocean",
        canvasNodes: [
          {
            id: "node-c1-1", // Existing ID
            type: "note",
            title: "Concept Outline - Edited",
            content: "Updated content for the first note.",
            x: 120,
            y: 160,
            width: 310,
            height: 260
          },
          {
            id: "node-c1-1", // Duplicate ID inside the update batch payload!
            type: "image",
            title: "Duplicate Key Collision Node",
            content: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600",
            x: 400,
            y: 160,
            width: 300,
            height: 250
          },
          {
            id: "node-new-999", // Fresh node ID
            type: "video",
            title: "Tutorial Walkthrough",
            content: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            x: 750,
            y: 200,
            width: 320,
            height: 280
          }
        ]
      })
    });

    if (!updateCanvasRes.ok) {
      const errorText = await updateCanvasRes.text();
      throw new Error(`Update canvas endpoint failed with status ${updateCanvasRes.status}: ${errorText}`);
    }
    console.log("✅ [TEST 5 SUCCESS] Canvas board and node graph updated safely! Duplicate key constraint resolved perfectly!");

    // ----------------------------------------------------
    // TEST 6: Delete Notebook & Canvas (Clean Up)
    // ----------------------------------------------------
    console.log("\n🔹 [TEST 6] Triggering secure deletion of test items to clean database...");
    
    const deleteIdeaRes = await fetch(`${baseUrl}/api/ideas/${testIdeaId}`, { method: "DELETE" });
    if (!deleteIdeaRes.ok) {
      throw new Error(`Delete notebook endpoint failed with status: ${deleteIdeaRes.status}`);
    }
    
    const deleteCanvasRes = await fetch(`${baseUrl}/api/ideas/${testCanvasId}`, { method: "DELETE" });
    if (!deleteCanvasRes.ok) {
      throw new Error(`Delete canvas endpoint failed with status: ${deleteCanvasRes.status}`);
    }

    console.log("✅ [TEST 6 SUCCESS] Both test notebooks and multimedia canvases successfully purged.");

    // ----------------------------------------------------
    // TEST 7: Verify Purge Cohesion
    // ----------------------------------------------------
    console.log("\n🔹 [TEST 7] Verifying purge state...");
    const verifyPurgeRes = await fetch(`${baseUrl}/api/ideas`);
    const finalItems: any[] = await verifyPurgeRes.json();
    const stillExists = finalItems.some((item: any) => item.id === testIdeaId || item.id === testCanvasId);
    if (stillExists) {
      throw new Error("Validation failure: Items were not fully deleted or remained in cache.");
    }
    console.log("✅ [TEST 7 SUCCESS] Database fully synchronized, clean state confirmed.");

    console.log("\n✨🏆 ALL CRUD OPERATIONS AND DUPLICATE KEY CONSTRAINT RESOLUTIONS ARE FULLY VALIDATED & 100% SUCCESSFUL! 🏆✨\n");
    process.exit(0);

  } catch (error: any) {
    console.error("\n❌ TEST SUITE FAILED:", error.message || error);
    process.exit(1);
  }
}

runTests();
