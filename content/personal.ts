import type { Project } from "./types";
import { ph } from "./assets";

/*
 * Personal Work — asymmetric, quieter sequencing than Commissions. Fewer
 * captions (personal work often runs uncaptioned), larger negative space, and
 * offset compositions that mirror the reference's asymmetric two-up rhythm.
 */
export const personal: Project = {
  title: "Personal Work",
  slug: "personal",
  blocks: [
    {
      variant: "image-pair",
      images: [ph("portrait-tall-c"), ph("square-b")],
    },
    {
      variant: "small-portrait",
      image: ph("portrait-h"),
      caption: { subject: "Study" },
    },
    {
      variant: "wide-landscape",
      image: ph("wide-b"),
    },
    {
      variant: "offset-right",
      image: ph("portrait-a"),
    },
    {
      variant: "stacked-pair",
      images: [ph("portrait-b"), ph("portrait-c")],
    },
    {
      variant: "centered-portrait",
      image: ph("portrait-tall-a"),
      caption: { subject: "Untitled" },
    },
  ],
};
