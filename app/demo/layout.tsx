import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "See OnCue Working — Live Demo",
  description:
    "A real recording with timestamped feedback already on it. Press play, hear each note land at the moment it applies, and add your own. No upload, no account.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "See OnCue Working — Live Demo",
    description:
      "A recording with timestamped feedback already on it. Press play and hear each note land where it applies.",
    url: "/demo",
    type: "website",
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
