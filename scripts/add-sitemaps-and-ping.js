const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const TOKEN = "nfp_edGdoeFu4vNK7M7UNbz6RcLmHuRrtEVp28f7";

const SITES = [
  {
    id: "4fdfe065-8201-429e-bbdd-48cf0dd6d54a",
    name: "ai-prompt-guides",
    dir: "D:/tmp/article2-deploy",
    urls: [
      "https://ai-prompt-guides.netlify.app/",
      "https://ai-prompt-guides.netlify.app/about.html",
      "https://ai-prompt-guides.netlify.app/articles/designers-image-to-prompt-workflow.html",
      "https://ai-prompt-guides.netlify.app/articles/image-to-prompt-guide.html",
      "https://ai-prompt-guides.netlify.app/articles/midjourney-prompt-tips.html",
      "https://ai-prompt-guides.netlify.app/articles/stable-diffusion-guide.html",
      "https://ai-prompt-guides.netlify.app/articles/flux-prompting-guide.html",
      "https://ai-prompt-guides.netlify.app/articles/dalle-3-prompt-tips.html",
      "https://ai-prompt-guides.netlify.app/articles/using-reference-images.html",
    ],
  },
  {
    id: "213efe4b-25b8-4e92-af14-b83370980adf",
    name: "prompt-from-image-guide",
    dir: "D:/tmp/site3-deploy",
    urls: ["https://prompt-from-image-guide.netlify.app/", "https://prompt-from-image-guide.netlify.app/about.html"],
  },
  {
    id: "69746269-e569-403b-946c-61c01c926ff7",
    name: "ai-image-prompt-tools",
    dir: "D:/tmp/site4-deploy",
    urls: ["https://ai-image-prompt-tools.netlify.app/", "https://ai-image-prompt-tools.netlify.app/about.html"],
  },
  {
    id: "a34e2310-d232-46f9-9cb8-797632f29c1c",
    name: "image-prompt-workflow",
    dir: "D:/tmp/site5-deploy",
    urls: ["https://image-prompt-workflow.netlify.app/", "https://image-prompt-workflow.netlify.app/about.html"],
  },
];

function makeSitemap(urls, siteBase) {
  const entries = urls.map((u) => `  <url><loc>${u}</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

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
      {
        hostname: "api.netlify.com", path: urlPath, method,
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": isBuffer ? "application/octet-stream" : "application/json" },
      },
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

function pingGoogle(sitemapUrl) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(sitemapUrl);
    const req = https.request(
      { hostname: "www.google.com", path: `/ping?sitemap=${encoded}`, method: "GET" },
      (res) => { res.resume(); resolve(res.statusCode); }
    );
    req.on("error", () => resolve("error"));
    req.end();
  });
}

async function deploySite(site) {
  console.log(`\n=== ${site.name} ===`);

  // Add sitemap.xml
  const sitemapContent = Buffer.from(makeSitemap(site.urls, `https://${site.name}.netlify.app`));
  const sitemapPath = path.join(site.dir, "sitemap.xml");
  fs.writeFileSync(sitemapPath, sitemapContent);
  console.log("Added sitemap.xml");

  const allFiles = getAllFiles(site.dir);
  const fileHashes = Object.fromEntries(Object.entries(allFiles).map(([p, { sha1 }]) => [p, sha1]));
  console.log(`Deploying ${Object.keys(fileHashes).length} files...`);

  const deploy = await apiRequest("POST", `/api/v1/sites/${site.id}/deploys`, { files: fileHashes });
  if (deploy.status !== 200) { console.error("Deploy failed:", deploy.body); return null; }

  const { id: deployId, required = [] } = deploy.body;
  console.log(`Deploy ${deployId} | Uploading ${required.length} new files`);

  for (const sha1 of required) {
    const entry = Object.entries(allFiles).find(([, v]) => v.sha1 === sha1);
    if (!entry) continue;
    const [urlPath, { content }] = entry;
    console.log(" →", urlPath);
    await apiRequest("PUT", `/api/v1/deploys/${deployId}/files${urlPath}`, content, true);
  }

  const sitemapUrl = `https://${site.name}.netlify.app/sitemap.xml`;
  const pingStatus = await pingGoogle(sitemapUrl);
  console.log(`Pinged Google: ${sitemapUrl} → HTTP ${pingStatus}`);

  return `https://${site.name}.netlify.app`;
}

async function main() {
  for (const site of SITES) {
    await deploySite(site);
  }
  console.log("\n✓ All sitemaps added and Google notified.");
}

main().catch(console.error);
