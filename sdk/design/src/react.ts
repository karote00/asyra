import {
  createElement,
  useLayoutEffect,
  useRef,
  type DetailedHTMLProps,
  type HTMLAttributes
} from 'react'
import type { DesignEditor, WorkspaceOptions } from './index.js'
import { designTag, type DesignElement } from './element.js'

type HostProps = DetailedHTMLProps<HTMLAttributes<DesignElement>, DesignElement>

type BoardProps<Id extends string> = HostProps &
  Pick<
    WorkspaceOptions<NoInfer<Id>>,
    | 'storageKey'
    | 'hideUI'
    | 'disabledFeatures'
    | 'uiTargets'
    | 'panels'
    | 'toolbar'
  > & {
    options?: WorkspaceOptions<Id>
    onMount?: (editor: DesignEditor<NoInfer<Id>>) => void
  }

declare module 'react' {
  // React exposes intrinsic tag types through its JSX namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'asyra-design': HostProps & { options?: WorkspaceOptions<string> }
    }
  }
}

/** Direct board settings override the corresponding options. */
export function AsyraDesign<const Id extends string = never>({
  onMount,
  options,
  storageKey = options?.storageKey,
  hideUI = options?.hideUI,
  disabledFeatures = options?.disabledFeatures,
  uiTargets = options?.uiTargets,
  panels = options?.panels,
  toolbar = options?.toolbar,
  ...props
}: BoardProps<Id>) {
  return createElement(designTag, {
    ...props,
    options: {
      ...options,
      storageKey,
      hideUI,
      disabledFeatures,
      uiTargets,
      panels,
      toolbar
    },
    'ondesign-ready':
      onMount &&
      ((event: CustomEvent<DesignEditor<Id>>) => onMount(event.detail))
  })
}

/** Place a live editor component here for the lifetime of this React host. */
export function DesignUI({
  component
}: {
  component: import('./editor-types.js').ComponentHandle
}) {
  const host = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (host.current) {
      return component.mount(host.current)
    }
  }, [component])

  return createElement('div', { ref: host, style: { display: 'contents' } })
}
