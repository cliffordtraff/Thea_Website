import type { ImageAsset } from "./types";

/*
 * Info + Contact.
 * Real bio, contact, clients, and interviews supplied by the site owner
 * (Thea Traff). The layout mirrors the reference's structure: bio → contact →
 * clients → interviews, set beneath a single portrait in a quiet italic serif.
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
  portrait: {
    src: "/images/thea-portrait.jpg",
    width: 1201,
    height: 1800,
    alt: "Thea Traff",
  },
  bio: [
    "Thea Traff (b. 1991) is a photographer based in New York City.",
    "From 2018 to 2020, Thea was a Senior Photo Editor at TIME Magazine, and from 2013–2018, she was a Photo Editor at The New Yorker Magazine. In 2013, she graduated from Colgate University with a degree in Studio Art and Philosophy. Thea is originally from Minnetonka, Minnesota.",
  ],
  contact: {
    email: "theatraff@gmail.com",
    phone: "952-270-9933",
    instagram: "@theatraff",
  },
  clients: [
    "The New York Times",
    "Rolling Stone",
    "The New Yorker",
    "TIME",
    "Pentagram",
    "Fast Company",
    "Zeit",
    "Inc.",
    "Bloomberg Businessweek",
    "Stern",
    "The SotoMethod",
    "Jenni Kayne",
    "SpotCo",
    "Penguin Random House",
  ],
  interviews: [
    "Cyrus Magazine, Portraits of an Artist (2024)",
    "Colgate Magazine, Portrait Mode (2024)",
    "Creative Review, Exposure (2023)",
    "Lensculture, Creative Leaps (2020)",
  ],
};
