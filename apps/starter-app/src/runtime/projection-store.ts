import type { Core } from '@asyra/core'
import {
  ITEM_COMPONENT_TYPE,
  type ItemProjection,
  isItemStatus,
  isValidItemTitle
} from '../domain/item-domain.js'

type ProjectionSubscriber = (items: readonly ItemProjection[]) => void

export class StarterProjectionStore {
  private items: readonly ItemProjection[] = Object.freeze([])
  private readonly subscribers = new Set<ProjectionSubscriber>()
  private disposed = false
  refreshCount = 0
  lateRefreshCount = 0

  constructor(private readonly core: Core) {}

  getSnapshot(): readonly ItemProjection[] {
    return this.items
  }

  subscribe(subscriber: ProjectionSubscriber): () => void {
    if (this.disposed) {
      return () => undefined
    }
    this.subscribers.add(subscriber)
    subscriber(this.items)
    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  refresh(): void {
    if (this.disposed) {
      this.lateRefreshCount += 1
      return
    }

    const items = this.core
      .getAllElementData()
      .filter(({ data }) => data.type === ITEM_COMPONENT_TYPE)
      .map(({ elementId, computed }) => {
        const fields = computed as Record<string, unknown>
        const title = fields.title
        const status = fields.status
        if (!isValidItemTitle(title) || !isItemStatus(status)) {
          return undefined
        }
        return Object.freeze({
          id: elementId,
          title,
          status
        })
      })
      .filter((item): item is ItemProjection => item !== undefined)

    this.items = Object.freeze(items)
    this.refreshCount += 1
    this.subscribers.forEach((subscriber) => subscriber(this.items))
  }

  dispose(): void {
    this.disposed = true
    this.subscribers.clear()
  }
}
