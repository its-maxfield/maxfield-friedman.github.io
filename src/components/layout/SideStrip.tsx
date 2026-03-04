"use client";

import { Mail, Linkedin, Github, FileText } from "lucide-react";
import { siteConfig } from "@/data/site-config";

const items = [
  {
    icon: Mail,
    href: `mailto:${siteConfig.email}`,
    label: "Email",
  },
  {
    icon: Linkedin,
    href: siteConfig.social.find((s) => s.icon === "linkedin")?.href ?? "#",
    label: "LinkedIn",
  },
  {
    icon: Github,
    href: siteConfig.social.find((s) => s.icon === "github")?.href ?? "#",
    label: "GitHub",
  },
  {
    icon: FileText,
    href: siteConfig.resume,
    label: "Resume",
  },
];

export default function SideStrip() {
  return (
    <div className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 flex-col gap-3 p-2">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target={item.href.startsWith("mailto") ? undefined : "_blank"}
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-lg bg-surface/80 backdrop-blur-md border border-border flex items-center justify-center text-text-muted hover:text-accent-text hover:border-border-accent transition-colors"
          aria-label={item.label}
        >
          <item.icon size={18} />
        </a>
      ))}
    </div>
  );
}
