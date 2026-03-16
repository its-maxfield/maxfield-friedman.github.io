"use client";

import { useState } from "react";
import type { BlogPost } from "@/lib/blog";
import BlogEntry from "./BlogEntry";

const VISIBLE_COUNT = 5;

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = posts.length > VISIBLE_COUNT;
  const visible = expanded ? posts : posts.slice(0, VISIBLE_COUNT);

  return (
    <div className="flex flex-col gap-6">
      {visible.map((post) => (
        <BlogEntry key={post.slug} post={post} />
      ))}
      {hasMore && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="self-center px-5 py-2 text-sm font-medium text-accent-text border border-border-accent rounded-lg hover:bg-surface-2 transition-colors"
        >
          {expanded
            ? "Show less"
            : `Show ${posts.length - VISIBLE_COUNT} more post${posts.length - VISIBLE_COUNT === 1 ? "" : "s"}`}
        </button>
      )}
    </div>
  );
}
