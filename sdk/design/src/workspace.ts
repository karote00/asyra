import { openLocalDocument } from './local-document.js'
import { resolveWorkspaceOptions } from './workspace-options.js'
import {
  startWorkspaceFrame,
  type Session,
  type Commands
} from './workspace-frame.js'
import { createToolGroups } from './tool-groups.js'
import type {
  DesignEditor,
  WorkspaceOptions,
  WorkspaceTool,
  WorkspaceTools
} from './index.js'
type Editor = DesignEditor<string, WorkspaceTool>
type Common = WorkspaceTools['common']
type Observer = (value: unknown) => void

// Late binding keeps retained methods attached to the current editor session.
function bindMethods<T extends object>(catalog: T, current: () => T): T {
  return Object.fromEntries(
    Object.keys(catalog).map((key) => [
      key,
      (...args: unknown[]) => {
        const owner = current()

        return Reflect.apply(
          owner[key as keyof T] as (...args: unknown[]) => unknown,
          owner,
          args
        )
      }
    ])
  ) as T
}

function bindCommonGroup<K extends keyof Common>(
  key: K,
  current: () => Common
) {
  return [
    key,
    Object.freeze(bindMethods(current()[key], () => current()[key]))
  ] as const
}

const occupied = new WeakSet<HTMLElement>()

export async function mountWorkspace(
  host: HTMLElement,
  options: WorkspaceOptions<string>,
  signal?: AbortSignal
): Promise<Editor> {
  if (occupied.has(host)) {
    throw new Error('Container already has an active Design editor')
  }

  const { policy, controls, defaultControls, collaboration } =
    resolveWorkspaceOptions(options)
  const {
    disabled,
    runAction,
    validateDisabled,
    isEnabled,
    runtimePolicy,
    features
  } = policy

  if (!host.isConnected) {
    throw new Error('Attach the Design workspace container before mounting')
  }

  const { storageKey } = options
  const localDocument = storageKey
    ? openLocalDocument(globalThis.localStorage, storageKey)
    : undefined

  let lifetime = new globalThis.AbortController()

  const stop = () => lifetime.abort()

  signal?.throwIfAborted()
  let frame: HTMLIFrameElement
  let observeKeys: readonly string[]
  let session: Session | undefined
  let closing: Promise<void> | undefined
  let active = true
  let pending: Promise<void> | undefined
  const observations = new Set<{
    key: string
    listener: Observer
    detach?: () => void
  }>()
  const availabilityListeners = new Set<Observer>()
  // Feature changes and frame replacements must see each other's completed session.
  let operations = Promise.resolve()

  function enqueue(operation: () => Promise<void>) {
    const result = operations.then(operation)

    operations = result.catch(() => undefined)

    return result
  }

  function detachObservers() {
    for (const entry of observations) {
      entry.detach?.()
      entry.detach = undefined
    }
  }

  function current() {
    if (!active || !session) {
      throw new Error('Design workspace is unavailable')
    }

    return session
  }

  let editor: Editor
  const base = {
    getTool: () => current().getTool(),

    setTool: (tool) => current().setTool(tool),

    drawRectangle: (rect) => current().drawRectangle(rect),

    drawOval: (rect) => current().drawOval(rect),

    select: (ids) => current().select(ids),

    deleteSelectedElement: () => current().deleteSelectedElement(),

    zoomFit: () => current().zoomFit(),

    async reset() {
      if (!active) {
        throw new Error('Design workspace is unavailable')
      }

      if (!isEnabled('reset')) {
        throw new Error('Disabled Design feature: reset')
      }

      if (pending) {
        return pending
      }

      // Without a session, retry the frame load for the previously admitted reset.
      return session ? session.reset() : reopen()
    },

    group: () => current().group(),

    ungroup: () => current().ungroup(),

    updateElement: (edit) => current().updateElement(edit),

    getSelection: () => current().getSelection(),

    undo: () => current().undo(),

    redo: () => current().redo(),

    save: () => current().save(),

    get observeKeys() {
      current()

      return observeKeys
    },

    observe(key: string, listener: Observer) {
      if (typeof listener !== 'function') {
        throw new TypeError('Expected an observation callback')
      }

      if (key === 'disabledFeatures') {
        current()
        listener([...disabled])
        availabilityListeners.add(listener)

        return () => availabilityListeners.delete(listener)
      }

      const entry = { key, listener, detach: current().observe(key, listener) }

      observations.add(entry)

      return () => {
        entry.detach?.()
        observations.delete(entry)
      }
    },

    get features() {
      return features
    },

    isFeatureEnabled(id) {
      current()

      return isEnabled(id)
    },

    async setDisabledFeatures(ids) {
      const next = validateDisabled(ids)

      return enqueue(async () => {
        const live = current()

        if (
          next.size === disabled.size &&
          [...next].every((id) => disabled.has(id))
        ) {
          return
        }

        const previous = new Set(disabled)

        const apply = async (mask: Set<string>) => {
          await live.updateFeatures(runtimePolicy(mask))
          current()
          disabled.clear()
          for (const id of mask) {
            disabled.add(id)
          }
        }

        await apply(next)
        const listeners = [...availabilityListeners]

        try {
          groups.refresh()
        } catch (error) {
          await apply(previous)
          groups.refresh()
          throw error
        }

        for (const notify of listeners) {
          if (availabilityListeners.has(notify)) {
            try {
              notify([...disabled])
            } catch (error) {
              globalThis.reportError(error)
            }
          }
        }
      })
    },

    async runAction(id) {
      current()
      await runAction(id, editor)
    },

    destroy() {
      groups.destroy()
      availabilityListeners.clear()
      active = false
      detachObservers()
      observations.clear()
      signal?.removeEventListener('abort', stop)
      stop()
      closing ??= (async () => {
        try {
          await operations
          await session?.destroy()
        } finally {
          session = undefined
          frame?.remove()
          occupied.delete(host)
        }
      })()

      return closing
    }
  } satisfies Omit<Editor, keyof Commands | 'toolGroups' | 'common'>

  const groups = createToolGroups(
    options.extensions ?? [],
    options,
    () => editor,
    () => frame
  )

  occupied.add(host)
  signal?.addEventListener('abort', stop, { once: true })

  async function start(documentData: unknown) {
    frame = host.ownerDocument.createElement('iframe')
    frame.title = 'Design editor'
    frame.style.cssText = 'display:block;border:0;width:100%;height:100%;'
    host.append(frame)
    session = await startWorkspaceFrame(
      frame,
      lifetime,
      {
        document: documentData,
        collaboration,
        slots: groups.refs,
        toolbar:
          controls === false
            ? false
            : {
                includeTools: defaultControls,
                actions: controls.map(({ id, label }) => ({
                  id,
                  label,

                  run: () => base.runAction(id)
                }))
              },
        disabledFeatures: runtimePolicy(disabled),
        hideUI: options.hideUI === true,
        panels: options.hideUI
          ? { layers: false, properties: false }
          : options.panels,

        reopen: () => reopen()
      },
      reopen
    )
    localDocument?.bind(session, lifetime.signal)
    observeKeys = Object.freeze([
      ...new Set([...session.observeKeys, 'disabledFeatures'])
    ])
  }

  function reopen(documentToRestore?: unknown) {
    if (pending || !active) {
      return pending ?? Promise.resolve()
    }

    pending = enqueue(async () => {
      if (!active) {
        return
      }

      groups.pause()
      detachObservers()
      const previous = session

      session = undefined
      const data = await documentToRestore

      lifetime.abort()
      await previous?.destroy()
      frame.remove()
      if (active) {
        lifetime = new globalThis.AbortController()
        try {
          await start(data)
          if (documentToRestore === undefined) {
            localDocument?.clear()
          }
        } catch (error) {
          lifetime.abort()
          session = undefined
          frame.remove()
          throw error
        }

        for (const entry of observations) {
          entry.detach = current().observe(entry.key, entry.listener)
        }

        groups.activate()
      }
    }).finally(() => {
      pending = undefined
    })

    return pending ?? Promise.resolve()
  }

  try {
    await start(localDocument ? localDocument.read() : options.document)
    const common = Object.fromEntries(
      (Object.keys(current().common) as (keyof Common)[]).map((key) =>
        bindCommonGroup(key, () => current().common)
      )
    ) as Common

    editor = Object.assign(
      base,
      bindMethods(current().commands, () => current().commands),
      { toolGroups: groups.api, common: Object.freeze(common) }
    )
    groups.activate()

    return editor
  } catch (error) {
    await base.destroy()
    throw error
  }
}
