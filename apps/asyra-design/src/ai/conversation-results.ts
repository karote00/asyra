import type { AiJsonValue } from '@asyra/ai-agent-runtime'

export type ResultContextCommand =
  | { read: Readonly<Record<string, { name: string; path: string }>> }
  | { save: Readonly<Record<string, AiJsonValue>> }
export type ExchangeConversationResults = (
  command: ResultContextCommand
) => Promise<Readonly<Record<string, AiJsonValue>>>
export const resultNamePattern = '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
const namePattern = new RegExp(resultNamePattern)

export const validResultName = (name: string) =>
  namePattern.test(name) && !Object.hasOwn(Object.prototype, name)

export const resultAt = (value: unknown, path: unknown): AiJsonValue => {
  if (
    typeof path !== 'string' ||
    (path !== '' && (!path.startsWith('/') || /~(?![01])/.test(path)))
  ) {
    throw new Error('Invalid result pointer')
  }

  for (const key of path.split('/').slice(1)) {
    const field = key.replace(/~1/g, '/').replace(/~0/g, '~')

    if (
      value === null ||
      typeof value !== 'object' ||
      !Object.hasOwn(value, field)
    ) {
      throw new Error('Missing result field: ' + path)
    }

    value = (value as Record<string, unknown>)[field]
  }

  if (value === undefined) {
    throw new Error('Result is unavailable')
  }

  return value as AiJsonValue
}

const maximumBytes = 4 * 1024 * 1024

/** Browser-owned snapshots. The request closes over its originating document scope. */
export function createConversationResults(documentScope: () => unknown) {
  const conversations = new Map<
    string,
    Map<string, { value: AiJsonValue; bytes: number }>
  >()
  let current = documentScope(),
    totalBytes = 0

  const clear = () => {
    conversations.clear()
    totalBytes = 0
  }

  return {
    clear,

    open(conversation: string) {
      const document = documentScope()

      if (current !== document) {
        clear()
        current = document
      }

      const entries =
        conversations.get(conversation) ??
        new Map<string, { value: AiJsonValue; bytes: number }>()

      conversations.set(conversation, entries)

      return {
        names: () => [...entries.keys()],

        exchange(command: ResultContextCommand): Record<string, AiJsonValue> {
          if (
            current !== documentScope() ||
            conversations.get(conversation) !== entries
          ) {
            throw Error('Conversation document scope expired')
          }

          if ('read' in command) {
            return Object.fromEntries(
              Object.entries(command.read).map(([label, { name, path }]) => {
                const item = entries.get(name)

                if (!item) {
                  throw Error('Missing conversation result: ' + name)
                }

                return [label, structuredClone(resultAt(item.value, path))]
              })
            )
          }

          let change = 0
          const updates = Object.entries(command.save).map(([name, value]) => {
            if (!validResultName(name)) {
              throw Error('Invalid conversation result name')
            }

            const bytes =
              new TextEncoder().encode(JSON.stringify(value)).length +
              name.length

            change += bytes - (entries.get(name)?.bytes ?? 0)

            return [name, { value, bytes }] as const
          })

          if (
            totalBytes + change > maximumBytes ||
            new Set([...entries.keys(), ...updates.map(([n]) => n)]).size > 128
          ) {
            throw Error('Conversation result capacity exceeded')
          }

          for (const [name, item] of updates) {
            entries.set(name, structuredClone(item))
          }

          totalBytes += change

          return {}
        }
      }
    }
  }
}
