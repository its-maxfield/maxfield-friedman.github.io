"use client";

import type { BlogPost } from "@/lib/blog";
import { formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export default function BlogEntry({ post }: { post: BlogPost }) {
  return (
    <article className="bg-surface border border-border rounded-xl p-6">
      <p className="font-mono text-xs text-accent-text">{formatDate(post.date)}</p>
      <h3 className="text-lg font-bold mt-1.5 text-text-primary">{post.title}</h3>
      <div className="prose prose-invert prose-sm max-w-none mt-3 prose-p:text-text-muted prose-p:leading-[1.7] prose-a:text-accent-text prose-strong:text-text-primary">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
      {post.media && post.media.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 mt-4">
          {post.media.map((m, i) => (
            <div key={i} className="aspect-video bg-bg rounded-lg overflow-hidden">
              {m.type === "image" ? (
                <img src={m.src} alt="" className="w-full h-full object-cover" />
              ) : m.type === "video" ? (
                <video controls className="w-full h-full object-cover">
                  <source src={m.src} />
                </video>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
