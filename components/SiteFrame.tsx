import { Nav } from "./Nav";
import { GalleryLightbox } from "./GalleryLightbox";
import styles from "./SiteFrame.module.css";

/**
 * Sidebar shell for all interior pages. A fixed-width left navigation column and
 * a content column to its right. On mobile the sidebar collapses to a stacked
 * top header (handled entirely in CSS — no client JS).
 *
 * `theme`: "dark" (default, the original warm dark-gray field) or "light" —
 * re-points the color tokens to match the light field (`--color-home-bg`)
 * used by the filmstrip pages. See DECISIONS.md D17.
 */
export function SiteFrame({
  active,
  theme = "dark",
  children,
}: {
  active: string;
  theme?: "dark" | "light";
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.frame} ${theme === "light" ? styles.light : ""}`}>
      <header className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          <Nav active={active} variant="sidebar" titleAs="link" />
        </div>
      </header>
      <main className={styles.content}>
        <GalleryLightbox>{children}</GalleryLightbox>
      </main>
    </div>
  );
}
