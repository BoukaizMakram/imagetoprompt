const https = require("https");

const TOKEN = "nfp_edGdoeFu4vNK7M7UNbz6RcLmHuRrtEVp28f7";

const NAMES = [
  "img2prompt-guide",
  "ai-prompt-from-photo",
  "reverse-prompt-ai",
  "image-to-text-prompt",
  "ai-image-describer",
];

function createSite(name) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ name });
    const req = https.request(
      {
        hostname: "api.netlify.com",
        path: "/api/v1/sites",
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const d = JSON.parse(Buffer.concat(chunks).toString());
          resolve({ name, id: d.id, url: d.ssl_url, error: d.errors || d.message });
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  for (const name of NAMES) {
    const r = await createSite(name);
    if (r.id) {
      console.log(`${r.name} => ${r.id} | ${r.url}`);
    } else {
      console.log(`${r.name} => ERROR: ${JSON.stringify(r.error)}`);
    }
    await sleep(3000);
  }
}

main().catch(console.error);
