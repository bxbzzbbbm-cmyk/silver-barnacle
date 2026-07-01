import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// Import cloud-function handlers
import { onRequestPost as handleConnect } from "./cloud-functions/api/vpn/connect.js";
import { onRequestPost as handleDisconnect } from "./cloud-functions/api/vpn/disconnect.js";
import { onRequestGet as handleCountry } from "./cloud-functions/api/vpn/country.js";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function makeContext(req, res, body) {
  return {
    request: new Request(`http://localhost:${PORT}${req.url}`, {
      method: req.method,
      headers: new Headers(Object.entries(req.headers).filter(([k]) => k.toLowerCase() !== "host")),
      body: req.method === "POST" ? body : null,
    }),
    env: {
      VPN_API_BASE_URL: process.env.VPN_API_BASE_URL,
      VPN_API_KEY: process.env.VPN_API_KEY,
    },
  };
}

const server = http.createServer(async (req, res) => {
  const url = req.url;

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  // Serve VPN UI at root
  if (url === "/" || url === "/index.html") {
    try {
      const html = fs.readFileSync(path.join(__dirname, "src", "vpn.html"), "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Failed to load VPN UI");
    }
    return;
  }

  // Route /api/vpn/connect
  if (url === "/api/vpn/connect" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const ctx = makeContext(req, res, body);
    try {
      const result = await handleConnect(ctx);
      const respBody = await result.text();
      const headers = Object.fromEntries(result.headers.entries());
      res.writeHead(result.status, { ...corsHeaders(), ...headers });
      res.end(respBody);
    } catch (err) {
      res.writeHead(500, { ...corsHeaders(), "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error", message: err.message }));
    }
    return;
  }

  // Route /api/vpn/disconnect
  if (url === "/api/vpn/disconnect" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const ctx = makeContext(req, res, body);
    try {
      const result = await handleDisconnect(ctx);
      const respBody = await result.text();
      const headers = Object.fromEntries(result.headers.entries());
      res.writeHead(result.status, { ...corsHeaders(), ...headers });
      res.end(respBody);
    } catch (err) {
      res.writeHead(500, { ...corsHeaders(), "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error", message: err.message }));
    }
    return;
  }

  // Route /api/vpn/country
  if (url === "/api/vpn/country" && req.method === "GET") {
    const ctx = makeContext(req, res, null);
    try {
      const result = await handleCountry(ctx);
      const respBody = await result.text();
      const headers = Object.fromEntries(result.headers.entries());
      res.writeHead(result.status, { ...corsHeaders(), ...headers });
      res.end(respBody);
    } catch (err) {
      res.writeHead(500, { ...corsHeaders(), "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error", message: err.message }));
    }
    return;
  }

  // 404 fallback
  res.writeHead(404, { ...corsHeaders(), "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`VPN Manager server running at http://localhost:${PORT}`);
});
