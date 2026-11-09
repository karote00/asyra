import { describe, expect, it } from 'vitest'
import {
  buildCapabilityCorpus,
  capabilityTerms,
  capabilityQueryTerms,
  matchCapability,
  readCapabilityMetadata,
  summarizeCapability
} from '../capability-search'

describe('capability search metadata', () => {
  it('indexes legal choices without examples, defaults or substring matches', () => {
    const metadata = readCapabilityMetadata({
      description: 'Edit line joins',
      inputSchema: {
        properties: {
          join: { enum: ['bevel', 'round'] },
          mode: { const: 'outline' }
        },
        examples: [{ join: 'example-only' }],
        default: 'default-only'
      }
    })
    const corpus = buildCapabilityCorpus([{ name: 'a', metadata }])

    expect(metadata.input.has('bevel')).toBe(true)
    expect(metadata.input.has('outline')).toBe(true)
    for (const query of ['example', 'default', 'lineage', 'roundabout']) {
      expect(matchCapability(metadata, 'a', [query], corpus).score).toBe(0)
    }

    expect(matchCapability(metadata, 'a', ['bevel'], corpus).match).toEqual({
      metadataTerms: ['bevel'],
      nameTerms: [],
      unmatchedTerms: []
    })
  })

  it.each([1, 30, 100])(
    'keeps an opaque purpose owner ahead of %s receipt references',
    (count) => {
      const purpose = 'Group existing elements into an editable container'
      const target = {
        name: 'a',
        metadata: readCapabilityMetadata({
          description: purpose,
          inputSchema: {}
        })
      }
      const distractors = Array.from({ length: count }, (_, index) => ({
        name: `group_elements_${index}`,
        metadata: readCapabilityMetadata({
          description: 'Export execution receipts',
          inputSchema: {},
          outputSchema: {
            properties: {
              context: {
                description: Array(20).fill(purpose).join('. ')
              }
            }
          }
        })
      }))
      const entries = [...distractors, target]
      const corpus = buildCapabilityCorpus(entries)
      const terms = [...capabilityTerms('group existing elements')]
      const rank = entries
        .map((entry) => ({
          name: entry.name,
          ...matchCapability(entry.metadata, entry.name, terms, corpus)
        }))
        .sort((a, b) => b.score - a.score)

      expect(rank[0].name).toBe('a')
      expect(rank[0].match.nameTerms).toEqual([])
      expect(rank[0].match.unmatchedTerms).toEqual([])
      const repeated = readCapabilityMetadata({
        description: purpose.repeat(100),
        inputSchema: {}
      })

      expect(matchCapability(repeated, 'a', terms, corpus).score).toBe(
        rank[0].score
      )
    }
  )

  it('preserves relevant authored prose beyond an identity or optional-control sentence', () => {
    for (const description of [
      'hierarchy.groupElements. Group the supplied element IDs. Uses the existing public API.',
      'Optional notes record source measurements. Prepare and apply a ready part. Invalid preparation never applies.'
    ]) {
      const metadata = readCapabilityMetadata({ description, inputSchema: {} })
      const corpus = buildCapabilityCorpus([{ name: 'a', metadata }])
      const query = description.startsWith('hierarchy')
        ? 'group elements'
        : 'prepare ready part'
      const summary = summarizeCapability(description, query, corpus)

      expect(summary).toBe(description.split('. ')[1] + '.')
      expect(description).toContain(summary)
    }
  })
})

it('normalizes query connectors without altering identities or negative constraints', () => {
  expect([
    ...capabilityQueryTerms('import an image from a reference URL')
  ]).toEqual(['import', 'image', 'reference', 'url'])
  expect([...capabilityTerms('from')]).toEqual(['from'])
  expect([...capabilityQueryTerms('from')]).toEqual(['from'])
  expect([...capabilityQueryTerms('draw without fill')]).toEqual([
    'draw',
    'without',
    'fill'
  ])
  expect([...capabilityQueryTerms('do not delete')]).toEqual([
    'do',
    'not',
    'delete'
  ])
})
