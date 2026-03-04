"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "@/data/site-config";

function getYouTubeId(url: string) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/
  );
  return match?.[1] ?? "";
}

function MediaRenderer({ item }: { item: MediaItem }) {
  switch (item.type) {
    case "youtube":
      return (
        <iframe
          src={`https://www.youtube.com/embed/${getYouTubeId(item.src)}`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    case "vimeo":
      return (
        <iframe
          src={item.src}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      );
    case "video":
      return (
        <video controls className="w-full h-full object-contain">
          <source src={item.src} />
        </video>
      );
    case "image":
      return (
        <img src={item.src} alt="" className="w-full h-full object-contain" />
      );
  }
}

export default function MediaCarousel({ media }: { media: MediaItem[] }) {
  const [index, setIndex] = useState(0);

  if (media.length === 0) return null;

  const prev = () => setIndex((i) => (i - 1 + media.length) % media.length);
  const next = () => setIndex((i) => (i + 1) % media.length);

  return (
    <div>
      <div className="relative h-[320px] bg-[#0d0f12] rounded-lg overflow-hidden">
        <MediaRenderer item={media[index]} />
        {media.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>
      {media.length > 1 && (
        <p className="text-center font-mono text-xs text-text-muted mt-2">
          {index + 1} / {media.length}
        </p>
      )}
    </div>
  );
}
