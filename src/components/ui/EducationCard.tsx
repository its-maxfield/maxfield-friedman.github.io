import type { EducationEntry } from "@/data/site-config";
import { isDev } from "@/lib/utils";

export default function EducationCard({ entry }: { entry: EducationEntry }) {
  const isHidden = isDev && entry.visible === false;

  return (
    <div
      className={`bg-surface border rounded-xl p-5 relative ${
        isHidden ? "border-dashed border-amber-500/60 opacity-60" : "border-border"
      }`}
    >
      {isHidden && (
        <span className="absolute top-2 right-2 z-10 bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded">
          DRAFT
        </span>
      )}

      <div className="flex items-center gap-3.5 mb-4">
        {entry.logo && (
          <img
            src={entry.logo}
            alt={entry.institution}
            className="w-14 h-14 rounded-lg object-contain bg-surface-2 border border-border"
          />
        )}
        <div>
          <p className="font-bold text-base text-text-primary">{entry.institution}</p>
          <p className="text-sm text-text-muted">
            {entry.degree} — {entry.major}
          </p>
          <p className="font-mono text-xs text-accent-text mt-0.5">{entry.date}</p>
        </div>
      </div>

      {entry.awards.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="font-semibold text-sm text-text-primary mb-1.5">Awards</p>
          <ul className="list-disc list-inside text-text-muted text-sm space-y-0.5">
            {entry.awards.map((award) => (
              <li key={award}>{award}</li>
            ))}
          </ul>
        </div>
      )}

      {entry.capstone && (
        <div className="pt-3 border-t border-border mt-3">
          <p className="font-semibold text-sm text-text-primary mb-1">Capstone Project</p>
          <a
            href={entry.capstone.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline"
          >
            {entry.capstone.title}
          </a>
        </div>
      )}
    </div>
  );
}
