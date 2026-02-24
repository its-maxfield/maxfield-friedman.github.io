# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Maxfield Friedman (Game Developer / XR Engineer), hosted on GitHub Pages at `maxfieldfriedman.com`. The entire site is a single file: `index.html`.

## Development

No build system. Edit `index.html` directly and open it in a browser to preview locally. Changes go live automatically when pushed to the `main` branch via GitHub Pages.

## Architecture

The site is a single-page, zero-dependency application. All HTML, CSS, and JavaScript live in `index.html`.

### Content is data-driven

All portfolio content (projects, skills, experience, hobbies, social links) is defined in a `SITE_CONFIG` object near the top of the `<script>` block (around line 362). The JavaScript then renders these dynamically into the DOM. To add or update content, edit `SITE_CONFIG` rather than the HTML markup.

### Key JavaScript systems

- **Project filtering** — projects can be filtered by tag (Unity, XR, Multiplayer, etc.)
- **Modal/lightbox** — clicking a project card opens a detail modal with media support (YouTube, Vimeo, local video, images)
- **Email copy-to-clipboard** — with a `mailto:` fallback

### Styling

- Embedded `<style>` block using CSS variables for colors and spacing
- Dark theme with earth tones; glass-morphism card design using `backdrop-filter`
- Fully responsive via media queries

## Assets

```
assets/
  profile.jpg                         # Header profile photo
  Maxfield_Friedman_XR_Gameplay_Engineer.pdf  # Downloadable resume
  logos/                              # Company logos for Experience section
  fmsMedia/                           # Karnivus game project images
  fidelis/                            # Alcon Fidelis Surgical Simulator media
  cs_vcs/                             # Alcon CS/VCS Experience media (video + thumbnails)
  baking/                             # Hobby showcase images
```
