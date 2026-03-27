"use client";

import { useState } from "react";
import type { SiteConfig, Project, MediaItem } from "@/data/site-config";

interface Props {
  config: SiteConfig;
  onChange: (config: SiteConfig) => void;
}

function emptyProject(): Project {
  return { visible: true, title: "", subtitle: "", img: null, media: [], desc: "", tags: [] };
}

export default function ProjectsEditor({ config, onChange }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  function update(idx: number, project: Project) {
    const projects = [...config.projects];
    projects[idx] = project;
    onChange({ ...config, projects });
  }

  function add() {
    onChange({ ...config, projects: [...config.projects, emptyProject()] });
    setExpanded(config.projects.length);
  }

  function remove(idx: number) {
    onChange({ ...config, projects: config.projects.filter((_, i) => i !== idx) });
    setExpanded(null);
  }

  function move(idx: number, dir: -1 | 1) {
    const projects = [...config.projects];
    const target = idx + dir;
    if (target < 0 || target >= projects.length) return;
    [projects[idx], projects[target]] = [projects[target], projects[idx]];
    onChange({ ...config, projects });
    setExpanded(target);
  }

  function updateMedia(pIdx: number, mIdx: number, media: MediaItem) {
    const project = { ...config.projects[pIdx] };
    const mediaArr = [...project.media];
    mediaArr[mIdx] = media;
    update(pIdx, { ...project, media: mediaArr });
  }

  function addMedia(pIdx: number) {
    const project = { ...config.projects[pIdx] };
    update(pIdx, { ...project, media: [...project.media, { type: "image", src: "" }] });
  }

  function removeMedia(pIdx: number, mIdx: number) {
    const project = { ...config.projects[pIdx] };
    update(pIdx, { ...project, media: project.media.filter((_, i) => i !== mIdx) });
  }

  function updateTags(pIdx: number, tagsStr: string) {
    const project = { ...config.projects[pIdx] };
    update(pIdx, { ...project, tags: tagsStr.split(",").map((t) => t.trim()).filter(Boolean) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Projects</h3>
        <button onClick={add} className="text-sm text-accent hover:underline">
          + Add Project
        </button>
      </div>

      {config.projects.map((project, idx) => (
        <div key={idx} className="bg-surface-2 border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === idx ? null : idx)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${project.visible !== false ? "bg-green-400" : "bg-amber-400"}`}
              />
              <span className="text-text-primary font-medium">{project.title || "Untitled Project"}</span>
            </div>
            <span className="text-text-dim text-sm">{expanded === idx ? "▲" : "▼"}</span>
          </button>

          {expanded === idx && (
            <div className="p-4 pt-0 space-y-3 border-t border-border">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-text-muted">
                  <input
                    type="checkbox"
                    checked={project.visible !== false}
                    onChange={(e) => update(idx, { ...project, visible: e.target.checked })}
                    className="accent-accent"
                  />
                  Visible
                </label>
                <div className="flex-1" />
                <button onClick={() => move(idx, -1)} className="text-text-muted text-sm hover:text-text-primary">
                  ↑
                </button>
                <button onClick={() => move(idx, 1)} className="text-text-muted text-sm hover:text-text-primary">
                  ↓
                </button>
                <button onClick={() => remove(idx)} className="text-red-400 text-sm hover:underline">
                  Delete
                </button>
              </div>

              <input
                value={project.title}
                onChange={(e) => update(idx, { ...project, title: e.target.value })}
                placeholder="Title"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />
              <input
                value={project.subtitle}
                onChange={(e) => update(idx, { ...project, subtitle: e.target.value })}
                placeholder="Subtitle"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />
              <input
                value={project.img || ""}
                onChange={(e) => update(idx, { ...project, img: e.target.value || null })}
                placeholder="Thumbnail image path (e.g. /assets/...)"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />
              <textarea
                value={project.desc}
                onChange={(e) => update(idx, { ...project, desc: e.target.value })}
                placeholder="Description"
                rows={4}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent resize-y"
              />
              <input
                value={project.tags.join(", ")}
                onChange={(e) => updateTags(idx, e.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              />

              {/* Media */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-muted">Media</span>
                  <button onClick={() => addMedia(idx)} className="text-xs text-accent hover:underline">
                    + Add Media
                  </button>
                </div>
                {project.media.map((m, mIdx) => (
                  <div key={mIdx} className="flex items-center gap-2">
                    <select
                      value={m.type}
                      onChange={(e) =>
                        updateMedia(idx, mIdx, { ...m, type: e.target.value as MediaItem["type"] })
                      }
                      className="px-2 py-1.5 bg-surface border border-border rounded text-text-primary text-sm focus:outline-none"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="youtube">YouTube</option>
                      <option value="vimeo">Vimeo</option>
                    </select>
                    <input
                      value={m.src}
                      onChange={(e) => updateMedia(idx, mIdx, { ...m, src: e.target.value })}
                      placeholder="Source URL / path"
                      className="flex-1 px-2 py-1.5 bg-surface border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                    />
                    <button onClick={() => removeMedia(idx, mIdx)} className="text-red-400 text-xs">
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
