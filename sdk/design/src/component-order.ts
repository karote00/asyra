import type { HostUIItem } from './component-registry.js'
import type { ComponentGroup } from './editor-types.js'

type Item = string | HostUIItem

export function createComponentOrder(
  fields: readonly string[],
  changed: () => void,
  current: () => void,
  admitHandle: (item: Item) => Item
) {
  const items = Object.freeze(Object.fromEntries(fields.map((id) => [id, id])))
  let entries: readonly Item[] = Object.freeze([...fields])
  const admitted = new WeakMap<HostUIItem, HostUIItem>()
  const tokens = new Map<string, symbol>()

  const key = (item: Item) => (typeof item === 'string' ? item : item.id)

  function validate(input: Item) {
    const item = admitHandle(input)

    if (
      typeof item === 'string'
        ? !fields.includes(item)
        : !item ||
          typeof item.id !== 'string' ||
          !item.id.trim() ||
          fields.includes(item.id) ||
          typeof item.mount !== 'function'
    ) {
      throw new TypeError('Invalid workspace component item')
    }

    if (typeof item === 'string') {
      return item
    }

    const value =
      admitted.get(item) ??
      Object.freeze({ id: item.id, mount: item.mount.bind(item) })

    admitted.set(item, value)
    admitted.set(value, value)

    return value
  }

  function replace(next: readonly Item[]) {
    entries = Object.freeze([...next])
    changed()
  }

  function check(index: number, size: number) {
    if (!Number.isInteger(index) || index < 0 || index >= size) {
      throw new RangeError('Invalid component index: ' + index)
    }
  }

  function removeAt(index: number) {
    current()
    check(index, entries.length)
    tokens.delete(key(entries[index]))
    replace(entries.filter((_, i) => i !== index))
  }

  function insertAt(index: number, item: Item) {
    current()
    check(index, entries.length + 1)
    const value = validate(item)
    const id = key(value)

    if (entries.some((entry) => key(entry) === id)) {
      throw new TypeError('Duplicate component item: ' + id)
    }

    const token = Symbol(id)

    tokens.set(id, token)
    replace([...entries.slice(0, index), value, ...entries.slice(index)])

    return () => {
      if (tokens.get(id) === token) {
        tokens.delete(id)
        replace(entries.filter((entry) => key(entry) !== id))
      }
    }
  }

  const api = {
    items,

    getOrder: () => entries,

    removeAt,
    insertAt,

    insertAfter(anchor: Item, item: Item) {
      const index = entries.findIndex((entry) => key(entry) === key(anchor))

      check(index, entries.length)

      return insertAt(index + 1, item)
    },

    setItems(next: readonly Item[]) {
      current()
      if (!Array.isArray(next)) {
        throw new TypeError('Expected component items')
      }

      const values = Array.from(next, validate)

      if (new Set(values.map(key)).size !== values.length) {
        throw new TypeError('Duplicate component items')
      }

      tokens.clear()
      replace(values)
    }
  } satisfies ComponentGroup<string>

  return {
    api,

    reset(next: readonly Item[]) {
      tokens.clear()
      replace(next)
    }
  }
}
