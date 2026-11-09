interface CapabilitySource {
  description: string
  inputSchema: unknown
  outputSchema?: unknown
}

export interface CapabilityMetadata {
  purpose: Set<string>
  input: Set<string>
  output: Set<string>
  all: Set<string>
}

export interface CapabilityCorpus {
  weights: ReadonlyMap<string, number>
  averageLengths: Record<'purpose' | 'input' | 'output', number>
}

export const capabilityTerms = (text: string): Set<string> =>
  new Set(
    text
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .normalize('NFKC')
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
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
  const schemaTerms = (root: unknown) => {
    const fields: string[] = []
    const visited = new WeakSet<object>()

    const visit = (schema: unknown) => {
      if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        return
      }

      if (visited.has(schema)) {
        return
      }

      visited.add(schema)
      const value = schema as Record<string, unknown>

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

          Object.values(children).forEach(visit)
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
        visit(value[key])
      }

      for (const key of ['anyOf', 'oneOf', 'allOf', 'prefixItems']) {
        const children = value[key]

        if (Array.isArray(children)) {
          children.forEach(visit)
        }
      }
    }

    visit(root)

    return capabilityTerms(fields.join(' '))
  }

  const purpose = capabilityTerms(source.description)
  const input = schemaTerms(source.inputSchema)
  const output = schemaTerms(source.outputSchema)

  return {
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
      (term) =>
        metadata.purpose.has(term) ||
        metadata.input.has(term) ||
        additional.has(term)
    ).length
  }
}

/** Return authored prose, not the synthetic "owner.operation." prefix. */
export const summarizeCapability = (
  description: string,
  query: string,
  corpus: CapabilityCorpus
) => {
  const sentences = descriptionSentences(description)
  const terms = capabilityTerms(query)

  const score = (sentence: string) => {
    const words = capabilityTerms(sentence)

    return [...terms].reduce(
      (total, term) =>
        total + (words.has(term) ? (corpus.weights.get(term) ?? 0) : 0),
      0
    )
  }

  return sentences.sort((a, b) => score(b) - score(a))[0] ?? description
}
