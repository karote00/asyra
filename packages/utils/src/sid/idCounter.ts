import { IDTypes } from './enum.js'
import { FIRST_ID, CODE_SPLIT } from './constants.js'
import { isNumber } from '../helpers/index.js'

class IDCounter {
  counter: Record<string, string> = {}
  private prefixes: Record<string, string> = {}
  private namespace: string | undefined

  constructor() {
    this.init()
  }

  init() {
    this.namespace = undefined
    this.prefixes = {}
    Object.values(IDTypes).forEach((type: string) => {
      this.prefixes[type] = type
      this.counter[type] = this.initialId(type, type)
    })
  }

  private scopedPrefix(prefix: string, type: string): string {
    if (type === IDTypes.DEFAULT || !this.namespace) {
      return prefix
    }
    return `${prefix}${CODE_SPLIT}${this.namespace}`
  }

  private initialId(type: string, prefix: string): string {
    if (type === IDTypes.DEFAULT) {
      return FIRST_ID
    }
    return `${this.scopedPrefix(prefix, type)}${CODE_SPLIT}${FIRST_ID}`
  }

  private splitId(
    value: string
  ): { prefix: string; count: number } | undefined {
    const separatorIndex = value.lastIndexOf(CODE_SPLIT)
    if (separatorIndex < 0) {
      const count = Number(value)
      return Number.isSafeInteger(count) && count >= 0
        ? { prefix: '', count }
        : undefined
    }
    const countText = value.slice(separatorIndex + CODE_SPLIT.length)
    if (!countText) {
      return
    }
    const count = Number(countText)
    if (!Number.isSafeInteger(count) || count < 0) {
      return
    }
    return { prefix: value.slice(0, separatorIndex), count }
  }

  setNamespace(namespace?: string): void {
    const trimmed = namespace?.trim()
    this.namespace = trimmed ? encodeURIComponent(trimmed) : undefined
    Object.entries(this.counter).forEach(([type, currentId]) => {
      if (type === IDTypes.DEFAULT) {
        return
      }
      const current = this.splitId(currentId)
      const prefix = this.prefixes[type] ?? type
      this.counter[type] = `${this.scopedPrefix(prefix, type)}${CODE_SPLIT}${
        current?.count ?? Number(FIRST_ID)
      }`
    })
  }

  current(type: string = IDTypes.DEFAULT): string {
    if (!type) {
      return ''
    }

    return this.counter[type]
  }

  load(id: string, type: string) {
    // Initialize if not exists
    if (!this.counter[type]) {
      this.prefixes[type] = type
      this.counter[type] = this.initialId(type, type)
    }

    const currentId = this.current(type)
    if (!currentId) {
      return ''
    }

    const current = this.splitId(currentId)
    const incoming = this.splitId(id)
    if (!current || !incoming || current.prefix !== incoming.prefix) {
      return
    }

    if (incoming.count > current.count) {
      this.update(type, id)
    }
  }

  update(type: string = IDTypes.DEFAULT, newId: string): void {
    if (!type) {
      return
    }

    this.counter[type] = newId
  }

  increase(type: string = IDTypes.DEFAULT): string {
    if (!type) {
      return ''
    }

    // Initialize if not exists
    if (!this.counter[type]) {
      this.prefixes[type] = type
      this.counter[type] = this.initialId(type, type)
    }

    const currentId = this.counter[type]
    if (!currentId) {
      return ''
    }

    const current = this.splitId(currentId)
    if (!current) {
      return ''
    }
    const next = current.count + 1
    const prefix = current.prefix
    const newId =
      prefix === '' ? next.toString() : `${prefix}${CODE_SPLIT}${next}`
    this.update(type, newId)

    return newId
  }

  /** Allocate registered identities without publishing a partially consumed batch. */
  allocate(types: readonly string[]): readonly string[] {
    if (!Array.isArray(types)) {
      throw new Error('ID allocation requires a type list.')
    }
    const prefixes = new Map<string, number>()
    for (const current of Object.values(this.counter)) {
      const parsed = this.splitId(current)
      if (parsed) {
        prefixes.set(parsed.prefix, (prefixes.get(parsed.prefix) ?? 0) + 1)
      }
    }
    const pending = new Map<string, string>()
    const ids: string[] = []
    for (const type of types) {
      if (typeof type !== 'string' || !this.hasType(type)) {
        throw new Error('ID allocation requires registered counter types.')
      }
      const current = this.splitId(pending.get(type) ?? this.counter[type])
      if (!current || !Number.isSafeInteger(current.count + 1)) {
        throw new Error('ID allocation counter is invalid or exhausted.')
      }
      if (prefixes.get(current.prefix) !== 1) {
        throw new Error('ID allocation counter prefix is ambiguous.')
      }
      const count = current.count + 1
      const next = current.prefix
        ? `${current.prefix}${CODE_SPLIT}${count}`
        : String(count)
      pending.set(type, next)
      ids.push(next)
    }
    for (const [type, value] of pending) {
      this.update(type, value)
    }
    return Object.freeze(ids)
  }

  valid(id: string, type: string = IDTypes.DEFAULT): boolean {
    if (!id || !type) {
      return false
    }

    if (type === IDTypes.DEFAULT) {
      return isNumber(id)
    }

    const parsed = this.splitId(id)
    if (!parsed || !Number.isInteger(parsed.count) || parsed.count < 0) {
      return false
    }
    const expectedPrefix = this.prefixes[type] ?? type
    const scopedSuffix = parsed.prefix.slice(
      expectedPrefix.length + CODE_SPLIT.length
    )
    return (
      parsed.prefix === expectedPrefix ||
      (parsed.prefix.startsWith(`${expectedPrefix}${CODE_SPLIT}`) &&
        scopedSuffix.length > 0 &&
        scopedSuffix.split(CODE_SPLIT).every(Boolean))
    )
  }

  /**
   * Register a new component type for auto-numbering
   * Allows app-level components to register without modifying framework IDTypes
   *
   * @param type - Component type string (e.g., 'star', 'myCustomWidget')
   * @param idPrefix - ID prefix string (e.g., 'star', 'myCustomWidget')
   * @param initialValue - Optional starting number (default: 1)
   *
   * @example
   * ```typescript
   * import { idCounter } from '@asyra/sid'
   *
   * // Register custom component type
   * idCounter.registerType('star', 'star')
   * idCounter.registerType('polygon', 'polygon')
   * ```
   */
  registerType(
    type: string,
    idPrefix: string,
    initialValue = Number(FIRST_ID),
    options: { override?: boolean } = {}
  ): void {
    if (!type || !idPrefix) {
      return
    }

    if (this.counter[type] && options.override !== true) {
      return
    }

    const prefixId = `${idPrefix}${CODE_SPLIT}${initialValue}`
    this.prefixes[type] = idPrefix
    this.counter[type] = this.namespace
      ? `${this.scopedPrefix(idPrefix, type)}${CODE_SPLIT}${initialValue}`
      : prefixId
  }

  hasType(type: string): boolean {
    if (!type) {
      return false
    }

    return Object.prototype.hasOwnProperty.call(this.counter, type)
  }

  unregisterType(type: string): boolean {
    if (!this.hasType(type)) {
      return false
    }

    const { [type]: _removed, ...nextCounter } = this.counter
    this.counter = nextCounter
    const { [type]: _removedPrefix, ...nextPrefixes } = this.prefixes
    this.prefixes = nextPrefixes
    return true
  }

  clear() {
    this.init()
  }
}

export const idCounter = new IDCounter()
