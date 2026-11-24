import { createDesign } from './index.js'

export const designTag = 'asyra-design'

if (globalThis.customElements && !globalThis.customElements.get(designTag)) {
  class DesignElement extends globalThis.HTMLElement {
    #host

    #options

    #editor

    #work = Promise.resolve()

    constructor() {
      super()
      const root = this.attachShadow({ mode: 'open' })
      const css = this.ownerDocument.createElement('style')

      css.textContent =
        ':host{display:block;height:480px}:host([hidden]){display:none}'
      this.#host = this.ownerDocument.createElement('div')
      this.#host.style.height = '100%'
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
