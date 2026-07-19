"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useTransitionNavigate } from "./ViewTransitions";

/**
 * A next/link that plays the site's slide-up view transition on a normal
 * left-click, while preserving all native link behaviour (open-in-new-tab via
 * modifier keys or middle-click, prefetch, focus, right-click menu). Used by Nav
 * for internal tab navigation.
 */
export function TransitionLink({
  href,
  onClick,
  ...rest
}: ComponentProps<typeof Link> & { href: string }) {
  const navigate = useTransitionNavigate();

  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        // Respect modifier keys / non-primary buttons — let the browser handle
        // "open in new tab", etc.
        if (
          e.defaultPrevented ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0
        ) {
          return;
        }
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    />
  );
}
