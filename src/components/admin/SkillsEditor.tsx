"use client";

import type { SiteConfig, SkillGroup } from "@/data/site-config";

interface Props {
  config: SiteConfig;
  onChange: (config: SiteConfig) => void;
}

export default function SkillsEditor({ config, onChange }: Props) {
  function updateGroup(idx: number, group: SkillGroup) {
    const skills = [...config.skills];
    skills[idx] = group;
    onChange({ ...config, skills });
  }

  function addGroup() {
    onChange({ ...config, skills: [...config.skills, { group: "New Group", items: [] }] });
  }

  function removeGroup(idx: number) {
    onChange({ ...config, skills: config.skills.filter((_, i) => i !== idx) });
  }

  function addItem(gIdx: number) {
    const skills = [...config.skills];
    skills[gIdx] = { ...skills[gIdx], items: [...skills[gIdx].items, "New Skill"] };
    onChange({ ...config, skills });
  }

  function removeItem(gIdx: number, iIdx: number) {
    const skills = [...config.skills];
    skills[gIdx] = {
      ...skills[gIdx],
      items: skills[gIdx].items.filter((_, i) => i !== iIdx),
    };
    onChange({ ...config, skills });
  }

  function updateItem(gIdx: number, iIdx: number, value: string) {
    const skills = [...config.skills];
    const items = [...skills[gIdx].items];
    items[iIdx] = value;
    skills[gIdx] = { ...skills[gIdx], items };
    onChange({ ...config, skills });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Skills</h3>
        <button onClick={addGroup} className="text-sm text-accent hover:underline">
          + Add Group
        </button>
      </div>

      {config.skills.map((group, gIdx) => (
        <div key={gIdx} className="bg-surface-2 border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={group.group}
              onChange={(e) => updateGroup(gIdx, { ...group, group: e.target.value })}
              className="flex-1 px-2 py-1 bg-surface border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
            />
            <button onClick={() => removeGroup(gIdx)} className="text-red-400 text-sm hover:underline">
              Remove
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item, iIdx) => (
              <div key={iIdx} className="flex items-center gap-1 bg-surface border border-border rounded px-2 py-1">
                <input
                  value={item}
                  onChange={(e) => updateItem(gIdx, iIdx, e.target.value)}
                  className="bg-transparent text-text-primary text-sm w-24 focus:outline-none"
                />
                <button onClick={() => removeItem(gIdx, iIdx)} className="text-red-400 text-xs">
                  x
                </button>
              </div>
            ))}
            <button
              onClick={() => addItem(gIdx)}
              className="text-sm text-accent hover:underline px-2 py-1"
            >
              + Add
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
