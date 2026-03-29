"use client";

import { useState } from "react";
import type { SiteConfig, EducationEntry } from "@/data/site-config";

interface Props {
  config: SiteConfig;
  onChange: (config: SiteConfig) => void;
}

function emptyEntry(): EducationEntry {
  return {
    visible: true,
    institution: "",
    logo: "",
    degree: "",
    major: "",
    date: "",
    awards: [],
    capstone: null,
  };
}

export default function EducationEditor({ config, onChange }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  function update(idx: number, entry: EducationEntry) {
    const education = [...config.education];
    education[idx] = entry;
    onChange({ ...config, education });
  }

  function add() {
    onChange({ ...config, education: [...config.education, emptyEntry()] });
    setExpanded(config.education.length);
  }

  function remove(idx: number) {
    onChange({ ...config, education: config.education.filter((_, i) => i !== idx) });
    setExpanded(null);
  }

  function updateAward(eIdx: number, aIdx: number, value: string) {
    const entry = { ...config.education[eIdx] };
    const awards = [...entry.awards];
    awards[aIdx] = value;
    update(eIdx, { ...entry, awards });
  }

  function addAward(eIdx: number) {
    const entry = { ...config.education[eIdx] };
    update(eIdx, { ...entry, awards: [...entry.awards, ""] });
  }

  function removeAward(eIdx: number, aIdx: number) {
    const entry = { ...config.education[eIdx] };
    update(eIdx, { ...entry, awards: entry.awards.filter((_, i) => i !== aIdx) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Education</h3>
        <button onClick={add} className="text-sm text-accent hover:underline">
          + Add School
        </button>
      </div>

      {config.education.map((entry, idx) => (
        <div key={idx} className="bg-surface-2 border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === idx ? null : idx)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${entry.visible !== false ? "bg-green-400" : "bg-amber-400"}`}
              />
              <span className="text-text-primary font-medium">
                {entry.institution || "New School"}
              </span>
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
                value={entry.institution}
                onChange={(e) => update(idx, { ...entry, institution: e.target.value })}
                placeholder="Institution name"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />
              <input
                value={entry.logo}
                onChange={(e) => update(idx, { ...entry, logo: e.target.value })}
                placeholder="Logo path (e.g. /assets/logos/...)"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />
              <input
                value={entry.degree}
                onChange={(e) => update(idx, { ...entry, degree: e.target.value })}
                placeholder="Degree (e.g. Bachelor of Science)"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />
              <input
                value={entry.major}
                onChange={(e) => update(idx, { ...entry, major: e.target.value })}
                placeholder="Major / Field of Study"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />
              <input
                value={entry.date}
                onChange={(e) => update(idx, { ...entry, date: e.target.value })}
                placeholder="Date range (e.g. 2018 - 2022)"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />

              {/* Awards */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-muted">Awards</span>
                  <button onClick={() => addAward(idx)} className="text-xs text-accent hover:underline">
                    + Add Award
                  </button>
                </div>
                {entry.awards.map((award, aIdx) => (
                  <div key={aIdx} className="flex items-center gap-2">
                    <input
                      value={award}
                      onChange={(e) => updateAward(idx, aIdx, e.target.value)}
                      placeholder="Award title"
                      className="flex-1 px-2 py-1.5 bg-surface border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                    />
                    <button onClick={() => removeAward(idx, aIdx)} className="text-red-400 text-xs">
                      x
                    </button>
                  </div>
                ))}
              </div>

              {/* Capstone */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-muted">Capstone Project</span>
                  {!entry.capstone ? (
                    <button
                      onClick={() => update(idx, { ...entry, capstone: { title: "", link: "" } })}
                      className="text-xs text-accent hover:underline"
                    >
                      + Add Capstone
                    </button>
                  ) : (
                    <button
                      onClick={() => update(idx, { ...entry, capstone: null })}
                      className="text-red-400 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {entry.capstone && (
                  <div className="bg-surface border border-border rounded-lg p-3 space-y-2">
                    <input
                      value={entry.capstone.title}
                      onChange={(e) =>
                        update(idx, {
                          ...entry,
                          capstone: { ...entry.capstone!, title: e.target.value },
                        })
                      }
                      placeholder="Project title"
                      className="w-full px-2 py-1.5 bg-surface-2 border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                    />
                    <input
                      value={entry.capstone.link}
                      onChange={(e) =>
                        update(idx, {
                          ...entry,
                          capstone: { ...entry.capstone!, link: e.target.value },
                        })
                      }
                      placeholder="Project URL"
                      className="w-full px-2 py-1.5 bg-surface-2 border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
