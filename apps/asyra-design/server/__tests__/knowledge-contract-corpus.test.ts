import { expect, it, vi } from 'vitest'
import { createLocalKnowledgeTools } from '../local-knowledge'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import { createLocalToolHost } from '../local-tool-host'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'
import {
  nativeToolInputSchema,
  operationInputIssue
} from '../operation-input-schema'
import { readCompleteInformation } from './tool-contract-assertions'
import { workflowUsageParameters } from '../design-workflow-discovery'

it('delivers current discovery selectors in every loaded Knowledge document and executable example', async () => {
  const signal = new AbortController().signal
  const knowledge = createLocalKnowledgeTools('knowledge-corpus')
  const actions = [
    { name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }
  ]
  const designs = createLocalDesignTools(actions)
  const operations = createLocalOperationTools(actions, designs, vi.fn())
  const host = createLocalToolHost({
    requestId: 'knowledge-corpus',
    signal,
    capacity: 32,
    receiptCapacity: 8,
    artifactCapacity: 32,
    limits: LocalToolLibraryLimits.recipe,
    store: {
      read: async () => undefined,

      list: async () => [],

      write: async () => {
        throw Error('No writes')
      }
    },

    createGroups: () => [
      { name: 'knowledge', description: 'Knowledge', owner: knowledge },
      {
        name: 'design_preparation',
        description: 'Preparation',
        owner: designs
      },
      {
        name: 'design_operations',
        description: 'Operations',
        owner: operations
      }
    ]
  })

  try {
    const catalog = JSON.parse(
      await knowledge.call(
        'discover_knowledge',
        {
          contexts: ['architectural-illustration', 'landing-page', 'docs-page']
        },
        signal
      )
    )
    const documents = new Map<string, string>()

    for (const entry of catalog.entries) {
      const read = JSON.parse(
        await readCompleteInformation(
          (input, requestedTool) =>
            knowledge.call(requestedTool, input, signal),
          {
            ids: [entry.id],
            contexts: [
              'architectural-illustration',
              'landing-page',
              'docs-page'
            ],
            rehydrate: true
          },
          'read_knowledge'
        )
      )

      for (const document of read.documents) {
        documents.set(document.target, document.text)
      }
    }

    expect(documents.size).toBeGreaterThan(10)
    const oldSelectors: string[] = []
    const invalidExamples: string[] = []

    for (const [id, text] of documents) {
      expect(text, id).not.toMatch(
        /whole-result obligation|request-bound review credentials|set final on the actual final judgment/
      )

      for (const line of text.split('\n')) {
        if (
          /operations.*use `operations`|semantic `operations` selector|Exact `operations`|using `operations`|through `operations`/i.test(
            line
          )
        ) {
          oldSelectors.push(`${id}: ${line}`)
        }
      }

      for (const match of text.matchAll(/```json[^\n]*\n([\s\S]*?)\n```/g)) {
        const sample = JSON.parse(match[1])

        if (!sample.tool || !sample.arguments) {
          continue
        }

        const definition = host
          .definitions()
          .find(
            (tool) =>
              tool.name === sample.tool ||
              tool.registeredName.endsWith('.' + sample.tool)
          )

        if (!definition) {
          throw new Error(`${id}: unknown tool ${sample.tool}`)
        }

        const issue = operationInputIssue(
          sample.arguments,
          workflowUsageParameters(nativeToolInputSchema(definition.inputSchema))
        )

        if (issue) {
          invalidExamples.push(`${id}: ${sample.tool}: ${issue}`)
        }
      }
    }

    expect(invalidExamples).toEqual([])
    expect(oldSelectors).toEqual([])
  } finally {
    await host.dispose()
    knowledge.dispose()
  }
})
