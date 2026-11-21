import { AiToolInputError } from './tool-input-error.js'
import {
  validResultName,
  resultAt,
  type ExchangeConversationResults
} from './result-context.js'

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

export interface NamedInputProducer {
  step?: string
  source?: 'input'
  path: string
}

/** Resolve normalized named references; the App owns its authored syntax. */
export async function resolveNamedResultInputs(
  input: unknown,
  producers: ReadonlyMap<string, NamedInputProducer>,
  exchange?: ExchangeConversationResults,
  authoredValue?: (selector: NamedInputProducer) => unknown,
  containsExpression: (value: unknown) => boolean = () => false
): Promise<unknown> {
  for (const [name, selector] of producers) {
    if (
      !validResultName(name) ||
      !record(selector) ||
      typeof selector.path !== 'string' ||
      (selector.path !== '' &&
        (!selector.path.startsWith('/') || /~(?![01])/.test(selector.path)))
    ) {
      throw new AiToolInputError('Invalid name or selection path')
    }
  }

  const selections = new Map<string, { name: string; path: string }>()
  const resolving = new Set<string>()
  const pending: {
    key: string
    assign: (value: unknown) => void
  }[] = []

  // Copy only ancestors of a reference. Keep large, ready geometry by reference.
  const visit = (v: unknown, assign: (value: unknown) => void): void => {
    if (!v || typeof v !== 'object') {
      return
    }

    if (record(v) && v.kind === 'literal') {
      return
    }

    if (record(v) && v.kind === 'named') {
      if (
        typeof v.name !== 'string' ||
        !validResultName(v.name) ||
        Object.keys(v).some((k) => !['kind', 'name', 'path'].includes(k))
      ) {
        throw new AiToolInputError('Invalid named result reference')
      }

      const path = v.path ?? ''

      if (typeof path !== 'string' || (path !== '' && !path.startsWith('/'))) {
        throw new AiToolInputError('Invalid named result path')
      }

      const alias = producers.get(v.name)

      if (alias?.step && alias.source === 'input') {
        if (!authoredValue || resolving.has(v.name)) {
          throw new AiToolInputError(
            'Unavailable or cyclic authored input: ' + v.name
          )
        }

        resolving.add(v.name)
        const value = resultAt(authoredValue(alias), alias.path + path)

        assign(value)
        visit(value, assign)
        resolving.delete(v.name)

        return
      }

      if (alias?.step) {
        assign({ kind: 'step', step: alias.step, path: alias.path + path })

        return
      }

      const key = JSON.stringify([v.name, path])

      selections.set(key, { name: v.name, path })
      pending.push({
        key,

        assign: (value) =>
          assign(containsExpression(value) ? { kind: 'literal', value } : value)
      })

      return
    }

    let copy: Record<string, unknown> | undefined

    for (const [k, i] of Object.entries(v)) {
      visit(i, (value) => {
        if (!copy) {
          copy = (Array.isArray(v) ? [...v] : { ...v }) as Record<
            string,
            unknown
          >
          assign(copy)
        }

        Object.defineProperty(copy, k, {
          value,
          enumerable: true,
          configurable: true,
          writable: true
        })
      })
    }
  }

  let rewritten = input

  visit(input, (value) => {
    rewritten = value
  })

  if (selections.size) {
    if (!exchange) {
      throw new Error('App conversation context unavailable')
    }

    const values = await exchange({ read: Object.fromEntries(selections) })

    for (const { key, assign } of pending) {
      if (!Object.hasOwn(values, key)) {
        throw new Error('Missing requested App result')
      }

      assign(values[key])
    }
  }

  return rewritten
}
