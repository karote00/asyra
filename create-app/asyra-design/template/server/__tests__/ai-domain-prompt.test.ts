import { describe, expect, it } from 'vitest'
import {
  AI_APP_PROMPT,
  AI_IMAGE_TOOL_CATALOG,
  AiImageToolIds,
  AI_OPERATION_INSTRUCTIONS
} from '../ai-domain-prompt'

it('separates a requested visual style from medium and recoverable review findings', () => {
  expect(AI_APP_PROMPT).toContain(
    'A style reference describes visible appearance'
  )
  expect(AI_APP_PROMPT).toContain(
    'Do not infer a requirement for a different output medium'
  )
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'A failed visual check is a correction task'
  )
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'identify the specific unavailable operation'
  )
  expect(AI_OPERATION_INSTRUCTIONS).not.toContain('stop execution on failure.')
})

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
        capabilities: ['explicit-solid-background-decomposition'],
        id: AiImageToolIds.VECTORIZE_IMAGE_LAYERS,
        inputMediaTypes: ['image/jpeg', 'image/png', 'image/webp']
      },
      {
        capabilities: ['whole-image-raster-vectorization'],
        id: 'vtracer',
        inputMediaTypes: ['image/jpeg', 'image/png', 'image/webp']
      },
      {
        capabilities: ['bounded-contour-quality-review'],
        id: 'review_vector_contours',
        inputMediaTypes: []
      },
      {
        capabilities: ['receipted-local-contour-refinement'],
        id: 'apply_contour_refinements',
        inputMediaTypes: []
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
  expect(AI_APP_PROMPT).toContain(
    'vectorize_image_layers BEFORE whole-image tracing'
  )
  expect(AI_APP_PROMPT).toContain('Do not overlay a native base')
  expect(AI_APP_PROMPT).toContain('every meaningful object')
  expect(AI_APP_PROMPT).toContain('componentTargets')
  expect(AI_APP_PROMPT).toContain('componentMappings')
  expect(AI_APP_PROMPT).toContain('not only the outer frame')
  expect(AI_APP_PROMPT).toContain(
    'Do not select a component from bounding-box shape alone'
  )
})

it('requires concise decisions and only material clarification without dropping review', () => {
  expect(AI_APP_PROMPT).toContain('without user-facing narration, plan prose')
  expect(AI_APP_PROMPT).toContain(
    'Use existing defaults for non-material choices'
  )
  expect(AI_APP_PROMPT).toContain('one short question')
  expect(AI_APP_PROMPT).toContain('one short factual sentence')
  expect(AI_APP_PROMPT).toContain('Required App approvals remain')
  expect(AI_OPERATION_INSTRUCTIONS).toContain('include a short message')
  expect(AI_OPERATION_INSTRUCTIONS).toContain('Stage 1 - data review')
  expect(AI_OPERATION_INSTRUCTIONS).toContain('Stage 2 - visual review')
})

it('keeps antialias cleanup and boundary-contact review independent of fidelity mode', () => {
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'Antialias coverage is not intentional texture'
  )
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'foregroundColors remains appropriate in faithful mode'
  )
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'foreground-to-background boundary contacts'
  )
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'Do not certify a detached boundary as complete'
  )
})

it('routes new layouts through semantic preparation and preserves targeted-edit intent', () => {
  expect(AI_APP_PROMPT).toContain('use prepare_design when it is')
  expect(AI_APP_PROMPT).toContain('apply_prepared_design')
  expect(AI_APP_PROMPT).toContain('actual editable text')
  expect(AI_APP_PROMPT).toContain(
    'Never invent canonical IDs, properties or descriptors'
  )
  expect(AI_APP_PROMPT).toContain('not create a new design')
  expect(AI_APP_PROMPT).toContain('Preparation is not')
})

it('distinguishes research and editable drawing from raster generation and tool installation', () => {
  expect(AI_APP_PROMPT).toContain('Research may use native web search')
  expect(AI_APP_PROMPT).toContain(
    'does not prohibit creating editable drawings'
  )
  expect(AI_APP_PROMPT).toContain(
    'A discovered tool is not an installed or callable tool'
  )
})

it('preserves reference fidelity rather than silently switching a logo to an original illustration', () => {
  expect(AI_APP_PROMPT).toContain(
    'Named existing logos and requested reproductions are reference-dependent'
  )
  expect(AI_APP_PROMPT).toContain(
    'Do not silently switch to an inspired or approximate original illustration'
  )
  expect(AI_APP_PROMPT).toContain(
    'An imported reference must go through the registered vectorization workflow'
  )
})

it('requires current identity verification before reproducing an unspecified brand logo', () => {
  expect(AI_APP_PROMPT).toContain(
    'Use the current brand identity unless the user requests a historical version'
  )
  expect(AI_APP_PROMPT).toContain('Resolve the version before drawing')
})

it('allows reimagining while prioritizing evidence for existing subjects and preserving requested viewpoint', () => {
  expect(AI_APP_PROMPT).toContain(
    'For a concrete existing subject, research design context first'
  )
  expect(AI_APP_PROMPT).toContain(
    'For original or open-ended requests, you may reimagine from the outset'
  )
  expect(AI_APP_PROMPT).toContain(
    'If suitable design context cannot be found, you may reimagine'
  )
  expect(AI_APP_PROMPT).toContain(
    'Subject identity and requested viewpoint are separate requirements'
  )
  expect(AI_APP_PROMPT).toContain(
    'A reimagined result is not a verified reproduction'
  )
})

it('requires structured design decisions and measured review without claiming geometric proof of beauty', () => {
  expect(AI_APP_PROMPT).toContain('include a compact brief')
  expect(AI_APP_PROMPT).toContain('total height alone does not verify')
  expect(AI_APP_PROMPT).toContain('Use relations for proportional native sizes')
  expect(AI_APP_PROMPT).toContain('one shared projection')
  expect(AI_APP_PROMPT).toContain('a preparation receipt describes the')
  expect(AI_APP_PROMPT).toContain(
    'Passing numeric checks does not certify beauty'
  )
})

it('does not instruct the model to stop at a request-total iteration quota', () => {
  const prompt =
    AI_APP_PROMPT +
    AI_OPERATION_INSTRUCTIONS +
    JSON.stringify(AI_IMAGE_TOOL_CATALOG)
  expect(prompt).toContain('no App-imposed total request duration')
  expect(prompt).not.toMatch(
    /at most six inspections|eight.*attempts|three generations|128 total candidate paths|32 tool calls/i
  )
})

it('treats unusable references as research recovery, not task failure', () => {
  expect(AI_APP_PROMPT).toContain(
    'A failed or unsuitable reference is a source-local failure, not a task-level blocker'
  )
  expect(AI_APP_PROMPT).toContain(
    'change search terms, source domains, or supported acquisition methods'
  )
  expect(AI_APP_PROMPT).toContain(
    'Do not ask the user to provide public reference material merely because'
  )
  expect(AI_APP_PROMPT).toContain(
    'Detailed style alone does not request exact reproduction'
  )
  expect(AI_APP_PROMPT).not.toContain(
    'if none succeeds, explain the reference limitation and request an image'
  )
})

it('uses native research without a Wikimedia-specific tool or candidate IDs', () => {
  expect(AI_APP_PROMPT).not.toContain('search_reference_images')
  expect(AI_APP_PROMPT).toContain('imageUrl and sourceUrl')
})

it('does not prescribe a language for model messages', () => {
  expect(AI_APP_PROMPT + AI_OPERATION_INSTRUCTIONS).not.toMatch(
    /English|English-only/
  )
})

it('distinguishes composition previews from native detail and recoverable evidence errors', () => {
  expect(AI_APP_PROMPT).toContain(
    'elementsTruncated refers only to object summaries'
  )
  expect(AI_APP_PROMPT).toContain('target-local regions')
  expect(AI_APP_PROMPT).toContain(
    'inspection receipt error does not mean drawing is unsupported'
  )
})

it('plans fixed-view 2D artwork around visible output without building hidden 3D structure', () => {
  expect(AI_APP_PROMPT).toContain(
    'For a fixed-view 2D deliverable, plan the final visible image'
  )
  expect(AI_APP_PROMPT).toContain('Omit fully occluded geometry and details')
  expect(AI_APP_PROMPT).toContain('do not construct a complete 3D model')
  expect(AI_APP_PROMPT).toContain('Preserve all requested visible detail')
})

it('preserves useful overlaps and requested hidden content instead of blindly deleting geometry', () => {
  expect(AI_APP_PROMPT).toContain(
    'Keep useful whole shapes that are only partially occluded'
  )
  expect(AI_APP_PROMPT).toContain('do not fragment every overlap')
  expect(AI_APP_PROMPT).toContain(
    'Preserve hidden content when the user requests it'
  )
  expect(AI_APP_PROMPT).toContain(
    'transparency, blending, shadows or reflections'
  )
  expect(AI_APP_PROMPT).toContain(
    'Do not blindly delete existing covered objects'
  )
})

it('delegates deterministic calculation and defers only intermediate image checks', () => {
  expect(AI_APP_PROMPT).toContain(
    'Separate design decisions from deterministic calculation'
  )
  expect(AI_APP_PROMPT).toContain('Reuse valid prepared artifactIds')
  expect(AI_APP_PROMPT).toContain('Do not invent a repetition or caching tool')
  expect(AI_OPERATION_INSTRUCTIONS).toContain('inspection="defer"')
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'Continue applying ready independent artifacts'
  )
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'Deferred images never waive final visual review'
  )
})

it('uses staged construction and compact patterns without sacrificing requested finish', () => {
  expect(AI_APP_PROMPT).toContain('structureCriteria')
  expect(AI_APP_PROMPT).toContain('phase=structure')
  expect(AI_APP_PROMPT).toContain('pattern')
  expect(AI_APP_PROMPT).toContain('regressions')
  expect(AI_APP_PROMPT).toContain(
    'Do not equate fewer objects with better performance'
  )
})

it('uses priority and progressive detail without precomputing deferred geometry or weakening final quality', () => {
  for (const policy of [
    'coarse global pass',
    'likely occluded',
    'deferredDetails',
    'deferredChecks',
    'instanceRanges',
    'Do not precompute deferred geometry',
    'not one model round trip per region',
    'LoD controls intermediate work'
  ])
    expect(AI_APP_PROMPT).toContain(policy)
})

it('chooses construction and refinement by the requested image rather than a viewpoint keyword', () => {
  expect(AI_APP_PROMPT).toContain(
    'A three-quarter view specifies appearance, not a 3D construction'
  )
  expect(AI_APP_PROMPT).toContain('Choose native 2D vector rings')
  expect(AI_OPERATION_INSTRUCTIONS).toContain('edit supported')
  expect(AI_OPERATION_INSTRUCTIONS).toContain(
    'update_design_element cannot change vector path points'
  )
  expect(AI_OPERATION_INSTRUCTIONS).toContain('identify the superseded IDs')
  expect(AI_OPERATION_INSTRUCTIONS).toContain('transparent/material overlays')
})
