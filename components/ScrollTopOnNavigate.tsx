"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Below 768px every tab is a plain vertical stack with native page scroll
 * (see FilmstripGallery.tsx / DECISIONS.md D18). Every tab renders the same
 * fixed-nav + stack DOM shape, which stops Next's client-side navigation
 * from reliably resetting scroll on its own — so do it explicitly here.
 */
export function ScrollTopOnNavigate() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
