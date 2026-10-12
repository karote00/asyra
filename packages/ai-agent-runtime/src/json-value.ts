import type { AiJsonValue } from './types.js'

export const detachAiJsonValue = (
  value: unknown,
  ancestors = new WeakSet<object>()
): AiJsonValue => {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return value
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('JSON value must contain only finite JSON numbers.')
    }

    return value
  }

  if (typeof value !== 'object') {
    throw new TypeError('JSON value must be JSON-compatible.')
  }

  if (ancestors.has(value)) {
    throw new TypeError('JSON value must not contain cycles.')
  }

  ancestors.add(value)

  try {
    if (Array.isArray(value)) {
      const result: AiJsonValue[] = []

      for (let index = 0; index < value.length; index += 1) {
        if (!(index in value)) {
          throw new TypeError('JSON value must not contain sparse arrays.')
        }

        result.push(detachAiJsonValue(value[index], ancestors))
      }

      return Object.freeze(result)
    }

    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('JSON value must contain only plain JSON objects.')
    }

    const result: Record<string, AiJsonValue> = {}
    for (const [key, nestedValue] of Object.entries(value)) {
      Object.defineProperty(result, key, {
        configurable: true,
        enumerable: true,
        value: detachAiJsonValue(nestedValue, ancestors),
        writable: true
      })
    }

    return Object.freeze(result)
  } finally {
    ancestors.delete(value)
  }
}
