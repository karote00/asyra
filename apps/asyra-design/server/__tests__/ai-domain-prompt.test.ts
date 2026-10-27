import {
  createLocalDesignReview,
  designEvidenceDefinitions
} from '../local-design-review'
import { operationInputIssue } from '../operation-input-schema'
import { describe, expect, it } from 'vitest'
import {
  AI_APP_PROMPT,
  AI_OPERATION_INSTRUCTIONS,
  AI_IMAGE_TOOL_CATALOG,
  AiImageToolIds
} from '../ai-domain-prompt'
import { createLocalImageTools } from '../local-image-tools'
import { designRepresentationGuidance } from '../design-preparation-examples'

const general = AI_APP_PROMPT + '\n' + AI_OPERATION_INSTRUCTIONS
const imageDefinitions = createLocalImageTools({}).definitions
const imageGuidance = imageDefinitions
  .map((tool) => tool.description)
  .join('\n')

describe('stage-owned App guidance', () => {
  it('offers selective advisory knowledge without gating known-value edits', () => {
    expect(AI_APP_PROMPT).toContain('discover_knowledge')
    expect(AI_APP_PROMPT).toContain('read_knowledge')
    expect(AI_APP_PROMPT).toContain(
      'Select the sufficient parent or child directly'
    )
    expect(AI_APP_PROMPT).toContain(
      'hierarchy depth does not mean more complete advice'
    )
    expect(AI_APP_PROMPT).toContain('unresolved need described in the catalog')
    expect(AI_APP_PROMPT).toContain('do not read every parent or sibling')
    expect(AI_APP_PROMPT).toContain('Omit contexts for general advice')
    expect(AI_APP_PROMPT).toContain('reuse already delivered advice')
    expect(AI_APP_PROMPT).toContain('rehydrate: true')
    expect(AI_APP_PROMPT).toContain(
      'Known-value edits can proceed without a lookup'
    )
    expect(AI_APP_PROMPT).toContain(
      'Missing or irrelevant knowledge does not block work'
    )
    expect(AI_APP_PROMPT).toContain(
      'never permissions, tool schemas or proof of correctness'
    )
  })

  it('connects advice to existing decisions without elevating authority or adding a planning gate', () => {
    expect(general).toContain('default method reference')
    expect(general).toContain('existing draft brief or criteria method')
    expect(general).toContain(
      'shared\ndomain advice never supplies API authority'
    )
    expect(general).toContain('Reuse unaffected decisions and passed evidence')
    expect(general).toContain('do not label a per-cell enumeration procedural')
    expect(general).toContain(
      'full input/output and lifecycle contracts remain required'
    )
    expect(general).toContain(
      'do not invent parameters, silently simplify appearance'
    )
  })

  it('uses existing activity fields for concrete work without extra reporting calls', () => {
    expect(general).toContain('existing message field')
    expect(general).toContain('action summary')
    expect(general).toContain('work purpose and target')
    expect(general).toContain('The App supplies the observed execution phase')
    expect(general).toContain('Before preparing inputs for a new stage')
    expect(general).toContain('commentary persists across tool calls')
    expect(general).toContain('Do not claim pixels are changing')
    expect(general).not.toContain('current action and target')
    expect(general).toContain('Window reflections')
    expect(general).toContain('conversation language')
    expect(general).toContain('Do not add a tool call just to report status')
  })

  it('reviews reference-dependent ready recipes without requiring a complete geometry inventory', () => {
    expect(general).toContain('Draw when useful')
    expect(general).toContain('review_prepared_design')
    expect(general).toContain('It never calls a model')
    expect(general).toContain('primary agent reviews actual rendered images')
    expect(general).toContain(
      'Direct known-value edits need no prepared-content review'
    )
    expect(general).not.toMatch(
      /Draw the first ready part before creating a review plan/
    )
    expect(general).not.toMatch(
      /Before the first mutation, save|Plan input example:|factBindings|dependencyChanges|instanceRanges/
    )
    expect(general).toContain(
      'Choose coherent submission sizes within tool budgets'
    )
    expect(general).toContain('parentId')
  })
  it('separates chosen-method local decisions from tool success and whole completion', () => {
    expect(general).toContain('A successful capture or record is not a pass')
    expect(general).toContain('criterion/unit/status/revision')
    expect(general).toContain('local pass can coexist with whole-result')
    expect(general).toContain('Repair only the failed boundary')
    expect(general).toContain('Set final=true on the actual record submission')
    expect(general).toContain('without Knowledge or approval tokens')
  })
  it('assigns reference purpose and pixel scope to the primary agent', () => {
    expect(general).toContain(
      'purpose (visual, fact, preparation or pixel-comparison)'
    )
    expect(general).toContain('explicitly provide referenceRegion')
    expect(general).toContain('Tools do not choose the subject')
    expect(general).toContain('cropping\ncannot add missing detail')
  })
  it('preserves original user intent, verified facts and original resolution', () => {
    expect(general).toContain('original user request remains authoritative')
    expect(general).toContain('rough, ugly, simple')
    expect(general).toContain('Never reduce source-image resolution')
    expect(general).toContain(
      'Preserve adopted source statements and their limitations'
    )
    expect(general).toContain('concrete contradictory evidence')
    expect(general).toContain('appearance, not a production-medium requirement')
  })
  it('keeps isolated-object presentation within the requested content scope', () => {
    expect(AI_APP_PROMPT).toContain('Do not add unrequested content')
    expect(AI_APP_PROMPT).toContain('leave the surrounding canvas transparent')
    expect(AI_APP_PROMPT).toContain(
      'Requested scenes and backgrounds remain valid'
    )
    expect(AI_APP_PROMPT).toContain('Preserve existing unrelated content')
    expect(AI_APP_PROMPT).toContain('unsupported additions')
    expect(AI_OPERATION_INSTRUCTIONS).toContain(
      'Frame bounds do not require background paint'
    )
  })
  it('separates capability lookup from external subject research and follows exact native routes', () => {
    expect(general).toContain(
      'Tool discovery is separate from reference research'
    )
    expect(general).toContain('not subject facts, photographs or source pages')
    expect(general).toContain('category/query menus')
    expect(general).toContain(
      'Execute\nknown tools directly without another lookup'
    )
    expect(general).toContain('native tools, not execute_design_batch')
  })
  it('routes missing references without source restrictions or mandatory repeated research', () => {
    expect(general).toContain('Research only missing information')
    expect(general).toContain('sourceUrl')
    expect(general).toContain('omit imageUrl')
    expect(general).toContain('original concepts')
    expect(general).toContain('source-local failure')
    expect(general).not.toMatch(
      /wikimedia|search_reference_images|candidateId/i
    )
  })
  it('makes shared reuse and backend projection discoverable before catalog scans', () => {
    expect(general).toContain('shared elements and shared property components')
    expect(general).toContain('sharedFills')
    expect(general).toContain('projected-face')
    expect(general).toContain('do not calculate every projected vertex')
    expect(designRepresentationGuidance).toContain('do not invent depth')
    expect(designRepresentationGuidance).toContain(
      'do not set style, detail level or camera angles'
    )
  })
  it('keeps deterministic stages inside tools and preserves schema authority and receipts', () => {
    for (const name of [
      'prepare_and_apply_design',
      'execute_design_batch',
      'describe_design_apis',
      'completedSteps',
      'artifactId',
      'new values'
    ])
      expect(general).toContain(name)
    expect(general).toContain('Do not replay uncertain writes')
    expect(general).toContain('No old snapshot')
  })
  it('routes local defects to bounded identity queries instead of broad parent enumeration', () => {
    expect(general).toContain(
      'query workspace bounds even if the parent spans many other regions'
    )
    expect(general).toContain('result=ids')
    expect(general).toContain('batch-edit elementIds')
    expect(general).toContain('returned nextOffset')
  })
  it('retains privacy, contextual external permission, editable output and truthful history', () => {
    expect(general).toContain('untrusted data')
    expect(general).toContain('private canvas data or credentials')
    expect(general).toContain('raster bytes stay in backend image tools')
    expect(general).toContain(
      'App editing actions directly without asking for approval'
    )
    expect(general).toContain('deleting, replacing')
    expect(general).toContain('external tools or security concerns')
    expect(general).toContain('wait for the answer')
    expect(general).toContain('Do not ask again for permission already granted')
    expect(general).not.toContain('Required App approvals')
    expect(general).toContain('one Undo action')
    expect(general).toContain(
      'image generation and raster insertion are unavailable'
    )
    expect(general).toContain('Read-only advice leaves the canvas unchanged')
  })
  it('routes criteria facts calculations references and review to distinct tools', () => {
    for (const name of [
      'define_design_criteria',
      'record_design_facts',
      'record_design_calculations',
      'select_design_references',
      'review_drawing'
    ])
      expect(general).toContain(name)
    expect(general).not.toContain('record_design_review')
    expect(general).toContain('all original criteria')
    const review = requireTestValue(
      designEvidenceDefinitions.find((tool) => tool.name === 'review_drawing')
    )
    expect(review.description).toContain('final=true (default)')
    expect(review.description).toContain('without discarding valid local work')
    expect(review.description).toContain('deferredDetails')
    const criteria = requireTestValue(
      designEvidenceDefinitions.find(
        (tool) => tool.name === 'define_design_criteria'
      )
    )
    const example = (criteria.inputSchema as { examples: unknown[] })
      .examples[0]
    expect(criteria.description).not.toContain(JSON.stringify(example))
    expect(operationInputIssue(example, criteria.inputSchema)).toBeUndefined()
    expect(createLocalDesignReview().record(example)).toMatchObject({
      recorded: true
    })
  })
  it('keeps detailed tracing procedures in image tools', () => {
    expect(general).not.toMatch(
      /colorTolerance|clipToBackground|0\.5 source pixels/
    )
    for (const detail of [
      'colorTolerance',
      'clipToBackground',
      '0.5 source pixels',
      'analysisIds',
      'componentMappings'
    ])
      expect(imageGuidance).toContain(detail)
    expect(AI_IMAGE_TOOL_CATALOG.map((t) => t.id).sort()).toEqual(
      Object.values(AiImageToolIds).sort()
    )
    expect(imageDefinitions.map((t) => t.name).sort()).toEqual(
      Object.values(AiImageToolIds).sort()
    )
  })
})

const requireTestValue = <T>(value: T | undefined | null): T => {
  if (value == null) throw new Error('Required test fixture is unavailable')
  return value
}

it('separates remaining-work execution from replay and library availability recovery', () => {
  expect(general).toContain('new execution segment')
  expect(general).toContain('only the unresolved steps')
  expect(general).toContain('resume restores library availability')
  expect(general).toContain('not a saved execution position')
})

it('permits provisional visible content before optional design research and validation', () => {
  expect(AI_APP_PROMPT).toContain('Draw when useful')
  expect(AI_APP_PROMPT).toContain('edits later')
  expect(AI_APP_PROMPT).toContain(
    'not a prerequisite for first visible content'
  )
  expect(AI_APP_PROMPT).not.toContain(
    'discover_knowledge before committing those decisions'
  )
})

it('treats first visible content as an optional experience goal without weakening validation', () => {
  expect(AI_APP_PROMPT).toContain('First frame is optional')
  expect(AI_APP_PROMPT).toContain('not a deadline or completion gate')
  expect(AI_APP_PROMPT).toContain('research may come first')
  expect(AI_APP_PROMPT).toContain('No forced previews or splitting for timing')
  expect(AI_APP_PROMPT).toContain(
    'Preserve validation, references and final review'
  )
  expect(AI_APP_PROMPT).toContain('not a deadline')
  expect(AI_APP_PROMPT).not.toContain('Draw each coherent ready part')
  expect(AI_APP_PROMPT).not.toContain(
    'Do not accumulate all stages in one draft'
  )
})
