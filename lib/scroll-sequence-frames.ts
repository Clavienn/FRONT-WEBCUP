function buildFrames(folder: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_, i) => `/img/sequence/${folder}/${String(i).padStart(3, "0")}.webp`
  )
}

const HERO_FRAMES = buildFrames("hero", 38)
const HISTOIRE_FRAMES = buildFrames("histoire", 23)

/**
 * Single continuous planet-to-city sequence shared by the hero and "Notre
 * histoire" chapters: one pinned background, the overlay content changes
 * as the user scrubs through it.
 */
export const VOYAGE_SEQUENCE_FRAMES = [...HERO_FRAMES, ...HISTOIRE_FRAMES]

/** Progress (0..1) at which the frame sequence hands off from hero to histoire content. */
export const VOYAGE_CHAPTER_SPLIT = HERO_FRAMES.length / VOYAGE_SEQUENCE_FRAMES.length
