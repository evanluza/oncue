import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FeedbackButton } from "@/components/feedback-button"

/**
 * Chrome for the /for/* pages: nav, hero, closing CTA, cross-links, footer.
 * The body of each page is its own — these exist to be read by people deciding
 * whether OnCue fits their work, so the copy is written per page rather than
 * generated from a template.
 */

export type RelatedLink = { href: string; label: string }

export const ALL_LANDING_PAGES: (RelatedLink & { description: string })[] = [
  {
    href: "/for/language-teachers",
    label: "Language teachers",
    description: "Speaking homework, marked at the moment the mistake happens.",
  },
  {
    href: "/for/pronunciation-feedback",
    label: "Pronunciation feedback",
    description: "Sounds, stress and intonation — pinned to the syllable.",
  },
  {
    href: "/for/music-teachers",
    label: "Music teachers",
    description: "Practice recordings between lessons, with notes that stay.",
  },
  {
    href: "/for/music-feedback",
    label: "Music & mix feedback",
    description: "Demos, mixes and revisions without vague timestamps.",
  },
]

export function LandingShell({
  eyebrow,
  title,
  lede,
  currentHref,
  children,
  closing,
}: {
  eyebrow: string
  title: string
  lede: string
  currentHref: string
  children: React.ReactNode
  closing: string
}) {
  const related = ALL_LANDING_PAGES.filter((p) => p.href !== currentHref)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/30">
        <div className="max-w-3xl mx-auto flex h-16 items-center justify-between px-6">
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

      <article className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
        <header className="space-y-5 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-[11px] text-muted-foreground">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
            {eyebrow}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15]">{title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{lede}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/annotate"
              className="inline-flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-5 h-10 text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Upload audio
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-xs text-muted-foreground/70">Free · no account · nothing to install</span>
          </div>
        </header>

        <div className="mt-14 space-y-14">{children}</div>

        <section className="mt-16 rounded-xl border border-border/40 bg-card/30 p-6 sm:p-8 text-center space-y-4">
          <p className="text-base text-foreground max-w-lg mx-auto leading-relaxed">{closing}</p>
          <Link
            href="/annotate"
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-5 h-10 text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Upload audio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <nav aria-label="Other ways people use OnCue" className="mt-14">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Also for
          </h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {related.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className="block h-full rounded-lg border border-border/40 bg-card/20 p-4 hover:border-accent/30 hover:bg-card/40 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{p.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground leading-relaxed">{p.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>

      <footer className="border-t border-border/30">
        <div className="max-w-3xl mx-auto px-6 py-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/oc-icon-orange.png" alt="OnCue" width={20} height={20} />
            <span className="text-xs text-muted-foreground">oncue</span>
          </Link>
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

/** Shared section furniture, so each page's copy is the only thing that varies. */
export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
      <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">{children}</div>
    </section>
  )
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Questions</h2>
      <div className="divide-y divide-border/30 border-y border-border/30">
        {items.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-foreground">
              <h3>{f.q}</h3>
              <span className="text-accent transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

/** FAQPage + WebPage markup for a landing page. */
export function LandingJsonLd({
  url,
  name,
  description,
  faqs,
}: {
  url: string
  name: string
  description: string
  faqs: { q: string; a: string }[]
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", url, name, description, isPartOf: { "@type": "WebSite", name: "OnCue" } },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}
