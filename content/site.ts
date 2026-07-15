import type { NavItem } from "./types";

/** Site-level metadata and navigation. */
export const site = {
  name: "Thea Traff",
  /** Displayed title treatment (letter-spaced small caps handled in CSS). */
  title: "Thea Traff",
  description:
    "Proof-of-concept editorial photography portfolio — original build, placeholder imagery.",
  /** Placeholder copyright line (year kept generic for the POC). */
  copyright: "© Thea Traff",
};

/**
 * Primary navigation. `key` matches the `active` prop passed by each page so
 * Nav can stay a Server Component (see DECISIONS.md D7).
 */
export const nav: NavItem[] = [
  { key: "commissions", label: "Recent Commissions", href: "/commissions" },
  { key: "personal", label: "Personal Work", href: "/personal" },
  { key: "elevator-series", label: "Elevator Series", href: "/elevator-series" },
  { key: "info", label: "Info + Contact", href: "/info" },
  {
    key: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/theatraff",
    external: true,
  },
];
