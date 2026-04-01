#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const title = process.argv[2];
if (!title) {
  console.error('Usage: npm run new-post -- "Post Title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const today = new Date().toISOString().slice(0, 10);
const blogDir = path.join(__dirname, "..", "content", "blog");
let filename = `${today}-${slug}.md`;

if (fs.existsSync(path.join(blogDir, filename))) {
  let i = 2;
  while (fs.existsSync(path.join(blogDir, `${today}-${slug}-${i}.md`))) i++;
  filename = `${today}-${slug}-${i}.md`;
}

const filePath = path.join(blogDir, filename);
const content = `---\ntitle: "${title}"\ndate: "${today}"\n---\n\n`;

fs.writeFileSync(filePath, content, "utf-8");
console.log(`Created: ${filePath}`);
