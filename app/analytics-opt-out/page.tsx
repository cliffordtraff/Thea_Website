import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsOptOutControl } from "@/components/AnalyticsOptOutControl";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Analytics preference",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AnalyticsOptOutPage() {
  return (
    <main className={styles.main}>
      <p className={styles.eyebrow}>Private browser setting</p>
      <h1 className={styles.title}>Analytics preference</h1>
      <p className={styles.copy}>
        Excluding this browser stops it from sending Vercel Web Analytics,
        anonymous site actions, Speed Insights, and Google Analytics data. The
        setting is stored only in this browser and must be enabled separately on
        every browser or device you use.
      </p>
      <AnalyticsOptOutControl />
      <Link className={styles.back} href="/">
        Return to the website
      </Link>
    </main>
  );
}
