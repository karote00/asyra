import {
  createElement,
  useLayoutEffect,
  useCallback,
  useContext,
  useRef,
  type DetailedHTMLProps,
  type HTMLAttributes
} from 'react'
import type { DesignEditor, WorkspaceOptions } from './index.js'
import { designTag, type DesignElement } from './element.js'

import { EditorScope } from './react-editor-scope.js'
export { DesignEditorProvider, useDesignEditor } from './react-editor-scope.js'

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
  ref,
  options,
  storageKey = options?.storageKey,
  hideUI = options?.hideUI,
  disabledFeatures = options?.disabledFeatures,
  uiTargets = options?.uiTargets,
  panels = options?.panels,
  toolbar = options?.toolbar,
  ...props
}: BoardProps<Id>) {
  const scope = useContext(EditorScope)
  const bind = useCallback(
    (board: DesignElement | null) => {
      if (!board || !scope) {
        return
      }

      const release = scope.bind(board)

      if (typeof ref === 'function') {
        const cleanup = ref(board)

        return () => {
          release()
          if (cleanup) {
            cleanup()
          } else {
            ref(null)
          }
        }
      }

      if (ref) {
        ref.current = board
      }

      return () => {
        release()
        if (ref) {
          ref.current = null
        }
      }
    },
    [scope, ref]
  )

  return createElement(designTag, {
    ...props,
    ref: scope ? bind : ref,
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
