import { vi } from 'vitest'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { createAiRuntimeInput } from '../../src/ai/runtime-input'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createLocalImageTools } from '../local-image-tools'
import { createLocalReferenceTools } from '../local-reference-tools'
import { createLocalKnowledgeTools } from '../local-knowledge'
import { createLocalToolHost } from '../local-tool-host'

/** Shared audit fixture, checked against the provider's actual registration. */
export const createDeliveryAuditFixture = () => {
  const runtime = createAiRuntimeInput({
    permissionRules: {},
    provider: { requestActionBatch: vi.fn() }
  })
  const actions = runtime.actionDefinitions.map(createAiToolContract)
  const designs = createLocalDesignTools(actions)
  const execute = vi.fn(async () => {
    throw new Error('Invalid input reached browser dispatch')
  })
  const images = createLocalImageTools({})
  const preparation = {
    resolveTargets: designs.resolveTargets,
    resolveRecipe: designs.resolveRecipe,

    modelActions: (input: Parameters<typeof designs.modelActions>[0]) =>
      designs.modelActions(images.modelActions(input)),

    resolveBatch: (input: Parameters<typeof designs.resolveBatch>[0]) =>
      designs.resolveBatch(images.resolveBatch(input))
  }
  const operations = createLocalOperationTools(actions, preparation, execute, {
    getNativeTools: () => host.definitions(),

    getNativeToolsRevision: () => host.revision,

    resolveSources: images.resolveSources,
    validateReferences: images.validateReferences,
    prepareReferences: images.prepareReferences,
    referenceImages: images.referenceImages
  })
  const main = createLocalDesignWorkflow(designs, operations)
  const operationCalls = vi.fn(operations.callInternal)

  operations.callInternal = operationCalls

  const signal = new AbortController().signal
  const references = createLocalReferenceTools(() => {
    throw new Error('Invalid reference admission')
  })
  const knowledge = createLocalKnowledgeTools('api-delivery-audit')
  const host = createLocalToolHost({
    requestId: 'api-delivery-audit',
    signal,
    capacity: 1024,
    receiptCapacity: 32,
    artifactCapacity: 128,
    limits: {
      steps: 32,
      bindings: 128,
      bindingDepth: 32,
      bytes: 24000,
      issues: 8
    },
    store: {
      read: async () => undefined,

      list: async () => [],

      write: async () => {
        throw new Error('No recipe write in discovery audit')
      }
    },

    createGroups: () => [
      { name: 'design_knowledge', description: 'Knowledge', owner: knowledge },
      { name: 'image_analysis', description: 'Images', owner: images },
      {
        name: 'design_references',
        description: 'References',
        owner: references
      },
      {
        name: 'design_preparation',
        description: 'Preparation',
        owner: designs
      },
      { name: 'design_workflow', description: 'Workflow', owner: main },
      {
        name: 'design_operations',
        description: 'Operations',
        owner: operations
      }
    ]
  })

  return {
    runtime,
    actions,
    designs,
    preparation,
    execute,
    operations,
    operationCalls,
    main,
    images,
    signal,
    references,
    knowledge,
    host,

    async dispose() {
      await host.dispose()
      for (const resource of runtime.ownedResources ?? []) {
        await resource.dispose()
      }

      knowledge.dispose()
    }
  }
}
