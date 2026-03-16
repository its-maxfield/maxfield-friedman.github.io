import { getAllBlogPosts } from "@/lib/blog";
import BlogList from "@/components/ui/BlogList";

export default function Blog() {
  const posts = getAllBlogPosts();

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-6">Blog</h2>
      <BlogList posts={posts} />
    </div>
  );
}
