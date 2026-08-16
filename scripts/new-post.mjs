#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const title = process.argv[2];
if (!title) {
  console.error('Usage: npm run new-post -- "Post Title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const today = new Date().toISOString().slice(0, 10);
const blogDirectory = path.join(scriptDirectory, "..", "content", "blog");
let filename = `${today}-${slug}.md`;

if (fs.existsSync(path.join(blogDirectory, filename))) {
  let suffix = 2;
  while (fs.existsSync(path.join(blogDirectory, `${today}-${slug}-${suffix}.md`))) suffix += 1;
  filename = `${today}-${slug}-${suffix}.md`;
}

const filePath = path.join(blogDirectory, filename);
const content = `---\ntitle: "${title}"\ndate: "${today}"\n---\n\n`;

fs.writeFileSync(filePath, content, "utf-8");
console.log(`Created: ${filePath}`);
