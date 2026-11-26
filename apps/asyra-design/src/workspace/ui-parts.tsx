import {
  createContext,
  useCallback,
  Fragment,
  useContext,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'
import {
  workspaceParts,
  type WorkspacePartId,
  type WorkspaceChild,
  type WorkspacePartGroup,
  type WorkspaceLayout,
  type HostUIItem
} from './component-registry'

export const WorkspaceLayoutContext = createContext<
  WorkspaceLayout | undefined
>(undefined)

function CustomItem({ item }: { item: HostUIItem }) {
  const host = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const element = host.current

    if (!element) {
      return
    }

    const cleanup = item.mount(element)

    return () => {
      cleanup?.()
      element.replaceChildren()
    }
  }, [item])

  return (
    <span
      ref={host}
      data-template-item={item.id}
      style={{ display: 'contents' }}
    />
  )
}

export function useLayoutPart(id: WorkspacePartId) {
  const layout = useContext(WorkspaceLayoutContext)

  useSyncExternalStore(
    useCallback(
      (fn: () => void) => layout?.subscribe(id, fn) ?? (() => undefined),
      [id, layout]
    ),
    () => layout?.revision(id) ?? 0,
    () => 0
  )

  return layout
}

// A hidden ancestor is rendered offscreen only while a descendant requests a
// placement. Selection and feature conditions still belong to the component.
export function UIPart({
  id,
  children,
  hidden = false
}: {
  id: WorkspacePartId
  children: ReactNode
  hidden?: boolean
}) {
  const layout = useLayoutPart(id)
  const parking = useRef<HTMLDivElement | null>(null)

  if (!layout) {
    return hidden ? null : <>{children}</>
  }

  const target = layout.target(id)

  if (hidden && !target && !layout.requested(id)) {
    return null
  }

  if (children == null || children === false) {
    return null
  }

  const content = (
    <div data-component={id} style={{ display: 'contents' }}>
      {children}
    </div>
  )

  if (target) {
    return createPortal(content, target)
  }

  if (hidden) {
    parking.current ??= document.createElement('div')

    return createPortal(content, parking.current)
  }

  return content
}

export function UIItems<G extends WorkspacePartGroup>({
  id,
  parts,
  hidden = []
}: {
  id: G
  parts: Record<WorkspaceChild<G>, ReactNode>
  hidden?: readonly WorkspaceChild<G>[]
}) {
  const layout = useLayoutPart(id)
  const native = (
    id === 'toolbarActions' ? Object.keys(parts) : workspaceParts[id]
  ) as readonly WorkspaceChild<G>[]
  const order: readonly (string | HostUIItem)[] = layout?.order(id) ?? native
  // Retain an explicitly mounted child even after its home is removed.
  const mounted = layout
    ? native.filter(
        (key) =>
          !order.includes(key) && layout.requested(key as WorkspacePartId)
      )
    : []

  return (
    <>
      {[...order, ...mounted].map((item) => {
        if (typeof item !== 'string') {
          return <CustomItem key={item.id} item={item} />
        }

        const key = item as WorkspaceChild<G>
        const content = parts[key]

        if (!layout) {
          return hidden.includes(key) ? null : (
            <Fragment key={item}>{content}</Fragment>
          )
        }

        return (
          <UIPart
            key={item}
            id={key as WorkspacePartId}
            hidden={hidden.includes(key) || mounted.includes(key)}
          >
            {content}
          </UIPart>
        )
      })}
    </>
  )
}

export function renderColorControls({
  saturation,
  sliders,
  channels
}: {
  saturation: ReactNode
  sliders: ReactNode
  channels: ReactNode
}) {
  return (
    <UIPart id="colorControls">
      <UIItems
        id="colorControls"
        parts={{
          colorSaturation: saturation,
          colorSliders: sliders,
          colorChannels: channels
        }}
      />
    </UIPart>
  )
}
