import { AiDesignToolIds } from '../src/constants/ai-design'
import { toolSemantics, toolResultObject } from '../src/ai/tool-contract'
import {
  createDesignFacts,
  designFactsSchema,
  designCalculationsSchema,
  designFactsResultSchema,
  designCalculationsResultSchema
} from './local-design-facts'
import { imageRegionSchema, type ReferenceIdentity } from './local-image-tools'
import { operationInputIssue } from './operation-input-schema'

const text = { type: 'string', minLength: 1 }
const referenceNote = {
  type: 'object',
  additionalProperties: false,
  required: ['referenceId'],
  properties: {
    referenceId: text,
    purpose: text,
    region: { anyOf: [{ const: 'whole' }, imageRegionSchema] },
    limitations: { type: 'array', items: text }
  }
}
const indexes = {
  type: 'array',
  uniqueItems: true,
  items: { type: 'integer', minimum: 0, 'x-runtime-value': 'request' }
}
const referenceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['referenceImageIndexes'],
  properties: {
    referenceImageIndexes: indexes,
    references: { type: 'array', items: referenceNote }
  }
}
export const designContextDefinitions = [
  {
    type: 'function',
    name: AiDesignToolIds.RECORD_DESIGN_FACTS,
    composition: 'allowed' as const,
    ...toolSemantics(designFactsResultSchema, 'prepare', ['request-artifacts']),
    revision: 2,
    description:
      'Store or retrieve authored source notes. Supply id and statement, with optional sources, scope and verification notes. An existing id replaces that note. Omit facts to read saved notes. This does not verify a source or gate drawing. Bind the result directly or retain selected fields for later turns.',
    inputSchema: designFactsSchema
  },
  {
    type: 'function',
    name: AiDesignToolIds.RECORD_DESIGN_CALCULATIONS,
    composition: 'allowed' as const,
    ...toolSemantics(designCalculationsResultSchema, 'prepare', [
      'request-artifacts'
    ]),
    revision: 2,
    description:
      'Store or retrieve authored numeric notes with id, value and unit. Optional sources and verification describe provenance; no prior fact registration is needed. Existing ids replace notes. This stores values without calculating or certifying them. Bind or retain results for later use.',
    inputSchema: designCalculationsSchema
  },
  {
    type: 'function',
    name: AiDesignToolIds.SELECT_DESIGN_REFERENCES,
    composition: 'request' as const,
    ...toolSemantics(
      toolResultObject({
        referenceImageIndexes: indexes,
        references: { type: 'array', items: referenceNote }
      }),
      'prepare',
      ['request-artifacts']
    ),
    revision: 2,
    description:
      'Select retained attachments for visual comparison and optionally save authored purpose/limitations. Supply existing attachment indexes and optional referenceId notes; an empty selection clears it. Does not judge suitability or authorize other tools. Image consumers take their own existing reference identity and crop directly. No prior criteria or suitability registration is required.',
    inputSchema: referenceSchema
  }
]

export const createLocalDesignContext = (options: {
  resolveSources?: (sources: string[]) => string[]
  validateReferences?: (
    indexes: number[],
    referenceIds?: string[]
  ) => ReferenceIdentity[]
  prepareReferences?: (
    indexes: number[],
    signal: AbortSignal
  ) => Promise<string>
}) => {
  const facts = createDesignFacts(options.resolveSources)
  const notes = new Map<string, Record<string, unknown>>()

  return {
    async call(name: string, input: unknown, signal: AbortSignal) {
      signal.throwIfAborted()
      const definition = designContextDefinitions.find(
        (tool) => tool.name === name
      )

      if (!definition) {
        throw new Error('Unknown design context operation.')
      }

      const issue = operationInputIssue(input, definition.inputSchema)

      if (issue) {
        throw new Error(issue)
      }

      if (name === AiDesignToolIds.RECORD_DESIGN_FACTS) {
        return facts.record(input)
      }

      if (name === AiDesignToolIds.RECORD_DESIGN_CALCULATIONS) {
        return facts.recordCalculations(input)
      }

      const args = input as {
        referenceImageIndexes: number[]
        references?: ({
          referenceId: string
          region?:
            { x: number; y: number; width: number; height: number } | 'whole'
        } & Record<string, unknown>)[]
      }

      if (!options.validateReferences) {
        throw new Error('Reference identities are unavailable.')
      }

      let selected = options.validateReferences(args.referenceImageIndexes)
      const additions = args.references ?? []

      if (
        new Set(additions.map((note) => note.referenceId)).size !==
        additions.length
      ) {
        throw new Error('Reference notes require unique identities.')
      }

      const required = additions.filter(
        (note) => note.region && note.region !== 'whole'
      )

      for (const note of additions) {
        if (
          !selected.some(
            (identity) => identity.referenceId === note.referenceId
          )
        ) {
          throw new Error(
            'Reference note must identify a selected existing image.'
          )
        }
      }

      const missingBounds = selected.filter(
        (identity) =>
          !identity.validation &&
          required.some((note) => note.referenceId === identity.referenceId)
      )

      if (missingBounds.length && options.prepareReferences) {
        await options.prepareReferences(
          missingBounds.map((identity) => identity.attachmentIndex),
          signal
        )
        signal.throwIfAborted()
        selected = options.validateReferences(args.referenceImageIndexes)
      }

      for (const note of additions) {
        const identity = selected.find(
          (item) => item.referenceId === note.referenceId
        )

        if (!identity) {
          throw new Error(
            'Reference note must identify a selected existing image.'
          )
        }

        if (note.region && note.region !== 'whole') {
          const bounds = identity.validation

          if (
            !bounds ||
            note.region.x + note.region.width > bounds.width ||
            note.region.y + note.region.height > bounds.height
          ) {
            throw new Error(
              'Reference crop requires decoded image bounds and must stay inside them.'
            )
          }
        }
      }

      for (const note of additions) {
        notes.set(note.referenceId, structuredClone(note))
      }

      return {
        referenceImageIndexes: [...args.referenceImageIndexes],
        references: selected.map((identity) => ({
          referenceId: identity.referenceId,
          ...structuredClone(notes.get(identity.referenceId) ?? {})
        }))
      }
    }
  }
}
