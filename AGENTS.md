# AGENTS.md — Thea Traff Portfolio (POC)

Permanent working rules for any agent (human or AI) touching this repository.

## Content & assets
- **Preserve original image aspect ratios.** Always pass true `width`/`height`
  to `next/image`. Never use `object-fit: cover` for photography unless a case is
  explicitly required and documented in `DECISIONS.md`.
- **Never overwrite source assets.** Placeholder generation writes only to
  `public/placeholders/`. Real photos, when added, are additive.
- **Never scrape or republish the reference site's photographs or private
  content** (contact details, verbatim bio). Use placeholders; the live site is a
  visual reference only.
- **Keep content separate from layout.** Portfolio data lives in `content/`;
  components render typed blocks and hold no hard-coded copy or image lists.

## Code
- **Do not add dependencies without justification** recorded in `DECISIONS.md`.
  Target set: `next`, `react`, `react-dom`, `typescript`, types. Playwright is a
  dev-only verification tool.
- **Prefer Server Components.** Use Client Components (`"use client"`) only where
  an interaction genuinely requires them.
- **Do not redesign the site into a generic template.** No cards, rounded
  containers, drop shadows, gradients, decorative borders, big buttons, or a
  universal masonry grid. Favor generous whitespace and deliberate sequencing.
- Use semantic HTML, `<figure>/<figcaption>`, logical headings, visible focus
  states, and meaningful link text.

## Verification (after meaningful milestones)
- **Verify desktop and mobile layouts** with Playwright at **1440×1000,
  1024×900, 768×1024, 390×844.** Check for: horizontal overflow, distorted or
  cropped images, console errors, failed network requests.
- **Run lint and a production build** (`npm run lint && npm run build`) after
  meaningful milestones. Do not declare success merely because it compiles or the
  DOM elements exist — inspect the rendered screenshots.

## Git
- Small, descriptive commits after stable milestones. Do not combine unrelated
  work into one commit. Commit/push only when asked.
