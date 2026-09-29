import { describe, expect, it, vi } from 'vitest'
import type { CoreRawData } from '@asyra/utils'
import {
  ITEM_PROPERTY_TYPE,
  STARTER_STORAGE_SLOT,
  createItemPropertySchema,
  createStarterDocumentWrapper
} from '../../../domain/item-domain.js'
import {
  createStarterRuntime,
  type StarterRuntime
} from '../../../runtime/starter-runtime.js'
import type { StarterStorage } from '../../../runtime/storage.js'
import { priorityItemField } from '../priority-item-field.js'

class MemoryStorage implements StarterStorage {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

const settleProjection = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await Promise.resolve()
}

const itemProperty = (core: CoreRawData): Record<string, unknown> => {
  const property = Object.values(core.props).find(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      (entry as { type?: unknown }).type === ITEM_PROPERTY_TYPE
  )
  if (!property || typeof property !== 'object') {
    throw new Error('Expected an Item property in the saved document.')
  }
  return property as Record<string, unknown>
}

const priorityOf = (runtime: StarterRuntime, id: string): unknown =>
  runtime.projection.getSnapshot().find((item) => item.id === id)?.fields
    ?.priority

describe('opt-in priority Item extension exercise', () => {
  it('declares priority on the App-owned Item property schema', () => {
    const field = createItemPropertySchema(priorityItemField).fields.find(
      ({ key }) => key === 'priority'
    )
    expect(field?.defaultValue).toBe('normal')
    expect(field?.validate?.('high')).toBe(true)
    expect(field?.validate?.('urgent')).toBe(false)
  })

  it('writes through Feature and Core, then projects one edit and its Undo/Redo', async () => {
    const runtime = createStarterRuntime({
      itemField: priorityItemField,
      storage: new MemoryStorage()
    })
    try {
      await runtime.start(document.createElement('div'), {
        width: 320,
        height: 240
      })
      const id = runtime.feature.addItem({
        title: 'First item',
        status: 'todo',
        fields: { priority: 'low' }
      })
      await settleProjection()
      expect(priorityOf(runtime, id)).toBe('low')
      expect(itemProperty(await runtime.core.save()).priority).toBe('low')

      const otherId = runtime.feature.addItem({ title: 'Other item' })
      await settleProjection()
      expect(priorityOf(runtime, otherId)).toBe('normal')
      const otherProjection = runtime.projection
        .getSnapshot()
        .find((item) => item.id === otherId)
      const fullRead = vi.spyOn(runtime.core, 'getAllElementData')
      const beforeRefresh = runtime.projection.refreshCount
      const beforeDepth = runtime.core.getUndoHistoryDepth()

      runtime.feature.editItem(id, {
        title: 'Edited item',
        status: 'doing',
        fields: { priority: 'high' }
      })
      await settleProjection()
      expect(runtime.core.getUndoHistoryDepth()).toBe(beforeDepth + 1)
      expect(runtime.projection.refreshCount).toBe(beforeRefresh + 1)
      expect(
        runtime.projection.getSnapshot().find((item) => item.id === id)
      ).toMatchObject({
        title: 'Edited item',
        status: 'doing',
        fields: { priority: 'high' }
      })
      expect(
        runtime.projection.getSnapshot().find((item) => item.id === otherId)
      ).toBe(otherProjection)
      expect(fullRead).not.toHaveBeenCalled()

      await runtime.undo()
      await settleProjection()
      expect(runtime.projection.refreshCount).toBe(beforeRefresh + 2)
      expect(
        runtime.projection.getSnapshot().find((item) => item.id === id)
      ).toMatchObject({
        title: 'First item',
        status: 'todo',
        fields: { priority: 'low' }
      })
      await runtime.redo()
      await settleProjection()
      expect(runtime.projection.refreshCount).toBe(beforeRefresh + 3)
      expect(
        runtime.projection.getSnapshot().find((item) => item.id === id)
      ).toMatchObject({
        title: 'Edited item',
        status: 'doing',
        fields: { priority: 'high' }
      })
      expect(fullRead).not.toHaveBeenCalled()
    } finally {
      await runtime.dispose()
    }
  })

  it('saves priority, admits legacy missing priority, and rejects invalid data before load', async () => {
    const storage = new MemoryStorage()
    const runtime = createStarterRuntime({
      itemField: priorityItemField,
      storage
    })
    try {
      await runtime.start(document.createElement('div'), {
        width: 320,
        height: 240
      })
      const id = runtime.feature.addItem({
        title: 'Persisted item',
        status: 'done',
        fields: { priority: 'high' }
      })
      await settleProjection()
      expect((await runtime.save()).ok).toBe(true)
      expect(itemProperty(await runtime.core.save()).priority).toBe('high')

      runtime.feature.editItem(id, {
        status: 'doing',
        fields: { priority: 'low' }
      })
      await settleProjection()
      expect((await runtime.reload()).ok).toBe(true)
      expect(
        runtime.projection.getSnapshot().find((item) => item.id === id)
      ).toMatchObject({
        title: 'Persisted item',
        status: 'done',
        fields: { priority: 'high' }
      })

      const acceptedCore = await runtime.core.save()
      const acceptedProjection = runtime.projection.getSnapshot()
      const acceptedDepth = runtime.core.getUndoHistoryDepth()
      const invalidCore = structuredClone(acceptedCore)
      itemProperty(invalidCore).priority = 'urgent'
      storage.setItem(
        STARTER_STORAGE_SLOT,
        JSON.stringify(createStarterDocumentWrapper(invalidCore))
      )
      const preflight = vi.spyOn(runtime.core, 'preflightLoad')
      const load = vi.spyOn(runtime.core, 'load')
      const invalidResult = await runtime.reload()
      expect(invalidResult.ok).toBe(false)
      expect(invalidResult.message).toContain('priority')
      expect(preflight).not.toHaveBeenCalled()
      expect(load).not.toHaveBeenCalled()
      expect(await runtime.core.save()).toEqual(acceptedCore)
      expect(runtime.projection.getSnapshot()).toEqual(acceptedProjection)
      expect(runtime.core.getUndoHistoryDepth()).toBe(acceptedDepth)

      const beforeInvalidWrite = await runtime.core.save()
      expect(() =>
        runtime.feature.editItem(id, { fields: { priority: 'urgent' } })
      ).toThrow('priority')
      expect(await runtime.core.save()).toEqual(beforeInvalidWrite)
      expect(runtime.core.getUndoHistoryDepth()).toBe(acceptedDepth)

      const legacyCore = structuredClone(acceptedCore)
      delete itemProperty(legacyCore).priority
      storage.setItem(
        STARTER_STORAGE_SLOT,
        JSON.stringify(createStarterDocumentWrapper(legacyCore))
      )
      expect((await runtime.reload()).ok).toBe(true)
      expect(priorityOf(runtime, id)).toBe('normal')
      expect(
        runtime.projection.getSnapshot().find((item) => item.id === id)
      ).toMatchObject({
        title: 'Persisted item',
        status: 'done'
      })
      expect(itemProperty(await runtime.core.save()).priority).toBe('normal')
    } finally {
      await runtime.dispose()
    }
  })
})
