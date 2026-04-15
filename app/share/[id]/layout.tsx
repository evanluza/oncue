import type { Metadata } from "next"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  return {
    title: "Shared Audio Annotation",
    description: "Someone shared an audio track for your feedback. Listen, annotate, and collaborate on OnCue.",
    openGraph: {
      title: "OnCue — Listen & Leave Feedback",
      description: "Someone shared an audio track for your feedback. Listen, annotate, and collaborate.",
      type: "website",
      url: `/share/${id}`,
      siteName: "OnCue",
      images: [
        {
          url: "/oncue-og.png",
          width: 1200,
          height: 630,
          alt: "OnCue — Drop a track. Mark it up. Share the link.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "OnCue — Listen & Leave Feedback",
      description: "Someone shared an audio track for your feedback. Listen, annotate, and collaborate.",
      images: ["/oncue-og.png"],
    },
  }
}

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children
}
