"use client";

import { useState } from "react";
import type { SiteConfig, Hobby, Accomplishment } from "@/data/site-config";

interface Props {
  config: SiteConfig;
  onChange: (config: SiteConfig) => void;
}

function emptyHobby(): Hobby {
  return { visible: true, hobby: "", description: "", img: null, accomplishments: [] };
}

export default function HobbiesEditor({ config, onChange }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  function update(idx: number, hobby: Hobby) {
    const hobbies = [...config.hobbies];
    hobbies[idx] = hobby;
    onChange({ ...config, hobbies });
  }

  function add() {
    onChange({ ...config, hobbies: [...config.hobbies, emptyHobby()] });
    setExpanded(config.hobbies.length);
  }

  function remove(idx: number) {
    onChange({ ...config, hobbies: config.hobbies.filter((_, i) => i !== idx) });
    setExpanded(null);
  }

  function updateAccomplishment(hIdx: number, aIdx: number, acc: Accomplishment) {
    const hobby = { ...config.hobbies[hIdx] };
    const accs = [...hobby.accomplishments];
    accs[aIdx] = acc;
    update(hIdx, { ...hobby, accomplishments: accs });
  }

  function addAccomplishment(hIdx: number) {
    const hobby = { ...config.hobbies[hIdx] };
    update(hIdx, {
      ...hobby,
      accomplishments: [...hobby.accomplishments, { title: "", img: null }],
    });
  }

  function removeAccomplishment(hIdx: number, aIdx: number) {
    const hobby = { ...config.hobbies[hIdx] };
    update(hIdx, {
      ...hobby,
      accomplishments: hobby.accomplishments.filter((_, i) => i !== aIdx),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Hobbies</h3>
        <button onClick={add} className="text-sm text-accent hover:underline">
          + Add Hobby
        </button>
      </div>

      {config.hobbies.map((hobby, idx) => (
        <div key={idx} className="bg-surface-2 border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === idx ? null : idx)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${hobby.visible !== false ? "bg-green-400" : "bg-amber-400"}`}
              />
              <span className="text-text-primary font-medium">{hobby.hobby || "New Hobby"}</span>
            </div>
            <span className="text-text-dim text-sm">{expanded === idx ? "▲" : "▼"}</span>
          </button>

          {expanded === idx && (
            <div className="p-4 pt-0 space-y-3 border-t border-border">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-text-muted">
                  <input
                    type="checkbox"
                    checked={hobby.visible !== false}
                    onChange={(e) => update(idx, { ...hobby, visible: e.target.checked })}
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
                value={hobby.hobby}
                onChange={(e) => update(idx, { ...hobby, hobby: e.target.value })}
                placeholder="Hobby name"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />
              <textarea
                value={hobby.description}
                onChange={(e) => update(idx, { ...hobby, description: e.target.value })}
                placeholder="Description"
                rows={4}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent resize-y"
              />
              <input
                value={hobby.img || ""}
                onChange={(e) => update(idx, { ...hobby, img: e.target.value || null })}
                placeholder="Image path (optional)"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />

              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-muted">Accomplishments</span>
                  <button onClick={() => addAccomplishment(idx)} className="text-xs text-accent hover:underline">
                    + Add
                  </button>
                </div>
                {hobby.accomplishments.map((acc, aIdx) => (
                  <div key={aIdx} className="flex items-center gap-2">
                    <input
                      value={acc.title}
                      onChange={(e) =>
                        updateAccomplishment(idx, aIdx, { ...acc, title: e.target.value })
                      }
                      placeholder="Title"
                      className="flex-1 px-2 py-1.5 bg-surface border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                    />
                    <input
                      value={acc.img || ""}
                      onChange={(e) =>
                        updateAccomplishment(idx, aIdx, { ...acc, img: e.target.value || null })
                      }
                      placeholder="Image path"
                      className="flex-1 px-2 py-1.5 bg-surface border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                    />
                    <button onClick={() => removeAccomplishment(idx, aIdx)} className="text-red-400 text-xs">
                      x
                    </button>
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
