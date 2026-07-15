import type { Project } from "./types";
import { ph } from "./assets";

/*
 * Recent Commissions — the representative, fully-built section for the POC.
 * It deliberately exercises many layout variants (centered portrait with
 * caption, wide landscape, asymmetric pair, offsets, stacked pair, triptych,
 * large portrait) to demonstrate editorial sequencing rather than a uniform grid.
 *
 * Captions use generic PLACEHOLDER subject/publication names (see
 * CONTENT_STATUS.md) — no real names or publications are reproduced.
 */
export const commissions: Project = {
  title: "Recent Commissions",
  slug: "commissions",
  blocks: [
    {
      variant: "centered-portrait",
      image: ph("portrait-tall-a"),
      caption: {
        subject: "Portrait, seated interior",
        publication: "The Quarterly Review",
      },
    },
    {
      variant: "wide-landscape",
      image: ph("wide-a"),
      caption: {
        subject: "On assignment, exterior",
        publication: "Field & Northern",
      },
    },
    {
      variant: "image-pair",
      images: [ph("portrait-a"), ph("portrait-b")],
      caption: {
        subject: "Two studies",
        publication: "Meridian Magazine",
      },
    },
    {
      variant: "offset-left",
      image: ph("landscape-a"),
      caption: {
        subject: "Working environment",
        credit: "Commissioned feature",
      },
    },
    {
      variant: "medium-landscape",
      image: ph("landscape-b"),
      caption: {
        subject: "Detail",
        publication: "The Quarterly Review",
      },
    },
    {
      variant: "offset-right",
      image: ph("portrait-c"),
      caption: {
        subject: "Portrait, natural light",
        publication: "Continuum",
      },
    },
    {
      variant: "stacked-pair",
      images: [ph("landscape-c"), ph("portrait-d")],
      caption: {
        subject: "Sequence",
        publication: "Field & Northern",
      },
    },
    {
      variant: "triptych",
      images: [ph("portrait-e"), ph("portrait-f"), ph("portrait-g")],
      caption: {
        subject: "Three subjects",
        publication: "Meridian Magazine",
      },
    },
    {
      variant: "large-portrait",
      image: ph("portrait-tall-b"),
      caption: {
        subject: "Closing portrait",
        publication: "Continuum",
      },
    },
  ],
};
