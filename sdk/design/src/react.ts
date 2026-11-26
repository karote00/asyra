import {
  createElement,
  type DetailedHTMLProps,
  type HTMLAttributes
} from 'react'
import type { WorkspaceOptions } from './index.js'
import type { DesignElement } from './element.js'

import { designTag } from './element.js'

type DesignElementProps = DetailedHTMLProps<
  HTMLAttributes<DesignElement>,
  DesignElement
> & {
  options?:
    | WorkspaceOptions
    | (WorkspaceOptions<string> &
        (
          | { extensions: NonNullable<WorkspaceOptions<string>['extensions']> }
          | { ui: NonNullable<WorkspaceOptions<string>['ui']> }
          | { actions: NonNullable<WorkspaceOptions<string>['actions']> }
        ))
}

declare module 'react' {
  // React exposes intrinsic tag types through its JSX namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'asyra-design': DesignElementProps
    }
  }
}

type MountedEditor = NonNullable<DesignElement['editor']>

/** Called once for each ready editor, including the successor after changing boards. */
export function AsyraDesign({
  onMount,
  storageKey,
  options,
  ...props
}: DesignElementProps & {
  /** Automatically save and restore this board in the browser. */
  storageKey?: string
  onMount?: (editor: MountedEditor) => void
}) {
  return createElement(designTag, {
    ...props,
    options: storageKey === undefined ? options : { ...options, storageKey },
    'ondesign-ready':
      onMount && ((event: CustomEvent<MountedEditor>) => onMount(event.detail))
  })
}
