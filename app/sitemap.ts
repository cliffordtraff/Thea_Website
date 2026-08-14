import type { MetadataRoute } from "next";
import { site } from "@/content/site";

const routes = ["", "/outside", "/dance", "/elevator-series", "/info"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route, index) => ({
    url: `${site.url}${route}`,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.8,
  }));
}
