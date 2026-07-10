"use client";

import { POSITIONS, POS_COLOR } from "@/data/draft-analysis";

/** Small inline key mapping each position to its color. */
export default function PositionKey({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs text-text-muted">
      {label && <span>{label}</span>}
      {POSITIONS.map((p) => (
        <span key={p} className="inline-flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: POS_COLOR[p] }} />
          {p}
        </span>
      ))}
    </span>
  );
}
