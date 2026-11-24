import type { createDesign, WorkspaceOptions } from './index.js'

export declare const designTag: 'asyra-design'

export interface DesignElement extends HTMLElement {
  options?: WorkspaceOptions<string>
  readonly editor: Awaited<ReturnType<typeof createDesign<string>>> | undefined
}

declare global {
  interface HTMLElementTagNameMap {
    'asyra-design': DesignElement
  }
}
