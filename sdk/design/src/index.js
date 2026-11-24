import { createCanvas } from '@asyra/canvas'
import { createActions } from './actions.js'
import { createToolbar } from './toolbar.js'
import { mountWorkspace } from './workspace.js'
import { createRuntime } from './runtime.js'

export async function attachDesignTools(canvas, options = {}) {
  const { disabled } = createActions({
    disabledFeatures: options.disabledFeatures
  })

  return mountTools(canvas, options, disabled)
}

function mountTools(canvas, options, disabled) {
  return canvas.mount(async (target) => {
    const { destroy, ...tools } = await createRuntime().start(target, {
      ...options,
      disabledFeatures: disabled
    })

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
    const { actions, disabled, runAction } = createActions({
      ...options,
      extensions: []
    })
    const session = await mountTools(surface, options, disabled)
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

        await runAction(id, tools)
      },

      destroy
    }

    if (!options.hideUI && options.toolbar !== false) {
      toolbar = createToolbar(
        target,
        [...(options.toolbar ?? actions.keys())].filter(
          (id) => !disabled.has(id)
        ),
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
