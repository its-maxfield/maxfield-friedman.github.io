"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { Project } from "@/data/site-config";
import MediaCarousel from "./MediaCarousel";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-5 z-[9999]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-surface border border-border-accent rounded-xl p-5 max-w-[900px] w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3.5 gap-3">
              <div>
                <h3 className="text-lg font-bold text-text-primary">{project.title}</h3>
                <p className="text-sm text-text-muted mt-1">{project.subtitle}</p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-2 rounded-lg hover:bg-surface-2 transition-colors text-text-muted cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            {project.media.length > 0 && <MediaCarousel media={project.media} />}
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              {project.desc}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
