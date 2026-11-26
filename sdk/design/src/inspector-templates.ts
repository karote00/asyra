import type {
  InspectorFields,
  InspectorItem,
  InspectorRowId
} from './common.js'
import type { InspectorTemplate } from './editor-types.js'

function itemId<Key extends string>(item: InspectorItem<Key>) {
  return typeof item === 'string' ? item : item.id
}

function createRow<Key extends string>(
  items: { readonly [K in Key]: K },
  requireEditor: () => void
) {
  type Item = InspectorItem<Key>
  Object.freeze(items)
  let order: readonly Item[] = Object.freeze(Object.values(items) as Key[])
  const listeners = new Set<() => void>()
  const insertions = new Map<string, symbol>()

  function update(next: readonly Item[]) {
    order = Object.freeze([...next])
    for (const notify of listeners) {
      notify()
    }
  }

  function admit(item: Item): Item {
    if (typeof item === 'string' && Object.hasOwn(items, item)) {
      return item
    }

    if (
      !item ||
      typeof item !== 'object' ||
      item.kind !== 'number' ||
      typeof item.id !== 'string' ||
      !item.id.trim() ||
      Object.hasOwn(items, item.id) ||
      typeof item.label !== 'string' ||
      !item.label.trim() ||
      typeof item.getValue !== 'function' ||
      typeof item.setValue !== 'function' ||
      typeof item.subscribe !== 'function'
    ) {
      throw new TypeError('Invalid inspector item')
    }

    return Object.freeze({
      kind: item.kind,
      id: item.id,
      label: item.label,
      getValue: item.getValue,
      subscribe: item.subscribe,
      setValue: item.setValue
    })
  }

  const api: InspectorTemplate<Key> = {
    items,

    setItems(next) {
      requireEditor()
      if (!Array.isArray(next)) {
        throw new TypeError('Expected inspector items')
      }

      const ids = new Set<string>()
      const admitted = Array.from(next, admit)

      for (const item of admitted) {
        const id = itemId(item)

        if (ids.has(id)) {
          throw new TypeError('Duplicate inspector item: ' + id)
        }

        ids.add(id)
      }

      insertions.clear()
      update(admitted)
    },

    insertAfter(anchor, item) {
      requireEditor()
      const anchorId = itemId(admit(anchor))
      const admitted = admit(item)
      const index = order.findIndex((entry) => itemId(entry) === anchorId)

      if (index < 0) {
        throw new TypeError('Missing inspector anchor: ' + itemId(anchor))
      }

      const id = itemId(item)

      if (order.some((entry) => itemId(entry) === id)) {
        throw new TypeError('Duplicate inspector item: ' + id)
      }

      const token = Symbol(id)

      insertions.set(id, token)
      update([
        ...order.slice(0, index + 1),
        admitted,
        ...order.slice(index + 1)
      ])

      return () => {
        if (insertions.get(id) === token) {
          insertions.delete(id)
          update(order.filter((entry) => itemId(entry) !== id))
        }
      }
    }
  }

  return {
    api: Object.freeze(api),

    getSnapshot: () => order,

    subscribe(notify: () => void) {
      listeners.add(notify)

      return () => {
        listeners.delete(notify)
      }
    },

    dispose() {
      insertions.clear()
      listeners.clear()
      order = []
    }
  }
}

export function createInspectorTemplates(requireEditor: () => void) {
  const sources = {
    positionRow: createRow({ x: 'x', y: 'y' }, requireEditor),
    dimensionRow: createRow({ width: 'width', height: 'height' }, requireEditor)
  }

  function getUI<Row extends InspectorRowId>(
    id: Row
  ): InspectorTemplate<InspectorFields[Row]> {
    requireEditor()
    if (!Object.hasOwn(sources, id)) {
      throw new TypeError('Unknown inspector row: ' + id)
    }

    return sources[id].api as InspectorTemplate<InspectorFields[Row]>
  }

  return {
    sources,
    getUI,

    dispose() {
      for (const row of Object.values(sources)) {
        row.dispose()
      }
    }
  }
}
