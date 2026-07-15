# DESIGN_SYSTEM.md — Thea Traff Portfolio (POC)

All shared values are defined as **CSS custom properties** in `app/globals.css`
under `:root`. This file documents them and the reasoning. Values were
approximated by inspecting the reference site with headless Playwright — they are
**not** copied from its stylesheet.

---

## Color

The reference sits on a single warm dark-gray field; photographs and light text
carry all the contrast. There are no cards, borders, gradients, or shadows.

| Token             | Value       | Use                                    |
| ----------------- | ----------- | -------------------------------------- |
| `--color-bg`      | `#4a4a4a`   | Page background (matches reference)    |
| `--color-text`    | `#ededed`   | Primary text, nav links                |
| `--color-dim`     | `#8f8f8f`   | Active nav item, secondary text        |
| `--color-faint`   | `#6f6f6f`   | Copyright, hairline meta               |
| `--color-frame`   | `#3f3f3f`   | Placeholder block fill (below bg)       |

No hover color shifts beyond a subtle opacity change — navigation stays quiet.

---

## Typography

- **Family:** an old-style serif standing in for *Sabon* (see `DECISIONS.md`).
  Loaded via `next/font` (self-hosted, `display: swap`, no layout shift).
- **Body default:** normal weight, generous line-height for the bio.
- **Title (`THEA TRAFF`):** italic, letter-spaced, small-caps feel.
- **Bio text:** italic serif with roman emphasis on proper nouns (editorial voice).
- **Caption subject:** small roman serif, prefixed with a `^` caret.
- **Caption publication/credit:** ~11px, **bold**, letter-spaced small caps.

| Token                 | Value        | Use                          |
| --------------------- | ------------ | ---------------------------- |
| `--font-serif`        | (font stack) | Everything                   |
| `--fs-title`          | `2.1rem`     | Site title                   |
| `--fs-nav`            | `1.05rem`    | Nav links                    |
| `--fs-body`           | `1.05rem`    | Bio / running text           |
| `--fs-caption`        | `0.95rem`    | Caption subject              |
| `--fs-meta`           | `0.7rem`     | Publication / credit         |
| `--lh-body`           | `1.6`        | Bio line-height              |

Type scale is intentionally shallow — restraint over hierarchy.

---

## Spacing scale

A single modular scale (rem), used for margins, gaps, and vertical rhythm:

| Token        | Value    |
| ------------ | -------- |
| `--space-1`  | `0.5rem` |
| `--space-2`  | `1rem`   |
| `--space-3`  | `1.5rem` |
| `--space-4`  | `2.5rem` |
| `--space-5`  | `4rem`   |
| `--space-6`  | `6rem`   |
| `--space-7`  | `9rem`   |

Vertical rhythm between image blocks in a sequence: `--space-6` desktop,
`--space-5` tablet, `--space-4` mobile.

---

## Page margins

| Token              | Desktop | Tablet | Mobile |
| ------------------ | ------- | ------ | ------ |
| `--page-margin`    | `2.5rem`| `2rem` | `1rem` |

The home grid runs closer to full-bleed (small gutter); interior content sits in
the column to the right of the fixed nav.

---

## Navigation dimensions

| Token             | Value    | Notes                                   |
| ----------------- | -------- | --------------------------------------- |
| `--nav-width`     | `250px`  | Fixed left column on interior pages     |
| `--nav-top`       | `2.2rem` | Title offset from top                   |
| `--nav-gap`       | `0.15rem`| Line gap between nav links (tight)      |

On mobile the sidebar becomes a stacked top header (no hamburger, zero JS).

---

## Image width categories

Driven by CSS custom properties so scales stay consistent across pages. Values
are the **max display width** of the image within the content column.

| Category            | `--w` token          | Approx desktop width |
| ------------------- | -------------------- | -------------------- |
| full-width          | `--iw-full`          | 100% of column       |
| wide landscape      | `--iw-wide`          | 78% of column        |
| medium landscape    | `--iw-medium`        | 55% of column        |
| large portrait      | `--iw-large-portrait`| 42% of column        |
| small portrait      | `--iw-small-portrait`| 26% of column        |
| centered portrait   | `--iw-centered`      | 38% of column        |

Aspect ratio is always preserved from the asset's real `width`/`height`.
**No `object-fit: cover`** for photography — the complete image always shows.

---

## Caption styling

- Placed at the **bottom-left under the image** (aligned to the image's left edge).
- Line 1: `^ Subject name` (roman serif, `--fs-caption`).
- Line 2: `PUBLICATION` (`--fs-meta`, bold, letter-spaced, uppercase).
- Muted color (`--color-dim`), tight leading, small top margin (`--space-1`).

---

## Responsive breakpoints

| Name    | Query                 | Behavior                                        |
| ------- | --------------------- | ----------------------------------------------- |
| desktop | `> 1024px`            | Full sidebar + multi-scale image sequence        |
| tablet  | `769px – 1024px`      | Narrower sidebar / margins, pairs may narrow      |
| mobile  | `≤ 768px`             | Sidebar → stacked top header; images stack        |

Verified viewports: **1440×1000, 1024×900, 768×1024, 390×844.**

---

## Motion

Effectively none. At most a subtle `opacity`/`transition` on link hover
(≤150ms). No scroll animations, parallax, or entrance effects.
