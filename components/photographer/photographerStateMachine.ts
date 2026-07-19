// ---------------------------------------------------------------------------
// photographerStateMachine.ts -- Pure stroll/shoot state machine (no DOM)
//
// Mirrors the Tesla walker's idle -> move -> idle loop, adapted for a person:
//   idle -> walking -> shooting -> idle -> ...
// The car's "stopped" beat becomes "shooting": at the end of each stroll the
// photographer plants, raises the camera, a flash fires, then they wander off
// in a new direction. All timing is driven by an external monotonic `clock`
// (ms) so the renderer can freeze it while the tab is hidden.
// ---------------------------------------------------------------------------

import { WALK_FRAMES } from "./photographerSprite";

export type Phase = "idle" | "walking" | "shooting";
export type Facing = 1 | -1; // 1 = right, -1 = left

export interface PhotographerState {
  /** Horizontal center of the figure (px). */
  x: number;
  /** Direction the figure faces / last moved. */
  facing: Facing;
  phase: Phase;
  /** clock time (ms) when the current phase began. */
  phaseStart: number;
  /** Current walk-cycle frame index. */
  frame: number;
  frameIndex: number;
  lastFrameTime: number;
  /** Walk plan. */
  walkStartX: number;
  walkDist: number; // signed
  walkDuration: number;
  /** How long the current idle pause lasts (ms). */
  idleDuration: number;
  /** Available width the figure can roam in (px). */
  boundsWidth: number;
}

// ---- tunables --------------------------------------------------------------

const EDGE_MARGIN = 70;
const FRAME_DURATION_MS = 140;

const IDLE_MIN = 1200;
const IDLE_MAX = 3000;

/** How long the raise/flash/lower beat lasts (ms). */
export const SHOOT_DURATION = 1650;

/** Stroll speed (px per ms) — a calm walking pace. */
const SPEED = 0.034;
const WALK_MIN_MS = 1600;
const WALK_MAX_MS = 6500;

/** Stroll distance as a fraction of the available width. */
const DIST_MIN = 0.12;
const DIST_MAX = 0.34;

// ---- helpers ---------------------------------------------------------------

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ---- public API ------------------------------------------------------------

/** Initial state: idle briefly at load, then start strolling. */
export function createPhotographerState(boundsWidth: number): PhotographerState {
  return {
    x: boundsWidth * 0.16,
    facing: 1,
    phase: "idle",
    phaseStart: 0,
    frame: 0,
    frameIndex: 0,
    lastFrameTime: 0,
    walkStartX: 0,
    walkDist: 0,
    walkDuration: 0,
    idleDuration: 1400, // a short beat after page load before the first stroll
    boundsWidth,
  };
}

/** Plan a fresh stroll: pick a direction, distance and duration. */
function planWalk(state: PhotographerState, now: number): PhotographerState {
  const available = state.boundsWidth - EDGE_MARGIN * 2;
  let dist = rand(DIST_MIN, DIST_MAX) * available;

  // Keep heading the same way so short hops still sweep across the full
  // width; only turn around when the next hop would run off an edge.
  let dir: Facing = state.facing;
  const projectedEnd = state.x + dir * dist;
  if (projectedEnd < EDGE_MARGIN || projectedEnd > state.boundsWidth - EDGE_MARGIN) {
    dir = (dir * -1) as Facing;
  }

  // Clamp distance so the figure stays within bounds.
  const room =
    dir > 0 ? state.boundsWidth - EDGE_MARGIN - state.x : state.x - EDGE_MARGIN;
  dist = clamp(Math.min(dist, room), 40, available);

  const duration = clamp(dist / SPEED, WALK_MIN_MS, WALK_MAX_MS);

  return {
    ...state,
    phase: "walking",
    facing: dir,
    phaseStart: now,
    walkStartX: state.x,
    walkDist: dir * dist,
    walkDuration: duration,
    frame: 0,
    frameIndex: 0,
    lastFrameTime: now,
  };
}

/** Advance one tick. Returns a new state object when anything changed. */
export function tick(state: PhotographerState, now: number): PhotographerState {
  switch (state.phase) {
    case "idle": {
      if (now - state.phaseStart >= state.idleDuration) {
        return planWalk(state, now);
      }
      return state;
    }

    case "walking": {
      const elapsed = now - state.phaseStart;
      if (elapsed >= state.walkDuration) {
        // Arrived — plant and raise the camera.
        return {
          ...state,
          phase: "shooting",
          phaseStart: now,
          x: state.walkStartX + state.walkDist,
          frame: 0,
          frameIndex: 0,
        };
      }

      const progress = easeInOutQuad(elapsed / state.walkDuration);
      const x = state.walkStartX + state.walkDist * progress;

      let { frame, frameIndex, lastFrameTime } = state;
      if (now - lastFrameTime >= FRAME_DURATION_MS) {
        frameIndex = (frameIndex + 1) % WALK_FRAMES;
        frame = frameIndex;
        lastFrameTime = now;
      }
      return { ...state, x, frame, frameIndex, lastFrameTime };
    }

    case "shooting": {
      if (now - state.phaseStart >= SHOOT_DURATION) {
        return {
          ...state,
          phase: "idle",
          phaseStart: now,
          idleDuration: rand(IDLE_MIN, IDLE_MAX),
          frame: 0,
        };
      }
      return state;
    }
  }
}

/** Re-clamp the figure into new bounds after a resize. */
export function handleResize(
  state: PhotographerState,
  newWidth: number,
): PhotographerState {
  return {
    ...state,
    boundsWidth: newWidth,
    x: clamp(state.x, EDGE_MARGIN, newWidth - EDGE_MARGIN),
  };
}
