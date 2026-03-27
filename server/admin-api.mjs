import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");

let ADMIN_PASSWORD = "";
if (fs.existsSync(ENV_PATH)) {
  const envContent = fs.readFileSync(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^ADMIN_PASSWORD=(.+)$/);
    if (match) ADMIN_PASSWORD = match[1].trim();
  }
}

if (!ADMIN_PASSWORD) {
  console.error("ERROR: ADMIN_PASSWORD not found in .env.local");
  process.exit(1);
}

const CONFIG_PATH = path.join(ROOT, "src/data/site-config.json");
const BLOG_DIR = path.join(ROOT, "content/blog");

const PORT = 3001;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cors(res, req) {
  const origin = req.headers.origin || "";
  const allowed = origin.startsWith("http://localhost:") ? origin : "http://localhost:3000";
  res.setHeader("Access-Control-Allow-Origin", allowed);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function json(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function checkAuth(req) {
  const auth = req.headers.authorization;
  if (!auth) return false;
  return auth.replace("Bearer ", "") === ADMIN_PASSWORD;
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body ? JSON.parse(body) : {}));
  });
}

// ─── gray-matter lite (no dependency needed) ─────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const data = {};
  let currentKey = null;
  let inArray = false;
  let arrayItems = [];

  for (const line of match[1].split("\n")) {
    if (inArray) {
      if (line.match(/^\s+-\s/)) {
        const item = line.replace(/^\s+-\s/, "").trim();
        // Check if it's a YAML object like `- type: "image"`
        if (item.includes(":")) {
          const obj = {};
          // Parse inline key: value pairs from this line and subsequent indented lines
          const pairs = item.split(/,\s*/).map((p) => p.trim());
          for (const pair of pairs) {
            const [k, ...v] = pair.split(":");
            if (k && v.length) obj[k.trim()] = v.join(":").trim().replace(/^["']|["']$/g, "");
          }
          arrayItems.push(obj);
        } else {
          arrayItems.push(item.replace(/^["']|["']$/g, ""));
        }
        continue;
      } else {
        data[currentKey] = arrayItems;
        inArray = false;
        arrayItems = [];
      }
    }

    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      const [, key, value] = kvMatch;
      if (value === "") {
        // Could be start of array or nested object
        currentKey = key;
        inArray = true;
        arrayItems = [];
      } else {
        data[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  }

  if (inArray && currentKey) {
    data[currentKey] = arrayItems;
  }

  return { data, content: match[2] };
}

function stringifyFrontmatter(data, content) {
  let fm = "---\n";
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      fm += `${key}:\n`;
      for (const item of value) {
        if (typeof item === "object") {
          const pairs = Object.entries(item)
            .map(([k, v]) => `${k}: "${v}"`)
            .join(", ");
          fm += `  - ${pairs}\n`;
        } else {
          fm += `  - "${item}"\n`;
        }
      }
    } else {
      fm += `${key}: "${value}"\n`;
    }
  }
  fm += "---\n";
  return fm + (content || "");
}

// ─── Route handlers ──────────────────────────────────────────────────────────

async function handleAuth(req, res) {
  const { password } = await readBody(req);
  if (password !== ADMIN_PASSWORD) {
    return json(res, { error: "Invalid password" }, 401);
  }
  json(res, { ok: true });
}

function handleConfigGet(req, res) {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  json(res, JSON.parse(raw));
}

async function handleConfigPut(req, res) {
  const data = await readBody(req);
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
  json(res, { ok: true });
}

function handleBlogList(req, res) {
  if (!fs.existsSync(BLOG_DIR)) return json(res, []);

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse();

  const posts = files.map((filename) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8");
    const { data, content } = parseFrontmatter(raw);
    const slug = filename.replace(/\.md$/, "");
    return { slug, title: data.title || "", date: data.date || "", media: data.media, content };
  });

  json(res, posts);
}

function sanitizeSlug(slug) {
  return slug.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function handleBlogCreate(req, res) {
  const { slug, title, date, media, content } = await readBody(req);
  if (!slug || !title || !date) {
    return json(res, { error: "Missing required fields" }, 400);
  }

  const safeSlug = sanitizeSlug(slug);
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

  const frontmatter = { title, date };
  if (media && media.length > 0) frontmatter.media = media;

  const fileContent = stringifyFrontmatter(frontmatter, content || "");
  fs.writeFileSync(path.join(BLOG_DIR, `${safeSlug}.md`), fileContent, "utf-8");
  json(res, { ok: true, slug: safeSlug });
}

function handleBlogGet(req, res, slug) {
  const safeSlug = sanitizeSlug(slug);
  const filePath = path.join(BLOG_DIR, `${safeSlug}.md`);
  if (!fs.existsSync(filePath)) return json(res, { error: "Not found" }, 404);

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = parseFrontmatter(raw);
  json(res, { slug: safeSlug, title: data.title, date: data.date, media: data.media, content });
}

async function handleBlogPut(req, res, slug) {
  const safeSlug = sanitizeSlug(slug);
  const filePath = path.join(BLOG_DIR, `${safeSlug}.md`);
  if (!fs.existsSync(filePath)) return json(res, { error: "Not found" }, 404);

  const { title, date, media, content, newSlug } = await readBody(req);

  const frontmatter = { title, date };
  if (media && media.length > 0) frontmatter.media = media;

  const fileContent = stringifyFrontmatter(frontmatter, content || "");
  const finalSlug = sanitizeSlug(newSlug || slug);
  const newPath = path.join(BLOG_DIR, `${finalSlug}.md`);

  if (newPath !== filePath) fs.unlinkSync(filePath);
  fs.writeFileSync(newPath, fileContent, "utf-8");
  json(res, { ok: true, slug: finalSlug });
}

function handleBlogDelete(req, res, slug) {
  const safeSlug = sanitizeSlug(slug);
  const filePath = path.join(BLOG_DIR, `${safeSlug}.md`);
  if (!fs.existsSync(filePath)) return json(res, { error: "Not found" }, 404);

  fs.unlinkSync(filePath);
  json(res, { ok: true });
}

// ─── Server ──────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  cors(res, req);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Auth endpoint (no auth check needed)
  if (pathname === "/api/admin/auth" && req.method === "POST") {
    return handleAuth(req, res);
  }

  // All other endpoints require auth
  if (!checkAuth(req)) {
    return json(res, { error: "Unauthorized" }, 401);
  }

  // Config endpoints
  if (pathname === "/api/admin/config") {
    if (req.method === "GET") return handleConfigGet(req, res);
    if (req.method === "PUT") return handleConfigPut(req, res);
  }

  // Blog list/create
  if (pathname === "/api/admin/blog") {
    if (req.method === "GET") return handleBlogList(req, res);
    if (req.method === "POST") return handleBlogCreate(req, res);
  }

  // Blog CRUD by slug
  const blogMatch = pathname.match(/^\/api\/admin\/blog\/(.+)$/);
  if (blogMatch) {
    const slug = decodeURIComponent(blogMatch[1]);
    if (req.method === "GET") return handleBlogGet(req, res, slug);
    if (req.method === "PUT") return handleBlogPut(req, res, slug);
    if (req.method === "DELETE") return handleBlogDelete(req, res, slug);
  }

  json(res, { error: "Not found" }, 404);
});

server.listen(PORT, () => {
  console.log(`Admin API running at http://localhost:${PORT}`);
});
