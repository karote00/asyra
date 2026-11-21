import type {
  AiKnowledgeMetadata,
  AiKnowledgeContent
} from '../knowledge-types.js'
export interface KnowledgeFile {
  readonly id: string
  readonly revision: number
  readonly markdown: string
}

/** Trusted file admission only. The initial loader accepts YAML's JSON subset. */
export const parseKnowledgeFile = (
  file: KnowledgeFile
): {
  metadata: AiKnowledgeMetadata
  text: string
  overrides: NonNullable<AiKnowledgeContent['overrides']>
} => {
  if (
    typeof file.markdown !== 'string' ||
    Buffer.byteLength(file.markdown) > 65536
  ) {
    throw new Error('Knowledge file exceeds the admission limit')
  }

  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/.exec(file.markdown)

  if (!match) {
    throw new Error('Knowledge frontmatter is required')
  }

  const value: unknown = JSON.parse(match[1])

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Knowledge metadata must be an object')
  }

  const fields = value as Record<string, unknown>

  if ('id' in fields || 'revision' in fields) {
    throw new Error('Knowledge identity belongs to the trusted file catalog')
  }

  const keys = new Set([
    'description',
    'provenance',
    'contexts',
    'references',
    'children',
    'extends',
    'overrides'
  ])

  if (Object.keys(fields).some((key) => !keys.has(key))) {
    throw new Error('Unsupported knowledge metadata')
  }

  const rawOverrides = fields.overrides ?? []

  if (
    !Array.isArray(rawOverrides) ||
    rawOverrides.length > 32 ||
    rawOverrides.some(
      (item) =>
        !item ||
        typeof item !== 'object' ||
        Array.isArray(item) ||
        Object.keys(item).some(
          (key) => !['target', 'priority', 'text'].includes(key)
        ) ||
        typeof item.text !== 'string' ||
        !item.text.length
    )
  ) {
    throw new Error('Targeted override text is required')
  }

  const overrides = Object.freeze(
    rawOverrides.map((item) =>
      Object.freeze({ target: item.target, text: item.text })
    )
  )

  return {
    metadata: {
      ...fields,
      overrides: rawOverrides.map((item) => ({
        target: item.target,
        priority: item.priority
      })),
      id: file.id,
      revision: file.revision
    } as unknown as AiKnowledgeMetadata,
    overrides,
    text: match[2]
  }
}

/** One lazy catalog per owner. Failed loads retry; closing never installs late results. */
export const createKnowledgeFileLoader = <
  T extends {
    install(file: KnowledgeFile): void
    dispose(): void
  }
>(
  load: () => Promise<readonly KnowledgeFile[]>,
  create: () => T
) => {
  let disposed = false
  let owner: T | undefined
  let pending: Promise<T> | undefined

  return {
    open(): Promise<T> {
      if (disposed) {
        throw new Error('Knowledge session is closed')
      }

      pending ??= load()
        .then((files) => {
          if (disposed) {
            throw new Error('Knowledge session is closed')
          }

          const candidate = create()

          try {
            for (const file of files) {
              candidate.install(file)
            }

            owner = candidate

            return candidate
          } catch (error) {
            candidate.dispose()
            throw error
          }
        })
        .catch((error) => {
          pending = undefined
          throw error
        })

      return pending
    },

    current() {
      if (disposed) {
        throw new Error('Knowledge session is closed')
      }

      return owner
    },

    dispose() {
      if (disposed) {
        return
      }

      disposed = true
      owner?.dispose()
    }
  }
}
