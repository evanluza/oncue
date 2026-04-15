import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "OnCue — Audio Annotation",
  description: "Drop a track. Mark it up. Share the link. Timestamped audio annotation for musicians, teachers, and creators.",
  icons: {
    icon: "/oc-icon-orange.png",
    apple: "/oc-icon-orange.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
