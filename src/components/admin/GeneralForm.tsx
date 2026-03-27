"use client";

import type { SiteConfig } from "@/data/site-config";

interface Props {
  config: SiteConfig;
  onChange: (config: SiteConfig) => void;
}

export default function GeneralForm({ config, onChange }: Props) {
  function set(key: keyof SiteConfig, value: string) {
    onChange({ ...config, [key]: value });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-text-primary">General Info</h3>

      <label className="block">
        <span className="text-sm text-text-muted">Name</span>
        <input
          value={config.name}
          onChange={(e) => set("name", e.target.value)}
          className="mt-1 w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="text-sm text-text-muted">Tag / Title</span>
        <input
          value={config.tag}
          onChange={(e) => set("tag", e.target.value)}
          className="mt-1 w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="text-sm text-text-muted">Bio</span>
        <textarea
          value={config.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={6}
          className="mt-1 w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent resize-y"
        />
      </label>

      <label className="block">
        <span className="text-sm text-text-muted">Email</span>
        <input
          value={config.email}
          onChange={(e) => set("email", e.target.value)}
          className="mt-1 w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="text-sm text-text-muted">Resume Path</span>
        <input
          value={config.resume}
          onChange={(e) => set("resume", e.target.value)}
          className="mt-1 w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
        />
      </label>
    </div>
  );
}
