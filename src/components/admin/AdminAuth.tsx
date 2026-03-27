"use client";

import { useState } from "react";

const API_BASE = "http://localhost:3001";

interface AdminAuthProps {
  onAuth: (password: string) => void;
}

export default function AdminAuth({ onAuth }: AdminAuthProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        sessionStorage.setItem("admin_token", password);
        onAuth(password);
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Cannot connect to admin server. Run: npm run admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-xl p-8 w-full max-w-sm"
      >
        <h1 className="text-xl font-bold text-text-primary mb-6">Admin Login</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent mb-4"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-2 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Authenticating..." : "Log In"}
        </button>
      </form>
    </div>
  );
}
