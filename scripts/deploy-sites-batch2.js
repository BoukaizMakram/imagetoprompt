const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const TOKEN = "nfp_edGdoeFu4vNK7M7UNbz6RcLmHuRrtEVp28f7";

const SITES = [
  { id: "79f875f1-0ebf-4dbc-955e-900a36261701", name: "reverse-image-to-prompt", dir: "D:/tmp/site6-deploy" },
  { id: "108ba243-08f1-4f11-a2de-a278c4623bd0", name: "photo-to-ai-prompt",      dir: "D:/tmp/site7-deploy" },
  { id: "984466e1-3b74-41d3-b419-d05061ae1b7a", name: "ai-art-prompt-extractor",  dir: "D:/tmp/site8-deploy" },
  { id: "1025c95b-4f59-4a13-a4eb-d45acedb4b9b", name: "prompt-from-photo-guide",  dir: "D:/tmp/site9-deploy" },
];

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
      { hostname: "api.netlify.com", path: urlPath, method,
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": isBuffer ? "application/octet-stream" : "application/json" } },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const t = Buffer.concat(chunks).toString();
          try { resolve({ status: res.statusCode, body: JSON.parse(t) }); }
          catch { resolve({ status: res.statusCode, body: t }); }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(isBuffer ? body : JSON.stringify(body));
    req.end();
  });
}

async function deploySite(site) {
  console.log(`\n=== ${site.name} ===`);
  const allFiles = getAllFiles(site.dir);
  const fileHashes = Object.fromEntries(Object.entries(allFiles).map(([p, { sha1 }]) => [p, sha1]));
  console.log(`Deploying ${Object.keys(fileHashes).length} files...`);

  const deploy = await apiRequest("POST", `/api/v1/sites/${site.id}/deploys`, { files: fileHashes });
  if (deploy.status !== 200) { console.error("Deploy failed:", deploy.body); return; }

  const { id: deployId, required = [] } = deploy.body;
  console.log(`Deploy ${deployId} | Uploading ${required.length} new files`);

  for (const sha1 of required) {
    const entry = Object.entries(allFiles).find(([, v]) => v.sha1 === sha1);
    if (!entry) continue;
    const [urlPath, { content }] = entry;
    console.log(" →", urlPath);
    await apiRequest("PUT", `/api/v1/deploys/${deployId}/files${urlPath}`, content, true);
  }
  console.log(`✓ https://${site.name}.netlify.app`);
}

async function main() {
  for (const site of SITES) await deploySite(site);
  console.log("\n✓ Done.");
}

main().catch(console.error);
