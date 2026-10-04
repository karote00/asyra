import { SharedDataChannelNames } from '@asyra/utils'
import { getPropertyComponentAccessor, type Core } from '@asyra/core'
import type { SharedPublication } from '@asyra/core'
import {
  ITEM_COMPONENT_TYPE,
  ITEM_PROPERTY_NAME,
  type ItemFieldExtension,
  type ItemProjection,
  isValidItemOffset,
  isItemStatus,
  isValidItemTitle
} from '../domain/item-domain.js'

export interface ProjectionChange {
  readonly changedIds: readonly string[]
  readonly membershipChanged: boolean
}
type ProjectionSubscriber = (items: readonly ItemProjection[]) => void

export class StarterProjectionStore {
  private items: readonly ItemProjection[] = Object.freeze([])
  private readonly itemsById = new Map<string, ItemProjection>()
  private readonly propertyToElement = new Map<string, string>()
  private readonly subscribers = new Set<ProjectionSubscriber>()
  private readonly itemSubscribers = new Map<string, Set<() => void>>()
  private readonly changeSubscribers = new Set<
    (change: ProjectionChange) => void
  >()
  private disposed = false
  refreshCount = 0
  lateRefreshCount = 0

  constructor(
    private readonly core: Core,
    private readonly itemField?: ItemFieldExtension
  ) {}

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

  getItem(id: string): ItemProjection | undefined {
    return this.itemsById.get(id)
  }

  subscribeItem(id: string, notify: () => void): () => void {
    if (this.disposed) return () => undefined
    const listeners = this.itemSubscribers.get(id) ?? new Set<() => void>()
    this.itemSubscribers.set(id, listeners)
    listeners.add(notify)
    return () => {
      listeners.delete(notify)
      if (listeners.size === 0) this.itemSubscribers.delete(id)
    }
  }

  subscribeChanges(subscriber: (change: ProjectionChange) => void): () => void {
    if (this.disposed) return () => undefined
    this.changeSubscribers.add(subscriber)
    return () => {
      this.changeSubscribers.delete(subscriber)
    }
  }

  refresh(): void {
    if (this.disposed) {
      this.lateRefreshCount += 1
      return
    }

    const previousIds = [...this.itemsById.keys()]
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
    this.publish([...new Set([...previousIds, ...this.itemsById.keys()])], true)
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

    const changedIds: string[] = []
    let membershipChanged = false
    elementIds.forEach((elementId) => {
      const existed = this.itemsById.has(elementId)
      if (this.refreshElement(elementId)) changedIds.push(elementId)
      membershipChanged ||= existed !== this.itemsById.has(elementId)
    })
    if (changedIds.length === 0) {
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
    this.publish(changedIds, membershipChanged)
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
      previous.status === next.status &&
      previous.offset?.x === next.offset?.x &&
      previous.offset?.y === next.offset?.y &&
      (!this.itemField ||
        previous.fields?.[this.itemField.key] ===
          next.fields?.[this.itemField.key])
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
    const fields = this.readItemFields(data, computed)
    const title = fields.title
    const status = fields.status
    if (!isValidItemTitle(title) || !isItemStatus(status)) {
      return undefined
    }
    let fieldValue: unknown
    if (this.itemField) {
      fieldValue = Object.hasOwn(fields, this.itemField.key)
        ? fields[this.itemField.key]
        : this.itemField.defaultValue
    }
    if (this.itemField && !this.itemField.validate(fieldValue)) {
      return undefined
    }
    const offsetX = fields.offsetX ?? 0
    const offsetY = fields.offsetY ?? 0
    if (!isValidItemOffset(offsetX) || !isValidItemOffset(offsetY)) {
      return undefined
    }
    return Object.freeze({
      id: elementId,
      title,
      status,
      ...(offsetX !== 0 || offsetY !== 0
        ? { offset: Object.freeze({ x: offsetX, y: offsetY }) }
        : {}),
      ...(this.itemField
        ? {
            fields: Object.freeze({
              [this.itemField.key]: fieldValue as string
            })
          }
        : {})
    })
  }

  private readItemFields(
    data: object,
    computed: object
  ): Record<string, unknown> {
    const computedFields = computed as Record<string, unknown>
    if (
      isValidItemTitle(computedFields.title) &&
      isItemStatus(computedFields.status) &&
      (!this.itemField ||
        this.itemField.validate(computedFields[this.itemField.key]))
    ) {
      return computedFields
    }

    const props = (data as { props?: unknown }).props
    if (!props || typeof props !== 'object') {
      return computedFields
    }
    const propertyId = (props as Record<string, unknown>)[ITEM_PROPERTY_NAME]
    if (typeof propertyId !== 'string') {
      return computedFields
    }
    const saved = getPropertyComponentAccessor()
      .getPropertyById(propertyId)
      ?.save() as unknown
    return saved && typeof saved === 'object'
      ? (saved as Record<string, unknown>)
      : computedFields
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

  private publish(
    changedIds: readonly string[],
    membershipChanged: boolean
  ): void {
    changedIds.forEach((id) =>
      this.itemSubscribers.get(id)?.forEach((notify) => notify())
    )
    this.changeSubscribers.forEach((subscriber) =>
      subscriber({ changedIds, membershipChanged })
    )
    this.refreshCount += 1
    this.subscribers.forEach((subscriber) => subscriber(this.items))
  }

  dispose(): void {
    this.disposed = true
    this.subscribers.clear()
    this.changeSubscribers.clear()
    this.itemSubscribers.clear()
  }
}
