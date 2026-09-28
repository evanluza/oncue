import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

// Share links are user content and stay out of the index (see robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/annotate`, changeFrequency: "monthly", priority: 0.8 },
  ]
}
