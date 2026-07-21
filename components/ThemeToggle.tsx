"use client";

import { useState } from "react";
import styles from "./ThemeToggle.module.css";

/**
 * TEST-ONLY dark-theme switch (see the DARK THEME block in globals.css).
 *
 * Flips <html data-theme="dark"> on/off for the current session only —
 * every fresh page load starts light regardless of any earlier toggle, even
 * on the same device. Remove this component + the dark block in
 * globals.css to fully undo the experiment.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  const toggle = () => {
    const root = document.documentElement;
    const next = !dark;
    setDark(next);
    if (next) {
      root.dataset.theme = "dark";
    } else {
      delete root.dataset.theme;
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
