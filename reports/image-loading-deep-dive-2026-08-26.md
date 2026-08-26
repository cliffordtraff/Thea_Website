# Image loading deep dive — 2026-08-26

## Decision

The loading strategy is now strong enough to test in production. The critical remaining defect found in the review was fixed: the adaptive loader is a genuine inline parser-time script, rather than a `next/script` registration that waited for the main Next.js runtime.

Do not further reduce normal-gallery image quality yet. On constrained connections, the gallery already favors speed with 640 px opening candidates and preserves full detail in the quality-90 lightbox. On proven-fast connections, responsive candidates provide higher display density.

## Measured cold-load behavior

Local production build; browser cache disabled.

| Profile | Photo 1 | Photo 2 | Photo 3 | Photo 4 | Behavior |
|---|---:|---:|---:|---:|---|
| Fast, 20 Mbps / 20 ms | 44 ms | 64–115 ms | 64–140 ms | 133–172 ms | 1 first, then 2–4 parallel |
| Hotel, 1 Mbps / 150 ms | 568–584 ms | 574–1,500 ms | 1,503–1,991 ms | 1,989–2,403 ms | Strictly sequential |
| Slow 3G, 0.4 Mbps / 300 ms | 1.37–1.43 s | 1.37–3.57 s | 3.55–4.89 s | 4.89–5.89 s | Strictly sequential |

The important transition—photo one finishing to photo two starting—fell from about **1.3 seconds to 6–8 milliseconds** under hotel emulation.

Every gallery route (`/`, `/outside`, `/dance`, `/elevator-series`) selected AVIF, classified the hotel profile as slow, revealed photos in order, and produced no image failures or layout overflow. The only local request failures were expected Vercel Analytics endpoints, which do not exist under `next start`.

Lighthouse using DevTools throttling on the local production build reported performance **100**, FCP **1.4 s**, LCP **1.4 s**, Speed Index **1.8 s**, TBT **0 ms**, and CLS **0**. This is lab evidence, not production-user evidence.

## Quality safeguards

- Photo one is directly discoverable, eager, high priority, and AVIF with JPEG fallback.
- Photos two through four have constrained 640 px and larger responsive variants.
- Later gallery images use responsive Next.js image candidates.
- The lightbox remains quality 90 and uses the original image dimensions.
- Generated opening assets have content-hashed immutable URLs and build-enforced freshness/byte budgets.
- No blur previews are used.

This follows current guidance to make the LCP image discoverable in initial HTML, avoid lazy-loading it, use responsive `sizes`/`srcset`, and reserve preload bandwidth for genuinely critical resources ([web.dev LCP guidance](https://web.dev/articles/optimize-lcp), [Next.js Image docs](https://nextjs.org/docs/app/api-reference/components/image)). AVIF is appropriate because it generally provides smaller photographic files at comparable visual quality, while the JPEG fallback preserves compatibility ([Chrome guidance](https://developer.chrome.com/docs/lighthouse/performance/uses-webp-images)).

## Other options considered

1. **Defer font preloads — rejected.** It improved median photo-one completion by about 77 ms, but made the first-four sequence about 150 ms slower and increases the chance of visible font swapping.
2. **Automatically upgrade every 640 px image after it appears — not recommended on slow links.** It downloads the same photograph twice. A user who asks for detail already gets the quality-90 lightbox.
3. **Preload more gallery images — rejected.** Early bandwidth is scarce and extra preloads would recreate the original competition with photo one.
4. **Service-worker precaching — low value.** It cannot help the first visit that motivated this work and adds cache invalidation complexity.
5. **More global compression — premature.** The next safe step would be per-photo perceptual tuning against originals using a metric such as [Butteraugli](https://github.com/google/butteraugli), plus visual review, rather than lowering one quality number for every photograph.
6. **Reduce the 118 KB route JavaScript — worthwhile but secondary.** The new loader no longer waits for it, so this would improve interactivity more than first-photo loading.

## Recommended next step

After code review, deploy to a preview or production deployment, verify immutable/CDN headers and cold/warm waterfalls over HTTP/2 or HTTP/3, then compare real-user mobile LCP and image timing in Vercel Speed Insights. Vercel caches optimized images and hashed static assets at the CDN, but local tests cannot prove the production cache is warm or correctly served ([Vercel image optimization](https://vercel.com/docs/image-optimization), [Vercel CDN caching](https://vercel.com/docs/caching/cdn-cache)).

No commit, push, or deployment was performed as part of this deep dive.
