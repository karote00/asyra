import { createDesign } from '@asyra/design'

const releasing = new WeakMap<HTMLElement, Promise<void>>()

export function mountDesign(host: HTMLElement) {
  let active = true
  const previous = releasing.get(host) ?? Promise.resolve()
  const ready = previous
    .then(() => {
      if (active) {
        return createDesign(host)
      }
    })
    .catch((error: unknown) => globalThis.reportError(error))

  return () => {
    if (!active) {
      return
    }

    active = false
    const released = ready
      .then((editor) => editor?.destroy())
      .catch((error: unknown) => globalThis.reportError(error))

    releasing.set(host, released)
  }
}
