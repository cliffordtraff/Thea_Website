"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  ANALYTICS_OPT_OUT_EVENT,
  ANALYTICS_OPT_OUT_PATH,
  GOOGLE_ANALYTICS_ID,
  isAnalyticsOptedOut,
  setGoogleAnalyticsDisabled,
} from "@/lib/analytics";

/** Loads production analytics only after this browser's owner preference is known. */
export function AnalyticsProviders() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [optedOut, setOptedOut] = useState(true);

  useEffect(() => {
    const syncPreference = () => {
      const disabled = isAnalyticsOptedOut();
      setGoogleAnalyticsDisabled(disabled);
      setOptedOut(disabled);
      setReady(true);
    };

    syncPreference();
    window.addEventListener("storage", syncPreference);
    window.addEventListener(ANALYTICS_OPT_OUT_EVENT, syncPreference);

    return () => {
      window.removeEventListener("storage", syncPreference);
      window.removeEventListener(ANALYTICS_OPT_OUT_EVENT, syncPreference);
    };
  }, []);

  const shouldTrack =
    ready && !optedOut && pathname !== ANALYTICS_OPT_OUT_PATH;

  if (!shouldTrack) return null;

  return (
    <>
      <Analytics
        beforeSend={(event) => (isAnalyticsOptedOut() ? null : event)}
      />
      <SpeedInsights
        beforeSend={(event) => (isAnalyticsOptedOut() ? null : event)}
      />
      <GoogleAnalytics gaId={GOOGLE_ANALYTICS_ID} />
    </>
  );
}
