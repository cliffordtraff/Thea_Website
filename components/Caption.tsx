import type { Caption as CaptionData } from "@/content/types";
import styles from "./Caption.module.css";

/**
 * Restrained editorial caption. Renders under an image, aligned to its left edge:
 *   ^ Subject name
 *   PUBLICATION            (bold, letter-spaced small caps)
 * The "^" caret is decorative and hidden from assistive tech.
 */
export function Caption({ caption }: { caption: CaptionData }) {
  const { subject, publication, credit, year } = caption;
  return (
    <figcaption className={styles.caption}>
      <span className={styles.subject}>
        <span aria-hidden="true" className={styles.caret}>
          ^{" "}
        </span>
        {subject}
        {year ? <span className={styles.year}>, {year}</span> : null}
      </span>
      {publication ? (
        <span className={styles.meta}>{publication}</span>
      ) : null}
      {credit ? <span className={styles.credit}>{credit}</span> : null}
    </figcaption>
  );
}
