// node server.js
const http = require("http");
const { request } = require("https");

const PORT = 8787;
const GEMINI_KEY = process.env.GEMINI_API_KEY; // set in your shell
const MODEL = "gemini-2.5-pro";

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") { // CORS preflight
    res.writeHead(204, cors());
    return res.end();
  }

  if (req.url === "/api/generate" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      const outReq = request(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
        outRes => {
          let out = "";
          outRes.on("data", d => (out += d));
          outRes.on("end", () => {
            res.writeHead(200, { ...cors(), "Content-Type": "application/json" });
            res.end(out);
          });
        }
      );
      outReq.on("error", (e) => {
        res.writeHead(500, { ...cors(), "Content-Type": "text/plain" });
        res.end(String(e));
      });
      outReq.write(body);
      outReq.end();
    });
    return;
  }

  res.writeHead(404, cors());
  res.end("Not found");
});

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

server.listen(PORT, () =>
  console.log(`Proxy listening http://localhost:${PORT}`)
);

