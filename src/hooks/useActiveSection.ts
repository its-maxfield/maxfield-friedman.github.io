"use client";

import { useEffect, useState, useMemo } from "react";
import { siteConfig } from "@/data/site-config";
import { isDev } from "@/lib/utils";

const ALL_SECTIONS = ["hero", "blog", "projects", "experience", "education", "hobbies", "contact"];

export function useActiveSection() {
  const sections = useMemo(() => {
    if (isDev) return ALL_SECTIONS;
    return ALL_SECTIONS.filter(
      (s) => s === "hero" || siteConfig.sections[s] !== false
    );
  }, []);

  const [active, setActive] = useState("hero");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  return active;
}
