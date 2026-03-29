// ─── Types ───────────────────────────────────────────────────────────────────

export interface MediaItem {
  type: "youtube" | "vimeo" | "video" | "image";
  src: string;
}

export interface Project {
  visible?: boolean;
  title: string;
  subtitle: string;
  img: string | null;
  media: MediaItem[];
  desc: string;
  tags: string[];
}

export interface Role {
  title: string;
  date: string;
  desc: string;
}

export interface ExperienceEntry {
  visible?: boolean;
  company: string;
  logo: string;
  link: string;
  roles: Role[];
}

export interface EducationEntry {
  visible?: boolean;
  institution: string;
  logo: string;
  degree: string;
  major: string;
  date: string;
  awards: string[];
  capstone: { title: string; link: string } | null;
}

export interface Accomplishment {
  title: string;
  img: string | null;
}

export interface Hobby {
  visible?: boolean;
  hobby: string;
  description: string;
  img: string | null;
  accomplishments: Accomplishment[];
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface Stat {
  label: string;
  value: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: "linkedin" | "github";
}

export interface SiteConfig {
  sections: Record<string, boolean>;
  name: string;
  tag: string;
  bio: string;
  email: string;
  resume: string;
  skills: SkillGroup[];
  stats: Stat[];
  projects: Project[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  hobbies: Hobby[];
  social: SocialLink[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

import rawConfig from "./site-config.json";

export const siteConfig = rawConfig as unknown as SiteConfig;
