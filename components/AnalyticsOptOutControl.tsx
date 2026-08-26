"use client";

import { useEffect, useState } from "react";
import {
  ANALYTICS_OPT_OUT_EVENT,
  isAnalyticsOptedOut,
  setAnalyticsOptOut,
} from "@/lib/analytics";
import styles from "./AnalyticsOptOutControl.module.css";

export function AnalyticsOptOutControl() {
  const [optedOut, setOptedOutState] = useState<boolean | null>(null);

  useEffect(() => {
    const syncPreference = () => setOptedOutState(isAnalyticsOptedOut());
    syncPreference();
    window.addEventListener(ANALYTICS_OPT_OUT_EVENT, syncPreference);
    window.addEventListener("storage", syncPreference);

    return () => {
      window.removeEventListener(ANALYTICS_OPT_OUT_EVENT, syncPreference);
      window.removeEventListener("storage", syncPreference);
    };
  }, []);

  if (optedOut === null) {
    return <p className={styles.status}>Checking this browser…</p>;
  }

  return (
    <div className={styles.controls}>
      <p className={styles.status} role="status" aria-live="polite">
        Analytics are <strong>{optedOut ? "excluded" : "included"}</strong> for
        this browser.
      </p>
      <button
        type="button"
        className={styles.button}
        onClick={() => setAnalyticsOptOut(!optedOut)}
      >
        {optedOut ? "Include this browser" : "Exclude this browser"}
      </button>
    </div>
  );
}
