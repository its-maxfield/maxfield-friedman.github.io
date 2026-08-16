import fs from "fs";
import path from "path";
import type { MediaItem } from "@/data/site-config";
import { parseFrontmatter } from "@/lib/frontmatter";

export interface BlogPost {
  title: string;
  date: string;
  content: string;
  slug: string;
  media?: MediaItem[];
}

function isMediaItem(value: unknown): value is MediaItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return ["youtube", "vimeo", "video", "image"].includes(String(item.type)) && typeof item.src === "string";
}

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export function getAllBlogPosts(): BlogPost[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  const posts: BlogPost[] = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = parseFrontmatter(raw);

    if (typeof data.title !== "string" || typeof data.date !== "string") {
      throw new Error(`Invalid frontmatter in ${file}: title and date are required`);
    }

    return {
      title: data.title,
      date: data.date,
      content: content.trim(),
      slug: file.replace(/\.md$/, ""),
      media: Array.isArray(data.media) ? data.media.filter(isMediaItem) : undefined,
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
