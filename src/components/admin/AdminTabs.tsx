"use client";

const TABS = [
  "General",
  "Skills & Stats",
  "Projects",
  "Experience",
  "Hobbies",
  "Social",
  "Sections",
  "Blog",
] as const;

export type AdminTab = (typeof TABS)[number];

interface AdminTabsProps {
  active: AdminTab;
  onChange: (tab: AdminTab) => void;
}

export default function AdminTabs({ active, onChange }: AdminTabsProps) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border pb-3">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            active === tab
              ? "bg-accent text-bg font-semibold"
              : "text-text-muted hover:text-text-primary hover:bg-surface-2"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
