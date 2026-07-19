import type { Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import { site } from "@/content/site";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Photographer } from "@/components/photographer/Photographer";
import { ViewTransitionProvider } from "@/components/ViewTransitions";
import "./globals.css";

/*
 * EB Garamond stands in for the reference site's licensed "Sabon".
 * Self-hosted by next/font (no external requests, no layout shift). See DECISIONS.md D1.
 */
const serif = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s — ${site.name}`,
  },
  description: site.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={serif.variable} suppressHydrationWarning>
      <body>
        {/* TEST: apply a saved dark-theme choice before paint (no flash).
            Default is light; only an explicit "dark" selection opts in. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('theme')==='dark'){document.documentElement.dataset.theme='dark'}}catch(e){}",
          }}
        />
        <ViewTransitionProvider>{children}</ViewTransitionProvider>
        <ThemeToggle />
        {/* Easter egg: a photographer who strolls the page and takes photos.
            Analog of the Charting Platform's Tesla "walker" sprite. */}
        <Photographer />
      </body>
    </html>
  );
}
