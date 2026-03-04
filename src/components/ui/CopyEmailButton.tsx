"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { siteConfig } from "@/data/site-config";

export default function CopyEmailButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${siteConfig.email}`;
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-center gap-2 w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-bg transition-colors hover:bg-accent-text cursor-pointer"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "Copied!" : "Copy Email Address"}
    </button>
  );
}
