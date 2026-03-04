# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Maxfield Friedman (Game Developer / XR Engineer), hosted on GitHub Pages at `maxfieldfriedman.com`. Built with Next.js (App Router), TypeScript, Tailwind CSS v4, and Framer Motion.

## Development

```bash
npm run dev    # Start dev server
npm run build  # Static export to out/
npm run lint   # ESLint
```

Changes go live when pushed to `main` via GitHub Actions (`.github/workflows/deploy.yml`).

## Architecture

### Content is data-driven

All portfolio content is in `src/data/site-config.ts` with full TypeScript types. To add or update content, edit the `siteConfig` object.

### Directory Structure

```
src/
  app/
    layout.tsx          # Root layout: fonts, metadata
    LayoutShell.tsx     # Client wrapper: Navbar, SideStrip, MobileFAB, Drawer
    page.tsx            # Main page: section composition
    globals.css         # Tailwind v4 @theme tokens
    event/page.tsx      # Password-gated event page
  components/
    layout/             # Navbar, SideStrip, MobileFAB, Drawer
    sections/           # Hero, Blog, Projects, Experience, Hobbies, Contact
    ui/                 # SectionWrapper, ProjectCard, ProjectModal, MediaCarousel, etc.
  data/site-config.ts   # All content + TypeScript interfaces
  hooks/useActiveSection.ts  # IntersectionObserver for nav highlighting
  lib/utils.ts          # cn() helper, formatDate
```

### Key Systems

- **Scroll-based sections** with Framer Motion fade-in (`SectionWrapper`)
- **Project filtering** by tag pills + modal with media carousel
- **Navbar** with active section highlighting via `useActiveSection` hook
- **SideStrip** (desktop) + **MobileFAB** (mobile) for quick links
- **Drawer** slide-out panel with bio + navigation
- **Static export** via `next.config.ts` (`output: 'export'`)

### Styling

- Tailwind CSS v4 with `@theme` tokens in `globals.css`
- Dark theme with earth tones; glass-morphism cards (`bg-surface/80 backdrop-blur-md`)
- Fonts: Inter (body), JetBrains Mono (mono) via `next/font/google`

## Assets

All assets live in `public/assets/` and are referenced with `/assets/...` paths.
