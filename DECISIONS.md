# DECISIONS.md — Thea Traff Portfolio (POC)

Reversible decisions and assumptions, logged so nothing important is decided
silently. Each entry: **Decision → Why → How to reverse.**

---

### D19. Favicon: the wordmark's italic "T", as a baked outline
- **Decision:** The site icon is the capital "T" from "THEA TRAFF", set in the
  wordmark's exact typography — EB Garamond, weight 400, italic, uppercase
  (`components/Nav.module.css` `.title` + `.titleWrap`). The glyph is shipped as
  a **path**, not a `<text>` element: extracted from the italic EB Garamond
  variable font `next/font` serves (default axis `wght=400`, upem 1000) and
  baked into `app/icon.svg`. Files: `app/icon.svg` (**active** — near-white
  `#ededed` letter on a black `#000000` field),
  `public/icon-alt-transparent.svg` (dark letter, transparent field — **not
  active**, kept for comparison), `app/icon1.png` (32×32 fallback),
  `app/apple-icon.png` (180×180), `public/icon-512.png` (512×512, unreferenced
  spare for a future manifest). All three PNGs carry the same `#000000` field as
  the active SVG.
  The wordmark's `letter-spacing: 0.08em` is deliberately *not* applied — on a
  single glyph it only adds trailing space and would throw off centring.
- **Why (outline, not text):** favicons never load webfonts, so `<text
  font-family="EB Garamond">` would silently fall back to whatever serif the
  viewer's OS has, losing the italic and the letterform.
- **Why (optical centring):** the glyph is centred on a point half-way between
  its bounding-box centre (431, 330.5) and its filled-area centroid
  (374.6, 385.4). The italic's top-right serif overhangs far to the right and
  its mass sits high, so bbox centring reads as jammed into the top-left, while
  pure centroid centring overcorrects low-right and forces a smaller glyph.
  Scale is set from the largest half-extent about that reference point, at 90%
  of the canvas — the tightest margin is ~0.8px at 16px, enough that the stem's
  bottom terminal doesn't bleed into the edge.
- **Why (`icon1.png`, not `icon.png`):** Next resolves one file per `icon`
  basename and `.png` outranks `.svg`, so an `app/icon.png` would suppress the
  SVG entirely. The numbered convention emits both, SVG first.
- **The Apple icon must stay opaque even if the rest go transparent.** iOS
  composites transparent `apple-touch-icon`s onto black. With the current dark
  field that is harmless, but it would bury a dark letter, so
  `app/apple-icon.png` always carries a field.
- **Colour — near-white on black, `#ededed` on `#000000`.** Owner's request.
  This is the site's dark-theme pair from `globals.css`: `--color-text` over
  `:root[data-theme="dark"]`'s `--color-bg`. A near-white letter is also the
  truer reading of the wordmark: every photo page paints the nav title `#ffffff`
  and flips it with `mix-blend-mode: difference` (`FilmstripView.module.css`
  `.navOverlay`), so the "T" a visitor actually sees is near-white far more
  often than dark — only `/info` renders it dark.
- **Why the field is opaque at all.** An earlier revision made the SVG
  theme-aware via `prefers-color-scheme` (`#2a2a2a` light / `#ededed` dark);
  **that was removed because Chrome does not reliably honour the media query in
  SVG favicons.** It silently fell back to the light-scheme colour, painting a
  dark letter on a dark tab strip where it was almost invisible. Since the letter
  cannot invert itself, it needs a ground it controls.
- **Field shade — three were built and compared** against Chrome's real tab
  colours before landing on black. A `#f0f0f0` light field with a dark letter
  read as a bright box and inverted the wordmark's usual colour. `#4a4a4a`
  (`--color-bg`) sat as a soft chip on a dark strip. `#000000` (chosen) is the
  highest-contrast of the three and reads as a deliberate black tile on any tab.
  If the visible square is ever the objection, `#3f3f3f` (`--color-frame`) blends
  almost invisibly into Chrome's dark tab — at the cost of tuning the mark to one
  browser's chrome.
- **To swap the transparent variant in:** copy it over the active file —
  `cp public/icon-alt-transparent.svg app/icon.svg` — then regenerate the three
  PNGs (`app/icon1.png`, `app/apple-icon.png`, `public/icon-512.png`) without the
  backdrop, **except** keep `app/apple-icon.png` opaque, per the iOS note above.
  Note that variant carries the *dark* letter, so it suits light surfaces only.
- **No metadata change was needed:** Next's `app/` file conventions emit the
  `<link rel="icon">` / `<link rel="apple-touch-icon">` tags automatically.
- **Reverse:** delete `app/icon.svg`, `app/icon1.png`, `app/apple-icon.png`,
  `public/icon-512.png`, and `public/icon-alt-transparent.svg`. Nothing else
  references them. To re-cut the glyph, the
  source font is the italic subset under `.next/static/media/` carrying `T`
  (identify it with fontTools by `name` ID 2 == "Italic" and `T` in the cmap).

### D18. Mobile filmstrip: plain vertical stack instead of horizontal scroll-jacking
- **Decision:** Below 768px, `FilmstripGallery` (Home/Inside, Outside, Dance,
  Elevator Series) no longer pins the viewport and hijacks scroll into
  horizontal motion. It's a normal vertical stack of full-width photos with
  native page scroll. `FilmstripGallery.tsx`'s wheel/touch/keyboard
  scroll-jacking effect now attaches/detaches via
  `matchMedia("(min-width: 769px)")` (re-checked on resize/rotation, not just
  on mount) instead of running unconditionally; `FilmstripGallery.module.css`
  gets a mobile media query that switches `.stage` from pinned/fixed to
  static, `.track` from a horizontal flex row to a column, and `.frame`/`.img`
  from height-driven to width-driven sizing. The horizontal-progress line and
  "Scroll →" cue are hidden on mobile (nothing to indicate).
- **Why:** Owner's request — the horizontal filmstrip interaction (wheel/swipe
  sideways to advance) doesn't read as a natural mobile pattern; vertical
  swipe/scroll is what mobile visitors expect.
- **Reverse:** Delete the mobile `@media (max-width: 768px)` block added to
  `FilmstripGallery.module.css` in this change, and in `FilmstripGallery.tsx`
  replace the `matchMedia`-gated `sync()`/`attachDesktopBehavior()` wiring
  with the plain unconditional effect body (attach once on mount, same as
  before D18).

### D17. Info + Contact: light field, matching the filmstrip pages
- **Decision:** `SiteFrame` gains an optional `theme` prop (`"dark"` default,
  `"light"` new). `app/info/page.tsx` opts into `theme="light"`, which
  re-points `--color-bg`/`--color-text`/`--color-dim`/`--color-faint` to a
  light palette (`--color-bg` = `var(--color-home-bg)`, the same near-white
  field every filmstrip page already uses) scoped to `.light` in
  `SiteFrame.module.css` — not the global `:root`, so nothing else changes.
- **Why:** Owner's request — Info + Contact was the one page still on the
  original warm dark-gray field (`--color-bg: #4a4a4a`) while every photo page
  (Home/Inside, Outside, Elevator Series, Video) reads light. `SiteFrame` is
  otherwise unused today (only `/info` renders through it), so this could have
  been hardcoded, but the prop keeps the shell reusable if a future interior
  page wants the dark field back.
- **Reverse:** Drop `theme="light"` from `app/info/page.tsx` (or set
  `theme="dark"`).

### D16. Home (`/`) now renders the "Inside" gallery — Hero removed
- **Decision:** The landing page no longer shows a single hero photo. It now
  renders the same `FilmstripView` as the "Inside" tab (`commissions` project,
  33 photos), with `active="commissions"` so the nav underlines correctly.
  `components/Hero.tsx`/`Hero.module.css` (D14/D15) are deleted — dead code.
  The nav's "Inside" link (`content/site.ts`) now points to `/` instead of
  `/commissions`. The `/commissions` route itself is untouched (still renders
  the same content at its own URL) so the experimental `app/v2`/`v3`/`v4`
  pages, which hardcode a link to `/commissions`, keep working.
- **Why:** Owner's request — "Inside" should be the landing experience rather
  than a separate single-photo splash screen.
- **Reverse:** Restore `app/page.tsx` to render a `Hero` (recreate the two
  deleted files per D14's snippet) and point `content/site.ts`'s "Inside" href
  back to `/commissions`.

### D15. Home hero: blurred cover backdrop + uncropped photo on top — REVERTED
- **Status:** Tried, then reverted same day at the owner's request (back to
  D14's plain full-bleed crop). Kept here for the record; `Hero.tsx` /
  `Hero.module.css` no longer match this description.
- **Decision:** Refines D14. The hero photo (`lp.jpg`, 2000×2667, portrait) is
  no longer directly `object-fit: cover`-cropped. Instead `Hero.tsx` renders
  two stacked `next/image` layers: a `blur(60px)` + `scale(1.15)` cover copy
  filling the viewport edge-to-edge (`aria-hidden`, low `quality`, purely
  decorative), and the real photo on top at `object-fit: contain` — fully
  visible, nothing cropped.
- **Why:** A portrait image forced to `cover` a landscape viewport crops away
  more than half its height, which read as too "zoomed in." Shrinking or
  growing the stage box can't fix this — the crop amount is fixed by the
  mismatch between the photo's aspect ratio and the screen's. The blurred
  backdrop keeps every pixel of the screen full-bleed (no flat letterbox
  bars) while the foreground copy shows the complete, unzoomed photograph.
- **Reverse:** Delete the `.backdrop` `<Image>` and its CSS class; set `.img`
  back to `object-fit: cover` (D14's original approach), or swap in a
  landscape-cropped hero photo if one becomes available.

### D14. Home hero is full-bleed (`object-fit: cover`) — explicit exception to "no cover"
- **Decision:** The landing page's single photograph now fills the viewport
  edge-to-edge via a dedicated `Hero` component (`components/Hero.tsx` +
  `Hero.module.css`), using `next/image` with `fill` + `object-fit: cover`.
  Home no longer routes through `FilmstripView`/`FilmstripGallery` (that stays
  the shared presentation for every other photo section — Commissions,
  Personal, Elevator Series, Video).
- **Why:** Explicit request from the site owner. This is a deliberate,
  documented exception to the project's default rule (AGENTS.md / D9 /
  DESIGN_SYSTEM.md §Image width categories) that photography is never cropped
  via `object-fit: cover` — the landing image is the one place a full-bleed
  hero crop is wanted.
- **Reverse:** Swap `app/page.tsx` back to `<FilmstripView images={homeCells.map((c) => c.image)} />`
  (as before), or change `.img { object-fit: cover }` to `contain` in
  `Hero.module.css` to keep the full-bleed stage but stop cropping.

### D13. Image performance: next/image everywhere + capped masters + AVIF
- **Decision:** Three linked changes so the photo-heavy galleries ship small
  images: (1) the filmstrip (`FilmstripGallery.tsx`, used by the home index and
  every photo section) renders through **`next/image`** instead of a plain
  `<img>`, with a per-image `sizes` derived from the frame height × the photo's
  aspect ratio; (2) `gen-photos.mjs` resizes each web copy to a **2560px long
  edge at JPEG q80** on import (`MAX_EDGE` / `JPEG_QUALITY`), recording the
  *output* dimensions in content; (3) `next.config` enables **AVIF then WebP**.
- **Why:** The filmstrip previously served the raw originals (up to 4480×6720 /
  ~15 MB each) at full resolution to every device — `next/image`'s resizing and
  format negotiation were being bypassed entirely. Measured on the largest photo
  (`traff-janietaylor-04-final`): 14.8 MB original → 563 KB capped web copy →
  **~63 KB AVIF** at a realistic display width. The 2560px cap is the practical
  ceiling because `next/image` never serves anything larger than a Retina
  viewport, and it keeps `public/images/archive` from bloating (408 MB → 110 MB).
  The true originals are untouched in `../Photos Downloaded from Website/`.
- **Reverse:** Raise/remove `MAX_EDGE` and re-run `node scripts/gen-photos.mjs`;
  drop `formats` from `next.config`; or set `unoptimized` on the filmstrip
  `<Image>` to go back to raw files. Aspect ratios and content are unaffected.

### D1. Font: EB Garamond as a stand-in for Sabon
- **Decision:** Use **EB Garamond** (self-hosted via `next/font/google`) for all
  type. The reference uses licensed *Sabon*.
- **Why:** Sabon is a commercial license we don't have. EB Garamond is a free,
  high-quality old-style serif with a true italic and small-caps feel — the
  closest match for the classical, editorial voice.
- **Reverse:** Drop a licensed Sabon (or Sabon-alike) into `next/font/local` and
  swap the family in `globals.css`. No component changes needed.

### D2. Background color `#4a4a4a`
- **Decision:** Warm dark gray `#4a4a4a` for the page field.
- **Why:** Sampled from the reference's computed `body` background (`rgb(74,74,74)`).
- **Reverse:** Change `--color-bg` in `globals.css`.

### D3. Placeholder imagery — grayscale Picsum photos (+ SVG fallback)
- **Decision:** Photographs are replaced by **grayscale placeholder photos from
  Lorem Picsum** (`picsum.photos`), downloaded once into `public/images/` at the
  content's real aspect ratios. They give the POC a believable B&W editorial feel
  without ever touching the reference site's photographs.
- **Why:** The user asked for usable placeholder *images* rather than flat blocks.
  Picsum is a standard dev placeholder service (Unsplash-licensed, free to use).
  Downloading locally means **no runtime external dependency** — the app is
  self-contained and Vercel-deployable offline, with correct dims (no layout shift).
- **Fallback retained:** Flat-tone, labeled SVG blocks are still generated by
  `scripts/gen-placeholders.mjs` into `public/placeholders/` for fully offline use.
  `next.config` keeps `images.dangerouslyAllowSVG: true` for those first-party SVGs.
- **Licensing note:** Picsum/Unsplash images are free to use but are **not owned by
  the site owner** — they are stand-ins and must be replaced with real, owned
  photographs before production.
- **Reverse:** Drop real `.jpg`/`.webp` assets into `public/images/` (same ids) or
  update `content/assets.ts` `src` + true `width`/`height`. To go fully offline,
  point `src` back to `/placeholders/${id}.svg`.

### D4. Contact details are placeholders
- **Decision:** The Info page uses a clearly marked placeholder email/phone, not
  the real ones shown on the reference site.
- **Why:** Content rule — do not copy private contact information.
- **Reverse:** Replace the placeholder fields in `content/info.ts` with real,
  owner-approved values.

### D5. Bio & client text are neutral placeholders
- **Decision:** The Info bio and client list are generic placeholder text that
  mirrors the *structure* (bio paragraph → contact → clients → interviews) but
  not the exact copy.
- **Why:** Nothing was explicitly provided in the repo; avoid republishing the
  reference's written content verbatim.
- **Reverse:** Replace strings in `content/info.ts`.

### D6. Navigation is JS-free and always visible
- **Decision:** No hamburger menu / no client JS for nav. On mobile the sidebar
  becomes a stacked top header.
- **Why:** The reference keeps nav quiet and persistent; a menu button would add
  client JS and interaction the brief discourages.
- **Reverse:** Introduce a small Client Component toggle if a collapsed mobile
  menu is later wanted.

### D7. Active nav state via explicit `active` prop
- **Decision:** Each page passes `active="<key>"` to `Nav` instead of reading the
  pathname at runtime.
- **Why:** Keeps `Nav` a Server Component with zero client JS; the active page is
  statically known.
- **Reverse:** Swap to a Client Component using `usePathname()` if nav is ever
  centralized in the root layout.

### D8. Two page shells instead of one root layout
- **Decision:** Home uses an "overlay" shell; interior pages use a "sidebar"
  shell (`SiteFrame`). The root layout only provides `<html>/<body>`, fonts, and
  global CSS.
- **Why:** Home and interior pages have genuinely different navigation placement
  in the reference; forcing one layout would compromise both.
- **Reverse:** Merge into a single layout with a variant prop if they converge.

### D9. Approximate measurements
- **Decision:** Nav width (~250px), page margins, image width categories, and
  vertical rhythm are approximated from screenshots.
- **Why:** We deliberately did not read the reference's stylesheet or copy exact
  values. These are tuned visually.
- **Reverse:** Adjust the tokens in `globals.css`; documented in `DESIGN_SYSTEM.md`.

### D10. Hand-scaffolded instead of `create-next-app`
- **Decision:** Author `package.json`, `tsconfig`, `next.config`, and the `app/`
  tree by hand.
- **Why:** `create-next-app` pulls template boilerplate (Tailwind option, example
  files) the brief wants avoided; hand-scaffolding keeps dependencies minimal.
- **Reverse:** N/A — standard Next.js layout, fully compatible with tooling.

### D12. Click-to-enlarge lightbox — original, no library
- **Decision:** Clicking any image opens a fullscreen lightbox (centered,
  uncropped image; × close; ‹ › prev/next; Esc + arrow keys; backdrop-click to
  close; `N / total` counter), imitating theatraff.com's PhotoSwipe "quick view."
  Built as one small Client Component (`GalleryLightbox`), **no third-party
  library**.
- **Why:** The reference uses PhotoSwipe; the brief bans heavy libraries and wants
  minimal client JS, so an ~1 KB original component is the better fit. Images stay
  Server Components — the lightbox uses click **event delegation** on
  `data-zoomable` triggers (real `<button>`s, so keyboard works). Adds ~1.2 KB JS
  per page.
- **Backdrop is near-white**, matching the reference's light wash (over our dark
  gray page). Change `--overlay` / `.overlay` background in
  `GalleryLightbox.module.css` to use a dark backdrop instead.
- **Reverse:** Set `zoomable={false}` on `Figure`, or remove the `GalleryLightbox`
  wrappers in `HomeGrid`/`SiteFrame`. No other code depends on it.

### D11. Image alt text is temporary and marked
- **Decision:** Placeholder images use short, clearly-marked temporary alt text
  (e.g. `"[placeholder] large portrait"`), tracked in `CONTENT_STATUS.md`.
- **Why:** We must not invent elaborate descriptions of photographs that don't
  exist. Temporary alt is honest and flagged for human review.
- **Reverse:** Replace with real, meaningful alt text when real images land.
