import type { Metadata } from "next"
import * as db from "@/lib/db"

type Props = {
  params: Promise<{ id: string }>
}

const GENERIC_NAMES = new Set(["guest", "anonymous", ""])

function trackTitle(fileName: string): string {
  return fileName.replace(/\.(mp3|wav)$/i, "").trim() || "a track"
}

/**
 * These links get pasted into Discord, iMessage and band group chats — the
 * preview card is the pitch. A card naming the sender and the track converts a
 * lot better than "Someone shared an audio track".
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  let title = "OnCue — Listen & Leave Feedback"
  let description = "Someone shared an audio track for your feedback. Listen, annotate, and collaborate."

  try {
    const project = await db.getProject(id)
    if (project) {
      const track = trackTitle(project.name)
      const sender = GENERIC_NAMES.has(project.created_by.trim().toLowerCase())
        ? "Someone"
        : project.created_by.trim()

      title = `${sender} wants feedback on ${track}`
      description = "Listen, leave timestamped notes, and send them back. No sign-up needed."
    }
  } catch {
    // Fall through to the generic card rather than breaking the page.
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
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
      title,
      description,
      images: ["/oncue-og.png"],
    },
  }
}

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children
}
