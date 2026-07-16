import type { Metadata } from "next";
import { Bebas_Neue, Space_Mono } from "next/font/google";
import styles from "./v3.module.css";

/*
 * ── TEST DESIGN (v3) ───────────────────────────────────────────────
 * A third, standalone throwaway concept under /v3. Full-bleed cinematic
 * panels, stark monochrome, condensed marquee display type. Shares nothing
 * with production or /v2 except read-only content imports. Its fonts are
 * scoped to a wrapper class so they can't leak elsewhere.
 */
const display = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--v3-display",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--v3-mono",
});

export const metadata: Metadata = {
  title: "Thea Traff — v3 (test)",
  description: "Experimental redesign, concept three. Not the live site.",
};

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${mono.variable} ${styles.root}`}>
      {children}
    </div>
  );
}
