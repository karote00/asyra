import { workspaceOnlyTools, workspaceFeatures } from './features.js'
import type { WorkspaceAction } from './features.js'
import { createToolGroups } from './tool-groups.js'
import { createActions } from './actions.js'
import { assets } from './workspace-assets.js'
import type {
  DesignEditor,
  WorkspaceOptions,
  WorkspaceTool,
  WorkspaceTools,
  WorkspaceEditingTools
} from './index.js'
type Editor = DesignEditor<string, WorkspaceTool>
type Commands = Omit<WorkspaceEditingTools, 'observe'>
type Common = WorkspaceTools['common']
type Session = Omit<WorkspaceTools, keyof Commands> & {
  commands: Commands
  ready: Promise<void>
  updateFeatures(ids: readonly string[]): Promise<void>
  destroy(): Promise<void>
}
type Observer = (value: unknown) => void
type RuntimeWindow = Window & {
  workspaceAssets: typeof assets
  DesignWorkspaceRuntime: { mount(options: object): Session }
}

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
const workspaceTools = Object.fromEntries(
  workspaceOnlyTools.map((id) => [
    id,
    {
      label: id[0].toUpperCase() + id.slice(1),

      run: (tools: WorkspaceTools) => tools.setTool(id)
    }
  ])
)
const workspaceActions = {
  group: {
    label: 'Group',

    run(tools: WorkspaceTools) {
      tools.group()
    }
  },
  ungroup: {
    label: 'Ungroup',

    run(tools: WorkspaceTools) {
      tools.ungroup()
    }
  },
  deleteSelectedElement: {
    label: 'Delete selection',

    run: (tools: WorkspaceTools) => tools.deleteSelectedElement()
  },
  zoomFit: {
    label: 'Zoom to fit',

    run: (tools: WorkspaceTools) => tools.zoomFit()
  },
  reset: {
    label: 'Reset document',

    run: (tools: WorkspaceTools) => tools.reset()
  }
} satisfies Record<
  WorkspaceAction,
  { label: string; run(tools: WorkspaceTools): void | Promise<void> }
>

function loadResource(
  element: HTMLElement,
  parent: HTMLElement,
  signal: AbortSignal
) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted()
    signal.addEventListener('abort', () => reject(signal.reason), {
      once: true
    })
    element.onload = () => resolve()
    element.onerror = () =>
      reject(new Error('Unable to load Design workspace asset'))
    parent.append(element)
  })
}

export async function mountWorkspace(
  host: HTMLElement,
  options: WorkspaceOptions<string>,
  signal?: AbortSignal
): Promise<Editor> {
  if (occupied.has(host)) {
    throw new Error('Container already has an active Design editor')
  }

  if (
    options.toolbar !== undefined &&
    options.toolbar !== false &&
    !Array.isArray(options.toolbar)
  ) {
    throw new TypeError('Expected an ordered toolbar list or false')
  }

  const {
    actions,
    disabled,
    runAction,
    validateDisabled,
    isEnabled,
    runtimePolicy,
    features
  } = createActions(
    options,
    workspaceTools,
    workspaceFeatures,
    workspaceActions
  )
  const defaultControls = options.toolbar === undefined
  const ids = defaultControls
    ? [
        'undo',
        'redo',
        ...(options.extensions ?? []).flatMap((extension) =>
          extension.ui?.length ? [] : Object.keys(extension.actions ?? {})
        ),
        ...Object.keys(options.actions ?? {})
      ]
    : (options.toolbar ?? [])
  const controls =
    options.hideUI || ids === false
      ? false
      : ids.map((id) => {
          const action = actions.get(id)

          if (!action) {
            throw new TypeError('Unknown Design action: ' + id)
          }

          return { id, label: action.label }
        })

  const collaboration = options.collaboration && {
    ...options.collaboration,
    actorId: options.collaboration.actorId ?? globalThis.crypto.randomUUID()
  }

  if (
    collaboration &&
    (!collaboration.fileId?.trim() ||
      !['ws:', 'wss:'].includes(
        new globalThis.URL(collaboration.endpoint).protocol
      ) ||
      options.document !== undefined)
  ) {
    throw new TypeError(
      'Collaboration requires a file ID, a WebSocket endpoint and a server-owned document'
    )
  }

  if (!host.isConnected) {
    throw new Error('Attach the Design workspace container before mounting')
  }

  let lifetime = new globalThis.AbortController()

  const stop = () => lifetime.abort()

  signal?.throwIfAborted()
  let frame: HTMLIFrameElement
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
  let changes = Promise.resolve()

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

    reset: () => current().reset(),

    group: () => current().group(),

    ungroup: () => current().ungroup(),

    updateElement: (edit) => current().updateElement(edit),

    getSelection: () => current().getSelection(),

    undo: () => current().undo(),

    redo: () => current().redo(),

    save: () => current().save(),

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

      const apply = async () => {
        const live = current()

        if (
          next.size === disabled.size &&
          [...next].every((id) => disabled.has(id))
        ) {
          return
        }

        await live.updateFeatures(runtimePolicy(next))
        current()
        disabled.clear()
        for (const id of next) {
          disabled.add(id)
        }

        groups.refresh()
        for (const notify of availabilityListeners) {
          notify([...disabled])
        }
      }

      const result = changes.then(apply)

      changes = result.catch(() => undefined)

      return result
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
          await pending?.catch(() => undefined)
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
    const doc = frame.contentDocument

    if (!doc) {
      throw new Error('Design workspace is unavailable')
    }

    const realm = frame.contentWindow as RuntimeWindow

    realm.workspaceAssets = assets
    const stylesheet = doc.createElement('link')

    stylesheet.rel = 'stylesheet'
    const style = Object.entries(assets).find(([name]) => name.endsWith('.css'))

    if (!style) {
      throw new Error('Design workspace stylesheet is unavailable')
    }

    stylesheet.href = style[1]
    const script = doc.createElement('script')

    script.src = assets['workspace.js']
    await Promise.all([
      loadResource(stylesheet, doc.head, lifetime.signal),
      loadResource(script, doc.head, lifetime.signal)
    ])
    lifetime.signal.throwIfAborted()
    session = realm.DesignWorkspaceRuntime.mount({
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
    })

    const abortMount = () => {
      void session?.destroy()
    }

    lifetime.signal.addEventListener('abort', abortMount, { once: true })
    try {
      await session.ready
    } finally {
      lifetime.signal.removeEventListener('abort', abortMount)
    }

    let departingDocument: unknown

    if (!collaboration) {
      realm.addEventListener(
        'pagehide',
        () => {
          if (active && session) {
            departingDocument = session.save()
          }
        },
        { once: true, signal: lifetime.signal }
      )
    }

    frame.addEventListener(
      'load',
      () => {
        // A traditional DOM reparent replaces an iframe document. Reopen the
        // saved document; native state-preserving moves keep the live session.
        if (active && frame.contentDocument && frame.contentDocument !== doc) {
          void reopen(departingDocument).catch((error) =>
            globalThis.reportError(error)
          )
        }
      },
      { signal: lifetime.signal }
    )
  }

  function reopen(documentToRestore?: unknown) {
    if (pending || !active) {
      return pending ?? Promise.resolve()
    }

    pending = (async () => {
      groups.pause()
      detachObservers()
      const previous = current()

      session = undefined
      const data = await documentToRestore

      lifetime.abort()
      await previous.destroy()
      frame.remove()
      if (active) {
        lifetime = new globalThis.AbortController()
        await start(data)
        for (const entry of observations) {
          entry.detach = current().observe(entry.key, entry.listener)
        }

        groups.activate()
      }
    })().finally(() => {
      pending = undefined
    })

    return pending ?? Promise.resolve()
  }

  try {
    await start(options.document)
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
