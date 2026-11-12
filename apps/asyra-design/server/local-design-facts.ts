import { operationInputIssue } from './operation-input-schema'

const noteText = { type: 'string', minLength: 1, maxLength: 1000 }
const sources = { type: 'array', uniqueItems: true, items: noteText }
const fact = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'statement'],
  properties: {
    id: noteText,
    statement: noteText,
    scope: noteText,
    sources,
    verification: noteText
  }
}
const calculation = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'value', 'unit'],
  properties: {
    id: noteText,
    value: { type: 'number' },
    unit: noteText,
    sources,
    verification: noteText
  }
}
export const designFactsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: { facts: { type: 'array', items: fact } }
}
export const designCalculationsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: { calculations: { type: 'array', items: calculation } }
}
export const designFactsResultSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['facts'],
  properties: designFactsSchema.properties
}
export const designCalculationsResultSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['calculations'],
  properties: designCalculationsSchema.properties
}

type Note = { id: string; sources?: string[] } & Record<string, unknown>

/** Authored context, not independent verification or a prerequisite for drawing. */
export const createDesignFacts = (
  resolveSources: (sources: string[]) => string[] = (sources) => sources
) => {
  const facts = new Map<string, Note>()
  const calculations = new Map<string, Note>()

  const record = (
    input: unknown,
    key: 'facts' | 'calculations',
    schema: object,
    store: Map<string, Note>
  ) => {
    const issue = operationInputIssue(input, schema)

    if (issue) {
      throw new Error(issue)
    }

    const additions = (input as Record<string, Note[]>)[key] ?? []

    if (new Set(additions.map((note) => note.id)).size !== additions.length) {
      throw new Error('Note IDs must be unique within an update.')
    }

    // Resolve the entire update before publishing any value.
    const admitted = additions.map((note) => ({
      ...structuredClone(note),
      ...(note.sources ? { sources: resolveSources(note.sources) } : {})
    }))

    for (const note of admitted) {
      store.set(note.id, note)
    }

    return { [key]: structuredClone([...store.values()]) }
  }

  return {
    snapshot: () => structuredClone([...facts.values()]),

    record: (input: unknown) =>
      record(input, 'facts', designFactsSchema, facts),

    recordCalculations: (input: unknown) =>
      record(input, 'calculations', designCalculationsSchema, calculations)
  }
}
