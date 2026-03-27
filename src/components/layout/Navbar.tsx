"use client";

import { useState, useMemo } from "react";
import { Menu, X } from "lucide-react";
import { useActiveSection } from "@/hooks/useActiveSection";
import { cn, isDev } from "@/lib/utils";
import { siteConfig } from "@/data/site-config";

const ALL_NAV_ITEMS = [
  { id: "hero", label: "About" },
  { id: "blog", label: "Blog" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "hobbies", label: "Hobbies" },
  { id: "contact", label: "Contact" },
];

export default function Navbar() {
  const active = useActiveSection();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_ITEMS = useMemo(() => {
    if (isDev) return ALL_NAV_ITEMS;
    return ALL_NAV_ITEMS.filter(
      (item) => item.id === "hero" || siteConfig.sections[item.id] !== false
    );
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur bg-bg/80 border-b border-border">
      <nav className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4 md:px-8">
        <a href="#hero" className="font-bold text-text-primary text-sm">
          MF
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                active === item.id
                  ? "text-accent-text bg-accent-dim/30"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-surface-2 transition-colors text-text-muted cursor-pointer"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile nav links */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-bg/95 backdrop-blur px-4 py-2">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-md text-sm transition-colors",
                active === item.id
                  ? "text-accent-text bg-accent-dim/30"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
