import { createCanvas } from '@asyra/canvas'
import { createActions } from './actions.js'
import { createToolbar } from './toolbar.js'
import { createRuntime } from './runtime.js'

export function attachDesignTools(canvas, options = {}) {
  return canvas.mount(async (target) => {
    const { destroy, ...tools } = await createRuntime().start(target, options)

    return { tools, destroy }
  })
}

const activeContainers = new WeakSet()

function bindTarget(host) {
  if (!globalThis.HTMLElement || !(host instanceof globalThis.HTMLElement)) {
    throw new TypeError('Expected an HTML container or canvas from this window')
  }

  if (host instanceof globalThis.HTMLCanvasElement) {
    return createCanvas(host)
  }

  if (activeContainers.has(host)) {
    throw new Error('Container already has an active Design editor')
  }

  const area = host.ownerDocument.createElement('div')
  const canvas = host.ownerDocument.createElement('canvas')

  area.style.cssText =
    'display:flex;flex-direction:column;width:100%;height:100%;min-width:0;min-height:0;'
  canvas.style.cssText =
    'display:block;flex:1 1 auto;width:100%;height:150px;min-height:0;min-width:0;'
  area.append(canvas)
  const surface = createCanvas(canvas)

  host.append(area)
  activeContainers.add(host)

  let closing

  return {
    ...surface,

    destroy() {
      closing ??= surface.destroy().finally(() => {
        area.remove()
        activeContainers.delete(host)
      })

      return closing
    }
  }
}

export async function createDesign(host, options = {}) {
  const surface = bindTarget(host)
  const target = surface.target
  const listeners = new globalThis.AbortController()
  let toolbar
  let addedTabIndex = false

  function destroy() {
    listeners.abort()
    toolbar?.remove()
    if (addedTabIndex && target.getAttribute('tabindex') === '0') {
      target.removeAttribute('tabindex')
    }

    addedTabIndex = false

    return surface.destroy()
  }

  try {
    const actions = createActions(options.actions)
    const session = await attachDesignTools(surface, options)
    const tools = {
      ...session,

      setTool(tool) {
        session.setTool(tool)
        toolbar?.update()
      }
    }

    const editor = {
      ...tools,

      async runAction(id) {
        if (listeners.signal.aborted) {
          throw new Error('Design editor is disposed')
        }

        const action = actions.get(id)

        if (!action) {
          throw new TypeError('Unknown Design action: ' + id)
        }

        await action.run(tools)
      },

      destroy
    }

    if (options.toolbar !== false) {
      toolbar = createToolbar(
        target,
        options.toolbar ?? actions.keys(),
        actions,
        editor,
        listeners.signal
      )
    }

    if (!target.hasAttribute('tabindex')) {
      target.tabIndex = 0
      addedTabIndex = true
    }

    return editor
  } catch (error) {
    await destroy()
    throw error
  }
}
