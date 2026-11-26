import type {
  DesignEditor,
  WorkspaceTool,
  WorkspaceOptions,
  WorkspaceExtension,
  WorkspaceUIGroup,
  InspectorRowId,
  ToolPlacement,
  ToolLayout,
  ToolGroups,
  Point
} from './index.js'
import { trackToolDrag } from './tool-drag.js'
import {
  dockedLayout,
  slots,
  placements,
  resolveLayout,
  type Layout
} from './tool-layout.js'

export function createToolGroups(
  extensions: readonly WorkspaceExtension<string>[],
  options: WorkspaceOptions<string>,
  hostDocument: Document,
  getEditor: () => DesignEditor<string, WorkspaceTool>,
  mountInspectorRow: (id: InspectorRowId, container: HTMLElement) => () => void,
  getFrame: () => HTMLIFrameElement
) {
  const groups = new Map<string, WorkspaceUIGroup<string>>()
  const inspectorHomes = new Map<string, HTMLElement>()
  const inspectorRefs: Partial<
    Record<InspectorRowId, (element: HTMLElement | null) => void>
  > = {}
  const owners = new Map<string, string>()
  const outlets = new Map<ToolPlacement, { node: HTMLElement }>()
  const manual = new Map<string, { container: HTMLElement }>()
  const mounted = new Map<
    string,
    { node: HTMLElement; unmount?: () => void; movable: boolean }
  >()
  let ready = false
  let closed = false
  let drag: { id: string; cancel: () => void } | undefined

  for (const extension of extensions) {
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

  function resetPlacements(
    layout: Layout,
    ids: ReadonlySet<string>,
    targets: ReadonlyMap<string, HTMLElement>
  ) {
    const preference = dockedLayout()

    for (const slot of placements) {
      preference[slot] = layout[slot].filter((id) => !ids.has(id))
    }

    const floating = Object.fromEntries(
      Object.entries(layout.floating ?? {}).filter(([id]) => !ids.has(id))
    )

    return resolveLayout(groups, { ...preference, floating }, targets)
  }

  let targets = resolveTargets(options.uiTargets)
  let layout = resolveLayout(groups, options.toolLayout, targets)

  if (targets.size) {
    layout = resetPlacements(layout, new Set(targets.keys()), targets)
  }

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

    const previous = { targets, layout, manual: new Map(manual) }

    targets = next
    layout = resetPlacements(layout, changed, targets)
    for (const id of changed) {
      manual.delete(id)
    }

    try {
      render()
    } catch (error) {
      targets = previous.targets
      layout = previous.layout
      for (const [id, binding] of previous.manual) {
        manual.set(id, binding)
      }

      render()
      throw error
    }

    options.onToolLayoutChange?.(globalThis.structuredClone(layout))
  }

  function detach(id: string) {
    const entry = mounted.get(id)

    if (!entry) {
      return
    }

    if (drag?.id === id) {
      drag.cancel()
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

  function makeNode(id: string, host: HTMLElement, movable: boolean) {
    const doc = host.ownerDocument
    const group = groups.get(id)

    if (!group) {
      throw new TypeError('Unknown tool group')
    }

    const node = doc.createElement('div')

    node.dataset.toolGroup = id
    node.style.cssText = 'display:inline-flex;align-items:flex-start;gap:4px'
    if (movable) {
      const grip = doc.createElement('button')

      grip.type = 'button'
      grip.textContent = '⠿'
      grip.setAttribute('aria-label', 'Move ' + (group.label ?? id))
      grip.title = 'Drag to float or dock ' + (group.label ?? id)
      grip.style.cssText = 'cursor:grab;touch-action:none;user-select:none'
      grip.addEventListener('pointerdown', (event) =>
        startDrag(event, id, node)
      )
      node.append(grip)
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

      mounted.set(id, { node, unmount, movable })

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

    for (const [slot, value] of Object.entries(layout)) {
      const free = slot === 'floating'
      const ids = free ? Object.keys(value) : (value as readonly string[])
      const movable = slot !== 'manual'
      const outletHost = free
        ? getFrame().ownerDocument.body
        : outlets.get(slot as ToolPlacement)?.node

      let index = 0

      for (const id of ids) {
        const dock =
          slot === 'properties.top'
            ? (inspectorHomes.get(id) ?? outletHost)
            : outletHost
        const host = movable
          ? dock
          : (manual.get(id)?.container ?? targets.get(id))
        const entry = mounted.get(id)

        const owner = owners.get(id)

        if (
          !host ||
          (owner !== undefined && !getEditor().isFeatureEnabled(owner))
        ) {
          hidden.push(id)
          continue
        }

        if (
          entry &&
          (host.ownerDocument !== entry.node.ownerDocument ||
            movable !== entry.movable)
        ) {
          detach(id)
        }

        const node = mounted.get(id)?.node ?? makeNode(id, host, movable)

        const position = layout.floating?.[id]

        if (position) {
          const { x, y } = position

          Object.assign(node.style, {
            position: 'fixed',
            left: '0',
            top: '0',
            zIndex: '2147483646',
            maxWidth: '100vw',
            maxHeight: '100dvh',
            overflow: 'auto',
            background: 'Canvas',
            color: 'CanvasText',
            outline: '1px solid currentColor',
            transform: `translate(clamp(0px, ${x}px, 100vw - 100%), clamp(0px, ${y}px, 100dvh - 100%))`
          })
          if (node.parentElement !== host) {
            host.append(node)
          }
        } else if (movable) {
          const before =
            host.children[host === outletHost ? index++ : 0] ?? null

          if (before !== node) {
            host.insertBefore(node, before)
          }
        } else if (node.parentElement !== host) {
          host.append(node)
        }
      }
    }

    // Keep existing mounts until every newly visible group has mounted.
    for (const id of hidden) {
      detach(id)
    }
  }

  function setLayout(preference: ToolLayout) {
    if (closed) {
      throw new Error('Design workspace is unavailable')
    }

    const next = resolveLayout(groups, preference, targets)

    if (JSON.stringify(next) === JSON.stringify(layout)) {
      return
    }

    const previous = layout

    layout = next
    try {
      render()
    } catch (error) {
      layout = previous
      render()
      throw error
    }

    options.onToolLayoutChange?.(globalThis.structuredClone(layout))
  }

  function withoutGroup(id: string) {
    if (!groups.has(id)) {
      throw new TypeError('Unknown tool group')
    }

    const next: Layout = dockedLayout()

    for (const name of placements) {
      next[name] = layout[name].filter((item) => item !== id)
    }

    const remaining = Object.entries(layout.floating ?? {}).filter(
      ([key]) => key !== id
    )

    if (remaining.length) {
      next.floating = Object.fromEntries(remaining)
    }

    return next
  }

  function float(id: string, point: Point) {
    const next = withoutGroup(id)

    next.floating = { ...next.floating, [id]: point }
    setLayout(next)
  }

  function move(id: string, slot: ToolPlacement, index?: number) {
    if (!placements.includes(slot as ToolPlacement)) {
      throw new TypeError('Unknown tool placement')
    }

    const next = withoutGroup(id)

    if (
      index !== undefined &&
      (!Number.isInteger(index) || index < 0 || index > next[slot].length)
    ) {
      throw new RangeError('Invalid tool group index')
    }

    next[slot].splice(index ?? next[slot].length, 0, id)
    setLayout(next)
  }

  function outlet(slot: ToolPlacement, node: HTMLElement | null) {
    if (node) {
      outlets.set(slot, { node })
    } else {
      outlets.delete(slot)
    }

    render()
  }

  function startDrag(event: PointerEvent, id: string, node: HTMLElement) {
    if (!event.isPrimary || event.button !== 0) {
      return
    }

    drag?.cancel()
    const frame = getFrame()
    const cancel = trackToolDrag(
      event,
      node,
      groups.get(id)?.label ?? id,
      frame,
      (dock, target, position) => {
        for (const [slot, { node: outletNode }] of outlets) {
          if (!dock || !dock.contains(outletNode)) {
            continue
          }

          const targetId = outletNode.contains(target)
            ? target?.closest<HTMLElement>('[data-tool-group]')?.dataset
                .toolGroup
            : undefined

          if (targetId === id) {
            return
          }

          const index = layout[slot]
            .filter((item) => item !== id)
            .indexOf(targetId ?? '')

          move(id, slot, index < 0 ? undefined : index)

          return
        }

        float(id, position)
      },
      () => {
        drag = undefined
      }
    )

    drag = { id, cancel }
  }

  return {
    inspectorRefs,
    refs: groups.size
      ? Object.fromEntries(
          slots.map((slot) => [
            slot,
            (node: HTMLElement | null) => outlet(slot, node)
          ])
        )
      : undefined,
    api: {
      getLayout: () => globalThis.structuredClone(layout),

      setLayout,
      setTargets,
      move,
      float,

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
          if (layout.manual.includes(id)) {
            render()
          } else {
            move(id, 'manual')
          }
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
          if (layout.manual.includes(id)) {
            if (!targets.has(id) && Object.hasOwn(inspectorRefs, id)) {
              move(id, 'properties.top')

              return
            }

            render()
          }
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
      drag?.cancel()
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
