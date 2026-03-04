import { siteConfig } from "@/data/site-config";
import BlogEntry from "@/components/ui/BlogEntry";

export default function Blog() {
  const sorted = [...siteConfig.blog].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-6">Blog</h2>
      <div className="flex flex-col gap-6">
        {sorted.map((post) => (
          <BlogEntry key={post.title} post={post} />
        ))}
      </div>
    </div>
  );
}
