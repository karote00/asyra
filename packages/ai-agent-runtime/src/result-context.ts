import { AiToolContractError } from './tool-contract.js'
import type { AiJsonValue } from './types.js'

export interface ConversationResultOrigin {
  operation: string
  step?: string
  source: 'input' | 'result'
  path: string
}

/** Trusted result provenance; encoded pixels remain only in the saved value. */
export interface ConversationResultImage {
  path: string
  dataPath: string
  actionName: string
  metadata: Record<string, AiJsonValue>
}

export type ResultContextCommand =
  | {
      read: Readonly<
        Record<
          string,
          { name: string; path: string; view?: 'shape' | 'delivery' }
        >
      >
    }
  | {
      save: Readonly<Record<string, AiJsonValue>>
      origins?: Readonly<Record<string, ConversationResultOrigin>>
      images?: Readonly<Record<string, readonly ConversationResultImage[]>>
    }
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

const valueType = (value: AiJsonValue): string => {
  if (value === null) {
    return 'null'
  }

  return Array.isArray(value) ? 'array' : typeof value
}

const describeValue = (
  name: string,
  value: AiJsonValue,
  rootPath = '',
  origin?: ConversationResultOrigin
) => {
  const paths: { path: string; type: string; length?: number }[] = []

  const visit = (value: AiJsonValue, path: string, depth: number) => {
    if (paths.length >= 16 || path.length > 256) {
      return
    }

    paths.push(
      Object.freeze({
        path,
        type: valueType(value),
        ...(Array.isArray(value) ? { length: value.length } : {})
      })
    )
    if (!value || typeof value !== 'object' || depth === 2) {
      return
    }

    for (const key in value) {
      if (paths.length >= 16 || (Array.isArray(value) && key !== '0')) {
        break
      }

      if (Object.hasOwn(value, key)) {
        visit(
          (value as Record<string, AiJsonValue>)[key],
          path + '/' + key.replace(/~/g, '~0').replace(/\//g, '~1'),
          depth + 1
        )
      }
    }
  }

  visit(value, rootPath, 0)
  Object.freeze(paths)

  return Object.freeze({
    name,
    type: valueType(value),
    paths,
    ...(origin ? { origin: Object.freeze({ ...origin }) } : {})
  })
}

export type ConversationResultDescription = ReturnType<typeof describeValue>

const maximumBytes = 4 * 1024 * 1024

/** Browser-owned snapshots. The request closes over its originating document scope. */
export function createConversationResults(documentScope: () => unknown) {
  const conversations = new Map<
    string,
    Map<
      string,
      {
        value: AiJsonValue
        bytes: number
        description: ReturnType<typeof describeValue>
        images: readonly ConversationResultImage[]
      }
    >
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
        new Map<
          string,
          {
            value: AiJsonValue
            bytes: number
            description: ReturnType<typeof describeValue>
            images: readonly ConversationResultImage[]
          }
        >()

      conversations.set(conversation, entries)

      return {
        names: () => [...entries.keys()],

        describe: () => [...entries.values()].map((entry) => entry.description),

        exchange(command: ResultContextCommand): Record<string, AiJsonValue> {
          if (
            current !== documentScope() ||
            conversations.get(conversation) !== entries
          ) {
            throw Error('Conversation document scope expired')
          }

          if ('read' in command) {
            return Object.fromEntries(
              Object.entries(command.read).map(
                ([label, { name, path, view }]) => {
                  const item = entries.get(name)

                  if (!item) {
                    throw new AiToolContractError(
                      'input',
                      'Missing conversation result: ' + name
                    )
                  }

                  if (
                    view !== undefined &&
                    view !== 'shape' &&
                    view !== 'delivery'
                  ) {
                    throw new AiToolContractError(
                      'input',
                      'Invalid result view'
                    )
                  }

                  let selected: AiJsonValue

                  try {
                    selected = resultAt(item.value, path)
                  } catch (error) {
                    throw new AiToolContractError(
                      'input',
                      error instanceof Error
                        ? error.message
                        : 'Invalid saved result selection'
                    )
                  }

                  if (view === 'delivery') {
                    const images = item.images.flatMap((image) => {
                      if (
                        image.dataPath !== path &&
                        !image.dataPath.startsWith(path + '/')
                      ) {
                        return []
                      }

                      return [
                        {
                          ...image,
                          path:
                            image.path === path ||
                            image.path.startsWith(path + '/')
                              ? image.path.slice(path.length)
                              : '',
                          dataPath: image.dataPath.slice(path.length)
                        }
                      ]
                    })

                    return [label, structuredClone({ value: selected, images })]
                  }

                  return [
                    label,
                    view === 'shape'
                      ? describeValue(
                          name,
                          selected,
                          path,
                          item.description.origin
                        )
                      : structuredClone(selected)
                  ]
                }
              )
            )
          }

          let change = 0
          const updates = Object.entries(command.save).map(([name, value]) => {
            if (!validResultName(name)) {
              throw Error('Invalid conversation result name')
            }

            const images = command.images?.[name] ?? []

            for (const image of images) {
              if (
                !image.actionName ||
                typeof resultAt(value, image.dataPath) !== 'string' ||
                (image.dataPath !== image.path &&
                  image.dataPath !== image.path + '/dataUrl') ||
                Object.hasOwn(image.metadata, 'dataUrl')
              ) {
                throw Error('Invalid saved image provenance')
              }

              resultAt(value, image.path)
            }

            const bytes =
              new TextEncoder().encode(JSON.stringify(value)).length +
              new TextEncoder().encode(JSON.stringify(images)).length +
              name.length +
              new TextEncoder().encode(
                JSON.stringify(command.origins?.[name] ?? {})
              ).length

            change += bytes - (entries.get(name)?.bytes ?? 0)

            return [
              name,
              {
                value,
                images,
                bytes,
                description: describeValue(
                  name,
                  value,
                  '',
                  command.origins?.[name]
                )
              }
            ] as const
          })

          if (
            totalBytes + change > maximumBytes ||
            new Set([...entries.keys(), ...updates.map(([n]) => n)]).size > 128
          ) {
            throw Error('Conversation result capacity exceeded')
          }

          for (const [name, item] of updates) {
            entries.set(name, {
              ...item,
              value: structuredClone(item.value),
              images: structuredClone(item.images)
            })
          }

          totalBytes += change

          return Object.fromEntries(
            updates.map(([name, item]) => [name, item.description])
          )
        }
      }
    }
  }
}
