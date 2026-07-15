import { Nav } from "./Nav";
import { Figure } from "./Figure";
import { homeCells } from "@/content/home";
import { site } from "@/content/site";
import styles from "./HomeGrid.module.css";

/**
 * Home index grid. A multi-column field of portrait cells; the site title and
 * navigation are overlaid on the first cell (like the reference). Cells preserve
 * their true aspect ratios — no cropping. A quiet copyright footer closes it.
 */
export function HomeGrid() {
  return (
    <>
      <main className={styles.grid}>
        {homeCells.map((cell, i) => (
          <div key={i} className={styles.cell}>
            <Figure
              image={cell.image}
              priority={i < 4}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            {i === 0 ? (
              <div className={styles.overlay}>
                <Nav variant="overlay" titleAs="h1" />
              </div>
            ) : null}
          </div>
        ))}
      </main>
      <footer className={styles.footer}>{site.copyright}</footer>
    </>
  );
}
