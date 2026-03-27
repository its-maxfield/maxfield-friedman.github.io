"use client";

import { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  content: string;
  media?: { type: string; src: string }[];
}

interface Props {
  token: string;
}

export default function BlogEditor({ token }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  async function fetchPosts() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/blog`, { headers });
      if (res.ok) setPosts(await res.json());
    } catch {
      setMessage("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startNew() {
    const today = new Date().toISOString().slice(0, 10);
    setEditing({ slug: `${today}-new-post`, title: "", date: today, content: "" });
    setIsNew(true);
  }

  function startEdit(post: BlogPost) {
    setEditing({ ...post });
    setIsNew(false);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setMessage("");

    try {
      if (isNew) {
        const res = await fetch(`${API_BASE}/api/admin/blog`, {
          method: "POST",
          headers,
          body: JSON.stringify(editing),
        });
        if (!res.ok) throw new Error("Failed to create post");
      } else {
        const res = await fetch(`${API_BASE}/api/admin/blog/${editing.slug}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(editing),
        });
        if (!res.ok) throw new Error("Failed to update post");
      }
      setMessage("Saved!");
      setEditing(null);
      fetchPosts();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(slug: string) {
    if (!confirm(`Delete post "${slug}"?`)) return;
    try {
      await fetch(`${API_BASE}/api/admin/blog/${slug}`, { method: "DELETE", headers });
      fetchPosts();
    } catch {
      setMessage("Delete failed");
    }
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">
            {isNew ? "New Post" : "Edit Post"}
          </h3>
          <button onClick={() => setEditing(null)} className="text-sm text-text-muted hover:underline">
            Cancel
          </button>
        </div>

        <input
          value={editing.title}
          onChange={(e) => setEditing({ ...editing, title: e.target.value })}
          placeholder="Post title"
          className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
        />

        <div className="flex gap-3">
          <input
            value={editing.date}
            onChange={(e) => setEditing({ ...editing, date: e.target.value })}
            type="date"
            className="px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
          />
          <input
            value={editing.slug}
            onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
            placeholder="Slug (filename)"
            className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <textarea
          value={editing.content}
          onChange={(e) => setEditing({ ...editing, content: e.target.value })}
          placeholder="Markdown content..."
          rows={16}
          className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:border-accent resize-y"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving || !editing.title || !editing.slug}
            className="px-4 py-2 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Post"}
          </button>
          {message && <span className="text-sm text-text-muted">{message}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Blog Posts</h3>
        <button onClick={startNew} className="text-sm text-accent hover:underline">
          + New Post
        </button>
      </div>

      {loading && <p className="text-text-muted text-sm">Loading posts...</p>}
      {message && <p className="text-sm text-text-muted">{message}</p>}

      {!loading && posts.length === 0 && (
        <p className="text-text-dim text-sm">No blog posts yet.</p>
      )}

      {posts.map((post) => (
        <div
          key={post.slug}
          className="flex items-center justify-between p-4 bg-surface-2 border border-border rounded-lg"
        >
          <div>
            <p className="text-text-primary font-medium">{post.title || post.slug}</p>
            <p className="text-text-muted text-sm">{post.date}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => startEdit(post)}
              className="text-sm text-accent hover:underline"
            >
              Edit
            </button>
            <button
              onClick={() => deletePost(post.slug)}
              className="text-sm text-red-400 hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
