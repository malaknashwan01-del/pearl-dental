# Pearl Dental 🦷

A bilingual (Arabic / English) landing page for a dental clinic, with a glossy 3D tooth that flies through the page as you scroll.

**Live demo:** _add your Vercel link here_

## Highlights

- **Procedural 3D tooth** built in three.js from a signed distance function (crown, cusps and three roots blended smoothly) and turned into a mesh with marching cubes, so there is no heavy model file to download
- **Pearl enamel material**: clearcoat, sheen and a subtle iridescence, lit with blue and pink rim lights in the brand colors
- **Scroll-driven flight path**: the tooth eases between a resting spot in each section, dips mid-flight, banks with its velocity and leans toward the cursor, with orbiting bubbles and twinkling sparkles
- **Arabic first, fully RTL**: layout built with CSS logical properties, so the page, decorations and flight path all mirror automatically for Arabic
- **Toothpaste palette**: blue, aqua and pink stripes on white, with hand-drawn SVG decorations (toothpaste swirl, tube, bubbles, toothbrush) and parallax
- **Accessible and light**: respects reduced-motion settings, skip link, keyboard focus styles; three.js is lazy-loaded after the page appears, and the page still works without WebGL

## Tech

Next.js 16 (App Router, static pages per language) · React 19 · TypeScript · Tailwind CSS v4 · three.js · self-hosted Alexandria font

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Visiting `/` redirects to `/ar` (or `/en` for English browsers).

## Project structure

```
src/
├── app/[lang]/        Layout and page for each language (ar, en)
├── components/landing/
│   ├── Landing.tsx     Sections, parallax, reveal animations
│   ├── toothScene.ts   The 3D tooth, scene and flight path
│   └── Decor.tsx       SVG decorations and logo
├── i18n/               Arabic and English copy
└── proxy.ts            Redirects to the visitor's language
```

## Roadmap

- Online booking: pick a treatment, dentist and free time slot
- Patient accounts with upcoming appointments
- Clinic dashboard with daily schedule

The clinic, team and contact details are fictional; this is a portfolio project.
