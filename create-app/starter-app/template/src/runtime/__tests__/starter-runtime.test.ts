import { describe, expect, it, vi } from 'vitest'
import type { CoreRawData } from '@asyra/utils'
import {
  ITEM_PROPERTY_TYPE,
  STARTER_STORAGE_SLOT,
  createStarterDocumentWrapper
} from '../../domain/item-domain.js'
import { saveCoreDocument, type StarterStorage } from '../storage.js'
import {
  createStarterRuntime,
  getStarterItemRenderBounds
} from '../starter-runtime.js'

class MemoryStorage implements StarterStorage {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

const clone = <T>(value: T): T => structuredClone(value)

const findItemProperty = (core: CoreRawData): Record<string, unknown> => {
  const property = Object.values(core.props).find(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      (entry as { type?: unknown }).type === ITEM_PROPERTY_TYPE
  )
  if (!property || typeof property !== 'object') {
    throw new Error('Expected saved item property.')
  }
  return property as Record<string, unknown>
}

const saveWrapper = async (
  runtime: ReturnType<typeof createStarterRuntime>
): Promise<CoreRawData> => runtime.core.save()

const settleProjection = async (): Promise<void> => {
  await Promise.resolve()
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await Promise.resolve()
}

describe('starter runtime canonical App path', () => {
  it('replays Add through one Undo and Redo with canonical evidence', async () => {
    const runtime = createStarterRuntime({ storage: new MemoryStorage() })
    const container = document.createElement('div')
    try {
      await runtime.start(container, { width: 320, height: 390 })
      const firstId = runtime.feature.addItem({ title: 'First' })
      const secondId = runtime.feature.addItem({ title: 'Second' })
      await settleProjection()
      expect(runtime.projection.getSnapshot().map((item) => item.id)).toEqual([
        firstId,
        secondId
      ])
      expect(runtime.core.getUndoHistoryDepth()).toBe(2)

      await runtime.undo()
      await settleProjection()
      expect(runtime.projection.getSnapshot().map((item) => item.id)).toEqual([
        firstId
      ])
      await runtime.redo()
      await settleProjection()
      expect(runtime.projection.getSnapshot().map((item) => item.id)).toEqual([
        firstId,
        secondId
      ])
    } finally {
      await runtime.dispose()
    }
  })

  it('lays out rendered Items without overlap at desktop and narrow widths', () => {
    for (const viewportWidth of [800, 364, 294]) {
      const bounds = Array.from({ length: 9 }, (_, index) =>
        getStarterItemRenderBounds(index, viewportWidth)
      )
      bounds.forEach((item, index) => {
        expect(item.width).toBeGreaterThan(0)
        expect(item.height).toBeGreaterThan(0)
        expect(item.x + item.width).toBeLessThanOrEqual(viewportWidth)
        bounds.slice(index + 1).forEach((other) => {
          const separated =
            item.x + item.width <= other.x ||
            other.x + other.width <= item.x ||
            item.y + item.height <= other.y ||
            other.y + other.height <= item.y
          expect(separated).toBe(true)
        })
      })
    }
  })

  it('commits one move, replays it, and restores its saved position', async () => {
    const storage = new MemoryStorage()
    const runtime = createStarterRuntime({ storage })
    const container = document.createElement('div')
    try {
      await runtime.start(container, { width: 800, height: 510 })
      const itemId = runtime.feature.addItem({ title: 'Movable' })
      await settleProjection()
      const beforeMoveDepth = runtime.core.getUndoHistoryDepth()
      runtime.feature.moveItem(itemId, { x: 64, y: 82 })
      await settleProjection()
      expect(runtime.core.getUndoHistoryDepth()).toBe(beforeMoveDepth + 1)
      expect(runtime.projection.getSnapshot()[0]?.offset).toEqual({
        x: 64,
        y: 82
      })
      expect(getStarterItemRenderBounds(0, 800, { x: 64, y: 82 }).x).toBe(
        getStarterItemRenderBounds(0, 800).x + 64
      )
      expect(findItemProperty(await runtime.core.save())).toMatchObject({
        offsetX: 64,
        offsetY: 82
      })

      await runtime.undo()
      await settleProjection()
      expect(runtime.projection.getSnapshot()[0]?.offset).toBeUndefined()
      await runtime.redo()
      await settleProjection()
      expect(runtime.projection.getSnapshot()[0]?.offset).toEqual({
        x: 64,
        y: 82
      })

      expect((await runtime.save()).ok).toBe(true)
      runtime.feature.moveItem(itemId, { x: 100, y: 110 })
      await settleProjection()
      expect((await runtime.reload()).ok).toBe(true)
      expect(runtime.projection.getSnapshot()[0]?.offset).toEqual({
        x: 64,
        y: 82
      })

      const beforeInvalid = await runtime.core.save()
      expect(() =>
        runtime.feature.moveItem(itemId, { x: Number.NaN, y: 0 })
      ).toThrow('position')
      expect(await runtime.core.save()).toEqual(beforeInvalid)
      const invalidSaved = clone(beforeInvalid)
      findItemProperty(invalidSaved).offsetX = 'bad'
      storage.setItem(
        STARTER_STORAGE_SLOT,
        JSON.stringify(createStarterDocumentWrapper(invalidSaved))
      )
      expect((await runtime.reload()).ok).toBe(false)
      expect(await runtime.core.save()).toEqual(beforeInvalid)

      const legacySaved = clone(beforeInvalid)
      delete findItemProperty(legacySaved).offsetX
      delete findItemProperty(legacySaved).offsetY
      storage.setItem(
        STARTER_STORAGE_SLOT,
        JSON.stringify(createStarterDocumentWrapper(legacySaved))
      )
      expect((await runtime.reload()).ok).toBe(true)
      expect(runtime.projection.getSnapshot()[0]?.offset).toBeUndefined()
    } finally {
      await runtime.dispose()
    }
  })

  it('starts, edits, replays history, reloads admitted data, and disposes projections', async () => {
    const storage = new MemoryStorage()
    const loadAccepted = vi.fn()
    const runtime = createStarterRuntime({
      storage,
      onLoadAccepted: loadAccepted
    })
    const container = document.createElement('div')

    await runtime.start(container, { width: 320, height: 240 })
    expect(runtime.core.hasRenderEngineProvider()).toBe(true)
    expect(runtime.projection.getSnapshot()).toEqual([])
    loadAccepted.mockClear()

    const itemId = runtime.feature.addItem({
      title: 'First item',
      status: 'todo'
    })
    await settleProjection()
    expect(itemId).toMatch(/^item-/)
    expect(runtime.projection.getSnapshot()).toEqual([
      { id: itemId, title: 'First item', status: 'todo' }
    ])
    expect(runtime.core.getUndoHistoryDepth()).toBe(1)
    const beforeResize = await runtime.core.save()
    runtime.resize(294, 390)
    expect(await runtime.core.save()).toEqual(beforeResize)
    expect(runtime.core.getUndoHistoryDepth()).toBe(1)

    runtime.feature.editItem(itemId, {
      title: 'Edited item',
      status: 'doing'
    })
    await settleProjection()
    expect(runtime.projection.getSnapshot()).toEqual([
      { id: itemId, title: 'Edited item', status: 'doing' }
    ])
    expect(runtime.core.getUndoHistoryDepth()).toBe(2)

    await runtime.undo()
    await settleProjection()
    expect(runtime.projection.getSnapshot()).toEqual([
      { id: itemId, title: 'First item', status: 'todo' }
    ])
    await runtime.redo()
    await settleProjection()
    expect(runtime.projection.getSnapshot()).toEqual([
      { id: itemId, title: 'Edited item', status: 'doing' }
    ])

    const beforeInvalidWrite = await saveWrapper(runtime)
    expect(() =>
      runtime.feature.editItem(itemId, {
        status: 'blocked' as never
      })
    ).toThrow('Unsupported item status')
    expect(await saveWrapper(runtime)).toEqual(beforeInvalidWrite)
    expect(runtime.projection.getSnapshot()).toEqual([
      { id: itemId, title: 'Edited item', status: 'doing' }
    ])

    const saveResult = await runtime.save()
    expect(saveResult.ok).toBe(true)
    const saved = storage.getItem(STARTER_STORAGE_SLOT)
    expect(saved).not.toBeNull()

    runtime.feature.editItem(itemId, {
      title: 'Changed after save',
      status: 'done'
    })
    await settleProjection()
    expect(runtime.projection.getSnapshot()).toEqual([
      { id: itemId, title: 'Changed after save', status: 'done' }
    ])

    const reloadResult = await runtime.reload()
    expect(reloadResult.ok).toBe(true)
    expect(loadAccepted).toHaveBeenCalledOnce()
    expect(runtime.projection.getSnapshot()).toEqual([
      { id: itemId, title: 'Edited item', status: 'doing' }
    ])

    const acceptedCore = await saveWrapper(runtime)
    const acceptedProjection = runtime.projection.getSnapshot()
    const acceptedDepth = runtime.core.getUndoHistoryDepth()
    const invalidCore = clone(acceptedCore)
    findItemProperty(invalidCore).status = 'blocked'
    storage.setItem(
      STARTER_STORAGE_SLOT,
      JSON.stringify(createStarterDocumentWrapper(invalidCore))
    )
    const preflightSpy = vi.spyOn(runtime.core, 'preflightLoad')
    const loadSpy = vi.spyOn(runtime.core, 'load')
    const invalidStatusResult = await runtime.reload()
    expect(invalidStatusResult.ok).toBe(false)
    expect(invalidStatusResult.message).toContain('invalid status')
    expect(preflightSpy).not.toHaveBeenCalled()
    expect(loadSpy).not.toHaveBeenCalled()
    expect(await saveWrapper(runtime)).toEqual(acceptedCore)
    expect(runtime.projection.getSnapshot()).toEqual(acceptedProjection)
    expect(runtime.core.getUndoHistoryDepth()).toBe(acceptedDepth)

    const missingTitleCore = clone(acceptedCore)
    delete findItemProperty(missingTitleCore).title
    storage.setItem(
      STARTER_STORAGE_SLOT,
      JSON.stringify(createStarterDocumentWrapper(missingTitleCore))
    )
    const missingTitleResult = await runtime.reload()
    expect(missingTitleResult.ok).toBe(false)
    expect(missingTitleResult.message).toContain('valid title')
    expect(await saveWrapper(runtime)).toEqual(acceptedCore)

    const missingStatusCore = clone(acceptedCore)
    delete findItemProperty(missingStatusCore).status
    storage.setItem(
      STARTER_STORAGE_SLOT,
      JSON.stringify(createStarterDocumentWrapper(missingStatusCore))
    )
    const missingStatusResult = await runtime.reload()
    expect(missingStatusResult.ok).toBe(false)
    expect(missingStatusResult.message).toContain('invalid status')
    expect(await saveWrapper(runtime)).toEqual(acceptedCore)

    const observed = vi.fn()
    const unsubscribe = runtime.projection.subscribe(observed)
    await runtime.dispose()
    runtime.projection.refresh()
    expect(runtime.projection.lateRefreshCount).toBe(1)
    expect(observed).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('does not throw when browser storage is unavailable during runtime creation', async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'localStorage'
    )
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage denied', 'SecurityError')
      }
    })

    try {
      const runtime = createStarterRuntime()
      const result = await runtime.save()
      expect(result.ok).toBe(false)
      expect(result.message).toContain('Storage denied')
      await runtime.dispose()
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, 'localStorage', originalDescriptor)
      }
    }
  })

  it('uses publication-scoped projection updates for normal actions and history replay', async () => {
    const runtime = createStarterRuntime({ storage: new MemoryStorage() })
    const container = document.createElement('div')
    await runtime.start(container, { width: 320, height: 240 })

    const fullRead = vi.spyOn(runtime.core, 'getAllElementData')
    const initialRefreshCount = runtime.projection.refreshCount
    const firstId = runtime.feature.addItem({
      title: 'First item',
      status: 'todo'
    })
    await settleProjection()
    expect(runtime.projection.refreshCount).toBe(initialRefreshCount + 1)
    expect(fullRead).not.toHaveBeenCalled()

    const afterFirstAdd = runtime.projection.refreshCount
    const secondId = runtime.feature.addItem({
      title: 'Second item',
      status: 'todo'
    })
    await settleProjection()
    expect(runtime.projection.refreshCount).toBe(afterFirstAdd + 1)
    expect(fullRead).not.toHaveBeenCalled()
    const firstBeforeEdit = runtime.projection
      .getSnapshot()
      .find((item) => item.id === firstId)
    expect(firstBeforeEdit).toBeDefined()

    const beforeEdit = runtime.projection.refreshCount
    runtime.feature.editItem(secondId, { status: 'doing' })
    await settleProjection()
    expect(runtime.projection.refreshCount).toBe(beforeEdit + 1)
    expect(fullRead).not.toHaveBeenCalled()
    expect(
      runtime.projection.getSnapshot().find((item) => item.id === firstId)
    ).toBe(firstBeforeEdit)
    expect(
      runtime.projection.getSnapshot().find((item) => item.id === secondId)
    ).toMatchObject({ title: 'Second item', status: 'doing' })

    const beforeUndo = runtime.projection.refreshCount
    await runtime.undo()
    await settleProjection()
    expect(runtime.projection.refreshCount).toBe(beforeUndo + 1)
    expect(fullRead).not.toHaveBeenCalled()
    expect(
      runtime.projection.getSnapshot().find((item) => item.id === secondId)
    ).toMatchObject({ title: 'Second item', status: 'todo' })

    const beforeRedo = runtime.projection.refreshCount
    await runtime.redo()
    await settleProjection()
    expect(runtime.projection.refreshCount).toBe(beforeRedo + 1)
    expect(fullRead).not.toHaveBeenCalled()
    expect(
      runtime.projection.getSnapshot().find((item) => item.id === secondId)
    ).toMatchObject({ title: 'Second item', status: 'doing' })

    const saved = await runtime.save()
    expect(saved.ok).toBe(true)
    const beforeLoadRefresh = runtime.projection.refreshCount
    expect(await runtime.reload()).toMatchObject({ ok: true })
    expect(runtime.projection.refreshCount).toBe(beforeLoadRefresh + 1)
    expect(fullRead).toHaveBeenCalledTimes(1)

    await runtime.dispose()
  })

  it('reports storage write failures without claiming a save', () => {
    const core = {
      version: '1.0.0',
      sceneTree: { workspace: '', workspaceList: [], elements: {} },
      props: {}
    } as unknown as CoreRawData
    const storage: StarterStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded')
      }
    }

    const result = saveCoreDocument(storage, core)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('quota exceeded')
  })
})
