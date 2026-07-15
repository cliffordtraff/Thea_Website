/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve modern formats for the photo-heavy galleries. AVIF first (best
    // compression for photography), WebP fallback, then the original JPEG for
    // browsers that support neither. See DECISIONS.md D13.
    formats: ["image/avif", "image/webp"],
    // First-party, generated SVG placeholders only (see DECISIONS.md D3).
    // No user-supplied SVGs are ever rendered.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
