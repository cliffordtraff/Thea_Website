import type { ImageAsset } from "./types";
import { ph } from "./assets";

/*
 * Info + Contact.
 * Bio and contact details are NEUTRAL PLACEHOLDERS (see DECISIONS.md D4/D5).
 * The reference site's real email/phone are private and intentionally omitted.
 * The bio mirrors the reference's *structure* (bio → contact → clients →
 * interviews) but not its exact copy.
 */

export interface InfoContent {
  portrait: ImageAsset;
  /** Bio paragraphs. Rendered in an editorial italic voice. */
  bio: string[];
  contact: {
    email: string;
    phone: string;
    instagram: string;
  };
  clients: string[];
  interviews: string[];
}

export const info: InfoContent = {
  portrait: ph("portrait-tall-a", "[placeholder] portrait"),
  bio: [
    "This is placeholder biography copy for a proof-of-concept rebuild. The layout demonstrates how an editorial artist statement sits beneath a single portrait, set in a quiet italic serif.",
    "A second placeholder paragraph stands in for career history, education, and background. Replace this text with approved copy before any real use. No text has been copied from the reference site.",
  ],
  contact: {
    // Clearly-marked placeholders — real contact details omitted on purpose.
    email: "hello@example.com  (placeholder)",
    phone: "(000) 000-0000  (placeholder)",
    instagram: "@placeholder",
  },
  clients: [
    "Placeholder Client One",
    "Placeholder Client Two",
    "Placeholder Client Three",
    "Placeholder Client Four",
    "Placeholder Client Five",
    "Placeholder Client Six",
    "Placeholder Client Seven",
    "Placeholder Client Eight",
  ],
  interviews: [
    "Placeholder Interview, Publication Name (2024)",
    "Placeholder Feature, Another Publication (2023)",
  ],
};
