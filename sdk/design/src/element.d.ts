import type { createDesign, DesignOptions } from './index.js'

export declare const designTag: 'asyra-design'

export interface DesignElement extends HTMLElement {
  options?: DesignOptions<string>
  readonly editor: Awaited<ReturnType<typeof createDesign<string>>> | undefined
}

declare global {
  interface HTMLElementTagNameMap {
    'asyra-design': DesignElement
  }
}
