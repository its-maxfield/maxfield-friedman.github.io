import Image from "next/image";
import { siteConfig } from "@/data/site-config";

export default function Hero() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
      <div>
        <h1 className="text-5xl md:text-7xl font-bold text-text-primary">
          {siteConfig.name}
        </h1>
        <p className="font-mono text-accent-text text-lg mt-2">{siteConfig.tag}</p>
        <p className="text-text-muted text-sm leading-[1.7] mt-6">{siteConfig.bio}</p>
        <div className="flex gap-3 mt-8">
          <a
            href="#projects"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-text"
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-2"
          >
            Contact
          </a>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center md:justify-end">
          <Image
            src="/assets/profile.jpg"
            alt={siteConfig.name}
            width={200}
            height={200}
            className="rounded-xl border border-border"
            priority
          />
        </div>

        <div className="bg-surface/80 backdrop-blur-md border border-border rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4">
            {siteConfig.stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xs text-text-dim font-mono uppercase tracking-wide">
                  {s.label}
                </p>
                <p className="text-sm font-semibold text-text-primary mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface/80 backdrop-blur-md border border-border rounded-xl p-4">
          <p className="font-mono text-[11px] text-text-dim uppercase tracking-wide mb-2.5">
            Skills
          </p>
          {siteConfig.skills.map((group) => (
            <div key={group.group} className="mb-3 last:mb-0">
              <p className="text-xs font-semibold text-text-muted mb-1.5">{group.group}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((skill) => (
                  <span
                    key={skill}
                    className="font-mono text-[11px] px-2.5 py-1 rounded-md border border-border-accent text-accent-text bg-accent-dim/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
