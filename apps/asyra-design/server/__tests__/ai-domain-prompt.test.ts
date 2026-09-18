import { describe, expect, it } from 'vitest'
import {
  AI_APP_PROMPT,
  AI_IMAGE_TOOL_CATALOG,
  AiImageToolIds,
  AI_OPERATION_INSTRUCTIONS
} from '../ai-domain-prompt'

describe('Asyra Design backend-owned AI domain prompt', () => {
  it('defines the registered App action and image-tool policy on the server', () => {
    expect(AI_APP_PROMPT).toMatch(/Asyra Design/)
    expect(AI_APP_PROMPT).toMatch(
      /registered App actions and image tools\s+supplied with the current request/i
    )
    expect(AI_APP_PROMPT).toMatch(/only App-registered image tools/i)
    expect(AI_APP_PROMPT).toMatch(/original or derived raster.*VTracer/is)
    expect(AI_APP_PROMPT).toMatch(
      /must not enter canonical state, persistence, or collaboration/i
    )
    expect(AI_APP_PROMPT).toMatch(/confirmation.*registered actions/is)
    expect(AI_APP_PROMPT).toMatch(/do not expose.*chain-of-thought/i)
    expect(AI_APP_PROMPT).toMatch(
      /Never regenerate a\s+complete composition as a fallback/i
    )
  })

  it('treats a choice as a continuation of the original request', () => {
    expect(AI_APP_PROMPT).toContain('metadata.replyTo')
    expect(AI_APP_PROMPT).toMatch(/preserve.*original.*constraints/is)
  })

  it('advertises only registered backend image capabilities', () => {
    expect(AI_IMAGE_TOOL_CATALOG).toEqual([
      {
        capabilities: ['whole-image-raster-vectorization'],
        id: 'vtracer',
        inputMediaTypes: ['image/jpeg', 'image/png']
      },
      {
        capabilities: ['read-only-vector-component-analysis'],
        id: AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
        inputMediaTypes: []
      }
    ])
    expect(JSON.stringify(AI_IMAGE_TOOL_CATALOG)).not.toMatch(
      /background-removal|segmentation|crop/
    )
  })
})

it('requires evidence-led representation selection without a preferred primitive', () => {
  expect(AI_APP_PROMPT).not.toContain('Prefer App components')
  expect(AI_APP_PROMPT).not.toContain('Use native Oval')
  expect(AI_APP_PROMPT).toContain('analyze_vector_components')
  expect(AI_APP_PROMPT).toContain('analysisId')
  expect(AI_APP_PROMPT).toContain('ovalPathIds')
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'After every acknowledged operation'
  )
  expect(AI_OPERATION_INSTRUCTIONS).toContain('repeat review and correction')
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'execution success is not visual correctness'
  )
  expect(AI_OPERATION_INSTRUCTIONS).toContain('no improvement')
})

it('prioritizes cheaper data review before mutation, then requires actual visual review', () => {
  expect(
    AI_OPERATION_INSTRUCTIONS.indexOf('Stage 1 - data review')
  ).toBeGreaterThanOrEqual(0)
  expect(
    AI_OPERATION_INSTRUCTIONS.indexOf('Stage 2 - visual review')
  ).toBeGreaterThan(AI_OPERATION_INSTRUCTIONS.indexOf('Stage 1 - data review'))
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'before calling any mutating backend operation'
  )
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'Do not repeat an identical deterministic tool call'
  )
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'Data review cannot certify visual fidelity'
  )
})

it('reviews all objects against supported component mappings, not just Oval detection', () => {
  expect(AI_APP_PROMPT).toContain('every meaningful object')
  expect(AI_APP_PROMPT).toContain('componentTargets')
  expect(AI_APP_PROMPT).toContain('componentMappings')
  expect(AI_APP_PROMPT).toContain('not only the outer frame')
  expect(AI_APP_PROMPT).toContain(
    'Do not select a component from bounding-box shape alone'
  )
})
