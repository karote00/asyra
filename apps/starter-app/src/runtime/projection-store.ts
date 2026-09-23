import { SharedDataChannelNames } from '@asyra/utils'
import type { Core } from '@asyra/core'
import type { SharedPublication } from '@asyra/core'
import {
  ITEM_COMPONENT_TYPE,
  ITEM_PROPERTY_NAME,
  type ItemProjection,
  isItemStatus,
  isValidItemTitle
} from '../domain/item-domain.js'

type ProjectionSubscriber = (items: readonly ItemProjection[]) => void

export class StarterProjectionStore {
  private items: readonly ItemProjection[] = Object.freeze([])
  private readonly itemsById = new Map<string, ItemProjection>()
  private readonly propertyToElement = new Map<string, string>()
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

    this.itemsById.clear()
    this.propertyToElement.clear()
    const items = this.core
      .getAllElementData()
      .map(({ elementId, data, computed }) => {
        const item = this.createProjection(elementId, data, computed)
        if (item) {
          this.itemsById.set(elementId, item)
          this.recordPropertyOwner(elementId, data)
        }
        return item
      })
      .filter((item): item is ItemProjection => item !== undefined)

    this.items = Object.freeze(items)
    this.publish()
  }

  refreshFromPublication(publication: SharedPublication): void {
    this.refreshFromPublications([publication])
  }

  refreshFromPublications(publications: readonly SharedPublication[]): void {
    if (this.disposed) {
      this.lateRefreshCount += 1
      return
    }

    const elementIds = new Set<string>()
    const propertyIds = new Set<string>()
    publications.forEach((publication) => {
      publication.slices.forEach((slice) => {
        slice.batches.forEach((batch) => {
          let target: Set<string> | undefined
          if (batch.channel === SharedDataChannelNames.PROPS) {
            target = propertyIds
          } else if (batch.channel === SharedDataChannelNames.SCENE_TREE) {
            target = elementIds
          }
          if (!target) {
            return
          }
          batch.deliveries.forEach((delivery) => {
            delivery.orderedIds.forEach((id) => target.add(id))
          })
        })
      })
    })

    propertyIds.forEach((propertyId) => {
      const elementId = this.propertyToElement.get(propertyId)
      if (elementId) {
        elementIds.add(elementId)
      }
    })

    if (elementIds.size === 0) {
      return
    }

    let changed = false
    elementIds.forEach((elementId) => {
      changed = this.refreshElement(elementId) || changed
    })
    if (!changed) {
      return
    }

    this.items = Object.freeze(
      this.items
        .map((item) => this.itemsById.get(item.id))
        .filter((item): item is ItemProjection => item !== undefined)
    )
    elementIds.forEach((elementId) => {
      if (!this.items.some((item) => item.id === elementId)) {
        const item = this.itemsById.get(elementId)
        if (item) {
          this.items = Object.freeze([...this.items, item])
        }
      }
    })
    this.publish()
  }

  private refreshElement(elementId: string): boolean {
    const data = this.core.getElementData(elementId)
    const computed = this.core.getElementComputedData(elementId)
    const next = this.createProjection(elementId, data, computed)
    const previous = this.itemsById.get(elementId)
    if (!next) {
      if (!previous) {
        return false
      }
      this.itemsById.delete(elementId)
      this.removePropertyOwner(elementId)
      return true
    }

    this.recordPropertyOwner(elementId, data)
    if (
      previous &&
      previous.title === next.title &&
      previous.status === next.status
    ) {
      return false
    }
    this.itemsById.set(elementId, next)
    return true
  }

  private createProjection(
    elementId: string,
    data: unknown,
    computed: unknown
  ): ItemProjection | undefined {
    if (
      !data ||
      typeof data !== 'object' ||
      (data as { type?: unknown }).type !== ITEM_COMPONENT_TYPE ||
      !computed ||
      typeof computed !== 'object'
    ) {
      return undefined
    }
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
  }

  private recordPropertyOwner(elementId: string, data: unknown): void {
    if (!data || typeof data !== 'object') {
      return
    }
    const props = (data as { props?: unknown }).props
    if (!props || typeof props !== 'object') {
      return
    }
    const propertyId = (props as Record<string, unknown>)[ITEM_PROPERTY_NAME]
    if (typeof propertyId === 'string') {
      this.propertyToElement.set(propertyId, elementId)
    }
  }

  private removePropertyOwner(elementId: string): void {
    ;[...this.propertyToElement.entries()].forEach(([propertyId, ownerId]) => {
      if (ownerId === elementId) {
        this.propertyToElement.delete(propertyId)
      }
    })
  }

  private publish(): void {
    this.refreshCount += 1
    this.subscribers.forEach((subscriber) => subscriber(this.items))
  }

  dispose(): void {
    this.disposed = true
    this.subscribers.clear()
  }
}
