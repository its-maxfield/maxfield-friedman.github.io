"use client";

import { useState, useSyncExternalStore } from "react";
import { Lock } from "lucide-react";

// Client-side gate. NOTE: on a static site this only obscures — the page's data
// still ships in the bundle. To change the password, run locally:
//   node -e "const c=require('crypto');console.log(c.createHash('sha256').update('YOUR-PASSWORD').digest('hex'))"
// and paste the result below. (Default password: war-room-2026)
const PASSWORD_HASH = "fdb843125636e9c18efacef0da0a30cf9b8099fc2bc1c7ece652ac6754d878fd";
const SESSION_KEY = "draft_auth";

// Tiny external store over sessionStorage so auth state reads correctly on the
// client without a setState-in-effect / hydration flash.
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function isAuthed() {
  return typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1";
}
function unlock() {
  sessionStorage.setItem(SESSION_KEY, "1");
  listeners.forEach((l) => l());
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function DraftGate({ children }: { children: React.ReactNode }) {
  const open = useSyncExternalStore(subscribe, isAuthed, () => false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(false);
    if ((await sha256(pw)) === PASSWORD_HASH) {
      unlock();
    } else {
      setError(true);
    }
    setChecking(false);
  }

  if (open) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-2 text-accent-text">
          <Lock size={18} />
          <h1 className="text-lg font-bold text-text-primary">Draft War Room</h1>
        </div>
        <p className="text-text-muted text-sm mb-6">Private fantasy draft analysis. Enter the passphrase.</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Passphrase"
          className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent mb-4"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm mb-4">Not quite. Try again.</p>}
        <button
          type="submit"
          disabled={checking || !pw}
          className="w-full py-2 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {checking ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
