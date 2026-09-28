import type { Metadata } from "next"
import { Faq, LandingJsonLd, LandingShell, Section } from "@/components/landing-shell"
import { SITE_URL } from "@/lib/site"

const URL = `${SITE_URL}/for/music-teachers`

export const metadata: Metadata = {
  title: "Audio Feedback for Music Teachers",
  description:
    "Mark a student's practice recording bar by bar — intonation, timing, dynamics, phrasing — and send one link they can replay all week. Free, no account.",
  alternates: { canonical: "/for/music-teachers" },
  openGraph: {
    title: "Audio Feedback for Music Teachers | OnCue",
    description:
      "Mark a student's practice recording bar by bar and send one link they can replay all week.",
    url: "/for/music-teachers",
    type: "article",
  },
}

const FAQS = [
  {
    q: "What if the student records on a phone?",
    a: "That's the normal case, and it works. MP3, WAV and M4A are all accepted, up to 25MB, which covers a phone recording of a typical lesson piece.",
  },
  {
    q: "Is the audio quality good enough to judge tone?",
    a: "OnCue plays back whatever was recorded without re-encoding it, so the ceiling is the student's phone, not the tool. For intonation, timing, phrasing and note accuracy that's fine. For fine judgments about tone colour or room sound, a phone recording is the wrong evidence regardless of what you play it in.",
  },
  {
    q: "Can I use it during the lesson instead of after?",
    a: "Some teachers do — record a run-through in the lesson, mark it together on screen, and the student leaves with the link. It turns \"remember what we said about bar 34\" into something they can actually replay.",
  },
  {
    q: "Do students need to install anything?",
    a: "No. The link opens in a browser on any device, with no account and no app. That matters most for younger students, where anything requiring a sign-up becomes a parent's problem.",
  },
  {
    q: "Can I keep a record of past feedback?",
    a: "Your recent shared tracks are listed on the upload screen of the browser you shared from, and links don't expire. There are no accounts yet, so if you clear your browser data that list goes — the links themselves keep working if you've saved them elsewhere.",
  },
]

export default function MusicTeachersPage() {
  return (
    <>
      <LandingJsonLd
        url={URL}
        name="Audio Feedback for Music Teachers"
        description="Timestamped feedback on student practice recordings, shared as one link."
        faqs={FAQS}
      />
      <LandingShell
        eyebrow="For music teachers"
        title="Practice feedback that survives the week"
        lede="Most of what you say in a lesson is gone by Tuesday. Mark a recording where each thing happens, send one link, and the student still has it when they sit down to practise."
        currentHref="/for/music-teachers"
        closing="Ask one student for a recording of what they've been practising. Mark it, send the link, and see whether the next lesson starts further along."
      >
        <Section heading="The gap between the lesson and the practice room">
          <p>
            The feedback lands in the lesson. The practice happens five days later, alone, from memory — and
            memory of a lesson is mostly the general mood of it. Students remember that the middle section
            wasn&apos;t good. They rarely remember that it was the third beat of bar 34, and that the fix was
            to stop rushing the lead-in rather than to play the bar itself more carefully.
          </p>
          <p>
            A marked-up recording closes that gap without adding a second lesson. They press play, hear
            themselves rush, and read what you said about it at that moment — as many times as they need.
          </p>
        </Section>

        <Section heading="What teachers mark most">
          <ul className="space-y-2.5 pl-4 list-disc marker:text-accent/60">
            <li>
              <strong className="text-foreground">Intonation</strong> on the specific note, not the phrase —
              especially where a student consistently drifts on one interval.
            </li>
            <li>
              <strong className="text-foreground">Timing and rushing.</strong> Usually somewhere the student
              is comfortable, which is why they can&apos;t hear it.
            </li>
            <li>
              <strong className="text-foreground">Dynamics that flattened out,</strong> marked where the
              crescendo should have started rather than where it should have peaked.
            </li>
            <li>
              <strong className="text-foreground">Phrasing and breath</strong> — the place the line should
              have carried on but didn&apos;t.
            </li>
            <li>
              <strong className="text-foreground">The moment it clicked.</strong> Students need to know which
              take to repeat, not just which bar to fear.
            </li>
          </ul>
        </Section>

        <Section heading="Using it week to week">
          <p>
            The pattern that sticks is simple: the student sends a recording before the lesson, you mark it
            in the ten minutes before you meet, and the lesson starts from what you both already heard rather
            than from a cold run-through. The recording becomes the agenda.
          </p>
          <p>
            It also gives you something lessons normally don&apos;t: a record. Two months of marked
            recordings is a specific, playable history of what actually changed — useful for the student,
            and considerably more convincing to a parent than &quot;she&apos;s improving nicely&quot;.
          </p>
        </Section>

        <Faq items={FAQS} />
      </LandingShell>
    </>
  )
}
