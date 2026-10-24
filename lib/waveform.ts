/**
 * Waveform peaks, computed once at upload instead of on every view.
 *
 * The share page used to download the whole audio file twice — once via
 * fetch() to decode it for the waveform, and again as the <audio> element's
 * source. On a 4.2 MB median file against a 5 GB monthly egress allowance that
 * is a few hundred views a month before the bill lands.
 *
 * Peaks are computed in the uploader's browser, where the decoded buffer
 * already exists, and stored on the project. A share page then draws the
 * waveform from a few KB of JSON and doesn't touch the audio until play.
 *
 * Projects uploaded before this have no peaks and still decode client-side —
 * see components/waveform-player.tsx.
 */

/** How many peaks to store. Far more than any viewport draws, so the same
 *  array can be downsampled to whatever bar count the canvas wants. */
export const STORED_PEAK_COUNT = 1000

/** Mean absolute amplitude per bucket, normalised to 0..1. */
export function computePeaks(audioBuffer: AudioBuffer, count: number): number[] {
  const channel = audioBuffer.getChannelData(0)
  const samplesPerBucket = Math.floor(channel.length / count)
  const peaks: number[] = []

  if (samplesPerBucket < 1) {
    // Clip shorter than the bucket count: one sample each, padded.
    for (let i = 0; i < count; i++) peaks.push(Math.abs(channel[i] ?? 0))
  } else {
    for (let i = 0; i < count; i++) {
      let sum = 0
      const start = i * samplesPerBucket
      const end = Math.min(start + samplesPerBucket, channel.length)
      for (let j = start; j < end; j++) sum += Math.abs(channel[j])
      peaks.push(sum / Math.max(1, end - start))
    }
  }

  const max = Math.max(...peaks, 0.001)
  // Three decimals keeps the stored JSON small; the canvas is ~150px tall, so
  // the extra precision would never be visible.
  return peaks.map((p) => Math.round((p / max) * 1000) / 1000)
}

/**
 * Downsample stored peaks to the bar count a canvas actually draws. Averages
 * across the span rather than picking one value, so a quiet bar between two
 * loud ones doesn't disappear at low bar counts.
 */
export function resamplePeaks(peaks: number[], count: number): number[] {
  if (peaks.length === 0) return []
  if (peaks.length === count) return peaks

  const out: number[] = []
  const ratio = peaks.length / count

  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * ratio)
    const end = Math.max(start + 1, Math.floor((i + 1) * ratio))
    let sum = 0
    for (let j = start; j < end && j < peaks.length; j++) sum += peaks[j]
    out.push(sum / Math.max(1, Math.min(end, peaks.length) - start))
  }

  return out
}

/** Narrow whatever came back from jsonb into usable peaks. */
export function parsePeaks(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const nums = value.filter((v): v is number => typeof v === "number" && Number.isFinite(v))
  return nums.length === value.length ? nums : null
}
