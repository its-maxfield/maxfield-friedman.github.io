"use client";

import type { SiteConfig } from "@/data/site-config";

interface Props {
  config: SiteConfig;
  onChange: (config: SiteConfig) => void;
}

const SECTION_LABELS: Record<string, string> = {
  blog: "Blog",
  projects: "Projects",
  experience: "Experience",
  hobbies: "Hobbies",
  contact: "Contact",
};

export default function SectionsToggle({ config, onChange }: Props) {
  function toggle(key: string) {
    onChange({
      ...config,
      sections: { ...config.sections, [key]: !config.sections[key] },
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-text-primary">Section Visibility</h3>
      <p className="text-sm text-text-muted">
        Toggle which sections are visible on the public site. Hidden sections still appear
        locally in dev mode with a &quot;HIDDEN SECTION&quot; banner.
      </p>

      <div className="space-y-3">
        {Object.entries(SECTION_LABELS).map(([key, label]) => (
          <label
            key={key}
            className="flex items-center justify-between p-3 bg-surface-2 border border-border rounded-lg cursor-pointer hover:border-border-accent transition-colors"
          >
            <span className="text-text-primary font-medium">{label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">
                {config.sections[key] !== false ? "Visible" : "Hidden"}
              </span>
              <input
                type="checkbox"
                checked={config.sections[key] !== false}
                onChange={() => toggle(key)}
                className="accent-accent w-4 h-4"
              />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
