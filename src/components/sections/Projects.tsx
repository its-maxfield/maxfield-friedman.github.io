"use client";

import { useState, useMemo } from "react";
import { siteConfig } from "@/data/site-config";
import type { Project } from "@/data/site-config";
import ProjectCard from "@/components/ui/ProjectCard";
import ProjectModal from "@/components/ui/ProjectModal";
import { visibleOnly, isDev } from "@/lib/utils";

export default function Projects() {
  const [filter, setFilter] = useState("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const projects = isDev ? siteConfig.projects : visibleOnly(siteConfig.projects);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return ["All", ...Array.from(tags)];
  }, [projects]);

  const filtered =
    filter === "All"
      ? projects
      : projects.filter((p) => p.tags.includes(filter));

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-6">Projects</h2>

      <div className="flex flex-wrap gap-2 mb-6">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter(tag)}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              filter === tag
                ? "bg-accent text-bg border-accent"
                : "bg-surface border-border text-text-muted hover:border-border-accent"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project) => (
          <ProjectCard
            key={project.title}
            project={project}
            onClick={() => setSelectedProject(project)}
          />
        ))}
      </div>

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
