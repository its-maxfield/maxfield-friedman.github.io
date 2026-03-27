"use client";

import { useState } from "react";
import type { SiteConfig, ExperienceEntry, Role } from "@/data/site-config";

interface Props {
  config: SiteConfig;
  onChange: (config: SiteConfig) => void;
}

function emptyRole(): Role {
  return { title: "", date: "", desc: "" };
}

function emptyEntry(): ExperienceEntry {
  return { visible: true, company: "", logo: "", link: "", roles: [emptyRole()] };
}

export default function ExperienceEditor({ config, onChange }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  function update(idx: number, entry: ExperienceEntry) {
    const experience = [...config.experience];
    experience[idx] = entry;
    onChange({ ...config, experience });
  }

  function add() {
    onChange({ ...config, experience: [...config.experience, emptyEntry()] });
    setExpanded(config.experience.length);
  }

  function remove(idx: number) {
    onChange({ ...config, experience: config.experience.filter((_, i) => i !== idx) });
    setExpanded(null);
  }

  function updateRole(eIdx: number, rIdx: number, role: Role) {
    const entry = { ...config.experience[eIdx] };
    const roles = [...entry.roles];
    roles[rIdx] = role;
    update(eIdx, { ...entry, roles });
  }

  function addRole(eIdx: number) {
    const entry = { ...config.experience[eIdx] };
    update(eIdx, { ...entry, roles: [...entry.roles, emptyRole()] });
  }

  function removeRole(eIdx: number, rIdx: number) {
    const entry = { ...config.experience[eIdx] };
    update(eIdx, { ...entry, roles: entry.roles.filter((_, i) => i !== rIdx) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Experience</h3>
        <button onClick={add} className="text-sm text-accent hover:underline">
          + Add Company
        </button>
      </div>

      {config.experience.map((entry, idx) => (
        <div key={idx} className="bg-surface-2 border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === idx ? null : idx)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${entry.visible !== false ? "bg-green-400" : "bg-amber-400"}`}
              />
              <span className="text-text-primary font-medium">{entry.company || "New Company"}</span>
            </div>
            <span className="text-text-dim text-sm">{expanded === idx ? "▲" : "▼"}</span>
          </button>

          {expanded === idx && (
            <div className="p-4 pt-0 space-y-3 border-t border-border">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-text-muted">
                  <input
                    type="checkbox"
                    checked={entry.visible !== false}
                    onChange={(e) => update(idx, { ...entry, visible: e.target.checked })}
                    className="accent-accent"
                  />
                  Visible
                </label>
                <div className="flex-1" />
                <button onClick={() => remove(idx)} className="text-red-400 text-sm hover:underline">
                  Delete
                </button>
              </div>

              <input
                value={entry.company}
                onChange={(e) => update(idx, { ...entry, company: e.target.value })}
                placeholder="Company name"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />
              <input
                value={entry.logo}
                onChange={(e) => update(idx, { ...entry, logo: e.target.value })}
                placeholder="Logo path (e.g. /assets/logos/...)"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />
              <input
                value={entry.link}
                onChange={(e) => update(idx, { ...entry, link: e.target.value })}
                placeholder="Company URL"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />

              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-muted">Roles</span>
                  <button onClick={() => addRole(idx)} className="text-xs text-accent hover:underline">
                    + Add Role
                  </button>
                </div>

                {entry.roles.map((role, rIdx) => (
                  <div key={rIdx} className="bg-surface border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={role.title}
                        onChange={(e) => updateRole(idx, rIdx, { ...role, title: e.target.value })}
                        placeholder="Role title"
                        className="flex-1 px-2 py-1.5 bg-surface-2 border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                      />
                      <button onClick={() => removeRole(idx, rIdx)} className="text-red-400 text-xs">
                        x
                      </button>
                    </div>
                    <input
                      value={role.date}
                      onChange={(e) => updateRole(idx, rIdx, { ...role, date: e.target.value })}
                      placeholder="Date range (e.g. Jan. 2024 - Present)"
                      className="w-full px-2 py-1.5 bg-surface-2 border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                    />
                    <textarea
                      value={role.desc}
                      onChange={(e) => updateRole(idx, rIdx, { ...role, desc: e.target.value })}
                      placeholder="Role description"
                      rows={3}
                      className="w-full px-2 py-1.5 bg-surface-2 border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent resize-y"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
