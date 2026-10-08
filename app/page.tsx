import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Upload, MessageSquare, Share2, Music, GraduationCap, Podcast, Mic } from "lucide-react"
import { SITE_URL } from "@/lib/site"
import { FeedbackButton } from "@/components/feedback-button"
import { ALL_LANDING_PAGES } from "@/components/landing-shell"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

const USE_CASES = [
  {
    icon: <Mic className="h-4 w-4" />,
    title: "Speaking & pronunciation",
    description:
      "Mark pronunciation, pacing, and speaking mistakes at the exact moment they happen.",
    href: "/for/language-teachers",
    linkLabel: "For language teachers",
  },
  {
    icon: <Music className="h-4 w-4" />,
    title: "Music & production",
    description:
      "Point out arrangement, mix, performance, and production changes without writing timestamps manually.",
    href: "/for/music-feedback",
    linkLabel: "For music feedback",
  },
  {
    icon: <GraduationCap className="h-4 w-4" />,
    title: "Lessons & coaching",
    description: "Send students clear audio feedback they can open from one link.",
    href: "/for/music-teachers",
    linkLabel: "For music teachers",
  },
  {
    icon: <Podcast className="h-4 w-4" />,
    title: "Podcast & editing",
    description: "Flag edits, cuts, mistakes, and moments worth revisiting.",
    href: "/annotate",
    linkLabel: "Upload an episode",
  },
]

const FAQS = [
  {
    q: "What is OnCue?",
    a: "OnCue is a free web tool for giving feedback on audio. Upload a recording, leave notes pinned to exact timestamps, and send one link. Whoever opens it hears your notes at the moments they apply — and can reply in the same place if they want to.",
  },
  {
    q: "Does anyone need an account?",
    a: "No — not you, and not the person you send it to. You upload and mark it up, they open a link and listen. Nobody signs up, and nothing gets installed.",
  },
  {
    q: "Which audio formats are supported?",
    a: "MP3, WAV and M4A (iPhone Voice Memos) files up to 25MB.",
  },
  {
    q: "How do I send someone feedback on a recording?",
    a: "Upload their file, listen through it, and type a note whenever something needs saying — each note sticks to the second you were at. Then copy the share link and send it. They open it in a browser with nothing to install and no account to make.",
  },
  {
    q: "Are share links private?",
    a: "Share links are unlisted: they aren't indexed by search engines, but anyone who has the link can open the track, so only send it to people you trust. There is no password on a link yet.",
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
        "Timestamped audio feedback. Upload an MP3, WAV or M4A, leave notes at the exact moments they apply, and send one link — no account for you or the person receiving it.",
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
            Upload audio
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
              Timestamped audio feedback
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
              Give feedback
              <br />
              <span className="text-accent">right where it matters.</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
              Upload audio. Leave notes at exact moments. Share one link.
            </p>

            <p className="text-sm text-muted-foreground/70">No account required.</p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/annotate"
                className="inline-flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-6 h-11 text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Upload audio
                <ArrowRight className="h-4 w-4" />
              </Link>
              {/* Nobody browsing on a phone has a student recording to hand. */}
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-6 h-11 text-sm font-medium text-foreground hover:border-accent/40 hover:text-accent transition-colors"
              >
                See it working
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
                  <span className="text-accent">2:05</span> Say this vowel longer
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
                description: "Drop in an .mp3, .wav or .m4a — including voice memos straight off a phone. It loads instantly, with no account.",
              },
              {
                icon: <MessageSquare className="h-5 w-5" />,
                step: "02",
                title: "Mark the moment",
                description: "Type a note at the second it applies. No more writing timestamps by hand or saying \"around two minutes in\".",
              },
              {
                icon: <Share2 className="h-5 w-5" />,
                step: "03",
                title: "Send one link",
                description: "They open it in a browser, hear your notes land at the right moments, and can reply in the same place if they want to.",
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
          <h2 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Feedback for anything you can hear
          </h2>
          <p className="text-center text-sm text-muted-foreground/70 max-w-md mx-auto mb-12">
            The job is the same everywhere: say what you mean, at the moment you mean it.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {USE_CASES.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-xl border border-border/40 bg-card/30 p-5 space-y-2.5 hover:border-accent/30 hover:bg-card/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-accent">{item.icon}</span>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 group-hover:text-accent transition-colors">
                  {item.linkLabel}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
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
            No sign-up required — not for you, not for whoever you send it to. Upload a recording and leave your first note in seconds.
          </p>
          <Link
            href="/annotate"
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-6 h-11 text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Upload audio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30">
        {/* Every landing page is one click from here. The use-case grid above
            can't carry all four without a fifth card in a two-column layout,
            and an orphan page is one nobody — crawler or reader — finds. */}
        <nav aria-label="Ways people use OnCue" className="max-w-5xl mx-auto px-6 pt-8">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground/70">
            {ALL_LANDING_PAGES.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="hover:text-accent transition-colors">
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/oc-icon-orange.png" alt="OnCue" width={20} height={20} />
            <span className="text-xs text-muted-foreground">oncue</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/50">
            <FeedbackButton />
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
