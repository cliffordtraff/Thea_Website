"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

/**
 * TEST-ONLY dark-theme switch (see the DARK THEME block in globals.css).
 *
 * Flips <html data-theme="dark"> on/off and remembers the choice in
 * localStorage. Default is the original light theme, so the site is unchanged
 * until toggled. Remove this component + its <script> in layout.tsx + the dark
 * block in globals.css to fully undo the experiment.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Sync initial button state with whatever the pre-paint script already set.
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = !dark;
    setDark(next);
    if (next) {
      root.dataset.theme = "dark";
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
    } else {
      delete root.dataset.theme;
      try {
        localStorage.setItem("theme", "light");
      } catch {}
    }
  };

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-pressed={dark}
      title="Toggle dark theme (test)"
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}
