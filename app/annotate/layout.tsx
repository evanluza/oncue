import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Annotate an Audio File",
  description:
    "Upload an MP3, WAV or M4A, add timestamped notes and quick callouts as you listen, then share a link for feedback. Free, no sign-up.",
  alternates: { canonical: "/annotate" },
}

export default function AnnotateLayout({ children }: { children: React.ReactNode }) {
  return children
}
