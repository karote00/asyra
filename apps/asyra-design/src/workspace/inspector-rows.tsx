import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type {
  InspectorRefs,
  InspectorRowId
} from '../properties/inspector-contract'
import { dimensionRow, inspectorRows } from '../properties/inspector-registry'
import { InspectorTemplateRow } from '../properties/inspector-template'
import { useElementSelection } from '../providers'
import { supportsSizeEdits } from '../common-apis/element/geometry-policy'
import core from '../contexts'

function InspectorControls({
  id,
  enabled
}: {
  id: InspectorRowId
  enabled: boolean
}) {
  const selected = useElementSelection()
  const dimension = id === dimensionRow.id
  const sizeUnavailable =
    dimension &&
    [...selected].some(
      (elementId) =>
        !supportsSizeEdits(core.getElementMetadata(elementId)?.type)
    )
  const editable = enabled && selected.size > 0 && !sizeUnavailable

  return (
    <fieldset
      aria-label={inspectorRows[id].label}
      disabled={!editable}
      style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
    >
      <InspectorTemplateRow id={id} markedByHost />
      {sizeUnavailable && (
        <p>Size editing is unavailable for this selection.</p>
      )}
    </fieldset>
  )
}

function createSurface() {
  const node = document.createElement('div')
  const listeners = new Set<() => void>()

  return {
    node,

    attached: () => node.parentNode !== null,

    subscribe(listener: () => void) {
      listeners.add(listener)

      return () => listeners.delete(listener)
    },

    notify() {
      for (const listener of listeners) {
        listener()
      }
    }
  }
}

function RowPortal({
  surface,
  id,
  enabled
}: {
  surface: ReturnType<typeof createSurface>
  id: InspectorRowId
  enabled: boolean
}) {
  const attached = useSyncExternalStore(surface.subscribe, surface.attached)

  return attached
    ? createPortal(
        <InspectorControls id={id} enabled={enabled} />,
        surface.node
      )
    : null
}

// Each installed row keeps one portal target for the workspace lifetime.
// Moving that node preserves the React controls and their property subscriptions.
export function createInspectorRows(refs: InspectorRefs) {
  const surfaces = new Map<InspectorRowId, ReturnType<typeof createSurface>>()

  for (const id of Object.keys(refs) as InspectorRowId[]) {
    surfaces.set(id, createSurface())
  }

  return {
    render(disabled: readonly string[]) {
      return [...surfaces].map(([id, surface]) => (
        <RowPortal
          key={id}
          id={id}
          surface={surface}
          enabled={!disabled.includes('geometry') && !disabled.includes(id)}
        />
      ))
    },

    mount(id: InspectorRowId, container: HTMLElement) {
      const surface = surfaces.get(id)

      if (!surface) {
        throw new Error('Unknown inspector row: ' + id)
      }

      if (container.ownerDocument !== document) {
        const shadow = container.attachShadow({ mode: 'open' })
        const stylesheet = document.querySelector<HTMLLinkElement>(
          'link[rel="stylesheet"]'
        )

        if (stylesheet) {
          shadow.append(stylesheet.cloneNode())
        }

        surface.node.style.cssText =
          'display:block;width:14rem;max-width:100%;background:#252525;color:white'
        shadow.append(surface.node)
      } else {
        surface.node.style.cssText = ''
        container.append(surface.node)
      }

      surface.notify()

      return () => {
        surface.node.remove()
        surface.notify()
      }
    }
  }
}
