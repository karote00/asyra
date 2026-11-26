import type {
  DesignEditor,
  WorkspaceTool,
  WorkspaceOptions,
  WorkspaceExtension,
  WorkspaceUIGroup,
  InspectorRowId,
  ToolPlacement,
  ToolGroups
} from './index.js'
import { positionRow, dimensionRow } from './inspector-rows.js'

const slots = ['toolbar.top', 'properties.top', 'selectionMenu'] as const
const placements: readonly ToolPlacement[] = [...slots, 'manual']

export function createToolGroups(
  extensions: readonly WorkspaceExtension<string>[],
  options: WorkspaceOptions<string>,
  hostDocument: Document,
  getEditor: () => DesignEditor<string, WorkspaceTool>,
  mountInspectorRow: (id: InspectorRowId, container: HTMLElement) => () => void
) {
  const groups = new Map<string, WorkspaceUIGroup<string>>()
  const inspectorHomes = new Map<string, HTMLElement>()
  const inspectorRefs: Partial<
    Record<InspectorRowId, (element: HTMLElement | null) => void>
  > = {}
  const owners = new Map<string, string>()
  const outlets = new Map<ToolPlacement, HTMLElement>()
  const manual = new Map<string, { container: HTMLElement }>()
  const mounted = new Map<string, { node: HTMLElement; unmount?: () => void }>()
  let ready = false
  let closed = false

  const installed = new Set(
    extensions.flatMap((entry) => entry.ui?.map((group) => group.id) ?? [])
  )
  const implicitRows = [positionRow, dimensionRow].filter(
    (row) => !installed.has(row.id)
  )

  for (const extension of [
    ...extensions,
    { ui: implicitRows, id: undefined }
  ]) {
    for (const group of extension.ui ?? []) {
      if (
        !group.id?.trim() ||
        groups.has(group.id) ||
        !placements.includes(group.placement) ||
        ('kind' in group
          ? group.kind !== 'inspector' ||
            !['positionRow', 'dimensionRow'].includes(group.id)
          : typeof group.mount !== 'function')
      ) {
        throw new TypeError(
          'Expected a unique tool group ID, placement and mount function'
        )
      }

      groups.set(group.id, group)
      if ('kind' in group) {
        inspectorRefs[group.id] = (element) => {
          if (element) {
            inspectorHomes.set(group.id, element)
          } else {
            inspectorHomes.delete(group.id)
          }

          render()
        }
      }

      if (extension.id) {
        owners.set(group.id, extension.id)
      }
    }
  }

  const hostElement = hostDocument.defaultView?.HTMLElement

  function resolveTargets(input: Readonly<Record<string, string>> = {}) {
    const targets = new Map<string, HTMLElement>()

    for (const [id, targetId] of Object.entries(input)) {
      if (!groups.has(id)) {
        throw new TypeError('Unknown UI group in uiTargets: ' + id)
      }

      const target =
        typeof targetId === 'string' && hostDocument.getElementById(targetId)

      if (!hostElement || !(target instanceof hostElement)) {
        throw new TypeError('Missing HTML target for ' + id + ': ' + targetId)
      }

      targets.set(id, target)
    }

    return targets
  }

  let targets = resolveTargets(options.uiTargets)

  function setTargets(input: Readonly<Record<string, string>>) {
    if (closed) {
      throw new Error('Design workspace is unavailable')
    }

    const next = resolveTargets(input)
    const changed = new Set(
      [...targets.keys(), ...next.keys()].filter(
        (id) => targets.get(id) !== next.get(id)
      )
    )

    if (!changed.size) {
      return
    }

    const previous = { targets, manual: new Map(manual) }

    targets = next
    for (const id of changed) {
      manual.delete(id)
    }

    try {
      render()
    } catch (error) {
      targets = previous.targets
      for (const [id, binding] of previous.manual) {
        manual.set(id, binding)
      }

      render()
      throw error
    }
  }

  function detach(id: string) {
    const entry = mounted.get(id)

    if (!entry) {
      return
    }

    mounted.delete(id)
    try {
      entry.unmount?.()
    } catch (error) {
      // A failed extension cleanup must still release every other group and the editor.
      globalThis.reportError(error)
    } finally {
      entry.node.remove()
    }
  }

  function makeNode(id: string, host: HTMLElement) {
    const doc = host.ownerDocument
    const group = groups.get(id)

    if (!group) {
      throw new TypeError('Unknown tool group')
    }

    const node = doc.createElement('div')

    node.dataset.toolGroup = id
    if (group.label) {
      node.setAttribute('role', 'group')
      node.setAttribute('aria-label', group.label)
    }

    const container = doc.createElement('div')

    node.append(container)
    host.append(node)
    try {
      const unmount =
        'kind' in group
          ? mountInspectorRow(group.id, container)
          : group.mount({ container, editor: getEditor() })

      if (unmount !== undefined && typeof unmount !== 'function') {
        throw new TypeError('Expected tool group cleanup')
      }

      mounted.set(id, { node, unmount })

      return node
    } catch (error) {
      node.remove()
      throw error
    }
  }

  function render() {
    if (!ready) {
      return
    }

    const hidden = []

    const indices = new Map<HTMLElement, number>()

    for (const [id, group] of groups) {
      const target = manual.get(id)?.container ?? targets.get(id)
      const host =
        target ??
        inspectorHomes.get(id) ??
        (installed.has(id) ? outlets.get(group.placement) : undefined)
      const owner = owners.get(id)

      if (
        !host ||
        (owner !== undefined && !getEditor().isFeatureEnabled(owner))
      ) {
        hidden.push(id)
        continue
      }

      const entry = mounted.get(id)

      if (entry && entry.node.ownerDocument !== host.ownerDocument) {
        detach(id)
      }

      const node = mounted.get(id)?.node ?? makeNode(id, host)

      if (target) {
        if (node.parentElement !== host) {
          host.append(node)
        }
      } else {
        const index = indices.get(host) ?? 0
        const before = host.children[index] ?? null

        if (before !== node) {
          host.insertBefore(node, before)
        }

        indices.set(host, index + 1)
      }
    }

    // Keep existing mounts until every newly visible group has mounted.
    for (const id of hidden) {
      detach(id)
    }
  }

  function outlet(slot: ToolPlacement, node: HTMLElement | null) {
    if (node) {
      outlets.set(slot, node)
    } else {
      outlets.delete(slot)
    }

    render()
  }

  return {
    inspectorRefs,
    refs: installed.size
      ? Object.fromEntries(
          slots.map((slot) => [
            slot,
            (node: HTMLElement | null) => outlet(slot, node)
          ])
        )
      : undefined,
    api: {
      setTargets,

      mount(id, container) {
        if (
          closed ||
          !groups.has(id) ||
          !container?.ownerDocument ||
          container.nodeType !== 1
        ) {
          throw new TypeError('Expected a registered group and host element')
        }

        const binding = { container }
        const old = manual.get(id)

        manual.set(id, binding)
        try {
          render()
        } catch (error) {
          if (old) {
            manual.set(id, old)
          } else {
            manual.delete(id)
          }

          render()
          throw error
        }

        return () => {
          if (manual.get(id) !== binding) {
            return
          }

          manual.delete(id)
          render()
        }
      }
    } satisfies ToolGroups,

    refresh: render,

    activate() {
      ready = true
      render()
    },

    pause() {
      ready = false
      for (const id of [...mounted.keys()]) {
        detach(id)
      }
    },

    destroy() {
      closed = true
      this.pause()

      outlets.clear()
      manual.clear()
      targets.clear()
    }
  }
}
