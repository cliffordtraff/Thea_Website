"use client";

import { useEffect } from "react";

/**
 * Clicking the nav link for the tab you're already on is a same-URL
 * navigation, which Next's router can mishandle (observed: it jumps scroll
 * to the bottom of the page instead of doing nothing). Since you're already
 * there, intercept the click in the capture phase — before Next's Link
 * handler sees it — and make it a no-op.
 */
export function PreventActiveTabReclick() {
  useEffect(() => {
    const isActiveTab = (e: Event) =>
      (e.target as HTMLElement | null)?.closest('a[aria-current="page"]');

    // Stop the navigation itself...
    const onClick = (e: MouseEvent) => {
      if (isActiveTab(e)) e.preventDefault();
    };
    // ...and stop the browser's default click-to-focus, which would
    // otherwise still scroll the (possibly off-screen) link into view even
    // though the navigation above was cancelled.
    const onMouseDown = (e: MouseEvent) => {
      if (isActiveTab(e)) e.preventDefault();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("mousedown", onMouseDown, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mousedown", onMouseDown, true);
    };
  }, []);

  return null;
}
