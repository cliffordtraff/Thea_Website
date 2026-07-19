"use client";

// ---------------------------------------------------------------------------
// Photographer.tsx -- Easter egg: a little photographer who strolls along the
// bottom of the page, occasionally stops, and takes a photo (flash + shutter).
//
// This is the Thea-site analog of the Charting Platform's Tesla "walker" sprite.
// It mounts globally from app/layout.tsx, so it appears on page load on every
// route. Her head/hair/top is the sketch cutout (/photographer-head.png); the
// legs, arm and camera are drawn procedurally on a fixed canvas; behavior is a
// pure state machine. Honors prefers-reduced-motion by standing still.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";
import styles from "./Photographer.module.css";
import {
  drawPhotographer,
  STRIP_HEIGHT,
  FOOT_MARGIN,
  FIGURE_ALPHA,
  HEAD_SRC,
} from "./photographerSprite";
import {
  createPhotographerState,
  handleResize,
  tick,
  SHOOT_DURATION,
  type PhotographerState,
} from "./photographerStateMachine";

export function Photographer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;

    function sizeCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(STRIP_HEIGHT * dpr);
    }
    sizeCanvas();

    let state: PhotographerState = createPhotographerState(width);
    const baselineY = STRIP_HEIGHT - FOOT_MARGIN;

    // The sketch head/hair/top cutout — drawn once loaded.
    const head = new Image();
    head.src = HEAD_SRC;

    // prefers-reduced-motion: draw a single standing figure, no animation.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function render() {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, width, STRIP_HEIGHT);

      let raiseAmt = 0;
      let flashAlpha = 0;
      const walking = state.phase === "walking";

      if (state.phase === "shooting") {
        const e = clock - state.phaseStart;
        // Raise in the first 280ms, lower over the final 320ms.
        raiseAmt = Math.min(
          Math.min(e / 280, 1),
          Math.min((SHOOT_DURATION - e) / 320, 1),
        );
        raiseAmt = Math.max(0, raiseAmt);
        // Flash bell curve while the camera is up.
        flashAlpha = Math.exp(-Math.pow((e - 720) / 150, 2));
      }

      // Subtle vertical bob while striding.
      const bob = walking ? Math.abs(Math.sin((state.frame / 4) * Math.PI * 2)) * 1.5 : 0;

      ctx!.save();
      ctx!.globalAlpha = FIGURE_ALPHA;
      ctx!.translate(state.x, baselineY - bob);
      if (state.facing === -1) ctx!.scale(-1, 1);
      drawPhotographer(
        ctx!,
        { walking, frame: state.frame, raiseAmt, flashAlpha },
        head,
      );
      ctx!.restore();
    }

    let clock = 0;
    let lastPerf: number | null = null;
    let raf = 0;

    function frame(perf: number) {
      if (lastPerf === null) lastPerf = perf;
      let dt = perf - lastPerf;
      lastPerf = perf;
      // Clamp large gaps (e.g. tab was backgrounded) so nothing lurches.
      if (dt > 100) dt = 100;
      clock += dt;

      state = tick(state, clock);
      render();
      raf = requestAnimationFrame(frame);
    }

    function onResize() {
      sizeCanvas();
      state = handleResize(state, width);
      if (reduce) render();
    }
    window.addEventListener("resize", onResize);

    if (reduce) {
      render();
      head.onload = render; // draw once the sketch head has loaded
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      aria-hidden="true"
    />
  );
}
