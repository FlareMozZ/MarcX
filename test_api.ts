// Thorough API Testing Suite for Central Architectural Engine
// This tests all endpoints: GET, POST (create), POST (update), DELETE, and capture ingestion fallback.
// Run using: npx tsx test_api.ts

async function runTests() {
  const BASE_URL = 'http://localhost:3000';
  console.log("================================================================================");
  console.log("🚀 STARTING INTEGRATION TESTS FOR CENTRAL ARCHITECTURAL ENGINE ENDPOINTS...");
  console.log(`🔗 Target Url: ${BASE_URL}\n`);

  let testItemId: string | null = null;

  try {
    // ----------------------------------------------------
    // TEST 1: GET /api/ideas
    // ----------------------------------------------------
    console.log("➡️ [TEST 1]: Fetching ideas (GET /api/ideas)...");
    const getRes = await fetch(`${BASE_URL}/api/ideas`);
    if (!getRes.ok) {
      throw new Error(`GET /api/ideas failed with status ${getRes.status}`);
    }
    const initialItems = await getRes.json();
    console.log(`✅ [TEST 1 PASS]: Successfully fetched ${initialItems.length} ideas.`);

    // ----------------------------------------------------
    // TEST 2: POST /api/ideas (Create Item)
    // ----------------------------------------------------
    console.log("\n➡️ [TEST 2]: Creating a new idea (POST /api/ideas)...");
    const mockItem = {
      id: "7a26f0d1-bb38-4e89-bdc2-6baaf354238e", // compliance UUID string
      title: "Automated Integration Test Concept Node",
      domainTag: "Automated Testing",
      description: "A highly resilient automated microservice cluster verified dynamically during lifecycle checks.",
      feasibility: "Medium-Scope",
      status: "Inbox",
      techStacks: ["Docker", "TypeScript", "Jest"],
      color: "mint",
      type: "item",
      comments: []
    };

    const createRes = await fetch(`${BASE_URL}/api/ideas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockItem)
    });

    if (!createRes.ok) {
      throw new Error(`POST /api/ideas failed with status ${createRes.status}`);
    }
    const createdData = await createRes.json();
    console.log("Response data:", createdData);
    testItemId = createdData.item?.id || createdData.id || mockItem.id;
    console.log(`✅ [TEST 2 PASS]: Successfully created item with id: ${testItemId}`);

    // ----------------------------------------------------
    // TEST 3: POST /api/ideas/:id (Update Item)
    // ----------------------------------------------------
    console.log(`\n➡️ [TEST 3]: Updating item properties (POST /api/ideas/${testItemId})...`);
    const updatePayload = {
      ...mockItem,
      id: testItemId,
      title: "UPDATED: Automated Integration Test Concept Node (Passed Phase 1)",
      status: "In-Progress",
      techStacks: ["Docker", "TypeScript", "Vitest", "Playwright"]
    };

    const updateRes = await fetch(`${BASE_URL}/api/ideas/${testItemId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload)
    });

    if (!updateRes.ok) {
      throw new Error(`POST /api/ideas/${testItemId} failed with status ${updateRes.status}`);
    }
    console.log(`✅ [TEST 3 PASS]: Successfully updated item ${testItemId}.`);

    // ----------------------------------------------------
    // TEST 4: GET /api/ideas (Verify Update)
    // ----------------------------------------------------
    console.log("\n➡️ [TEST 4]: Verifying updated state (GET /api/ideas)...");
    const verifyGetRes = await fetch(`${BASE_URL}/api/ideas`);
    if (!verifyGetRes.ok) {
      throw new Error(`GET /api/ideas verification failed`);
    }
    const updatedItems = await verifyGetRes.json();
    const targetItem = updatedItems.find((itm: any) => itm.id === testItemId);
    if (!targetItem) {
      throw new Error(`Failed to find updated item with id ${testItemId} in state`);
    }
    if (targetItem.title !== "UPDATED: Automated Integration Test Concept Node (Passed Phase 1)") {
      throw new Error(`Title was not matching! Expected 'UPDATED...', got '${targetItem.title}'`);
    }
    console.log(`✅ [TEST 4 PASS]: Verification passed! Updated title matches: "${targetItem.title}"`);

    // ----------------------------------------------------
    // TEST 5: POST /api/capture (Asynchronous Ingestion)
    // ----------------------------------------------------
    console.log("\n➡️ [TEST 5]: Testing Ingestion processing queue (POST /api/capture)...");
    const capturePayload = {
      sourceinput: "Interactive system to stream 3D point cloud maps to browser via WebRTC.",
      implementationnotes: "Use WebGL2, Rust, actix-web, and peer-to-peer connection protocols.",
      domainName: "Computer Vision"
    };

    const captureRes = await fetch(`${BASE_URL}/api/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(capturePayload)
    });

    if (!captureRes.ok) {
      throw new Error(`POST /api/capture failed with status ${captureRes.status}`);
    }
    const captureResult = await captureRes.json();
    console.log("Capture response:", captureResult);
    console.log(`✅ [TEST 5 PASS]: Ingestion queue processed successfully with status: '${captureResult.status}'`);

    // ----------------------------------------------------
    // TEST 6: DELETE /api/ideas/:id (Cleanup)
    // ----------------------------------------------------
    console.log(`\n➡️ [TEST 6]: Performing secure cascade deletion (DELETE /api/ideas/${testItemId})...`);
    const deleteRes = await fetch(`${BASE_URL}/api/ideas/${testItemId}`, {
      method: "DELETE"
    });

    if (!deleteRes.ok) {
      throw new Error(`DELETE /api/ideas/${testItemId} failed with status ${deleteRes.status}`);
    }
    console.log(`✅ [TEST 6 PASS]: Successfully issued cascade deletion for ${testItemId}.`);

    // ----------------------------------------------------
    // TEST 7: GET /api/ideas (Verify Clean state)
    // ----------------------------------------------------
    console.log("\n➡️ [TEST 7]: Verifying absolute deletion in storage...");
    const finalGetRes = await fetch(`${BASE_URL}/api/ideas`);
    if (!finalGetRes.ok) {
      throw new Error(`GET /api/ideas final fetch failed`);
    }
    const finalItems = await finalGetRes.json();
    const deletedExists = finalItems.some((itm: any) => itm.id === testItemId);
    if (deletedExists) {
      throw new Error(`FAIL: Deleted node with ID ${testItemId} is still returned by storage!`);
    }
    console.log("✅ [TEST 7 PASS]: Absolute deletion verification confirmed. Node deleted from active arrays.");

    console.log("\n================================================================================");
    console.log("🎖️ ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY! SYSTEM ENDPOINTS GREEN.");
    console.log("================================================================================");
  } catch (error: any) {
    console.error("\n❌ TEST RUNNER CRASHED WITH EXCEPTION:", error.message);
    process.exit(1);
  }
}

runTests();
