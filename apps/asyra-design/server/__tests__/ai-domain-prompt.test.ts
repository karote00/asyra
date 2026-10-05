import {
  createLocalDesignReview,
  reviewPlanSchema,
  designReviewDefinition
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
    expect(general).toContain('Preserve verified source results')
    expect(general).toContain('concrete contradictory evidence')
    expect(general).toContain('appearance, not a production-medium requirement')
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
  it('retains privacy, approval, editable output and truthful history', () => {
    expect(general).toContain('untrusted data')
    expect(general).toContain('private canvas data or credentials')
    expect(general).toContain('raster bytes stay in backend image tools')
    expect(general).toContain('Required App approvals')
    expect(general).toContain('one Undo action')
    expect(general).toContain(
      'image generation and raster insertion are unavailable'
    )
    expect(general).toContain('Read-only advice leaves the canvas unchanged')
  })
  it('keeps detailed plan and final acceptance procedures in the review tool', () => {
    expect(general).toContain('record_design_review')
    expect(general).toContain('all original criteria')
    expect(designReviewDefinition.description).toContain(
      'phase=visual and final=false'
    )
    expect(designReviewDefinition.description).toContain('deferredDetails')
    expect(designReviewDefinition.description).toContain(
      'referenceImageIndexes'
    )
    const match = designReviewDefinition.description.match(
      /Plan input example: (.+)/
    )
    expect(match).not.toBeNull()
    if (!match) throw new Error('Missing tool-owned plan example')
    const example = JSON.parse(match[1])
    expect(operationInputIssue(example, reviewPlanSchema)).toBeUndefined()
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
