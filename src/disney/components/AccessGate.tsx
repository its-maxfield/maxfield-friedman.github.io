"use client";

import { useState, useSyncExternalStore } from "react";
import { LockKeyhole } from "lucide-react";

const ACCESS_KEY = "park-day-trip-access";
const PASSWORD_HASH = "b85d909f696aff55fdf6b44024857986a6cbe1625161638b23db7be5160b686a";
const listeners = new Set<() => void>();
const subscribe = (callback: () => void) => { listeners.add(callback); return () => listeners.delete(callback); };
const unlocked = () => typeof window !== "undefined" && localStorage.getItem(ACCESS_KEY) === "1";

async function hash(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const open = useSyncExternalStore(subscribe, unlocked, () => false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitted = String(new FormData(event.currentTarget).get("passphrase") ?? password);
    if (await hash(submitted) === PASSWORD_HASH) {
      localStorage.setItem(ACCESS_KEY, "1");
      listeners.forEach((listener) => listener());
    } else setError(true);
  }

  if (open) return <>{children}</>;
  return (
    <main className="min-h-dvh bg-[#07110f] px-5 text-[#f7f2e7] grid place-items-center">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#10221d] p-6 shadow-2xl">
        <div className="grid size-12 place-items-center rounded-2xl bg-emerald-300 text-emerald-950"><LockKeyhole /></div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Private trip tool</p>
        <h1 className="mt-2 text-3xl font-black">Park Day Optimizer</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">Enter the trip passphrase. Unlocking is remembered on this device for offline use.</p>
        <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-white/55" htmlFor="trip-passphrase">Passphrase</label>
        <input id="trip-passphrase" name="passphrase" autoFocus type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(false); }} className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 text-base outline-none focus:border-emerald-300" />
        {error && <p className="mt-3 text-sm font-bold text-rose-300">That passphrase does not match.</p>}
        <button className="mt-4 min-h-12 w-full rounded-xl bg-emerald-300 px-4 font-black text-emerald-950">Unlock</button>
      </form>
    </main>
  );
}
