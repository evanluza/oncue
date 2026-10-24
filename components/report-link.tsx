import { Flag } from "lucide-react"

type ReportLinkProps = {
  projectId: string
}

/**
 * A way to report an abusive or infringing share link.
 *
 * The bucket serves public URLs from oncue.audio, anyone can upload without an
 * account, and until now there was no route for a recipient to tell you that
 * something on your domain shouldn't be there. That matters for takedown
 * requests regardless of volume.
 *
 * Renders nothing unless NEXT_PUBLIC_REPORT_EMAIL is set, so no address is
 * published until you choose one. The project id is prefilled in the subject
 * so a report can be acted on without a reply.
 */
export function ReportLink({ projectId }: ReportLinkProps) {
  const address = process.env.NEXT_PUBLIC_REPORT_EMAIL
  if (!address) return null

  const subject = encodeURIComponent(`OnCue report: ${projectId}`)
  const body = encodeURIComponent(
    [
      `Link: https://www.oncue.audio/share/${projectId}`,
      "",
      "What's wrong with it:",
      "",
    ].join("\n")
  )

  return (
    <a
      href={`mailto:${address}?subject=${subject}&body=${body}`}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
    >
      <Flag className="h-3 w-3" />
      Report this link
    </a>
  )
}
