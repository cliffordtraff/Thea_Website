import { nav, site } from "@/content/site";
import { TransitionLink } from "./TransitionLink";
import styles from "./Nav.module.css";

/**
 * Quiet primary navigation. Server Component — the active item is passed in as a
 * prop (see DECISIONS.md D7), so no client JS is needed.
 *
 * `variant`:
 *   - "sidebar": stacked block used inside SiteFrame (interior pages).
 *   - "overlay": same markup, styled to sit over the home grid's first cell.
 * `titleAs`: render the site title as <h1> (home) or a plain link (interior).
 */
export function Nav({
  active,
  variant = "sidebar",
  titleAs = "link",
}: {
  active?: string;
  variant?: "sidebar" | "overlay";
  titleAs?: "h1" | "link";
}) {
  const title = (
    <TransitionLink href="/" className={styles.title}>
      {site.title}
    </TransitionLink>
  );

  return (
    <nav
      className={`${styles.nav} ${variant === "overlay" ? styles.overlay : ""}`}
      aria-label="Primary"
    >
      {titleAs === "h1" ? (
        <h1 className={styles.titleWrap}>{title}</h1>
      ) : (
        <p className={styles.titleWrap}>{title}</p>
      )}

      <ul className={styles.list}>
        {nav.map((item) => {
          const isActive = item.key === active;
          return (
            <li key={item.key}>
              {item.external ? (
                <a
                  href={item.href}
                  className={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              ) : (
                <TransitionLink
                  href={item.href}
                  className={`${styles.link} ${isActive ? styles.active : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </TransitionLink>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
