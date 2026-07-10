"use client";

import { POSITIONS, type Position } from "@/data/draft-analysis";

interface Props {
  value: "All" | Position;
  onChange: (v: "All" | Position) => void;
  className?: string;
}

export default function PositionFilter({ value, onChange, className = "" }: Props) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {(["All", ...POSITIONS] as const).map((p) => {
        const on = value === p;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              on ? "bg-accent text-bg border-accent" : "bg-surface border-border text-text-muted hover:border-border-accent"
            }`}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
