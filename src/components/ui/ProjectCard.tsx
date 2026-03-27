"use client";

import type { Project } from "@/data/site-config";
import { isDev } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const isHidden = isDev && project.visible === false;

  return (
    <button
      onClick={onClick}
      className={`bg-surface border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-border-accent hover:bg-surface-2 text-left flex flex-col relative ${
        isHidden ? "border-dashed border-amber-500/60 opacity-60" : "border-border"
      }`}
    >
      {isHidden && (
        <span className="absolute top-2 right-2 z-10 bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded">
          DRAFT
        </span>
      )}
      <div className="bg-[#0d0f12] flex items-center justify-center min-h-[140px]">
        {project.img ? (
          <img
            src={project.img}
            alt={project.title}
            className="w-full h-auto object-contain block"
          />
        ) : (
          <span className="text-text-dim text-sm">No preview</span>
        )}
      </div>
      <div className="p-3.5">
        <p className="font-bold text-[15px] text-text-primary">{project.title}</p>
        <p className="text-[13px] text-text-muted mt-1">{project.subtitle}</p>
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-2 text-text-muted border border-border"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
