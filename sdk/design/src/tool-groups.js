const slots = ['toolbar.top', 'properties.top', 'selectionMenu']
const placements = [...slots, 'manual']

export function createToolGroups(extensions, options, editor) {
  const groups = new Map()
  const owners = new Map()
  const outlets = new Map()
  const manual = new Map()
  const mounted = new Map()
  let ready = false
  let closed = false
  let dragging

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

    for (const [slot, ids] of Object.entries(input)) {
      if (!placements.includes(slot) || !Array.isArray(ids)) {
        throw new TypeError('Invalid tool layout')
      }

      for (const id of ids) {
        // A preference can outlive the extension that supplied a group.
        if (!groups.has(id)) {
          continue
        }

        if (seen.has(id)) {
          throw new TypeError('Repeated tool group: ' + id)
        }

        seen.add(id)
        result[slot].push(id)
      }
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
    node.style.cssText = 'display:inline-flex;align-items:center;gap:4px'
    if (movable) {
      const grip = doc.createElement('button')

      grip.type = 'button'
      grip.draggable = true
      grip.textContent = '⠿'
      grip.title = 'Move ' + (group.label ?? id)
      grip.setAttribute('aria-label', grip.title)
      grip.style.cursor = 'grab'
      grip.addEventListener('dragstart', (event) => {
        dragging = id
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', id)
      })
      grip.addEventListener('dragend', () => {
        dragging = undefined
      })
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

    for (const [slot, ids] of Object.entries(layout)) {
      const movable = slot !== 'manual'

      let index = 0

      for (const id of ids) {
        const host = movable
          ? outlets.get(slot)?.node
          : manual.get(id)?.container
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

        if (movable) {
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

  function move(id, slot, index) {
    if (!groups.has(id) || !placements.includes(slot)) {
      throw new TypeError('Unknown tool group or placement')
    }

    const next = Object.fromEntries(
      placements.map((name) => [
        name,
        layout[name].filter((item) => item !== id)
      ])
    )

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
    outlets.get(slot)?.remove()
    outlets.delete(slot)
    if (node) {
      const over = (event) => {
        if (dragging) {
          event.preventDefault()
        }
      }

      const drop = (event) => {
        if (!dragging) {
          return
        }

        event.preventDefault()
        const id = dragging

        dragging = undefined
        const target =
          event.target.closest?.('[data-tool-group]')?.dataset.toolGroup

        if (target === id) {
          return
        }

        const index = layout[slot].filter((item) => item !== id).indexOf(target)

        move(id, slot, index < 0 ? undefined : index)
      }

      node.addEventListener('dragover', over)
      node.addEventListener('drop', drop)
      outlets.set(slot, {
        node,

        remove() {
          node.removeEventListener('dragover', over)
          node.removeEventListener('drop', drop)
        }
      })
    }

    render()
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
      for (const id of [...mounted.keys()]) {
        detach(id)
      }
    },

    destroy() {
      closed = true
      this.pause()
      for (const entry of outlets.values()) {
        entry.remove()
      }

      outlets.clear()
      manual.clear()
    }
  }
}
