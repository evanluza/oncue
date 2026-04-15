import type { Metadata } from "next"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  return {
    title: "OnCue — Shared Audio Annotation",
    description: "Listen and leave feedback on this shared audio track with timestamped annotations.",
    openGraph: {
      title: "OnCue — Audio Annotation",
      description: "Someone shared an audio track for your feedback. Listen, annotate, and collaborate.",
      type: "website",
      url: `/share/${id}`,
      siteName: "OnCue",
    },
    twitter: {
      card: "summary",
      title: "OnCue — Audio Annotation",
      description: "Someone shared an audio track for your feedback. Listen, annotate, and collaborate.",
    },
  }
}

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children
}
