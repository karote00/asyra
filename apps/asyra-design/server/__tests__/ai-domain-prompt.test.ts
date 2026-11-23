import { designContextDefinitions } from '../local-design-context'
import { describe, expect, it } from 'vitest'
import {
  AI_APP_PROMPT,
  AI_CONVERSATION_HISTORY_INSTRUCTIONS,
  AiImageToolIds
} from '../ai-domain-prompt'
import { createLocalImageTools } from '../local-image-tools'
import { createLocalKnowledgeTools } from '../local-knowledge'
import { createLocalReferenceTools } from '../local-reference-tools'
import { designRepresentationGuidance } from '../design-preparation-examples'

const general = AI_APP_PROMPT
const imageDefinitions = createLocalImageTools({}).definitions
const imageGuidance = imageDefinitions
  .map((tool) => tool.description)
  .join('\n')

describe('stage-owned App guidance', () => {
  it('publishes user authority, tool choice and optional knowledge without preloading task methods', () => {
    for (const rule of [
      "user's intent",
      'real IDs',
      'Make design decisions',
      'Delegate decided work to tools',
      'Confirm the requested result',
      'Never replay uncertain writes',
      'private document data',
      'Advice leaves the document unchanged'
    ]) {
      expect(general).toContain(rule)
    }

    expect(general).not.toMatch(
      /prepare_and_apply_design|map_retained_fills|inputScopes|submit_tool|optionalInputs|dataEvidence|source:"input"/
    )
    expect(designRepresentationGuidance).toContain('do not invent depth')
  })

  it('locates representation advice and reads it through the optional knowledge owner', async () => {
    const knowledge = createLocalKnowledgeTools('prompt-ownership')

    try {
      const signal = new AbortController().signal
      const menu = await knowledge.call('discover_knowledge', {}, signal)

      expect(menu).toContain('design.representation')
      const result = await knowledge.call(
        'read_knowledge',
        { ids: ['design.representation'] },
        signal
      )

      expect(result).toContain('define the motif once')
      expect(result).toContain('future edits should propagate')
    } finally {
      await knowledge.dispose()
    }
  })

  it('consumes chronological conversation data with current intent precedence', () => {
    expect(AI_CONVERSATION_HISTORY_INSTRUCTIONS).toContain('Prior turns')
    expect(AI_CONVERSATION_HISTORY_INSTRUCTIONS).toContain(
      'Current intent takes precedence'
    )
    expect(AI_CONVERSATION_HISTORY_INSTRUCTIONS).toContain('attachmentIndexes')
    expect(AI_CONVERSATION_HISTORY_INSTRUCTIONS).toContain('current targets')
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

  it('keeps source import details on the reference owner', () => {
    const references = createLocalReferenceTools(() => 0)
    const descriptions = references.definitions
      .map((tool) => tool.description)
      .join(' ')

    expect(descriptions).toContain('sourceUrl')
    expect(descriptions).toContain('omit imageUrl')
    expect(general).not.toContain('import_reference_image')
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
