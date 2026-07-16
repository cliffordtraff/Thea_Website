import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import styles from "./v2.module.css";

/*
 * ── TEST DESIGN (v2) ───────────────────────────────────────────────
 * A standalone, throwaway redesign living entirely under /v2. It shares
 * NOTHING with the production layout/components except read-only content
 * imports (real photographs). Its own display font (Space Grotesk) is
 * scoped to a wrapper class so it can't leak into the original site,
 * whose EB Garamond variable still lives on <html> from the root layout.
 */
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--v2-font",
});

export const metadata: Metadata = {
  title: "Thea Traff — v2 (test)",
  description: "Experimental redesign. Not the live site.",
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${styles.root}`}>{children}</div>
  );
}
