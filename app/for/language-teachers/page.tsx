import type { Metadata } from "next"
import { Faq, LandingJsonLd, LandingShell, Section } from "@/components/landing-shell"
import { SITE_URL } from "@/lib/site"

const URL = `${SITE_URL}/for/language-teachers`

export const metadata: Metadata = {
  title: "Audio Feedback for Language Teachers",
  description:
    "Mark up a student's speaking recording where the mistake actually happens, then send one link. Works with phone voice memos, needs no account, and costs nothing.",
  alternates: { canonical: "/for/language-teachers" },
  openGraph: {
    title: "Audio Feedback for Language Teachers | OnCue",
    description:
      "Mark up a student's speaking recording where the mistake actually happens, then send one link.",
    url: "/for/language-teachers",
    type: "article",
  },
}

const FAQS = [
  {
    q: "What format do students' recordings need to be in?",
    a: "MP3, WAV or M4A, up to 25MB. M4A matters here: it's what iPhone Voice Memos and most Android recorder apps produce, so a student can record on their phone and send the file straight to you with no conversion.",
  },
  {
    q: "Does my student need an account to hear the feedback?",
    a: "No. They open the link in whatever browser they already have — phone or laptop — and press play. There is no sign-up, no app, and no download.",
  },
  {
    q: "Can the student reply?",
    a: "Yes. Anyone with the link can add their own timestamped notes, so a student can ask \"what did I say here?\" at 1:12 rather than describing it in a separate message. They aren't required to, and most don't — the link works fine as one-way feedback.",
  },
  {
    q: "Can I use this for IELTS or exam speaking practice?",
    a: "That's the most common use we see. Part 2 long turns are where it earns its keep: two minutes of continuous speech is hard to give written feedback on, because by the time you've described where the problem was, the student has lost the thread.",
  },
  {
    q: "How long do the links last?",
    a: "There's no expiry today. Links stay live, and you can send the same one again if a student loses it.",
  },
]

export default function LanguageTeachersPage() {
  return (
    <>
      <LandingJsonLd
        url={URL}
        name="Audio Feedback for Language Teachers"
        description="Timestamped feedback on student speaking recordings, shared as one link."
        faqs={FAQS}
      />
      <LandingShell
        eyebrow="For language teachers"
        title="Feedback your student can hear, at the second it applies"
        lede="Upload a speaking recording, mark the exact moments that need work, and send one link. No account for you, none for them."
        currentHref="/for/language-teachers"
        closing="Your next student recording is probably already sitting in your messages. Upload it and see how long the feedback actually takes."
      >
        <Section heading="The problem with written speaking feedback">
          <p>
            A student sends two minutes of speaking practice. You listen, and you hear six things worth
            saying — a vowel, a missed past tense, a long hesitation, a stress pattern that changes the
            word, a phrase that was actually excellent, and one sentence you couldn&apos;t make out at all.
          </p>
          <p>
            Then you have to write it down. So it becomes <em>&quot;at about 0:45 when you were talking
            about your hometown, the word &lsquo;comfortable&rsquo; — try three syllables, not four.&quot;</em>{" "}
            You are spending most of your effort describing <em>where</em> the feedback goes instead of
            giving the feedback, and the student still has to scrub back and forth to find it.
          </p>
          <p>
            Every note you leave in OnCue is already attached to its moment. You press play, and when you
            hear something, you type. That&apos;s the whole workflow.
          </p>
        </Section>

        <Section heading="How a lesson cycle usually runs">
          <ol className="space-y-3 list-none counter-reset">
            <li>
              <strong className="text-foreground">1. The student records on their phone.</strong> Voice
              Memos, WhatsApp, whatever they have. They send you the file.
            </li>
            <li>
              <strong className="text-foreground">2. You upload it and listen once.</strong> Type notes as
              you go — each one lands at the second you were at.
            </li>
            <li>
              <strong className="text-foreground">3. You send the link.</strong> One message, no
              attachments, nothing to install.
            </li>
            <li>
              <strong className="text-foreground">4. They listen with your notes in place.</strong> They
              hear their own hesitation, then read what you said about it, in that order — which is the
              order that makes it stick.
            </li>
          </ol>
        </Section>

        <Section heading="What&apos;s worth marking">
          <p>
            Teachers who use this heavily tend to keep notes short and specific — a few words at the right
            moment beats a paragraph in the wrong place. Common marks:
          </p>
          <ul className="space-y-2 pl-4 list-disc marker:text-accent/60">
            <li>A single mispronounced word, marked on the word rather than the sentence</li>
            <li>Word stress that changed the meaning (<em>PREsent</em> vs <em>preSENT</em>)</li>
            <li>Hesitations and fillers, where the pause itself is the point</li>
            <li>A grammar slip the student self-corrected — worth praising at the exact spot</li>
            <li>Pace: the moment they sped up and stopped being intelligible</li>
            <li>The best sentence in the recording, so the feedback isn&apos;t only corrections</li>
          </ul>
        </Section>

        <Faq items={FAQS} />
      </LandingShell>
    </>
  )
}
