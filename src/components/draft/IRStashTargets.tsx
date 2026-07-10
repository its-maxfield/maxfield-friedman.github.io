"use client";

import { POS_COLOR, type IRStashTarget } from "@/data/draft-analysis";

export default function IRStashTargets({ targets, irSlots }: { targets: IRStashTarget[]; irSlots: number }) {
  if (!targets.length) {
    return (
      <p className="font-mono text-sm text-text-muted">
        No significant IR-stash candidates flagged right now. Injury designations firm up through training camp and
        preseason — re-run <span className="text-text-primary">npm run fetch-fantasy</span> closer to your draft and
        stashes will appear here.
      </p>
    );
  }

  return (
    <div>
      <p className="font-mono text-xs text-text-muted mb-4">
        Talent that&apos;s falling in drafts because of injury — draft late and park on one of your {irSlots} IR slots.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {targets.map((t) => (
          <div key={t.id} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: POS_COLOR[t.pos] }} />
              <span className="text-text-primary font-semibold">{t.name}</span>
              <span className="font-mono text-xs text-text-dim">{t.pos} · {t.team || "FA"}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded-full border border-reach/40 text-reach" style={{ color: "var(--color-reach)", borderColor: "color-mix(in srgb, var(--color-reach) 40%, transparent)" }}>
                {t.injuryStatus ?? "injured"}
              </span>
              {t.note && <span className="font-mono text-xs text-text-muted">{t.note}</span>}
            </div>
            <div className="font-mono text-xs text-text-muted">
              proj <span className="text-text-primary">{Math.round(t.projPts)}</span> half-PPR pts
              {t.adp ? ` · ADP ${t.adp}` : " · undrafted"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
