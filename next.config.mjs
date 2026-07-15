/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // First-party, generated SVG placeholders only (see DECISIONS.md D3).
    // No user-supplied SVGs are ever rendered.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
