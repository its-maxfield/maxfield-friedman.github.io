import type { NewsEvidence, SourceHealth } from "@/data/draft-analysis";

const direction = (n: number) => n > 0 ? "↑" : n < 0 ? "↓" : "•";

export default function NewsImpactFeed({ evidence, health }: { evidence: NewsEvidence[]; health: SourceHealth[] }) {
  const sorted = [...evidence].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return (
    <div className="space-y-4">
      {health.length > 0 && (
        <div className="flex flex-wrap gap-2 font-mono text-xs">
          {health.map((item) => <span key={item.source} title={item.detail} className={`px-2 py-1 rounded-full border ${item.status === "ok" ? "border-border text-text-muted" : "border-amber-700 text-amber-400"}`}>{item.source}: {item.status}</span>)}
        </div>
      )}
      {sorted.length === 0 ? (
        <p className="font-mono text-xs text-text-muted">No approved news adjustments yet. Baseline rankings remain active.</p>
      ) : (
        <ol className="grid gap-2 md:grid-cols-2">
          {sorted.slice(0, 16).map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-surface-2/40 p-3">
              <div className="flex items-center gap-2 font-mono text-xs mb-1">
                <span style={{ color: item.direction > 0 ? "var(--color-steal)" : item.direction < 0 ? "var(--color-reach)" : "var(--color-text-muted)" }}>{direction(item.direction)} {item.eventType}</span>
                <span className="text-text-dim">{Math.round(item.confidence * 100)}% confidence</span>
              </div>
              <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-text-primary hover:text-accent-text">{item.title}</a>
              <p className="text-xs text-text-muted mt-1">{item.summary}</p>
              <p className="font-mono text-[11px] text-text-dim mt-2">{item.source} · {new Date(item.publishedAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
