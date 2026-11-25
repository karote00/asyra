import { createToolGroups } from './tool-groups.js'
import { createActions } from './actions.js'
import { assets } from './workspace-assets.js'

const occupied = new WeakSet()
const workspaceTools = Object.fromEntries(
  ['oval', 'pen', 'text'].map((id) => [
    id,
    {
      label: id[0].toUpperCase() + id.slice(1),

      run: (tools) => tools.setTool(id)
    }
  ])
)
const workspaceActions = Object.fromEntries(
  Object.entries({
    group: 'Group',
    ungroup: 'Ungroup',
    deleteSelectedElement: 'Delete selection',
    zoomFit: 'Zoom to fit',
    reset: 'Reset document'
  }).map(([id, label]) => [
    id,
    {
      label,

      run: (tools) => tools[id]()
    }
  ])
)

function loadResource(element, parent, signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted()
    signal.addEventListener('abort', () => reject(signal.reason), {
      once: true
    })
    element.onload = resolve
    element.onerror = () =>
      reject(new Error('Unable to load Design workspace asset'))
    parent.append(element)
  })
}

export async function mountWorkspace(host, options, signal) {
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
    runtimePolicy
  } = createActions(
    options,
    workspaceTools,
    [
      'moveElements',
      'hoverElement',
      'moveLayerHierarchy',
      'pan',
      'zoom',
      'geometry',
      'fills',
      'strokes',
      'lock',
      'visibility',
      'rename'
    ],
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
    : options.toolbar
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
  let frame
  let session
  let closing
  let active = true
  let pending
  const observations = new Set()
  const availabilityListeners = new Set()
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

  const editor = {
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

    observe(key, listener) {
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
  }

  const groups = createToolGroups(options.extensions ?? [], options, editor)

  editor.toolGroups = groups.api
  occupied.add(host)
  signal?.addEventListener('abort', stop, { once: true })

  async function start(documentData) {
    frame = host.ownerDocument.createElement('iframe')
    frame.title = 'Design editor'
    frame.style.cssText = 'display:block;border:0;width:100%;height:100%;'
    host.append(frame)
    const doc = frame.contentDocument

    frame.contentWindow.workspaceAssets = assets
    const stylesheet = doc.createElement('link')

    stylesheet.rel = 'stylesheet'
    stylesheet.href = Object.entries(assets).find(([name]) =>
      name.endsWith('.css')
    )[1]
    const script = doc.createElement('script')

    script.src = assets['workspace.js']
    await Promise.all([
      loadResource(stylesheet, doc.head, lifetime.signal),
      loadResource(script, doc.head, lifetime.signal)
    ])
    lifetime.signal.throwIfAborted()
    session = frame.contentWindow.DesignWorkspaceRuntime.mount({
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

                run: () => editor.runAction(id)
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

    let departingDocument

    if (!collaboration) {
      frame.contentWindow.addEventListener(
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

  function reopen(documentToRestore) {
    if (pending || !active) {
      return pending
    }

    pending = (async () => {
      groups.pause()
      detachObservers()
      const previous = session

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

    return pending
  }

  try {
    await start(options.document)
    // Bind to the current session on each call, including after reset or DOM reparenting.
    for (const name of Object.keys(session.commands)) {
      editor[name] = (...args) => current().commands[name](...args)
    }

    editor.common = Object.freeze(
      Object.fromEntries(
        Object.entries(session.common).map(([group, methods]) => [
          group,
          Object.freeze(
            Object.fromEntries(
              Object.keys(methods).map((name) => [
                name,
                (...args) => current().common[group][name](...args)
              ])
            )
          )
        ])
      )
    )

    groups.activate()

    return editor
  } catch (error) {
    await editor.destroy()
    throw error
  }
}
