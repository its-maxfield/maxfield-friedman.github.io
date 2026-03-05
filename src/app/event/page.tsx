"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Lock, MapPin, DollarSign } from "lucide-react";

const EVENT_PASSWORD = "3rdpatty";

const bars = [
  { name: "Harper & Rye",      addr: "1695 Polk St",       lat: 37.7922344, lng: -122.42132,  color: "#FF6B6B" },
  { name: "Hi-Lo Club",        addr: "1423 Polk St",       lat: 37.7899543, lng: -122.42070,  color: "#FFD93D" },
  { name: "McTeague's Saloon", addr: "1237 Polk St",       lat: 37.7883793, lng: -122.42050,  color: "#6BCB77" },
  { name: "Wreck Room",        addr: "1390 California St", lat: 37.7912215, lng: -122.41716,  color: "#4D96FF" },
  { name: "Jackalope",         addr: "1092 Post St",       lat: 37.7869831, lng: -122.41978,  color: "#FF922B" },
  { name: "Ace's Bar",         addr: "998 Sutter St",      lat: 37.78831,   lng: -122.41671,  color: "#DA77FF" },
  { name: "Peacekeeper",       addr: "925 Bush St",        lat: 37.7895456, lng: -122.41253,  color: "#FF6BD6" },
  { name: "The Summer Place",  addr: "801 Bush St",        lat: 37.78985,   lng: -122.41060,  color: "#38D9A9" },
];

const BarMap = dynamic(() => import("@/components/ui/BarMap"), { ssr: false });

function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-8"
    >
      <ArrowLeft size={16} />
      Back to Portfolio
    </Link>
  );
}

export default function EventPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === EVENT_PASSWORD) {
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-xl p-8 max-w-sm w-full">
          <BackLink />
          <div className="flex items-center gap-2 mb-4">
            <Lock size={20} className="text-accent" />
            <h1 className="text-xl font-bold text-text-primary">Event Access</h1>
          </div>
          <p className="text-sm text-text-muted mb-6">
            Enter the password to view event details.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg bg-surface-2 border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-border-accent"
            />
            {error && (
              <p className="text-xs text-red-400">Incorrect password. Try again.</p>
            )}
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-text cursor-pointer"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-24 max-w-3xl mx-auto">
      <BackLink />
      <h1 className="text-3xl font-bold text-text-primary mb-8">Event Details</h1>

      <div className="space-y-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-accent" />
            <h2 className="font-bold text-text-primary">Location</h2>
          </div>
          <BarMap bars={bars} />
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={18} className="text-accent" />
            <h2 className="font-bold text-text-primary">Venmo</h2>
          </div>
          <a
            href="https://venmo.com/u/maxfield_friedman"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-text"
          >
            Send via Venmo
          </a>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="font-bold text-text-primary mb-2">Event Info</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Event details will be updated here. Check back for more information.
          </p>
        </div>
      </div>
    </div>
  );
}
