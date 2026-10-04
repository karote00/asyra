import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { initApp } from '../../init/init-app.js'
import { AppContext } from '../../contexts/app.js'
import { UIProperties } from '../../config/ui-properties.js'
import {
  useItem,
  useIsSelected,
  useItemIds,
  useStatus
} from '../../providers/properties.js'
import {
  createStarterDocumentWrapper,
  STARTER_STORAGE_SLOT
} from '../../domain/item-domain.js'

;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true
const settle = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}
const memoryStorage = () => {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    }
  }
}

describe('App property and entity update boundaries', () => {
  it('reads and notifies only the edited Item; selection and status do no document reads', async () => {
    const app = initApp({ storage: memoryStorage() })
    const host = document.createElement('div')
    const root = createRoot(host)
    try {
      await app.start(document.createElement('div'))
      const ids = Array.from({ length: 30 }, (_, index) =>
        app.itemActions.addItem({ title: 'Item ' + index })
      )
      await settle()
      const first = ids[0] as string
      const other = ids[29] as string
      const renders = { first: 0, other: 0, list: 0, status: 0 }
      const Row = ({ id, count }: { id: string; count: 'first' | 'other' }) => {
        const item = useItem(id)
        const selected = useIsSelected(id)
        renders[count]++
        return (
          <span data-id={id}>
            {item?.title}:{String(selected)}
          </span>
        )
      }
      const List = () => {
        useItemIds()
        renders.list++
        return null
      }
      const Status = () => {
        useStatus()
        renders.status++
        return null
      }
      await act(async () => {
        root.render(
          <AppContext.Provider value={app}>
            <List />
            <Status />
            <Row id={first} count="first" />
            <Row id={other} count="other" />
          </AppContext.Provider>
        )
      })
      const reads = vi.spyOn(app.core, 'getElementData')
      const fullReads = vi.spyOn(app.core, 'getAllElementData')
      const firstNotified = vi.fn()
      const otherNotified = vi.fn()
      const listNotified = vi.fn()
      const releaseFirst = app.projection.subscribeItem(first, firstNotified)
      const releaseOther = app.projection.subscribeItem(other, otherNotified)
      const releaseList = app.core.onUIPropertyChange(
        UIProperties.itemIds,
        listNotified
      )
      listNotified.mockClear()
      const before = { ...renders }
      await act(async () => {
        app.itemActions.editItem(first, { title: 'Localized edit' })
        await settle()
      })
      expect(reads.mock.calls.map(([id]) => id)).toEqual([first])
      expect(fullReads).not.toHaveBeenCalled()
      expect(firstNotified).toHaveBeenCalledOnce()
      expect(otherNotified).not.toHaveBeenCalled()
      expect(listNotified).not.toHaveBeenCalled()
      expect(renders.first).toBe(before.first + 1)
      expect(renders.other).toBe(before.other)
      expect(renders.list).toBe(before.list)
      expect(renders.status).toBe(before.status)
      expect(host.textContent).toContain('Localized edit')
      reads.mockClear()
      await act(async () => {
        app.controller.selectItem(first)
        app.controller.status({
          tone: 'error',
          message: 'unsaved changes - 測試錯誤'
        })
      })
      expect(reads).not.toHaveBeenCalled()
      expect(fullReads).not.toHaveBeenCalled()
      expect(renders.other).toBe(before.other)
      expect(renders.list).toBe(before.list)
      expect(host.textContent).toContain('Localized edit:true')
      await act(async () => {
        await app.historyApis.undo()
        await settle()
      })
      expect(host.textContent).toContain('Item 0:true')
      await act(async () => {
        await app.historyApis.redo()
        await settle()
      })
      expect(host.textContent).toContain('Localized edit:true')
      await app.storageApis.save()
      await act(async () => {
        app.itemActions.editItem(first, { title: 'Transient' })
        await settle()
        await app.storageApis.reload()
      })
      expect(host.textContent).toContain('Localized edit:true')
      releaseFirst()
      releaseOther()
      releaseList()
      await act(async () => {
        root.unmount()
      })
      const stale = vi.fn()
      app.projection.subscribeItem(first, stale)
      await app.dispose()
      await settle()
      expect(stale).not.toHaveBeenCalled()
      expect(app.projection.lateRefreshCount).toBe(0)
      reads.mockRestore()
      fullReads.mockRestore()
    } finally {
      await app.dispose()
      host.remove()
    }
  })

  it('keeps canonical redo after invalid/no-op edits, and branches after a localized successful edit', async () => {
    const app = initApp({ storage: memoryStorage() })
    try {
      await app.start(document.createElement('div'))
      const id = app.itemActions.addItem({ title: 'Original' })
      await settle()
      app.itemActions.editItem(id, { title: 'Second' })
      await settle()
      await app.controller.undo()
      await settle()
      expect(app.controller.editItem(id, { title: '' }, '已更新')).toBe(false)
      expect(app.core.getUIProperty(UIProperties.status)).toMatchObject({
        tone: 'error'
      })
      app.itemActions.editItem(id, {})
      await app.controller.redo()
      await settle()
      expect(app.projection.getItem(id)?.title).toBe('Second')
      await app.controller.undo()
      await settle()
      expect(app.controller.editItem(id, { title: '第三版' }, '已更新')).toBe(
        true
      )
      await settle()
      expect(app.core.getUIProperty(UIProperties.status)).toEqual({
        tone: 'ok',
        message: '已更新'
      })
      await app.controller.redo()
      await settle()
      expect(app.projection.getItem(id)?.title).toBe('第三版')
    } finally {
      await app.dispose()
    }
  })

  it('replaces removed Items and selection after accepted reload; rejects invalid data without notification', async () => {
    const storage = memoryStorage()
    const app = initApp({ storage })
    try {
      await app.start(document.createElement('div'))
      await app.storageApis.save()
      const id = app.itemActions.addItem({ title: 'Temporary' })
      await settle()
      app.controller.selectItem(id)
      const changed = vi.fn()
      app.projection.subscribeItem(id, changed)
      await app.storageApis.reload()
      expect(app.projection.getItem(id)).toBeUndefined()
      expect(app.core.getUIProperty(UIProperties.selectedId)).toBeNull()
      expect(changed).toHaveBeenCalledOnce()
      changed.mockClear()
      storage.setItem(
        STARTER_STORAGE_SLOT,
        JSON.stringify({
          ...createStarterDocumentWrapper(await app.core.save()),
          appDocumentVersion: 'invalid'
        })
      )
      expect((await app.storageApis.reload()).ok).toBe(false)
      expect(changed).not.toHaveBeenCalled()
    } finally {
      await app.dispose()
    }
  })

  it('suppresses late storage completion and starts the next App with fresh UI state', async () => {
    const app = initApp({ storage: memoryStorage() })
    await app.start(document.createElement('div'))
    let resolveSave: (value: { ok: true; message: string }) => void = () =>
      undefined
    app.storageApis.save = () =>
      new Promise((resolve) => {
        resolveSave = resolve
      })
    const saving = app.controller.save()
    expect(app.core.getUIProperty(UIProperties.pending)).toBe(true)
    await app.dispose()
    const next = initApp({ storage: memoryStorage() })
    try {
      await next.start(document.createElement('div'))
      resolveSave({ ok: true, message: 'Old lifetime completion' })
      await saving
      expect(next.core.getUIProperty(UIProperties.status)).toEqual({
        tone: 'ok',
        message: 'Ready'
      })
      expect(next.core.getUIProperty(UIProperties.pending)).toBe(false)
      expect(next.core.getUIProperty(UIProperties.itemIds)).toEqual([])
    } finally {
      await next.dispose()
    }
  })
})
