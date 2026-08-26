"use client";

import { track } from "@vercel/analytics";

export const ANALYTICS_OPT_OUT_KEY = "thea.analytics.optOut";
export const ANALYTICS_OPT_OUT_EVENT = "thea:analytics-opt-out-change";
export const ANALYTICS_OPT_OUT_PATH = "/analytics-opt-out";
export const GOOGLE_ANALYTICS_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-SRVDMHMB5M";

export function isAnalyticsOptedOut(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAnalyticsOptOut(optedOut: boolean): void {
  if (typeof window === "undefined") return;

  try {
    if (optedOut) {
      window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "true");
    } else {
      window.localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
    }
  } catch {
    // The current page can still disable GA for this session if storage is blocked.
  }

  setGoogleAnalyticsDisabled(optedOut);
  window.dispatchEvent(new Event(ANALYTICS_OPT_OUT_EVENT));
}

export function setGoogleAnalyticsDisabled(disabled: boolean): void {
  if (typeof window === "undefined") return;
  Object.assign(window, { [`ga-disable-${GOOGLE_ANALYTICS_ID}`]: disabled });
}

export function trackTheaEvent(
  eventName: string,
  properties: Record<string, string | number | boolean | null>,
): void {
  if (isAnalyticsOptedOut()) return;
  track(eventName, properties);
}
