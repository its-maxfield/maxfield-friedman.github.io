"use client";

import { useState, useEffect, useCallback } from "react";
import type { SiteConfig } from "@/data/site-config";
import AdminAuth from "@/components/admin/AdminAuth";
import AdminTabs, { type AdminTab } from "@/components/admin/AdminTabs";
import GeneralForm from "@/components/admin/GeneralForm";
import SkillsEditor from "@/components/admin/SkillsEditor";
import StatsEditor from "@/components/admin/StatsEditor";
import ProjectsEditor from "@/components/admin/ProjectsEditor";
import ExperienceEditor from "@/components/admin/ExperienceEditor";
import HobbiesEditor from "@/components/admin/HobbiesEditor";
import SocialEditor from "@/components/admin/SocialEditor";
import SectionsToggle from "@/components/admin/SectionsToggle";
import BlogEditor from "@/components/admin/BlogEditor";

const API_BASE = "http://localhost:3001";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [tab, setTab] = useState<AdminTab>("General");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);

  // Check for existing session
  useEffect(() => {
    const stored = sessionStorage.getItem("admin_token");
    if (stored) setToken(stored);
  }, []);

  const fetchConfig = useCallback(async (t: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/config`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        setConfig(await res.json());
      } else {
        setToken(null);
        sessionStorage.removeItem("admin_token");
      }
    } catch {
      setMessage("Cannot connect to admin server. Run: npm run admin");
    }
  }, []);

  useEffect(() => {
    if (token) fetchConfig(token);
  }, [token, fetchConfig]);

  function handleAuth(password: string) {
    setToken(password);
  }

  function handleConfigChange(newConfig: SiteConfig) {
    setConfig(newConfig);
    setDirty(true);
    setMessage("");
  }

  async function handleSave() {
    if (!token || !config) return;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setMessage("Saved! Changes will appear on refresh.");
        setDirty(false);
      } else {
        setMessage("Save failed.");
      }
    } catch {
      setMessage("Cannot connect to admin server.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    setToken(null);
    setConfig(null);
  }

  if (!token) {
    return <AdminAuth onAuth={handleAuth} />;
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted">{message || "Loading config..."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="text-xs text-amber-400 font-mono">Unsaved changes</span>
          )}
          {tab !== "Blog" && (
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="px-4 py-2 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
            >
              {saving ? "Saving..." : "Save Config"}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-muted">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <AdminTabs active={tab} onChange={setTab} />
      </div>

      {/* Tab Content */}
      <div className="bg-surface border border-border rounded-xl p-6">
        {tab === "General" && (
          <GeneralForm config={config} onChange={handleConfigChange} />
        )}
        {tab === "Skills & Stats" && (
          <div className="space-y-8">
            <SkillsEditor config={config} onChange={handleConfigChange} />
            <StatsEditor config={config} onChange={handleConfigChange} />
          </div>
        )}
        {tab === "Projects" && (
          <ProjectsEditor config={config} onChange={handleConfigChange} />
        )}
        {tab === "Experience" && (
          <ExperienceEditor config={config} onChange={handleConfigChange} />
        )}
        {tab === "Hobbies" && (
          <HobbiesEditor config={config} onChange={handleConfigChange} />
        )}
        {tab === "Social" && (
          <SocialEditor config={config} onChange={handleConfigChange} />
        )}
        {tab === "Sections" && (
          <SectionsToggle config={config} onChange={handleConfigChange} />
        )}
        {tab === "Blog" && <BlogEditor token={token} />}
      </div>
    </div>
  );
}
