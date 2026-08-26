/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve modern formats for the photo-heavy galleries. AVIF first (best
    // compression for photography), WebP fallback, then the original JPEG for
    // browsers that support neither. See DECISIONS.md D13.
    formats: ["image/avif", "image/webp"],
    qualities: [65, 75, 90],
    // First-party, generated SVG placeholders only (see DECISIONS.md D3).
    // No user-supplied SVGs are ever rendered.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        // Every file in this folder carries a content hash, so it can be kept
        // by browsers without revalidation. Regeneration produces a new URL.
        source: "/images/gallery-fast-path/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
