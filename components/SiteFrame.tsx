import { Nav } from "./Nav";
import { GalleryLightbox } from "./GalleryLightbox";
import styles from "./SiteFrame.module.css";

/**
 * Sidebar shell for all interior pages. A fixed-width left navigation column and
 * a content column to its right. On mobile the sidebar collapses to a stacked
 * top header (handled entirely in CSS — no client JS).
 */
export function SiteFrame({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.frame}>
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
