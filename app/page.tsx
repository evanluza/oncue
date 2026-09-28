import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Upload, MessageSquare, Share2, Music, GraduationCap, Podcast } from "lucide-react"
import { SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

const FAQS = [
  {
    q: "What is OnCue?",
    a: "OnCue is a free web tool for annotating audio. Upload a track, leave notes pinned to exact timestamps, and share a link so others can listen and reply in context.",
  },
  {
    q: "Do I need an account?",
    a: "No. Just upload a track and start annotating. Anyone with your share link can listen and add their own timestamped notes.",
  },
  {
    q: "Which audio formats are supported?",
    a: "MP3, WAV and M4A (iPhone Voice Memos) files up to 25MB.",
  },
  {
    q: "How do I get feedback on a mix or demo?",
    a: "Upload the file, add any notes you want reviewers to see, then copy the share link and send it to your bandmates, clients, or teacher. Their comments appear on the waveform at the moment they were left.",
  },
  {
    q: "Are share links private?",
    a: "Share links are unlisted: they aren't indexed by search engines, but anyone who has the link can open the track, so only send it to people you trust.",
  },
]

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "OnCue",
      url: `${SITE_URL}/`,
      description:
        "Timestamped audio annotation and feedback. Upload an MP3, WAV or M4A, leave notes at exact moments, and share a link for collaborators to reply.",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript and a modern browser",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      image: `${SITE_URL}/oncue-og.png`,
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Navigation */}
      <nav className="border-b border-border/30">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/oc-icon-orange.png" alt="OnCue" width={28} height={28} />
            <span className="text-base font-semibold tracking-tight">oncue</span>
          </Link>
          <Link
            href="/annotate"
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-4 h-9 text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Start Annotating
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 relative">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-1.5 text-xs text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
              Audio annotation made simple
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
              Drop a track.
              <br />
              <span className="text-accent">Mark it up.</span>
              <br />
              Share the link.
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
              Leave timestamped notes and quick-fire callouts on any audio file. Then share it with anyone for feedback.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/annotate"
                className="inline-flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-6 h-11 text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Start Annotating
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Waveform preview graphic */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 shadow-2xl shadow-accent/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-accent/60" />
                <div className="text-xs text-muted-foreground font-mono">demo-track.mp3</div>
              </div>
              {/* Animated waveform bars */}
              <div className="flex items-center gap-0.5 h-20 px-2">
                {Array.from({ length: 80 }).map((_, i) => {
                  const height = Math.abs(Math.sin(i * 0.15) * 0.4 + Math.cos(i * 0.08) * 0.3 + Math.sin(i * 0.22) * 0.3) * 100
                  const isPlayed = i < 32
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-full transition-all duration-300"
                      style={{
                        height: `${Math.max(8, height)}%`,
                        backgroundColor: isPlayed
                          ? "oklch(0.55 0.15 45)"
                          : "oklch(0.68 0.18 45)",
                        opacity: isPlayed ? 0.7 : 1,
                      }}
                    />
                  )
                })}
              </div>
              {/* Annotation markers */}
              <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2.5 py-1 text-[10px] text-muted-foreground">
                  <span className="text-accent">0:34</span> Great transition here
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2.5 py-1 text-[10px] text-muted-foreground">
                  <span className="text-accent">1:12</span> 🔥
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2.5 py-1 text-[10px] text-muted-foreground">
                  <span className="text-accent">2:05</span> Levels need work
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-12">
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Upload className="h-5 w-5" />,
                step: "01",
                title: "Upload",
                description: "Drop in any .mp3 or .wav file. Your audio loads instantly — no account needed.",
              },
              {
                icon: <MessageSquare className="h-5 w-5" />,
                step: "02",
                title: "Annotate",
                description: "Add timestamped notes and quick macros as you listen. Flag highlights, issues, and ideas.",
              },
              {
                icon: <Share2 className="h-5 w-5" />,
                step: "03",
                title: "Share",
                description: "Send a link. Your collaborators see the waveform, hear the audio, and add their own notes.",
              },
            ].map((item) => (
              <div key={item.step} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 text-accent">
                    {item.icon}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground/50">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-t border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-12">
            Built for
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Music className="h-6 w-6" />,
                title: "Musicians & Producers",
                description: "Share rough mixes with bandmates. Mark the verse that needs reworking. Flag the snare that's too hot. All without leaving the track.",
              },
              {
                icon: <GraduationCap className="h-6 w-6" />,
                title: "Teachers & Students",
                description: "Leave feedback on student performances. Students can review notes at each timestamp and understand exactly what to practice.",
              },
              {
                icon: <Podcast className="h-6 w-6" />,
                title: "Podcasters & Editors",
                description: "Mark edit points, flag audio issues, and leave production notes. Your editor sees everything in context, synced to the timeline.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border border-border/40 bg-card/30 p-6 space-y-4 hover:border-accent/30 hover:bg-card/50 transition-colors"
              >
                <div className="text-accent">{item.icon}</div>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/30">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-12">
            Questions
          </h2>
          <div className="divide-y divide-border/30">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium">
                  <h3>{f.q}</h3>
                  <span className="text-accent transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Ready to mark it up?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            No sign-up required. Upload a track and start annotating in seconds.
          </p>
          <Link
            href="/annotate"
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-6 h-11 text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Start Annotating
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/oc-icon-orange.png" alt="OnCue" width={20} height={20} />
            <span className="text-xs text-muted-foreground">oncue</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/50">
            <span className="hidden sm:inline">Audio annotation, simplified.</span>
            <a
              href="https://www.elulabs.com/#contact"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Built by ELU LABS
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
