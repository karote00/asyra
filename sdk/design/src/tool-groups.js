import { trackToolDrag, toolDropTarget } from './tool-drag.js'

const slots = ['toolbar.top', 'properties.top', 'selectionMenu']
const placements = [...slots, 'manual']

export function createToolGroups(extensions, options, editor, getFrame) {
  const groups = new Map()
  const owners = new Map()
  const outlets = new Map()
  const manual = new Map()
  const mounted = new Map()
  let ready = false
  let closed = false
  let drag

  for (const extension of extensions) {
    for (const group of extension.ui ?? []) {
      if (
        !group.id?.trim() ||
        groups.has(group.id) ||
        !placements.includes(group.placement) ||
        typeof group.mount !== 'function'
      ) {
        throw new TypeError(
          'Expected a unique tool group ID, placement and mount function'
        )
      }

      groups.set(group.id, group)
      if (extension.id) {
        owners.set(group.id, extension.id)
      }
    }
  }

  function resolveLayout(input = {}) {
    const result = Object.fromEntries(placements.map((slot) => [slot, []]))
    const seen = new Set()

    const floating = new Map()

    for (const [slot, value] of Object.entries(input)) {
      const free = slot === 'floating'

      if (
        free
          ? !value || typeof value !== 'object' || Array.isArray(value)
          : !placements.includes(slot) || !Array.isArray(value)
      ) {
        throw new TypeError('Invalid tool layout')
      }

      for (const id of free ? Object.keys(value) : value) {
        if (!groups.has(id)) {
          continue
        }

        if (seen.has(id)) {
          throw new TypeError('Repeated tool group: ' + id)
        }

        seen.add(id)
        if (free) {
          const point = value[id]

          if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) {
            throw new TypeError('Expected a floating tool position')
          }

          floating.set(id, { x: point.x, y: point.y })
        } else {
          result[slot].push(id)
        }
      }
    }

    if (floating.size) {
      result.floating = Object.fromEntries(floating)
    }

    for (const group of groups.values()) {
      if (!seen.has(group.id)) {
        result[group.placement].push(group.id)
      }
    }

    return result
  }

  let layout = resolveLayout(options.toolLayout)

  function detach(id) {
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

  function makeNode(id, host, movable) {
    const doc = host.ownerDocument
    const group = groups.get(id)
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
      const unmount = group.mount({ container, editor })

      if (unmount !== undefined && typeof unmount !== 'function') {
        throw new TypeError('Expected tool group cleanup')
      }

      mounted.set(id, { node, unmount, movable })
    } catch (error) {
      node.remove()
      throw error
    }
  }

  function render() {
    if (!ready) {
      return
    }

    for (const [slot, value] of Object.entries(layout)) {
      const free = slot === 'floating'
      const ids = free ? Object.keys(value) : value
      const movable = slot !== 'manual'
      const outletHost = free
        ? getFrame().ownerDocument.body
        : outlets.get(slot)?.node

      let index = 0

      for (const id of ids) {
        const host = movable ? outletHost : manual.get(id)?.container
        const entry = mounted.get(id)

        if (
          !host ||
          (owners.has(id) && !editor.isFeatureEnabled(owners.get(id)))
        ) {
          detach(id)
          continue
        }

        if (
          entry &&
          (host.ownerDocument !== entry.node.ownerDocument ||
            movable !== entry.movable)
        ) {
          detach(id)
        }

        if (!mounted.has(id)) {
          makeNode(id, host, movable)
        }

        const node = mounted.get(id).node

        if (free) {
          const { x, y } = value[id]

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
          const before = host.children[index] ?? null

          index++

          if (before !== node) {
            host.insertBefore(node, before)
          }
        } else if (node.parentElement !== host) {
          host.append(node)
        }
      }
    }
  }

  function setLayout(preference) {
    if (closed) {
      throw new Error('Design workspace is unavailable')
    }

    const next = resolveLayout(preference)

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

  function withoutGroup(id) {
    if (!groups.has(id)) {
      throw new TypeError('Unknown tool group')
    }

    const next = Object.fromEntries(
      placements.map((name) => [
        name,
        layout[name].filter((item) => item !== id)
      ])
    )
    const remaining = Object.entries(layout.floating ?? {}).filter(
      ([key]) => key !== id
    )

    if (remaining.length) {
      next.floating = Object.fromEntries(remaining)
    }

    return next
  }

  function float(id, point) {
    const next = withoutGroup(id)

    next.floating = { ...next.floating, [id]: point }
    setLayout(next)
  }

  function move(id, slot, index) {
    if (!placements.includes(slot)) {
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

  function outlet(slot, node) {
    if (node) {
      outlets.set(slot, { node })
    } else {
      outlets.delete(slot)
    }

    render()
  }

  function startDrag(event, id, node) {
    if (!event.isPrimary || event.button !== 0) {
      return
    }

    drag?.cancel()
    const frame = getFrame()
    const cancel = trackToolDrag(
      event,
      node,
      groups.get(id).label ?? id,
      frame,
      (point, position) => {
        const target = toolDropTarget(frame, point)

        for (const [slot, { node: outletNode }] of outlets) {
          if (!target || !outletNode.contains(target)) {
            continue
          }

          const targetId =
            target.closest('[data-tool-group]')?.dataset.toolGroup

          if (targetId === id) {
            return
          }

          const index = layout[slot]
            .filter((item) => item !== id)
            .indexOf(targetId)

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
    refs: groups.size
      ? Object.fromEntries(
          slots.map((slot) => [slot, (node) => outlet(slot, node)])
        )
      : undefined,
    api: {
      getLayout: () => globalThis.structuredClone(layout),

      setLayout,
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
            detach(id)
          }
        }
      }
    },

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
    }
  }
}
