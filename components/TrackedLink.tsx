"use client";

import type { AnchorHTMLAttributes } from "react";
import { track } from "@vercel/analytics";

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventName: string;
  eventProperties: Record<string, string | number | boolean | null>;
};

/** A normal anchor that records an anonymous, non-blocking interaction event. */
export function TrackedLink({
  eventName,
  eventProperties,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        track(eventName, eventProperties);
        onClick?.(event);
      }}
    />
  );
}
