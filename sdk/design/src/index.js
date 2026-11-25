import { createCanvas } from '@asyra/canvas'
import { createActions } from './actions.js'
import { createToolbar } from './toolbar.js'
import { mountWorkspace } from './workspace.js'
import { createRuntime } from './runtime.js'

export async function attachDesignTools(canvas, options = {}) {
  const policy = createActions({
    disabledFeatures: options.disabledFeatures
  })

  return mountTools(canvas, options, policy)
}

function mountTools(canvas, options, { disabled, validateDisabled }) {
  return canvas.mount(async (target) => {
    const { destroy, updateAvailability, ...tools } =
      await createRuntime().start(target, {
        ...options,
        disabledFeatures: disabled
      })

    return {
      tools: {
        ...tools,

        async setDisabledFeatures(ids) {
          updateAvailability(validateDisabled(ids))
        },

        isFeatureEnabled: (id) => !disabled.has(id)
      },
      destroy
    }
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
    const policy = createActions({
      ...options,
      extensions: []
    })
    const { actions, runAction } = policy
    const session = await mountTools(surface, options, policy)
    const tools = {
      ...session,

      async setDisabledFeatures(ids) {
        await session.setDisabledFeatures(ids)
        toolbar?.update()
      },

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
        [...(options.toolbar ?? actions.keys())],
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
