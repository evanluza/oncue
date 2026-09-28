// Vercel serves www.oncue.audio as the primary host (the apex 307s to it), so
// canonical URLs, the sitemap and OG images all point at www to avoid redirects.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.oncue.audio").replace(/\/$/, "")
