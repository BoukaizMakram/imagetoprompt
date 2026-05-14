const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const TOKEN = "nfp_edGdoeFu4vNK7M7UNbz6RcLmHuRrtEVp28f7";
const SITE_ID = "4fdfe065-8201-429e-bbdd-48cf0dd6d54a";
const DEPLOY_DIR = "D:/tmp/article2-deploy";

function getAllFiles(dir, baseUrl = "") {
  if (!fs.existsSync(dir)) return {};
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
  const allFiles = getAllFiles(DEPLOY_DIR);
  const fileHashes = {};
  for (const [urlPath, { sha1 }] of Object.entries(allFiles)) {
    fileHashes[urlPath] = sha1;
  }

  console.log("Deploying", Object.keys(fileHashes).length, "files...");
  console.log("Files:", Object.keys(fileHashes).join(", "));

  const deploy = await apiRequest("POST", `/api/v1/sites/${SITE_ID}/deploys`, { files: fileHashes });

  if (deploy.status !== 200) {
    console.error("Deploy creation failed:", JSON.stringify(deploy.body, null, 2));
    process.exit(1);
  }

  const deployId = deploy.body.id;
  const required = deploy.body.required || [];
  console.log("Deploy ID:", deployId, "| Uploading", required.length, "new files");

  for (const sha1 of required) {
    const entry = Object.entries(allFiles).find(([, v]) => v.sha1 === sha1);
    if (!entry) {
      console.warn("Could not find file for sha1:", sha1);
      continue;
    }
    const [urlPath, { content }] = entry;
    console.log("Uploading:", urlPath);
    const uploadRes = await apiRequest("PUT", `/api/v1/deploys/${deployId}/files${urlPath}`, content, true);
    if (uploadRes.status !== 200) {
      console.error("Upload failed for", urlPath, ":", uploadRes.status, uploadRes.body);
    }
  }

  // Poll for deploy to be ready
  console.log("Waiting for deploy to go live...");
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await apiRequest("GET", `/api/v1/deploys/${deployId}`, null);
    const state = statusRes.body && statusRes.body.state;
    console.log("Deploy state:", state);
    if (state === "ready") {
      console.log("\nDone! Site is live at: https://ai-prompt-guides.netlify.app");
      console.log("New article: https://ai-prompt-guides.netlify.app/articles/designers-image-to-prompt-workflow.html");
      return;
    }
    if (state === "error") {
      console.error("Deploy errored:", statusRes.body);
      process.exit(1);
    }
  }
  console.log("Deploy submitted. Check: https://ai-prompt-guides.netlify.app");
}

main().catch(console.error);
