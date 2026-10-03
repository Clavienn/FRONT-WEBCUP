export type FrameLoaderState = "idle" | "loading" | "ready" | "error"

export type FrameLoader = {
  state: () => FrameLoaderState
  progress: () => number
  get: (index: number) => HTMLImageElement | null
  isFailed: (index: number) => boolean
  isSettled: () => boolean
  focus: (index: number) => void
  dispose: () => void
}

type Options = {
  /** Max images in flight at once. */
  concurrency?: number
  /** Leading frames fetched *and* decoded up front, so frame 0 is never blank. */
  priorityCount?: number
  onSettled?: () => void
}

const NOOP = () => {}

export function createFrameLoader(urls: string[], options: Options = {}): FrameLoader {
  const { concurrency = 6, priorityCount = 4, onSettled = NOOP } = options
  const total = urls.length

  const images = new Array<HTMLImageElement | null>(total).fill(null)
  const finished = new Array<boolean>(total).fill(false)
  const failed = new Array<boolean>(total).fill(false)
  const requested = new Array<boolean>(total).fill(false)

  let done = 0
  let inFlight = 0
  let focusIndex = 0
  let disposed = false

  const settleIfDone = () => {
    if (disposed || done < total) return
    onSettled()
  }

  const pump = () => {
    if (disposed) return
    while (inFlight < concurrency) {
      // Walk outward from the focused frame so scrubbing never outruns the loader.
      let next = -1
      for (let step = 0; step < total && next === -1; step += 1) {
        const index = focusIndex + (step % 2 === 0 ? step / 2 : -(step + 1) / 2)
        if (index >= 0 && index < total && !requested[index]) next = index
      }
      if (next === -1) return
      load(next, next < priorityCount)
    }
  }

  const load = (index: number, decode: boolean) => {
    requested[index] = true
    inFlight += 1

    const image = new Image()
    image.decoding = "async"
    image.src = urls[index]

    // Exactly-once resolution: the load event, error event and decode()
    // rejection can all fire for the same frame.
    const resolve = (ok: boolean) => {
      if (finished[index]) return
      finished[index] = true
      inFlight -= 1
      done += 1
      if (ok) images[index] = image
      else failed[index] = true
      settleIfDone()
      pump()
    }

    image.addEventListener("load", () => resolve(true), { once: true })
    image.addEventListener("error", () => resolve(false), { once: true })

    // decode() takes the image off the main thread, but it also pins a decoded
    // bitmap in memory. Only the priority frames get it; the rest would
    // otherwise cost a lot of decoded RGBA memory for no benefit.
    if (decode && typeof image.decode === "function") {
      image.decode().then(
        () => resolve(true),
        () => resolve(image.complete && image.naturalWidth > 0)
      )
    }
  }

  for (let i = 0; i < Math.min(priorityCount, total); i += 1) load(i, true)
  pump()

  return {
    state: () => {
      if (disposed) return "error"
      if (done >= total) return "ready"
      return done + inFlight > 0 ? "loading" : "idle"
    },
    progress: () => (total === 0 ? 0 : done / total),
    get: (index) => (index >= 0 && index < total ? images[index] : null),
    isFailed: (index) => failed[index] === true,
    isSettled: () => done >= total,
    focus: (index) => {
      if (total === 0) return
      const clamped = Math.min(Math.max(index, 0), total - 1)
      if (clamped === focusIndex) return
      focusIndex = clamped
      pump()
    },
    dispose: () => {
      disposed = true
      for (let i = 0; i < total; i += 1) {
        const image = images[i]
        if (image) image.src = ""
        images[i] = null
      }
    },
  }
}
