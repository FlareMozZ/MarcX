// Deep Wire-Level Interceptor Debugger for Gemini SDK
// Run with: npx tsx debug_gemini_wire.ts

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import dns from "dns";
import http from "http";
import https from "https";

// Pin network topology settings
dns.setDefaultResultOrder("ipv4first");
dotenv.config();

console.log("==================================================");
console.log("🛠️ WIRE-LEVEL SDK HTTP LAYER DIAGNOSTICS");
console.log("==================================================\n");

// --- MONKEY PATCH NATIVE HTTPS TO SNIFF THE SDK'S RAW OUTPUT ---
const originalRequest = https.request;
(https as any).request = function (url: any, options: any, callback: any) {
  const targetUrl = url instanceof URL ? url.toString() : url;
  const opt = typeof url === 'object' && !callback ? url : options;
  
  console.log("🔌 [INTERCEPTED OUTBOUND SDK REQUEST]");
  console.log(`   ► Target URL: ${targetUrl}`);
  console.log(`   ► Method:     ${opt?.method || 'POST'}`);
  console.log(`   ► Headers sent by SDK:`);
  if (opt?.headers) {
    Object.keys(opt.headers).forEach(key => {
      // Hide the middle of your key to remain secure while showing whitespace/formatting errors
      let val = opt.headers[key];
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('authorization')) {
        val = `${String(val).substring(0, 6)}...${String(val).substring(String(val).length - 4)}`;
      }
      console.log(`        ${key}: ${val}`);
    });
  }
  console.log("--------------------------------------------------\n");
  
  return originalRequest.apply(this, arguments as any);
};

async function executeDiagnostics() {
  const rawKey = process.env.GEMINI_API_KEY || "";
  
  // Clean string sanitation wrapper
  const sanitizedKey = rawKey.replace(/^["']|["']$/g, "").trim();

  console.log(`ℹ️ Initializing SDK Client wrapper with key length: ${sanitizedKey.length}`);
  
  // Initialize standard SDK configurations
  const ai = new GoogleGenAI({ 
    apiKey: sanitizedKey,
    // explicitly ensure standard Developer API routing
    httpOptions: {
      baseUrl: "https://generativelanguage.googleapis.com"
    }
  });

  try {
    console.log("🚀 Dispatched payload via modern 'gemini-2.5-flash'...");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Modern production endpoint
      contents: "Respond with the single phrase: 'Handshake Optimal'.",
    });

    console.log(`🎉 SUCCESS! Model Response: "${response.text?.trim()}"`);
  } catch (err: any) {
    console.error("❌ UPSTREAM API EXCEPTION THROWN:");
    console.error(`   Message: ${err.message}`);
    console.error(`   Status:  ${err.status}`);
    
    if (err.message?.includes("API key not valid")) {
      console.log("\n💡 ANALYSIS: The gateway explicitly received a key syntax it did not recognize.");
      console.log("   Check the intercepted header values printed above. If you see quotes, percentage codes (%22),");
      console.log("   or an unexpected path structural mutation, your environment parser is corrupting the string.");
    }
  }
}

executeDiagnostics();