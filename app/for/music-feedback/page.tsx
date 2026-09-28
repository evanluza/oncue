import type { Metadata } from "next"
import { Faq, LandingJsonLd, LandingShell, Section } from "@/components/landing-shell"
import { SITE_URL } from "@/lib/site"

const URL = `${SITE_URL}/for/music-feedback`

export const metadata: Metadata = {
  title: "Timestamped Feedback on Mixes & Demos",
  description:
    "Send mix notes pinned to the exact bar instead of \"around 2:15\". Upload a rough, mark arrangement and mix changes, share one link. Free, no account.",
  alternates: { canonical: "/for/music-feedback" },
  openGraph: {
    title: "Timestamped Feedback on Mixes & Demos | OnCue",
    description:
      "Send mix notes pinned to the exact bar instead of \"around 2:15\". Upload a rough, mark it, share one link.",
    url: "/for/music-feedback",
    type: "article",
  },
}

const FAQS = [
  {
    q: "Can I send this to a client who isn't technical?",
    a: "That's the main reason people use it for client work. There's no account, no app and no file to download — they click the link and press play. A client who would never install a review tool will still open a link.",
  },
  {
    q: "What about file size for a full mix?",
    a: "The cap is 25MB, which is a full-length track as a reasonable-quality MP3. Bounce a rough rather than uploading a WAV master — you're sending it for notes, not for mastering.",
  },
  {
    q: "Can several people leave notes on the same track?",
    a: "Yes. Everyone with the link can add notes, and each person gets their own name and colour, so you can see who asked for what. Nobody signs up for this.",
  },
  {
    q: "Does it replace a revision tool or project management?",
    a: "No, and it isn't trying to. There are no versions, approvals, or revision rounds — it's one recording and the notes on it. If you need formal sign-off workflows, use something built for that.",
  },
  {
    q: "Is the link private?",
    a: "It's unlisted and not indexed by search engines, but anyone who has it can open the track — there's no password yet. For unreleased material, treat it like any other shareable link.",
  },
]

export default function MusicFeedbackPage() {
  return (
    <>
      <LandingJsonLd
        url={URL}
        name="Timestamped Feedback on Mixes & Demos"
        description="Mix and arrangement notes pinned to exact moments, shared as one link."
        faqs={FAQS}
      />
      <LandingShell
        eyebrow="For music & mix feedback"
        title="Stop writing timestamps by hand"
        lede="Every note you leave sits on the second it refers to. No more &quot;around 2:15, after the second chorus&quot; — just play, type, send the link."
        currentHref="/for/music-feedback"
        closing="Bounce a rough, mark the three things bothering you, and send it to whoever needs to hear them."
      >
        <Section heading="The notes-in-a-text-message problem">
          <p>
            Feedback on a mix currently arrives as a list: <em>&quot;1:04 kick too loud, 2:15ish vocal is
            buried, the bridge feels long&quot;</em>. Every line in that message costs the person reading it
            a scrub, a guess, and usually a reply asking which bridge.
          </p>
          <p>
            Worse, it changes what gets said. When writing each note costs effort, people batch them into
            vague summaries — <em>&quot;the second half drags&quot;</em> — which is the least actionable
            form of a real observation. Cheap notes are specific notes.
          </p>
        </Section>

        <Section heading="What gets marked">
          <p>Across real production use, the notes that show up most are:</p>
          <ul className="space-y-2.5 pl-4 list-disc marker:text-accent/60">
            <li>
              <strong className="text-foreground">Arrangement.</strong> Where a section should start, stop,
              or lose eight bars. Easiest thing to argue about vaguely and hardest to fix from a summary.
            </li>
            <li>
              <strong className="text-foreground">Balance.</strong> The exact moment something masks
              something else, rather than a blanket &quot;vocals up&quot;.
            </li>
            <li>
              <strong className="text-foreground">Performance.</strong> A take that drifts, a phrase worth
              re-cutting, a moment worth keeping exactly as it is.
            </li>
            <li>
              <strong className="text-foreground">Transitions.</strong> The joins — where energy drops or a
              change lands early. Almost always a timing question, so almost always needs a timestamp.
            </li>
            <li>
              <strong className="text-foreground">Ideas.</strong> &quot;Try a half-time feel here&quot; is
              worth far more attached to the bar than in a list at the end.
            </li>
          </ul>
        </Section>

        <Section heading="Who it fits">
          <p>
            Producers sending roughs to collaborators, engineers sending mixes to clients, artists collecting
            notes from a band, and anyone asked for feedback on someone else&apos;s track who would rather
            not write an essay. It works in both directions: mark up your own track to explain what you were
            going for, or mark up someone else&apos;s to say what you&apos;d change.
          </p>
          <p>
            It is deliberately small. No accounts, no project management, no versioning — one recording, its
            notes, and a link. If that&apos;s not enough for your workflow, it probably isn&apos;t the tool
            for that part of it.
          </p>
        </Section>

        <Faq items={FAQS} />
      </LandingShell>
    </>
  )
}
