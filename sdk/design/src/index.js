import { createCanvas } from '@asyra/canvas'
import { createActions } from './actions.js'
import { createToolbar } from './toolbar.js'
import { mountWorkspace } from './workspace.js'
import { createRuntime } from './runtime.js'

export function attachDesignTools(canvas, options = {}) {
  return canvas.mount(async (target) => {
    const { destroy, ...tools } = await createRuntime().start(target, options)

    return { tools, destroy }
  })
}

export async function createDesign(host, options = {}) {
  if (!globalThis.HTMLElement || !(host instanceof globalThis.HTMLElement)) {
    throw new TypeError('Expected an HTML container or canvas from this window')
  }

  if (!(host instanceof globalThis.HTMLCanvasElement)) {
    return mountWorkspace(host, options)
  }

  const surface = createCanvas(host)
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
