"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Mail, Linkedin, Github, FileText } from "lucide-react";
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

export default function MobileFAB() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden fixed bottom-6 right-6 z-40 flex flex-col-reverse items-center gap-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-accent text-bg flex items-center justify-center shadow-lg transition-transform cursor-pointer"
        style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        aria-label="Quick links"
      >
        <Plus size={24} />
      </button>

      <AnimatePresence>
        {open &&
          items.map((item, i) => (
            <motion.a
              key={item.label}
              href={item.href}
              target={item.href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.3, y: 20 }}
              transition={{ delay: i * 0.05 }}
              className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-accent-text transition-colors shadow-md"
              aria-label={item.label}
            >
              <item.icon size={18} />
            </motion.a>
          ))}
      </AnimatePresence>
    </div>
  );
}
