const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const TOKEN = "nfp_edGdoeFu4vNK7M7UNbz6RcLmHuRrtEVp28f7";
const SITE_ID = "213efe4b-25b8-4e92-af14-b83370980adf";
const DEPLOY_DIR = "D:/tmp/site3-deploy";

function getAllFiles(dir, baseUrl = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = {};
  for (const e of entries) {
    const fullPath = path.join(dir, e.name);
    const urlPath = baseUrl + "/" + e.name;
    if (e.isDirectory()) Object.assign(files, getAllFiles(fullPath, urlPath));
    else {
      const content = fs.readFileSync(fullPath);
      files[urlPath] = { sha1: crypto.createHash("sha1").update(content).digest("hex"), content };
    }
  }
  return files;
}

function apiRequest(method, urlPath, body, isBuffer = false) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: "api.netlify.com", path: urlPath, method, headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": isBuffer ? "application/octet-stream" : "application/json" } },
      (res) => {
        const chunks = [];
        res.on("data", c => chunks.push(c));
        res.on("end", () => { const t = Buffer.concat(chunks).toString(); try { resolve({ status: res.statusCode, body: JSON.parse(t) }); } catch { resolve({ status: res.statusCode, body: t }); } });
      }
    );
    req.on("error", reject);
    if (body) req.write(isBuffer ? body : JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const allFiles = getAllFiles(DEPLOY_DIR);
  const fileHashes = Object.fromEntries(Object.entries(allFiles).map(([p, {sha1}]) => [p, sha1]));
  console.log("Deploying", Object.keys(fileHashes).length, "files to prompt-from-image-guide...");
  const deploy = await apiRequest("POST", `/api/v1/sites/${SITE_ID}/deploys`, { files: fileHashes });
  if (deploy.status !== 200) { console.error("Failed:", deploy.body); process.exit(1); }
  const { id: deployId, required = [] } = deploy.body;
  console.log("Deploy ID:", deployId, "| Uploading:", required.length, "files");
  for (const sha1 of required) {
    const entry = Object.entries(allFiles).find(([, v]) => v.sha1 === sha1);
    if (!entry) continue;
    const [urlPath, { content }] = entry;
    console.log(" →", urlPath);
    await apiRequest("PUT", `/api/v1/deploys/${deployId}/files${urlPath}`, content, true);
  }
  console.log("Deploy ID for status check:", deployId);
  console.log("DONE! https://prompt-from-image-guide.netlify.app");
}
main().catch(console.error);
