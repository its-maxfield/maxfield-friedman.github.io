import { siteConfig } from "@/data/site-config";
import { Linkedin, Github, FileDown } from "lucide-react";
import CopyEmailButton from "@/components/ui/CopyEmailButton";

const iconMap = {
  linkedin: Linkedin,
  github: Github,
};

export default function Contact() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-6">Contact</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-surface/80 backdrop-blur-md border border-border rounded-xl p-5">
          <p className="font-mono text-[11px] text-text-dim uppercase tracking-wide">
            Get in touch
          </p>
          <p className="text-text-muted text-sm mt-2">
            Email me or download my resume below.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <CopyEmailButton />
            <a
              href={siteConfig.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-lg border border-border px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-2"
            >
              <FileDown size={16} />
              Download Resume
            </a>
          </div>
          <p className="font-mono text-xs text-text-muted mt-3">
            {siteConfig.email}
          </p>
        </div>

        <div className="bg-surface/80 backdrop-blur-md border border-border rounded-xl p-5">
          <p className="font-mono text-[11px] text-text-dim uppercase tracking-wide mb-2">
            Links
          </p>
          {siteConfig.social.map((link) => {
            const Icon = iconMap[link.icon];
            return (
              <div
                key={link.label}
                className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-text-muted" />
                  <span className="font-semibold text-sm text-text-primary">
                    {link.label}
                  </span>
                </div>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-accent-text hover:text-accent transition-colors"
                >
                  Visit &rarr;
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
