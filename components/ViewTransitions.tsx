"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Client-side page transitions for tab navigation.
 *
 * Wraps App Router navigations in the browser's native View Transitions API so
 * that leaving one tab lifts the current photo up and off the top of the
 * viewport, revealing the incoming tab settling into its place (see the
 * ::view-transition rules in globals.css). No animation library needed.
 *
 * Falls back to an ordinary router.push when the API is unavailable or the user
 * prefers reduced motion.
 */

type Navigate = (href: string) => void;

const NavigateContext = createContext<Navigate | null>(null);

/** Hook used by TransitionLink to trigger an animated navigation. */
export function useTransitionNavigate(): Navigate {
  const navigate = useContext(NavigateContext);
  if (!navigate) {
    throw new Error(
      "useTransitionNavigate must be used within <ViewTransitionProvider>",
    );
  }
  return navigate;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function ViewTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Holds the resolver for the in-flight transition. The view transition's
  // callback promise stays pending until the new route has actually rendered,
  // so the API snapshots the *new* page rather than the old one.
  const pending = useRef<{ href: string; resolve: () => void } | null>(null);

  useEffect(() => {
    if (pending.current && pathname === pending.current.href) {
      const { resolve } = pending.current;
      pending.current = null;
      // Start the animation as soon as the new route has committed (one paint
      // frame), rather than waiting extra frames.
      requestAnimationFrame(resolve);
    }
  }, [pathname]);

  const navigate = useCallback<Navigate>(
    (href) => {
      if (href === pathname) return;

      const doc = document as Document & {
        startViewTransition?: (cb: () => Promise<void> | void) => unknown;
      };

      if (!doc.startViewTransition || prefersReducedMotion()) {
        router.push(href);
        return;
      }

      doc.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            // Safety net: never let the transition hang if the route change
            // stalls or the pathname never matches (e.g. a redirect).
            const timeout = setTimeout(resolve, 1200);
            pending.current = {
              href,
              resolve: () => {
                clearTimeout(timeout);
                resolve();
              },
            };
            router.push(href);
          }),
      );
    },
    [router, pathname],
  );

  return (
    <NavigateContext.Provider value={navigate}>
      {children}
    </NavigateContext.Provider>
  );
}
