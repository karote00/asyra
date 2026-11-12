import { designContextDefinitions } from '../local-design-context'
import { describe, expect, it } from 'vitest'
import {
  AI_APP_PROMPT,
  AI_CONVERSATION_HISTORY_INSTRUCTIONS,
  AI_OPERATION_INSTRUCTIONS,
  AI_IMAGE_TOOL_CATALOG,
  AiImageToolIds
} from '../ai-domain-prompt'
import { createLocalImageTools } from '../local-image-tools'
import { createLocalKnowledgeTools } from '../local-knowledge'
import { createLocalReferenceTools } from '../local-reference-tools'
import { designRepresentationGuidance } from '../design-preparation-examples'

const general = AI_APP_PROMPT + '\n' + AI_OPERATION_INSTRUCTIONS
const imageDefinitions = createLocalImageTools({}).definitions
const imageGuidance = imageDefinitions
  .map((tool) => tool.description)
  .join('\n')

describe('stage-owned App guidance', () => {
  it('keeps material methods optional rather than globally prescribing design order', () => {
    expect(general).not.toMatch(
      /default method reference|representative route before repeating|seamless height grade/
    )
    expect(general).toContain('optional reference material')
    expect(general).toContain('not an additional acceptance standard')
  })

  it('explains knowledge value before tool names without requiring consultation', () => {
    const value = AI_APP_PROMPT.indexOf(
      'domain principles, common failure modes'
    )

    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThan(AI_APP_PROMPT.indexOf('discover_knowledge'))
    expect(AI_APP_PROMPT).toContain(
      'even when you already know how to approach the design'
    )
    expect(AI_APP_PROMPT).toContain('avoid re-deriving relationships')
    expect(AI_APP_PROMPT).toContain(
      'Known-value edits can proceed without a lookup'
    )
    expect(AI_APP_PROMPT).toContain('No particular construction order')
  })

  it('exposes deterministic delegation and optional reusable composition before discovery', () => {
    expect(AI_APP_PROMPT).toContain(
      'You choose visual intent, design parameters'
    )
    expect(AI_APP_PROMPT).toContain('instead of manually\nexpanding values')
    expect(AI_APP_PROMPT).toContain('Prefer a suitable existing direct tool')
    expect(AI_APP_PROMPT).toContain(
      'delegate the sequence in one execute_design call with bound outputs'
    )
    expect(AI_APP_PROMPT).toContain(
      'artifact keys/prefixes or a workspace region with its filter directly to the batch'
    )
    expect(AI_APP_PROMPT).toContain(
      'use submit_tool for a finite recipe and invoke_tool'
    )
    expect(AI_APP_PROMPT).toContain('Before preparing a stage')
    expect(AI_APP_PROMPT).toContain('later use need not be known')
    expect(AI_APP_PROMPT).toContain('execute_design stages')
    expect(AI_APP_PROMPT).toContain('source:"input"')
    expect(AI_APP_PROMPT).toContain('portable inputs and outputs')
    expect(AI_APP_PROMPT).toContain(
      'Request handles cannot be saved with retain'
    )
    expect(AI_APP_PROMPT).not.toContain(
      'Preserve useful public inputs and outputs'
    )
    expect(AI_APP_PROMPT).toContain(
      'Later operations consume named values directly'
    )
    expect(AI_APP_PROMPT).toContain(
      'Successful execution attempts durable saving'
    )
    expect(AI_APP_PROMPT).toContain(
      'cannot create missing primitive capabilities'
    )
    expect(AI_APP_PROMPT).toContain(
      'registered mechanically decidable checks and repairs'
    )
    expect(AI_APP_PROMPT).toContain('Do not build a recipe for every task')
    expect(AI_APP_PROMPT).toContain(
      'save_tool retries failed saving without executing the drawing again'
    )
  })

  it('positions knowledge as a shortcut through uncertainty without extra polish', () => {
    expect(AI_APP_PROMPT).toContain(
      'shorten exploration and repeated correction'
    )
    expect(AI_APP_PROMPT).toContain('an adjustment keeps missing its target')
    expect(AI_APP_PROMPT).toContain(
      'does not raise the requested level of detail or polish'
    )
    expect(AI_APP_PROMPT).toContain(
      'Known-value edits can proceed without a lookup'
    )
    expect(AI_APP_PROMPT).toContain('No particular construction order')
  })

  it('offers selective advisory knowledge without gating known-value edits', () => {
    const knowledge = createLocalKnowledgeTools('prompt-ownership')
    const guidance = knowledge.definitions
      .map((tool) => tool.description)
      .join('\n')

    expect(AI_APP_PROMPT).toContain('discover_knowledge')
    expect(AI_APP_PROMPT).toContain('read_knowledge')
    expect(AI_APP_PROMPT).toContain(
      'Known-value edits can proceed without a lookup'
    )
    expect(AI_APP_PROMPT).toContain(
      'Missing or irrelevant knowledge does not block work'
    )
    expect(AI_APP_PROMPT).toContain(
      'never permissions, tool schemas or proof of correctness'
    )
    expect(guidance).toContain('children are optional')
    expect(guidance).toContain('rehydrate: true')
    expect(guidance).toContain('Do not read all siblings')
    knowledge.dispose()
  })

  it('connects advice to existing decisions without elevating authority or adding a planning gate', () => {
    expect(general).toContain('optional reference material')
    expect(general).toContain('not an additional acceptance standard')
    expect(general).toContain('Reuse unaffected decisions and passed evidence')
    expect(general).toContain(
      'Full input/output and lifecycle contracts are required when authoring a reusable recipe with submit_tool'
    )
    expect(general).toContain(
      'Do not invent parameters, silently simplify appearance'
    )
    expect(general).not.toContain('default method reference')
  })

  it('does not require a second approval protocol for observations', () => {
    expect(general).not.toMatch(
      /define_design_criteria|review_drawing|bindChecks|dataEvidence|optionalInputs=\["plan"\]|defining criteria/
    )
    expect(general).toContain('final')
    expect(general).toContain("user's request")
  })

  it('consumes chronological conversation data with current intent precedence', () => {
    expect(AI_CONVERSATION_HISTORY_INSTRUCTIONS).toContain(
      'metadata.conversationContext'
    )
    expect(AI_CONVERSATION_HISTORY_INSTRUCTIONS).toContain(
      'current input.intent overrides'
    )
    expect(AI_CONVERSATION_HISTORY_INSTRUCTIONS).toContain('attachmentIndexes')
    expect(AI_CONVERSATION_HISTORY_INSTRUCTIONS).toContain(
      'fresh target and evidence checks'
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
    expect(general).toContain('No particular construction order')
    expect(general).toContain('review_prepared_design')
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
    expect(general).toContain('real returned IDs')
  })
  it('leaves design judgments with the AI rather than treating a tool receipt as approval', () => {
    expect(general).toContain('tool success does not establish visual quality')
    expect(general).toContain('Final verification is your responsibility')
    expect(general).not.toContain('Completion requires all original criteria')
  })

  it('offers reference purpose and region as optional context', () => {
    const selection = requireTestValue(
      designContextDefinitions.find(
        (tool) => tool.name === 'select_design_references'
      )
    )

    expect(selection.inputSchema).toMatchObject({
      required: ['referenceImageIndexes']
    })
    expect(JSON.stringify(selection.inputSchema)).not.toMatch(
      /criterionId|requirementRevision|referenceUse/
    )
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
    expect(general).toMatch(/categor/i)
    expect(general).toContain('execute known current contracts directly')
    expect(general).toContain('Use returned action names and execution routes')
  })
  it('routes missing references without source restrictions or mandatory repeated research', () => {
    expect(general).toContain('Research only missing information')
    const references = createLocalReferenceTools(() => 0)
    const guidance = references.definitions
      .map((tool) => tool.description)
      .join('\n')

    expect(guidance).toContain('sourceUrl')
    expect(guidance).toContain('omit imageUrl')
    expect(general).toContain('original concepts')
    expect(general).toContain('source-local failure')
    expect(general).not.toMatch(
      /wikimedia|search_reference_images|candidateId/i
    )
  })
  it('makes shared reuse and backend projection discoverable before catalog scans', () => {
    expect(general).toContain('shared elements and shared property components')
    expect(general).toContain(
      'equal appearance does not itself imply linked edits'
    )
    expect(general).toContain('backend projection')
    expect(designRepresentationGuidance).toContain('do not invent depth')
    expect(designRepresentationGuidance).toContain(
      'do not set style, detail level or camera angles'
    )
  })
  it('keeps deterministic stages inside tools and preserves schema authority and receipts', () => {
    for (const name of [
      'prepare_and_apply_design',
      'execute_design',
      'describe_design_apis',
      'completedSteps',
      'artifactId',
      'new values'
    ]) {
      expect(general).toContain(name)
    }

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
  it('offers standalone notes and reference context without prior registration', () => {
    for (const tool of designContextDefinitions) {
      expect(general).toContain(tool.name)
    }

    expect(general).not.toMatch(
      /define_design_criteria|review_drawing|bindChecks/
    )
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
    ]) {
      expect(imageGuidance).toContain(detail)
    }

    expect(AI_IMAGE_TOOL_CATALOG.map((t) => t.id).sort()).toEqual(
      Object.values(AiImageToolIds).sort()
    )
    expect(imageDefinitions.map((t) => t.name).sort()).toEqual(
      Object.values(AiImageToolIds).sort()
    )
  })
})

const requireTestValue = <T>(value: T | undefined | null): T => {
  if (value == null) {
    throw new Error('Required test fixture is unavailable')
  }

  return value
}

it('separates remaining-work execution from replay and library availability recovery', () => {
  expect(general).toContain('new execution segment')
  expect(general).toContain('only the unresolved steps')
  expect(general).toContain('resume restores library availability')
  expect(general).toContain('not a saved execution position')
})

it('leaves construction order to the task without weakening final validation', () => {
  expect(AI_APP_PROMPT).toContain('No particular construction order')
  expect(AI_APP_PROMPT).toContain('Final verification is your responsibility')
  expect(AI_APP_PROMPT).not.toMatch(
    /First frame is optional|research may come first|Draw each coherent ready part|representative route before repeating/
  )
})
