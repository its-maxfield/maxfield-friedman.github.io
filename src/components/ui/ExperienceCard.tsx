import type { ExperienceEntry } from "@/data/site-config";
import { isDev } from "@/lib/utils";

export default function ExperienceCard({ entry }: { entry: ExperienceEntry }) {
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
      <div className="grid grid-cols-[56px_1fr] gap-3.5 items-center mb-4">
        <img
          src={entry.logo}
          alt={entry.company}
          className="w-14 h-14 rounded-lg object-contain bg-surface-2 border border-border"
        />
        <a
          href={entry.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-base text-text-primary hover:text-accent transition-colors"
        >
          {entry.company}
        </a>
      </div>
      <div className="flex flex-col gap-3">
        {entry.roles.map((role) => (
          <div key={role.title} className="pt-3 border-t border-border">
            <p className="font-semibold text-sm text-text-primary">{role.title}</p>
            <p className="font-mono text-xs text-accent-text mt-0.5">{role.date}</p>
            <p className="text-text-muted text-sm mt-1.5 leading-relaxed">{role.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
