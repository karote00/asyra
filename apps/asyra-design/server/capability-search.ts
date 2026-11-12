interface CapabilitySource {
  description: string
  inputSchema: unknown
  outputSchema?: unknown
}

export interface CapabilityMetadata {
  summary: string
  boundaries: string[]
  fields: string[]
  purpose: Set<string>
  input: Set<string>
  output: Set<string>
  all: Set<string>
}

export interface CapabilityCorpus {
  weights: ReadonlyMap<string, number>
  averageLengths: Record<'purpose' | 'input' | 'output', number>
}

const normalizeWord = (word: string) => {
  if (word.length > 4 && word.endsWith('ies')) {
    return word.slice(0, -3) + 'y'
  }

  if (word.length > 3 && word.endsWith('s') && !/(ss|us|is)$/.test(word)) {
    return word.slice(0, -1)
  }

  return word
}

export const capabilityTerms = (text: string): Set<string> =>
  new Set(
    text
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .normalize('NFKC')
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .map(normalizeWord)
  )

// Query grammar is not capability evidence. Exact identities resolve before this
// projection; metadata and meaningful constraints (including negation) stay intact.
const queryConnectors = new Set([
  'a',
  'an',
  'the',
  'from',
  'to',
  'of',
  'for',
  'with',
  'by',
  'using'
])

export const capabilityQueryTerms = (query: string): Set<string> => {
  const terms = capabilityTerms(query)
  const purpose = new Set(
    [...terms].filter((term) => !queryConnectors.has(term))
  )

  return purpose.size ? purpose : terms
}

const descriptionSentences = (description: string) =>
  description
    .split(/(?<=\.)\s+/)
    .filter((sentence) => !/^[\w-]+(?:\.[\w-]+)+\.$/.test(sentence))

export const readCapabilityMetadata = (
  source: CapabilitySource
): CapabilityMetadata => {
  const inputFields = new Set<string>()

  const schemaTerms = (root: unknown) => {
    const fields: string[] = []
    const visited = new WeakSet<object>()

    const visit = (schema: unknown, path: string[] = [], accepted = true) => {
      if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        return
      }

      if (visited.has(schema)) {
        return
      }

      visited.add(schema)
      const value = schema as Record<string, unknown>

      if (typeof value.$ref === 'string' && value.$ref.startsWith('#/')) {
        let resolved: unknown = root

        for (const segment of value.$ref.slice(2).split('/')) {
          const key = segment.replace(/~1/g, '/').replace(/~0/g, '~')

          resolved =
            resolved &&
            typeof resolved === 'object' &&
            Object.hasOwn(resolved, key)
              ? (resolved as Record<string, unknown>)[key]
              : undefined
        }

        visit(resolved, path, accepted)
      }

      for (const text of [value.title, value.description, value.const]) {
        if (typeof text === 'string') {
          fields.push(text)
        }
      }

      if (Array.isArray(value.enum)) {
        fields.push(...value.enum.filter((item) => typeof item === 'string'))
      }

      for (const key of [
        'properties',
        '$defs',
        'definitions',
        'patternProperties'
      ]) {
        const children = value[key]

        if (
          children &&
          typeof children === 'object' &&
          !Array.isArray(children)
        ) {
          if (key === 'properties') {
            fields.push(...Object.keys(children))
          }

          Object.entries(children).forEach(([name, child]) => {
            const childPath = key === 'properties' ? [...path, name] : path

            if (
              root === source.inputSchema &&
              accepted &&
              key === 'properties' &&
              child !== false
            ) {
              inputFields.add(childPath.join('/'))
            }

            visit(
              child,
              key === 'patternProperties' ? [...path, '*'] : childPath,
              accepted && !['$defs', 'definitions'].includes(key)
            )
          })
        }
      }

      for (const key of [
        'items',
        'additionalProperties',
        'contains',
        'if',
        'then',
        'else',
        'not'
      ]) {
        visit(
          value[key],
          ['items', 'additionalProperties'].includes(key)
            ? [...path, '*']
            : path,
          accepted && !['not', 'if', 'contains'].includes(key)
        )
      }

      for (const key of ['anyOf', 'oneOf', 'allOf', 'prefixItems']) {
        const children = value[key]

        if (Array.isArray(children)) {
          children.forEach((child, index) =>
            visit(
              child,
              key === 'prefixItems' ? [...path, String(index)] : path,
              accepted
            )
          )
        }
      }

      visited.delete(schema)
    }

    visit(root)

    return capabilityTerms(fields.join(' '))
  }

  const root = source.inputSchema as Record<string, unknown> | undefined
  const declaration = root?.['x-design-discovery'] as
    { purpose?: string; terms?: string[]; boundaries?: string[] } | undefined
  const summary =
    typeof declaration?.purpose === 'string'
      ? declaration.purpose
      : (descriptionSentences(source.description)[0] ?? source.description)
  const purpose = capabilityTerms(
    [
      summary,
      ...(Array.isArray(declaration?.terms)
        ? declaration.terms.filter((term) => typeof term === 'string')
        : [])
    ].join(' ')
  )
  const input = schemaTerms(source.inputSchema)
  const output = schemaTerms(source.outputSchema)

  return {
    summary,
    boundaries: Array.isArray(declaration?.boundaries)
      ? declaration.boundaries.filter(
          (boundary) => typeof boundary === 'string'
        )
      : [],
    fields: [...inputFields],
    purpose,
    input,
    output,
    all: new Set([...purpose, ...input, ...output])
  }
}

/** One document vote per term; repeated schema text cannot inflate relevance. */
export const buildCapabilityCorpus = (
  entries: readonly { name: string; metadata: CapabilityMetadata }[]
): CapabilityCorpus => {
  const frequencies = new Map<string, number>()
  const averageLengths = { purpose: 0, input: 0, output: 0 }

  for (const entry of entries) {
    for (const field of ['purpose', 'input', 'output'] as const) {
      averageLengths[field] += entry.metadata[field].size / entries.length
    }

    for (const term of new Set([
      ...entry.metadata.all,
      ...capabilityTerms(entry.name)
    ])) {
      frequencies.set(term, (frequencies.get(term) ?? 0) + 1)
    }
  }

  return {
    averageLengths,
    weights: new Map(
      [...frequencies].map(([term, count]) => [
        term,
        Math.log1p(entries.length / count)
      ])
    )
  }
}

export const matchCapability = (
  metadata: CapabilityMetadata,
  name: string,
  terms: readonly string[],
  corpus: CapabilityCorpus,
  additionalInput = ''
) => {
  const additional = capabilityTerms(additionalInput)
  const identity = capabilityTerms(name)
  const metadataTerms = terms.filter(
    (term) => metadata.all.has(term) || additional.has(term)
  )
  const nameTerms = terms.filter(
    (term) => !metadataTerms.includes(term) && identity.has(term)
  )
  const match = {
    metadataTerms,
    nameTerms,
    unmatchedTerms: terms.filter(
      (term) => !metadataTerms.includes(term) && !nameTerms.includes(term)
    )
  }
  const score = terms.reduce((total, term) => {
    // Binary term frequency with field-length normalization prevents broad
    // execution guides and shared result schemas from winning by vocabulary size.
    const fieldWeight = (
      field: 'purpose' | 'input' | 'output',
      boost: number
    ) =>
      metadata[field].has(term)
        ? boost /
          (0.25 +
            (0.75 * metadata[field].size) /
              Math.max(1, corpus.averageLengths[field]))
        : 0

    const weight = Math.max(
      fieldWeight('purpose', 4),
      fieldWeight('input', 2),
      fieldWeight('output', 1),
      additional.has(term) ? 2 : 0,
      identity.has(term) ? 0.25 : 0
    )

    return total + weight * (corpus.weights.get(term) ?? Math.log(2))
  }, 0)

  return {
    score,
    match,
    intentMatches: terms.filter(
      (term) => metadata.purpose.has(term) || additional.has(term)
    ).length
  }
}

/** Field names are exact schema paths or leaf names, never incidental prose. */
export const matchCapabilityFields = (
  metadata: CapabilityMetadata,
  requested: readonly string[]
) =>
  Object.fromEntries(
    requested.map((field) => [
      field,
      metadata.fields.filter(
        (path) =>
          path === field.replace(/^\//, '') ||
          (!field.includes('/') && path.split('/').at(-1) === field)
      )
    ])
  )

export const capabilityBoundary = (metadata: CapabilityMetadata) => ({
  purpose: metadata.summary,
  boundaries: metadata.boundaries,
  inputFields: metadata.fields.filter((path) => !path.includes('/'))
})
