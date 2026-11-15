import * as https from "https";
import * as http from "http";
import { DNS } from "dns";

const url = "https://abmuzmmpbwbfdvnmykmz.supabase.co/rest/v1/categories?limit=1";
const apikey = "sb_publishable_UKcsDqxgV45nPLcYgGj2nw_7XqJeCkB";

console.log("[TEST] Diagnosing Node.js network connectivity to Supabase\n");

// Test 1: DNS resolution
console.log("[TEST 1] DNS Resolution");
import dns from "dns";
dns.lookup("abmuzmmpbwbfdvnmykmz.supabase.co", (err, address, family) => {
  if (err) {
    console.error("  ❌ DNS lookup failed:", err.message);
  } else {
    console.log(`  ✅ Resolved to ${address} (IPv${family})`);
  }

  // Test 2: Direct HTTPS request with built-in https module
  console.log("\n[TEST 2] Direct HTTPS Request (built-in https module)");

  const startTime = Date.now();
  const req = https.request(
    url,
    {
      method: "GET",
      headers: {
        apikey,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    },
    (res) => {
      const elapsed = Date.now() - startTime;
      console.log(`  ✅ Response received in ${elapsed}ms`);
      console.log(`  Status: ${res.statusCode}`);

      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`  ✅ Parsed JSON: ${parsed.length || parsed.message} items`);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`  First item: ${parsed[0].name}`);
          }
        } catch {
          console.log(`  Response: ${data.substring(0, 100)}`);
        }
        process.exit(0);
      });
    }
  );

  req.on("error", (err) => {
    const elapsed = Date.now() - startTime;
    console.error(`  ❌ Request failed after ${elapsed}ms:`, err.message);
    process.exit(1);
  });

  req.on("timeout", () => {
    console.error(`  ❌ Request timed out after 15 seconds`);
    req.abort();
    process.exit(1);
  });

  req.end();
});
