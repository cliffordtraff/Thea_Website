import type { Project } from "./types";
import { ph } from "./assets";

/*
 * Elevator Series — a single ongoing series of vertical frames. Presented as a
 * calm, mostly centered single-column sequence (one idea, repeated), with an
 * occasional pair. Restrained, minimal captions.
 */
export const elevator: Project = {
  title: "Elevator Series",
  slug: "elevator-series",
  blocks: [
    {
      variant: "centered-portrait",
      image: ph("elevator-a", "[placeholder] elevator frame 1"),
      caption: { subject: "Elevator, no. 1" },
    },
    {
      variant: "centered-portrait",
      image: ph("elevator-b", "[placeholder] elevator frame 2"),
      caption: { subject: "Elevator, no. 2" },
    },
    {
      variant: "image-pair",
      images: [
        ph("elevator-c", "[placeholder] elevator frame 3"),
        ph("elevator-d", "[placeholder] elevator frame 4"),
      ],
    },
    {
      variant: "centered-portrait",
      image: ph("elevator-a", "[placeholder] elevator frame 5"),
      caption: { subject: "Elevator, no. 5" },
    },
  ],
};
