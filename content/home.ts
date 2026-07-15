import type { HomeCell } from "./types";
import { ph } from "./assets";

/**
 * Home grid — an ordered set of portrait cells. The first cell sits behind the
 * overlaid title + navigation (handled by the HomeGrid component). Order is
 * deliberate, not alphabetized.
 */
export const homeCells: HomeCell[] = [
  { image: ph("portrait-a", "[placeholder] home image 1") },
  { image: ph("portrait-b", "[placeholder] home image 2") },
  { image: ph("portrait-c", "[placeholder] home image 3") },
  { image: ph("portrait-d", "[placeholder] home image 4") },
  { image: ph("portrait-e", "[placeholder] home image 5") },
  { image: ph("portrait-f", "[placeholder] home image 6") },
  { image: ph("portrait-g", "[placeholder] home image 7") },
  { image: ph("portrait-h", "[placeholder] home image 8") },
  { image: ph("portrait-tall-a", "[placeholder] home image 9") },
  { image: ph("portrait-tall-b", "[placeholder] home image 10") },
  { image: ph("portrait-tall-c", "[placeholder] home image 11") },
  { image: ph("square-a", "[placeholder] home image 12") },
];
