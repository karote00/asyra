import type { Core } from '@asyra/core'
import { UIProperties } from '../../config/ui-properties.js'
import type { StarterProjectionStore } from '../../derived-state/item-projection.js'

export const initUIProperties = (
  core: Core,
  projection: StarterProjectionStore
) => {
  core.defineUIProperty(UIProperties.itemIds, { defaultValue: [] })
  core.defineUIProperty(UIProperties.selectedId, { defaultValue: null })
  core.defineUIProperty(UIProperties.ready, { defaultValue: false })
  core.defineUIProperty(UIProperties.pending, { defaultValue: false })
  core.defineUIProperty(UIProperties.status, {
    defaultValue: { tone: 'loading', message: 'Starting runtime...' }
  })
  core.defineUIProperty(UIProperties.canvasWidth, { defaultValue: 800 })
  const selectedListeners = new Map<string, Set<() => void>>()
  const unsubscribe = projection.subscribeChanges(({ membershipChanged }) => {
    if (!membershipChanged) return
    core.setUIProperty(
      UIProperties.itemIds,
      projection.getSnapshot().map((item) => item.id)
    )
    const selectedId = core.getUIProperty<string | null>(
      UIProperties.selectedId
    )
    if (selectedId && !projection.getItem(selectedId))
      core.setUIProperty(UIProperties.selectedId, null)
  })
  let previous: string | null = null
  const unselect = core.onUIPropertyChange<string | null>(
    UIProperties.selectedId,
    (id) => {
      if (id === previous) return
      if (previous)
        selectedListeners.get(previous)?.forEach((notify) => notify())
      if (id) selectedListeners.get(id)?.forEach((notify) => notify())
      previous = id
    }
  )
  return {
    subscribeSelected(id: string, notify: () => void): () => void {
      const listeners = selectedListeners.get(id) ?? new Set<() => void>()
      selectedListeners.set(id, listeners)
      listeners.add(notify)
      return () => {
        listeners.delete(notify)
        if (!listeners.size) selectedListeners.delete(id)
      }
    },
    dispose(): void {
      unsubscribe()
      unselect()
      selectedListeners.clear()
    }
  }
}
