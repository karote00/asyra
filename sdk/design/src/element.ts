import { mountWorkspace } from './workspace.js'
import type { DesignEditor, WorkspaceTool, WorkspaceOptions } from './index.js'

export const designTag = 'asyra-design'

export interface DesignElement extends HTMLElement {
  options?: WorkspaceOptions<string>
  readonly editor: DesignEditor<string, WorkspaceTool> | undefined
}

declare global {
  interface HTMLElementTagNameMap {
    'asyra-design': DesignElement
  }
}

function presentationChanged(
  a?: WorkspaceOptions<string>,
  b?: WorkspaceOptions<string>
) {
  return (
    a?.hideUI !== b?.hideUI ||
    a?.panels !== b?.panels ||
    a?.toolbar !== b?.toolbar
  )
}

if (globalThis.customElements && !globalThis.customElements.get(designTag)) {
  // A standalone editor may be nested in framework mount elements. Leave
  // document margins alone when any branch has sibling content.
  const content = ':not(script, style, link, template, noscript, [hidden])'
  const pageDefaults = globalThis.document.createElement('style')

  pageDefaults.textContent = `@layer {
    :where(body:has(${designTag}):not(:has(${content} ~ ${content}))) { margin: 0; }
  }`
  globalThis.document.head.prepend(pageDefaults)

  class DesignHost extends globalThis.HTMLElement implements DesignElement {
    #host: HTMLDivElement

    #options?: WorkspaceOptions<string>

    #editor?: DesignElement['editor']

    #startup?: AbortController

    #work = Promise.resolve()

    constructor() {
      super()
      const root = this.attachShadow({ mode: 'open' })
      const css = this.ownerDocument.createElement('style')

      css.textContent = `
        :host {
          display: block;
          position: relative;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          contain: size;
          contain-intrinsic-size: 0 100vh;
          contain-intrinsic-size: 0 100dvh;
        }
        :host([hidden]) { display: none; }
      `
      this.#host = this.ownerDocument.createElement('div')
      // Percentage height in an auto-height layout is intrinsic. Inset the
      // drawing area against the resulting box after that size is resolved.
      this.#host.style.cssText =
        'position: absolute; inset: 0; overflow: hidden;'
      root.append(css, this.#host)
    }

    // Hosts can assign object-valued properties before connection.
    get options() {
      return this.#options
    }

    set options(value: WorkspaceOptions<string> | undefined) {
      const previous = this.#options

      this.#options = value
      const room = previous?.collaboration
      const nextRoom = value?.collaboration

      if (
        previous?.document !== value?.document ||
        previous?.storageKey !== value?.storageKey ||
        room?.fileId !== nextRoom?.fileId ||
        room?.endpoint !== nextRoom?.endpoint ||
        room?.actorId !== nextRoom?.actorId
      ) {
        this.#startup?.abort()
        const closing = this.#release()

        if (closing) {
          this.#work = this.#work.then(() => closing)
        }
      }

      if (!this.#editor && this.isConnected) {
        this.#schedule()

        return
      }

      if (this.#editor && presentationChanged(previous, value)) {
        this.#editor.setPresentation(value ?? {})
      }

      if (this.#editor && previous?.uiTargets !== value?.uiTargets) {
        this.#editor.toolGroups.setTargets(value?.uiTargets ?? {})
      }

      if (
        this.#editor &&
        previous?.disabledFeatures !== value?.disabledFeatures
      ) {
        this.#editor
          .setDisabledFeatures(value?.disabledFeatures ?? [])
          .catch((error) => globalThis.reportError(error))
      }
    }

    get editor() {
      return this.#editor
    }

    connectedCallback() {
      this.#schedule()
    }

    connectedMoveCallback() {
      // The browser preserved the editor document and live session.
    }

    disconnectedCallback() {
      if (!this.isConnected) {
        this.#startup?.abort()
      }

      this.#schedule()
    }

    #release() {
      const editor = this.#editor

      if (editor) {
        this.#editor = undefined
        this.dispatchEvent(new globalThis.Event('design-release'))

        return editor.destroy()
      }
    }

    #schedule() {
      this.#work = this.#work
        .then(() => this.#syncConnection())
        .catch((error) => globalThis.reportError(error))
    }

    async #syncConnection() {
      if (!this.isConnected) {
        await this.#release()

        return
      }

      if (this.#editor) {
        return
      }

      const startup = new globalThis.AbortController()
      const initial = this.options ?? {}

      this.#startup = startup
      try {
        const editor = await mountWorkspace(this.#host, initial, startup.signal)

        try {
          let applied = initial.disabledFeatures

          while (applied !== this.options?.disabledFeatures) {
            applied = this.options?.disabledFeatures
            await editor.setDisabledFeatures(applied ?? [])
            startup.signal.throwIfAborted()
          }

          if (presentationChanged(initial, this.options)) {
            editor.setPresentation(this.options ?? {})
          }

          if (initial.uiTargets !== this.options?.uiTargets) {
            editor.toolGroups.setTargets(this.options?.uiTargets ?? {})
          }

          startup.signal.throwIfAborted()
        } catch (error) {
          await editor.destroy()
          throw error
        }

        this.#editor = editor
        this.dispatchEvent(
          new globalThis.CustomEvent('design-ready', { detail: editor })
        )
      } catch (error) {
        if (!startup.signal.aborted) {
          throw error
        }
      } finally {
        this.#startup = undefined
      }
    }
  }
  globalThis.customElements.define(designTag, DesignHost)
}
