import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "../src/lib/frontmatter";

describe("frontmatter parser", () => {
  it("parses every existing blog post", () => {
    const directory = path.join(process.cwd(), "content", "blog");
    for (const filename of fs.readdirSync(directory).filter((file) => file.endsWith(".md"))) {
      const { data, content } = parseFrontmatter(fs.readFileSync(path.join(directory, filename), "utf8"));
      expect(data.title, filename).toBeTypeOf("string");
      expect(data.date, filename).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(content.trim().length, filename).toBeGreaterThan(0);
    }
  });

  it("supports the media array format written by the admin tool", () => {
    const parsed = parseFrontmatter(`---\ntitle: "Media post"\ndate: "2026-08-16"\nmedia:\n  - type: "image", src: "/photo.jpg"\n  - type: "youtube"\n    src: "abc123"\n---\nBody`);
    expect(parsed.data.media).toEqual([
      { type: "image", src: "/photo.jpg" },
      { type: "youtube", src: "abc123" },
    ]);
    expect(parsed.content).toBe("Body");
  });
});
