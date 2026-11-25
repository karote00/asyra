import type { DetailedHTMLProps, HTMLAttributes } from 'react'
import type { DesignElement } from './element.js'

export { designTag as AsyraDesign } from './element.js'

type DesignElementProps = DetailedHTMLProps<
  HTMLAttributes<DesignElement>,
  DesignElement
> &
  Pick<DesignElement, 'options'>

declare module 'react' {
  // React exposes intrinsic tag types through its JSX namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'asyra-design': DesignElementProps
    }
  }
}
