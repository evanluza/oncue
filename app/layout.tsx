import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "OnCue — Audio Annotation",
    template: "%s | OnCue",
  },
  description: "Drop a track. Mark it up. Share the link. Timestamped audio annotation for musicians, teachers, and creators.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://oncue.audio"),
  icons: {
    icon: "/oc-icon-orange.png",
    apple: "/oc-icon-orange.png",
  },
  openGraph: {
    title: "OnCue — Audio Annotation",
    description: "Drop a track. Mark it up. Share the link. Timestamped audio annotation for musicians, teachers, and creators.",
    siteName: "OnCue",
    type: "website",
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
    title: "OnCue — Audio Annotation",
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
