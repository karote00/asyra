import { describe, expect, it } from 'vitest'
import {
  buildCapabilityCorpus,
  capabilityTerms,
  capabilityQueryTerms,
  matchCapability,
  matchCapabilityFields,
  readCapabilityMetadata
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

  it('uses authored purpose instead of choosing incidental guidance for the query', () => {
    const metadata = readCapabilityMetadata({
      description:
        'hierarchy.groupElements. Group the supplied element IDs. Use a different tool to move elements.',
      inputSchema: {}
    })

    expect(metadata.summary).toBe('Group the supplied element IDs.')
    expect(metadata.purpose.has('move')).toBe(false)
    const declared = readCapabilityMetadata({
      description: 'Optional notes record source measurements. Prepare a part.',
      inputSchema: {
        'x-design-discovery': {
          purpose: 'Prepare a ready part',
          boundaries: []
        }
      }
    })

    expect(declared.summary).toBe('Prepare a ready part')
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

it('matches only reachable positive input fields, including reused references', () => {
  const metadata = readCapabilityMetadata({
    description: 'Move a point',
    inputSchema: {
      type: 'object',
      properties: {
        first: { $ref: '#/$defs/point' },
        second: { $ref: '#/$defs/point' },
        disabled: false
      },
      $defs: {
        point: {
          type: 'object',
          properties: { x: { type: 'number' }, y: { type: 'number' } }
        },
        unused: { properties: { secret: {} } }
      },
      not: { properties: { forbidden: {} } }
    },
    outputSchema: { properties: { outputOnly: {} } }
  })

  expect(
    matchCapabilityFields(metadata, [
      'x',
      'second/y',
      'secret',
      'forbidden',
      'outputOnly',
      'disabled'
    ])
  ).toEqual({
    x: ['first/x', 'second/x'],
    'second/y': ['second/y'],
    secret: [],
    forbidden: [],
    outputOnly: [],
    disabled: []
  })
})
