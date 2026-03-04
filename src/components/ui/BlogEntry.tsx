import type { BlogPost } from "@/data/site-config";
import { formatDate } from "@/lib/utils";

export default function BlogEntry({ post }: { post: BlogPost }) {
  const paragraphs = post.content.split("\n\n");

  return (
    <article className="bg-surface border border-border rounded-xl p-6">
      <p className="font-mono text-xs text-accent-text">{formatDate(post.date)}</p>
      <h3 className="text-lg font-bold mt-1.5 text-text-primary">{post.title}</h3>
      <div className="text-text-muted text-sm leading-[1.7] mt-3 space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
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
