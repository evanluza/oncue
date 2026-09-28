import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

// Share links are user content and stay out of the index (they are noindex).
// The /for/* pages are hand-written landing pages, not generated ones — if that
// ever stops being true, they don't belong here either.
const LANDING_PAGES = [
  "/for/language-teachers",
  "/for/pronunciation-feedback",
  "/for/music-teachers",
  "/for/music-feedback",
]

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/annotate`, changeFrequency: "monthly", priority: 0.8 },
    ...LANDING_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]
}
