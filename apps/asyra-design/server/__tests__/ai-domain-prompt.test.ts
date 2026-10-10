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
  it('uses existing activity fields for concrete work without extra reporting calls', () => {
    expect(general).toContain('existing message field')
    expect(general).toContain('action summary')
    expect(general).toContain('current action and target')
    expect(general).toContain('Adding window reflections')
    expect(general).toContain('conversation language')
    expect(general).toContain('Do not add a tool call just to report status')
  })

  it('admits the first ready drawing before review planning without a complete geometry inventory', () => {
    expect(general).toMatch(/first ready part.*before.*plan/s)
    expect(general).not.toMatch(
      /Before the first mutation, save|Plan input example:|factBindings|dependencyChanges|instanceRanges/
    )
    expect(general).toContain('Do not accumulate all stages in one draft')
    expect(general).toContain('parentId')
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
    expect(review.description).toContain('final=false')
    expect(review.description).toContain('deferredDetails')
    const criteria = requireTestValue(
      designEvidenceDefinitions.find(
        (tool) => tool.name === 'define_design_criteria'
      )
    )
    const match = criteria.description.match(/Plan input example: (.+)/)
    expect(match).not.toBeNull()
    const example = JSON.parse(requireTestValue(match)[1])
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
