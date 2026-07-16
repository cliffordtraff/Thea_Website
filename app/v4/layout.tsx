import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import styles from "./v4.module.css";

/*
 * ── TEST DESIGN (v4) ───────────────────────────────────────────────
 * A fourth standalone concept under /v4: a collage landing that resolves
 * into a one-photo-at-a-time horizontal reel on first scroll. Shares nothing
 * with production, /v2, or /v3 except read-only content imports. Fonts scoped
 * to a wrapper class so they can't leak elsewhere.
 */
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--v4-display",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--v4-sans",
});

export const metadata: Metadata = {
  title: "Thea Traff — v4 (test)",
  description: "Experimental redesign, concept four. Not the live site.",
};

export default function V4Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${sans.variable} ${styles.root}`}>
      {children}
    </div>
  );
}
