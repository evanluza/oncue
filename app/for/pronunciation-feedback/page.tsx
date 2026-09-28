import type { Metadata } from "next"
import { Faq, LandingJsonLd, LandingShell, Section } from "@/components/landing-shell"
import { SITE_URL } from "@/lib/site"

const URL = `${SITE_URL}/for/pronunciation-feedback`

export const metadata: Metadata = {
  title: "Pronunciation Feedback on Recorded Speech",
  description:
    "Pin pronunciation notes to the exact syllable — sounds, word stress, linking and intonation — and share them as one link the learner can replay.",
  alternates: { canonical: "/for/pronunciation-feedback" },
  openGraph: {
    title: "Pronunciation Feedback on Recorded Speech | OnCue",
    description:
      "Pin pronunciation notes to the exact syllable and share them as one link the learner can replay.",
    url: "/for/pronunciation-feedback",
    type: "article",
  },
}

const FAQS = [
  {
    q: "Can I record my own voice as an example?",
    a: "Not yet — notes are text today. It's the most requested thing we're weighing, and we'd rather ask teachers what they actually need before building it. If that's the feature that would decide it for you, there's a feedback link at the bottom of this page.",
  },
  {
    q: "Can learners use this on themselves?",
    a: "Yes, and it's a good self-study habit. Record yourself, listen back, and mark every moment you notice something. Hearing your own speech with your own notes attached is a sharper exercise than listening straight through.",
  },
  {
    q: "Does it show a waveform?",
    a: "Yes, drawn from the actual audio. It's genuinely useful for pronunciation work: pauses, hesitations and clipped word endings are visible before you hear them, and you can click straight to a spot instead of scrubbing.",
  },
  {
    q: "How precise are the timestamps?",
    a: "Notes are pinned to a tenth of a second, which is enough to land on a syllable rather than a sentence.",
  },
  {
    q: "Can I use phonetic symbols in a note?",
    a: "Yes — notes are plain text, so IPA works if your keyboard produces it. Plenty of teachers skip it and write the sound in a way the learner already understands.",
  },
]

export default function PronunciationFeedbackPage() {
  return (
    <>
      <LandingJsonLd
        url={URL}
        name="Pronunciation Feedback on Recorded Speech"
        description="Timestamped pronunciation notes on a recording, shared as one link."
        faqs={FAQS}
      />
      <LandingShell
        eyebrow="Pronunciation feedback"
        title="Pronunciation notes that land on the syllable, not the paragraph"
        lede="Pronunciation is the hardest thing to give feedback on in writing, because the unit of the mistake is smaller than a sentence. Pin each note to the moment it happened instead."
        currentHref="/for/pronunciation-feedback"
        closing="Upload a recording and mark the first three things you hear. It takes about as long as listening to it once."
      >
        <Section heading="Why written pronunciation feedback rarely works">
          <p>
            You can&apos;t spell a vowel. Writing <em>&quot;the &lsquo;i&rsquo; in &lsquo;live&rsquo; was
            too long&quot;</em> asks the learner to reconstruct a sound they can&apos;t hear in their head —
            which is the whole reason they said it that way.
          </p>
          <p>
            What works is proximity: the note has to arrive next to the audio. When a learner hears the
            word and reads <em>&quot;shorter — this is the &lsquo;live in a house&rsquo; one&quot;</em> at
            that instant, they&apos;re comparing your note against the sound still in their ears, not
            against a memory from four minutes ago.
          </p>
        </Section>

        <Section heading="Four layers worth marking separately">
          <p>
            Pronunciation problems get lumped into one comment — &quot;work on your pronunciation&quot; —
            when they&apos;re usually four different problems with four different fixes. Marking them at
            separate moments keeps them separable:
          </p>
          <ul className="space-y-2.5 pl-4 list-disc marker:text-accent/60">
            <li>
              <strong className="text-foreground">Individual sounds.</strong> A substituted consonant or a
              vowel from the wrong pair. Mark the word, not the clause.
            </li>
            <li>
              <strong className="text-foreground">Word stress.</strong> Usually the highest-value fix,
              because wrong stress can make a correctly-pronounced word unrecognisable.
            </li>
            <li>
              <strong className="text-foreground">Connected speech.</strong> Where words run together — or
              don&apos;t. Learners who pronounce every word perfectly in isolation often sound effortful
              here, and it&apos;s invisible to them without a recording.
            </li>
            <li>
              <strong className="text-foreground">Intonation and pace.</strong> The melody of a question,
              a rushed clause, a pause landing in the wrong place. This one is almost impossible to
              describe in writing without a timestamp.
            </li>
          </ul>
        </Section>

        <Section heading="A note on how much to mark">
          <p>
            Because marking is fast, it&apos;s tempting to mark everything — and a recording returned with
            forty notes reads as failure, however kindly each one is written. Most teachers settle around
            five to ten per recording: the two or three patterns worth actually practising, plus the
            moments that went well.
          </p>
          <p>
            The ones that went well matter more than they look. A learner who can hear the exact half-second
            where they got a difficult sound right has something to repeat, which is more useful than a
            list of what to avoid.
          </p>
        </Section>

        <Faq items={FAQS} />
      </LandingShell>
    </>
  )
}
