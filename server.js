const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const provider = "https://ads4u.co/api/v2";
const mime = { ".html":"text/html; charset=utf-8", ".css":"text/css", ".js":"application/javascript", ".png":"image/png", ".jpg":"image/jpeg", ".json":"application/json" };

const send = (res, status, body, type = "application/json") => {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
};

const readBody = (req) => new Promise((resolve, reject) => {
  let body = "";
  req.on("data", (chunk) => body += chunk);
  req.on("end", () => resolve(body));
  req.on("error", reject);
});

const proxyApi = async (req, res) => {
  try {
    const input = JSON.parse(await readBody(req) || "{}");
    const key = process.env.ADS4U_API_KEY || input.key;
    if (!key) return send(res, 400, JSON.stringify({ error: "ADS4U_API_KEY is not configured" }));
    const body = new URLSearchParams({ ...input, key });
    const response = await fetch(provider, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
    send(res, response.status, await response.text());
  } catch (error) {
    send(res, 500, JSON.stringify({ error: error.message }));
  }
};

http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/") && req.method === "POST") return proxyApi(req, res);
  const pathname = decodeURIComponent(req.url.split("?")[0]);
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = path.resolve(root, requested);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, "Not found", "text/plain");
  res.writeHead(200, { "content-type": mime[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`SEO8U running at http://localhost:${port}`));