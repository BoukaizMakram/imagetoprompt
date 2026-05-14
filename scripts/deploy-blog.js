const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const TOKEN = "nfp_edGdoeFu4vNK7M7UNbz6RcLmHuRrtEVp28f7";
const SITE_ID = "4fdfe065-8201-429e-bbdd-48cf0dd6d54a";
const BLOG_DIR = "D:/tmp/ai-prompt-blog";

function getAllFiles(dir, baseUrl = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = {};
  for (const e of entries) {
    const fullPath = path.join(dir, e.name);
    const urlPath = baseUrl + "/" + e.name;
    if (e.isDirectory()) {
      Object.assign(files, getAllFiles(fullPath, urlPath));
    } else {
      const content = fs.readFileSync(fullPath);
      const sha1 = crypto.createHash("sha1").update(content).digest("hex");
      files[urlPath] = { sha1, content };
    }
  }
  return files;
}

function apiRequest(method, urlPath, body, isBuffer = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.netlify.com",
      path: urlPath,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": isBuffer ? "application/octet-stream" : "application/json",
      },
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, body: JSON.parse(text) }); }
        catch { resolve({ status: res.statusCode, body: text }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(isBuffer ? body : JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const allFiles = getAllFiles(BLOG_DIR);
  const fileHashes = {};
  for (const [urlPath, { sha1 }] of Object.entries(allFiles)) {
    fileHashes[urlPath] = sha1;
  }

  console.log("Creating deploy with", Object.keys(fileHashes).length, "files...");
  const deploy = await apiRequest("POST", `/api/v1/sites/${SITE_ID}/deploys`, { files: fileHashes });

  if (deploy.status !== 200) {
    console.error("Deploy creation failed:", deploy.body);
    process.exit(1);
  }

  const deployId = deploy.body.id;
  const required = deploy.body.required || [];
  console.log("Deploy ID:", deployId, "| Required uploads:", required.length);

  for (const sha1 of required) {
    const entry = Object.entries(allFiles).find(([, v]) => v.sha1 === sha1);
    if (!entry) { console.warn("No file found for sha1:", sha1); continue; }
    const [urlPath, { content }] = entry;
    console.log("Uploading:", urlPath);
    const up = await apiRequest("PUT", `/api/v1/deploys/${deployId}/files${urlPath}`, content, true);
    if (up.status !== 200) console.warn("Upload failed for", urlPath, up.status);
  }

  console.log("\nDeploy complete!");
  console.log("URL: https://ai-prompt-guides.netlify.app");
}

main().catch(console.error);
