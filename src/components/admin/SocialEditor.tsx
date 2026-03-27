"use client";

import type { SiteConfig, SocialLink } from "@/data/site-config";

interface Props {
  config: SiteConfig;
  onChange: (config: SiteConfig) => void;
}

export default function SocialEditor({ config, onChange }: Props) {
  function update(idx: number, link: SocialLink) {
    const social = [...config.social];
    social[idx] = link;
    onChange({ ...config, social });
  }

  function add() {
    onChange({
      ...config,
      social: [...config.social, { label: "", href: "", icon: "github" }],
    });
  }

  function remove(idx: number) {
    onChange({ ...config, social: config.social.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Social Links</h3>
        <button onClick={add} className="text-sm text-accent hover:underline">
          + Add Link
        </button>
      </div>

      {config.social.map((link, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            value={link.label}
            onChange={(e) => update(idx, { ...link, label: e.target.value })}
            placeholder="Label"
            className="w-32 px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
          />
          <input
            value={link.href}
            onChange={(e) => update(idx, { ...link, href: e.target.value })}
            placeholder="URL"
            className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
          />
          <select
            value={link.icon}
            onChange={(e) =>
              update(idx, { ...link, icon: e.target.value as SocialLink["icon"] })
            }
            className="px-2 py-2 bg-surface-2 border border-border rounded-lg text-text-primary text-sm focus:outline-none"
          >
            <option value="github">GitHub</option>
            <option value="linkedin">LinkedIn</option>
          </select>
          <button onClick={() => remove(idx)} className="text-red-400 text-sm hover:underline">
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
