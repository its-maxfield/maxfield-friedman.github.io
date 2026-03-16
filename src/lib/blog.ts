import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { MediaItem } from "@/data/site-config";

export interface BlogPost {
  title: string;
  date: string;
  content: string;
  slug: string;
  media?: MediaItem[];
}

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export function getAllBlogPosts(): BlogPost[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  const posts: BlogPost[] = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    return {
      title: data.title,
      date: data.date,
      content: content.trim(),
      slug: file.replace(/\.md$/, ""),
      media: data.media,
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
