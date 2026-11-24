import { createDesign } from './index.js'

export const designTag = 'asyra-design'

if (globalThis.customElements && !globalThis.customElements.get(designTag)) {
  // A standalone editor may be nested in framework mount elements. Leave
  // document margins alone when any branch has sibling content.
  const content = ':not(script, style, link, template, noscript, [hidden])'
  const pageDefaults = globalThis.document.createElement('style')

  pageDefaults.textContent = `@layer {
    :where(body:has(${designTag}):not(:has(${content} ~ ${content}))) { margin: 0; }
  }`
  globalThis.document.head.prepend(pageDefaults)

  class DesignElement extends globalThis.HTMLElement {
    #host

    #options

    #editor

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

    // React and Vue assign object-valued properties before connection.
    get options() {
      return this.#options
    }

    set options(value) {
      this.#options = value
    }

    get editor() {
      return this.#editor
    }

    connectedCallback() {
      this.#schedule()
    }

    disconnectedCallback() {
      this.#schedule()
    }

    #schedule() {
      this.#work = this.#work
        .then(async () => {
          if (!this.isConnected) {
            const editor = this.#editor

            this.#editor = undefined
            await editor?.destroy()
          } else if (!this.#editor) {
            this.#editor = await createDesign(this.#host, this.options)
            if (this.isConnected) {
              this.dispatchEvent(
                new globalThis.CustomEvent('design-ready', {
                  detail: this.#editor
                })
              )
            }
          }
        })
        .catch((error) => globalThis.reportError(error))
    }
  }
  globalThis.customElements.define(designTag, DesignElement)
}
