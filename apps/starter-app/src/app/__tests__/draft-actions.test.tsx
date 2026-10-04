import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { initApp } from '../../init/init-app.js'
import { AppContext } from '../../contexts/app.js'
import { AppView } from '../index.js'
import { UIProperties } from '../../config/ui-properties.js'

;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

async function fixture() {
  const values = new Map<string, string>()
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value)
    })
  }
  const app = initApp({ storage })
  await app.start(document.createElement('div'))
  const first = app.itemActions.addItem({ title: 'First' })
  const second = app.itemActions.addItem({ title: 'Second' })
  await settle()
  app.controller.selectItem(first)
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => {
    root.render(
      <AppContext.Provider value={app}>
        <AppView />
      </AppContext.Provider>
    )
  })
  const input = () =>
    host.querySelector<HTMLInputElement>(
      '[aria-label="Title"]'
    ) as HTMLInputElement
  const type = async (value: string) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )?.set?.call(input(), value)
      input().dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
  return {
    app,
    storage,
    host,
    first,
    second,
    input,
    type,
    async close() {
      await act(async () => {
        root.unmount()
        await app.dispose()
      })
      host.remove()
    }
  }
}

describe('draft admission before product actions', () => {
  it.each([
    { key: 'Enter', isComposing: true, keyCode: 13 },
    { key: 'Escape', isComposing: true, keyCode: 27 },
    { key: 'Enter', isComposing: false, keyCode: 229 },
    { key: 'Escape', isComposing: false, keyCode: 229 }
  ])(
    'preserves composing text for $key ($isComposing, $keyCode)',
    async (event) => {
      const f = await fixture()
      const reads = vi.spyOn(f.app.core, 'getElementData')
      const fullReads = vi.spyOn(f.app.core, 'getAllElementData')
      const changed = vi.fn()
      const unsubscribe = f.app.projection.subscribeChanges(changed)
      try {
        const depth = f.app.core.getUndoHistoryDepth()
        await f.type('輸入中的草稿')
        await act(async () => {
          f.input().dispatchEvent(
            new KeyboardEvent('keydown', { ...event, bubbles: true })
          )
          await settle()
        })
        expect(f.input().value).toBe('輸入中的草稿')
        expect(f.app.core.getUndoHistoryDepth()).toBe(depth)
        expect(f.app.projection.getItem(f.first)?.title).toBe('First')
        expect(reads).not.toHaveBeenCalled()
        expect(fullReads).not.toHaveBeenCalled()
        expect(changed).not.toHaveBeenCalled()
        await act(async () => {
          f.input().dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
          )
          await settle()
        })
        expect(f.app.projection.getItem(f.first)?.title).toBe('輸入中的草稿')
        expect(f.app.core.getUndoHistoryDepth()).toBe(depth + 1)
        await f.type('Another draft')
        await act(async () => {
          f.input().dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
          )
        })
        expect(f.input().value).toBe('輸入中的草稿')
        expect(f.app.core.getUndoHistoryDepth()).toBe(depth + 1)
      } finally {
        unsubscribe()
        reads.mockRestore()
        fullReads.mockRestore()
        await f.close()
      }
    }
  )

  it('reports accepted edits as operations, including no-ops after Save', async () => {
    const f = await fixture()
    try {
      await act(async () => {
        await f.app.controller.save()
      })
      await f.type('Temporary draft')
      await f.type('First')
      await act(async () => {
        f.app.controller.prepareAction()
      })
      expect(f.app.core.getUIProperty(UIProperties.status)).toEqual({
        tone: 'ok',
        message: 'Title accepted'
      })
      expect(
        f.host.querySelector('[role="status"]')?.getAttribute('aria-label')
      ).toBe('Last operation')
      expect(f.host.querySelector('[role="status"]')?.className).toBe(
        'operation-feedback ok'
      )
      await f.type('Changed')
      await act(async () => {
        f.app.controller.prepareAction()
        await settle()
      })
      expect(f.host.querySelector('[role="status"]')?.textContent).toBe(
        'Title accepted'
      )
      await act(async () => {
        await f.app.controller.undo()
        await settle()
      })
      expect(f.input().value).toBe('First')
      expect(f.host.querySelector('[role="status"]')?.textContent).toBe(
        'Undo requested'
      )
      await act(async () => {
        await f.app.controller.redo()
        await settle()
      })
      expect(f.input().value).toBe('Changed')
      expect(f.host.querySelector('[role="status"]')?.textContent).toBe(
        'Redo requested'
      )
    } finally {
      await f.close()
    }
  })

  it('preserves a rejected draft and blocks Save, selection, creation, history, reload and movement', async () => {
    const f = await fixture()
    try {
      await f.type('   ')
      const depth = f.app.core.getUndoHistoryDepth()
      await act(async () => {
        await f.app.controller.save()
      })
      expect(f.storage.setItem).not.toHaveBeenCalled()
      expect(f.input().value).toBe('   ')
      expect(f.host.querySelector('[role="status"]')?.textContent).toContain(
        'Item title is required'
      )
      await act(async () => {
        f.app.controller.selectItem(f.second)
        f.app.controller.addItem()
        f.app.controller.moveItem(f.second, { x: 60, y: 40 })
        await f.app.controller.undo()
        await f.app.controller.redo()
        await f.app.controller.reload()
        await settle()
      })
      expect(f.app.core.getUIProperty(UIProperties.selectedId)).toBe(f.first)
      expect(f.app.projection.getSnapshot()).toHaveLength(2)
      expect(f.app.core.getUndoHistoryDepth()).toBe(depth)
      expect(f.app.projection.getItem(f.second)?.offset).toBeUndefined()
      expect(f.input().value).toBe('   ')
    } finally {
      await f.close()
    }
  })

  it('saves a corrected focused draft once and supports immediate single-step Undo/Redo', async () => {
    const f = await fixture()
    try {
      await f.type('   ')
      await act(async () => {
        await f.app.controller.save()
      })
      await f.type(' Revised ')
      const depth = f.app.core.getUndoHistoryDepth()
      await act(async () => {
        await f.app.controller.save()
        await settle()
      })
      expect(f.storage.setItem).toHaveBeenCalledTimes(1)
      expect(f.app.core.getUndoHistoryDepth()).toBe(depth + 1)
      expect(f.input().value).toBe('Revised')
      await f.type('Next')
      await act(async () => {
        await f.app.controller.undo()
        await settle()
      })
      expect(f.input().value).toBe('Revised')
      await act(async () => {
        await f.app.controller.redo()
        await settle()
      })
      expect(f.input().value).toBe('Next')
    } finally {
      await f.close()
    }
  })

  it('explicitly cancels invalid input without a history entry before selection', async () => {
    const f = await fixture()
    try {
      await f.type(' ')
      const depth = f.app.core.getUndoHistoryDepth()
      const cancel = [...f.host.querySelectorAll('button')].find(
        (button) => button.textContent === 'Cancel edit'
      )
      expect(cancel).toBeDefined()
      await act(async () => {
        cancel?.click()
        f.app.controller.selectItem(f.second)
      })
      expect(f.app.core.getUndoHistoryDepth()).toBe(depth)
      expect(f.input().value).toBe('Second')
    } finally {
      await f.close()
    }
  })
  it('keeps a draft across unrelated publications and commits only its field', async () => {
    const f = await fixture()
    try {
      await f.type('Draft')
      await act(async () => {
        f.app.itemActions.editItem(f.first, { status: 'done' })
        await settle()
      })
      expect(f.input().value).toBe('Draft')
      await act(async () => {
        f.app.controller.selectItem(f.second)
        await settle()
      })
      expect(f.app.projection.getItem(f.first)?.title).toBe('Draft')
      expect(f.app.projection.getItem(f.first)?.status).toBe('done')
      expect(f.input().value).toBe('Second')
    } finally {
      await f.close()
    }
  })

  it('preserves the accepted title when persistence fails and allows a retry', async () => {
    const f = await fixture()
    try {
      f.storage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage unavailable')
      })
      await f.type('Keep me')
      await act(async () => {
        await f.app.controller.save()
        await settle()
      })
      expect(f.input().value).toBe('Keep me')
      expect(f.app.core.getUIProperty(UIProperties.status)).toMatchObject({
        tone: 'error'
      })
      const depth = f.app.core.getUndoHistoryDepth()
      await act(async () => {
        await f.app.controller.save()
        await settle()
      })
      expect(f.storage.setItem).toHaveBeenCalledTimes(2)
      expect(f.app.core.getUndoHistoryDepth()).toBe(depth)
    } finally {
      await f.close()
    }
  })

  it('does not let retired registrations remove the current participant', async () => {
    const f = await fixture()
    try {
      const old = vi.fn(() => true)
      const current = vi.fn(() => false)
      const retireOld = f.app.controller.registerDraft(old)
      const retireCurrent = f.app.controller.registerDraft(current)
      retireOld()
      expect(f.app.controller.prepareAction()).toBe(false)
      expect(old).not.toHaveBeenCalled()
      expect(current).toHaveBeenCalledTimes(1)
      retireCurrent()
      expect(f.app.controller.prepareAction()).toBe(true)
    } finally {
      await f.close()
    }
    expect(f.app.controller.prepareAction()).toBe(false)
  })
  it('locks editing and action admission for the complete async save lifetime', async () => {
    const f = await fixture()
    const originalSave = f.app.core.save.bind(f.app.core)
    let release: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    f.app.core.save = async () => {
      await gate
      return originalSave()
    }
    try {
      await f.type('Before pending')
      let saving: Promise<void> | undefined
      await act(async () => {
        saving = f.app.controller.save()
      })
      expect(f.input().disabled).toBe(true)
      const depth = f.app.core.getUndoHistoryDepth()
      await act(async () => {
        f.app.controller.selectItem(f.second)
        f.app.controller.addItem()
        await f.app.controller.save()
      })
      expect(f.app.core.getUIProperty(UIProperties.selectedId)).toBe(f.first)
      expect(f.app.core.getUndoHistoryDepth()).toBe(depth)
      await act(async () => {
        release?.()
        await saving
        await settle()
      })
      expect(f.storage.setItem).toHaveBeenCalledTimes(1)
      expect(f.input().disabled).toBe(false)
      expect(f.input().value).toBe('Before pending')
    } finally {
      release?.()
      await f.close()
    }
  })
  it('finishes an admitted creation selection while a subsequent Save is pending', async () => {
    const f = await fixture()
    const originalSave = f.app.core.save.bind(f.app.core)
    let release: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    f.app.core.save = async () => {
      await gate
      return originalSave()
    }
    try {
      let saving: Promise<void> | undefined
      await act(async () => {
        f.app.controller.addItem()
        saving = f.app.controller.save()
        await settle()
      })
      const created = f.app.projection
        .getSnapshot()
        .find((item) => item.title === 'Item 3')
      expect(created).toBeDefined()
      expect(f.app.core.getUIProperty(UIProperties.selectedId)).toBe(
        created?.id
      )
      await act(async () => {
        release?.()
        await saving
      })
    } finally {
      release?.()
      await f.close()
    }
  })
  it('compares a submitted title at the canonical owner before projection publication', async () => {
    const f = await fixture()
    try {
      await f.type('Unfinished')
      await f.type('First')
      await act(async () => {
        f.app.itemActions.editItem(f.first, { title: 'External update' })
        await f.app.controller.save()
        await settle()
      })
      expect(f.input().value).toBe('First')
      expect(f.app.projection.getItem(f.first)?.title).toBe('First')
      expect(f.storage.setItem.mock.calls[0]?.[1]).not.toContain(
        'External update'
      )
    } finally {
      await f.close()
    }
  })
  it('clears rejected feedback when the corrected draft equals the canonical title without history', async () => {
    const f = await fixture()
    try {
      await f.type(' ')
      await act(async () => {
        f.app.controller.prepareAction()
      })
      const depth = f.app.core.getUndoHistoryDepth()
      await f.type('First')
      await act(async () => {
        expect(f.app.controller.prepareAction()).toBe(true)
      })
      expect(f.app.core.getUIProperty(UIProperties.status)).not.toMatchObject({
        tone: 'error'
      })
      expect(f.app.core.getUndoHistoryDepth()).toBe(depth)
    } finally {
      await f.close()
    }
  })
  it('does no canonical reads or unrelated publication while typing and cancelling', async () => {
    const f = await fixture()
    const reads = vi.spyOn(f.app.core, 'getElementData')
    const fullReads = vi.spyOn(f.app.core, 'getAllElementData')
    const notified = vi.fn()
    const unsubscribe = f.app.projection.subscribeItem(f.second, notified)
    try {
      await f.type('A')
      await f.type('A draft')
      await act(async () => {
        f.input().dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        )
      })
      expect(f.input().value).toBe('First')
      expect(reads).not.toHaveBeenCalled()
      expect(fullReads).not.toHaveBeenCalled()
      expect(notified).not.toHaveBeenCalled()
    } finally {
      unsubscribe()
      reads.mockRestore()
      fullReads.mockRestore()
      await f.close()
    }
  })
})
