"use client";

import type { SiteConfig } from "@/data/site-config";

interface Props {
  config: SiteConfig;
  onChange: (config: SiteConfig) => void;
}

export default function StatsEditor({ config, onChange }: Props) {
  function updateStat(idx: number, field: "label" | "value", val: string) {
    const stats = [...config.stats];
    stats[idx] = { ...stats[idx], [field]: val };
    onChange({ ...config, stats });
  }

  function addStat() {
    onChange({ ...config, stats: [...config.stats, { label: "", value: "" }] });
  }

  function removeStat(idx: number) {
    onChange({ ...config, stats: config.stats.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Stats</h3>
        <button onClick={addStat} className="text-sm text-accent hover:underline">
          + Add Stat
        </button>
      </div>

      {config.stats.map((stat, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            value={stat.label}
            onChange={(e) => updateStat(idx, "label", e.target.value)}
            placeholder="Label"
            className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
          />
          <input
            value={stat.value}
            onChange={(e) => updateStat(idx, "value", e.target.value)}
            placeholder="Value"
            className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
          />
          <button onClick={() => removeStat(idx)} className="text-red-400 text-sm hover:underline">
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
