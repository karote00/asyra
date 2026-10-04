import { subscribeToFileLoadComplete, type Core } from '@asyra/core'
import type { StarterProjectionStore } from '../../derived-state/item-projection.js'

export const initProjection = (
  core: Core,
  projection: StarterProjectionStore,
  onLoadAccepted?: () => void
): (() => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const pending: Parameters<
    StarterProjectionStore['refreshFromPublication']
  >[0][] = []
  const unsubscribe = core.subscribeToSharedPublication((publication) => {
    pending.push(publication)
    if (timer !== undefined) return
    timer = setTimeout(() => {
      timer = undefined
      projection.refreshFromPublications(pending.splice(0))
    }, 0)
  })
  const loaded = subscribeToFileLoadComplete(() => {
    onLoadAccepted?.()
    projection.refresh()
  })
  return () => {
    unsubscribe()
    loaded.unsubscribe()
    if (timer !== undefined) clearTimeout(timer)
    pending.length = 0
  }
}
