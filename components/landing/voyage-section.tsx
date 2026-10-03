import { VOYAGE_SEQUENCE_FRAMES, VOYAGE_CHAPTER_SPLIT } from "@/lib/scroll-sequence-frames"
import { ScrollSequence } from "@/components/landing/scroll-sequence"
import { VoyageOverlay } from "@/components/landing/voyage-overlay"

export function VoyageSection() {
  return (
    <ScrollSequence
      ariaLabel="Terra Nova : du nouveau monde à la ville"
      frames={VOYAGE_SEQUENCE_FRAMES}
      scrollLengthVh={6}
      scrimClassName="tn-scrollseq__scrim--voyage"
      overlay={<VoyageOverlay />}
      anchors={
        <>
          <span
            id="accueil"
            aria-hidden="true"
            className="tn-scrollseq__anchor"
            style={{ top: 0, height: `${VOYAGE_CHAPTER_SPLIT * 100}%` }}
          />
          <span
            id="presentation"
            aria-hidden="true"
            className="tn-scrollseq__anchor"
            style={{ top: `${VOYAGE_CHAPTER_SPLIT * 100}%`, height: `${100 - VOYAGE_CHAPTER_SPLIT * 100}%` }}
          />
        </>
      }
    />
  )
}
