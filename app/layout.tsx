import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: {
    default: "OnCue — Timestamped Audio Feedback & Annotation",
    template: "%s | OnCue",
  },
  description: "Leave timestamped notes on any MP3, WAV or M4A and share a link for feedback. Free audio annotation for musicians, producers, teachers, and podcasters. No sign-up.",
  metadataBase: new URL(SITE_URL),
  applicationName: "OnCue",
  category: "music",
  icons: {
    icon: "/oc-icon-orange.png",
    apple: "/oc-icon-orange.png",
  },
  openGraph: {
    title: "OnCue — Timestamped Audio Feedback & Annotation",
    description: "Leave timestamped notes on any MP3, WAV or M4A and share a link for feedback. Free audio annotation for musicians, producers, teachers, and podcasters. No sign-up.",
    siteName: "OnCue",
    type: "website",
    url: "/",
    locale: "en_US",
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
    title: "OnCue — Timestamped Audio Feedback & Annotation",
    description: "Drop a track. Mark it up. Share the link.",
    images: ["/oncue-og.png"],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
