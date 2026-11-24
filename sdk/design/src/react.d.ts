import type { DetailedHTMLProps, HTMLAttributes } from 'react'
import type { DesignElement } from './element.js'

export { designTag as AsyraDesign } from './element.js'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'asyra-design': DetailedHTMLProps<
        HTMLAttributes<DesignElement>,
        DesignElement
      > &
        Pick<DesignElement, 'options'>
    }
  }
}
