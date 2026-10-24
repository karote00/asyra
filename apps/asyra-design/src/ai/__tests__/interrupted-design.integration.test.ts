import { deliverPreparedDesign } from '../prepared-design'
import { beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Buffer } from 'node:buffer'
import core from '@asyra/core'
import factory from '@asyra/factory'
import props from '@asyra/props-manager'
import scene from '@asyra/scene-tree'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import {
  createAiAgentRuntime,
  type AiBatchReceipt
} from '@asyra/ai-agent-runtime'
import { createAiTransactionRunner } from '../transaction'
import { createPreparedDesignAction } from '../design-actions'
import { observeAiAction } from '../runtime-input'
import {
  prepareDesign,
  createDesignPreparationSession
} from '../../../server/design-preparation'
import { elementApis } from '../../common-apis'
import { readDocumentPublicationSlices } from '../../collaboration/document-publication'
import { prepareCollaborationPublication } from '../../collaboration/factory-adapter'
import { applyCanonicalChangesToDocument } from '../../../server/document-canonical-reducer'
import { createDocumentMaterializationService } from '../../../server/document-materializer'
import { createFileDocumentMaterializationStore } from '../../../server/document-backend-store'
import {
  CollaborationMessageTypes,
  encodePublicationMessageFrames
} from '../../collaboration/protocol'
import type { AppDocumentData } from '../../collaboration/app-protocol-types'
import type { SharedPublication } from '@asyra/factory'

const persistPublications = async (
  initial: AppDocumentData,
  publications: readonly SharedPublication[]
): Promise<AppDocumentData> => {
  const parent = resolve(import.meta.dirname, '../../../../../tmp')
  await mkdir(parent, { recursive: true })
  const directory = await mkdtemp(resolve(parent, 'interrupted-document-'))
  try {
    const documentId = 'interrupted-drawing'
    const store = createFileDocumentMaterializationStore(directory)
    await store.transact(documentId, async (current, commit) => {
      commit({ ...current, document: initial })
    })
    const materializer = createDocumentMaterializationService({
      store,
      authorize: async () => undefined,
      applyCanonicalChanges: applyCanonicalChangesToDocument
    })
    const batch = {
      protocolVersion: 1,
      batchId: 'drawing-publications',
      documentId,
      expectedDurableSequence: 0,
      firstSequence: 1,
      lastSequence: publications.length,
      entries: publications.map((publication, index) => ({
        documentId,
        sequence: index + 1,
        publicationId: publication.publicationId,
        encodedPublicationFrames: encodePublicationMessageFrames({
          type: CollaborationMessageTypes.PUBLICATION,
          publication,
          fromActorId: 'drawing-client',
          sequence: index + 1
        }).map((frame) => Buffer.from(frame).toString('base64'))
      }))
    }
    await expect(materializer.materialize(batch)).resolves.toEqual({
      durableSequence: publications.length
    })
    // A lost persistence acknowledgement may retry the same batch, never redraw.
    await expect(materializer.materialize(batch)).resolves.toEqual({
      durableSequence: publications.length
    })
    const reloaded =
      await createFileDocumentMaterializationStore(directory).readCheckpoint(
        documentId
      )
    expect(reloaded.durableSequence).toBe(publications.length)
    expect(Object.keys(reloaded.publicationSequences)).toHaveLength(
      publications.length
    )
    return reloaded.document
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

beforeAll(() => {
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.VECTOR,
      PresetDefaults.SELECTION
    ]
  })
})

beforeEach(() => factory.transact.reset())

it.each(['admission', 'member-rollback', 'abort'] as const)(
  'preserves interrupted canonical members through receipts, Undo, Redo, publication and reload after %s',
  async (interruption) => {
    const initial = {
      version: '1.0.0',
      props: {},
      sceneTree: {
        workspace: 'workspace',
        workspaceList: ['workspace'],
        elements: {
          workspace: {
            id: 'workspace',
            type: 'workspace',
            name: 'Workspace',
            parentId: '',
            visible: true,
            lock: false,
            children: []
          }
        }
      }
    }
    core.load(initial)
    const snapshot = () => ({
      version: '1.0.0',
      props: props.save(),
      sceneTree: scene.save()
    })
    const design = prepareDesign(
      {
        type: 'group',
        name: 'Repeated facade',
        children: Array.from({ length: 40 }, (_, index) => ({
          type: 'rect',
          key: `panel-${index}`,
          name: `Panel ${index}`,
          x: index * 50,
          y: 20,
          width: 30,
          height: 40,
          fill: index % 2 ? '#246080' : '#80a0b0'
        }))
      },
      'interrupted'
    )
    let clock = 0
    let yields = 0
    const controller = new AbortController()
    const publications: SharedPublication[] = []
    const stop = core.subscribeToSharedPublication((p) => {
      const document = prepareCollaborationPublication(p)
      if (document) publications.push(document)
    })
    const action = observeAiAction(
      createPreparedDesignAction(undefined, async () => {
        // The real grouped owner refuses admission of the next member.
        yields++
        if (yields === 2) {
          clock = 2
          if (interruption === 'abort') controller.abort()
        }
      })
    )
    const now = vi.spyOn(Date, 'now').mockImplementation(() => clock)
    const runner = createAiTransactionRunner({
      getMutationDeadline: () => (interruption === 'admission' ? 1 : undefined)
    })
    let receipt: AiBatchReceipt | undefined
    const runtime = createAiAgentRuntime({
      provider: {
        requestActionBatch: async (_input, options) => {
          receipt = await options.executeBatch?.({
            batchId: 'draw',
            actions: [
              {
                id: 'apply',
                name: action.name,
                arguments: { design: deliverPreparedDesign(design) },
                summary: 'Build facade'
              }
            ]
          })
          return {
            batchId: 'report',
            actions: [
              { id: 'report', name: 'report', arguments: {}, summary: 'Report' }
            ]
          }
        }
      },
      actionDefinitions: [
        action,
        {
          name: 'report',
          description: 'Report',
          inputSchema: {},
          revision: 1,
          outputSchema: true,
          effect: 'read',
          resources: [],
          lifecycle: {
            cancellation: 'cooperative',
            retry: 'never',
            output: 'value'
          },
          execute: async () => ({ reported: true })
        }
      ],
      contextProvider: { getContext: async () => ({}) },
      permissionPolicy: { evaluate: () => 'allow' },
      confirmationHandler: { confirm: async () => true },
      transactionRunner: {
        run: (label, execute, request) =>
          runner.run(
            label,
            (mutate) =>
              execute(async (write, settled) => {
                if (!mutate) throw new Error('Missing grouped executor')
                return mutate(() => {
                  const value = write()
                  if (clock >= 2 && interruption === 'member-rollback')
                    throw new Error('Member failed after writing')
                  return value
                }, settled)
              }),
            request
          )
      }
    })
    try {
      const result = await runtime.run({
        intent: 'Build facade',
        signal: controller.signal
      })
      const evidence = interruption === 'abort' ? result : receipt
      if (interruption === 'abort') {
        expect(receipt).toBeUndefined()
        expect(result).toMatchObject({
          status: 'cancelled',
          transaction: { status: 'committed' }
        })
      } else {
        expect(receipt).toMatchObject({
          failure: { settlement: 'partial', actionId: 'apply' }
        })
      }
      expect(evidence).toMatchObject({
        actionResults: [
          {
            result: {
              compositionId: design.rootId,
              status: 'partial',
              appliedElementCount: 33,
              appliedRange: { start: 0, end: 33 }
            }
          }
        ]
      })
      expect(yields).toBe(2)
      const retained = snapshot()
      expect(Object.keys(retained.sceneTree.elements).sort()).toEqual(
        [
          'workspace',
          ...design.entries.slice(0, 33).map((e) => e.descriptor.id)
        ].sort()
      )
      expect(factory.getUndoHistoryDepth()).toBe(1)
      // A new request cannot replay the whole artifact over retained members.
      const retry = createAiAgentRuntime({
        provider: {
          requestActionBatch: async () => ({
            batchId: 'retry',
            actions: [
              {
                id: 'retry',
                name: action.name,
                arguments: { design: deliverPreparedDesign(design) },
                summary: 'Retry'
              }
            ]
          })
        },
        actionDefinitions: [action],
        contextProvider: { getContext: async () => ({}) },
        permissionPolicy: { evaluate: () => 'allow' },
        confirmationHandler: { confirm: async () => true },
        transactionRunner: createAiTransactionRunner()
      })
      try {
        const rejected = await retry.run({
          intent: 'Retry',
          signal: new AbortController().signal
        })
        expect(rejected.status).toBe('failed')
        expect(snapshot()).toEqual(retained)
        expect(factory.getUndoHistoryDepth()).toBe(1)
        expect(yields).toBe(2)
      } finally {
        await retry.dispose()
      }
      await factory.undo()
      expect(snapshot()).toEqual(initial)
      await factory.redo()
      expect(snapshot()).toEqual(retained)
      await Promise.resolve()
      stop()
      expect(publications.length).toBeGreaterThan(0)
      const persisted = await persistPublications(initial, publications)
      expect(persisted).toEqual(retained)
      core.load(initial)
      factory.transact.reset()
      let echoes = 0
      const unlisten = core.subscribeToSharedPublication(() => echoes++)
      try {
        for (const p of publications)
          await core.applyRemoteCanonicalChangeSlices({
            origin: p.origin,
            // Same validated App-wire to Core boundary as the collaboration adapter.
            slices: readDocumentPublicationSlices(p) as Parameters<
              typeof core.applyRemoteCanonicalChangeSlices
            >[0]['slices']
          })
        await Promise.resolve()
        expect(snapshot()).toEqual(retained)
        expect(factory.getUndoHistoryDepth()).toBe(0)
        expect(echoes).toBe(0)
      } finally {
        unlisten()
      }
      core.load(persisted)
      expect(snapshot()).toEqual(retained)
    } finally {
      stop()
      now.mockRestore()
      await runtime.dispose()
    }
  }
)

it('continues only retained remaining parts after cancellation with real history and durable state', async () => {
  const initial = {
    version: '1.0.0',
    props: {},
    sceneTree: {
      workspace: 'workspace',
      workspaceList: ['workspace'],
      elements: {
        workspace: {
          id: 'workspace',
          name: 'Workspace',
          type: 'workspace',
          parentId: '',
          visible: true,
          lock: false,
          children: []
        }
      }
    }
  }
  core.load(initial)
  const snapshot = () => ({
    version: '1.0.0',
    props: props.save(),
    sceneTree: scene.save()
  })
  // The existing test budget makes two retained partitions cheaply; this tests
  // continuation, not budget admission or a changed production limit.
  const session = createDesignPreparationSession(
    undefined,
    undefined,
    undefined,
    2000
  )
  const draftId = session.retainRejectedDraft({
    type: 'group',
    name: 'Facade',
    projection: {
      azimuth: 30,
      elevation: 25,
      scale: 1,
      originX: 0,
      originY: 0
    },
    children: Array.from({ length: 2001 }, (_, index) => ({
      type: 'projected-face',
      key: `panel-${index}`,
      name: `Panel ${index}`,
      vertices: [
        { x: index * 2, y: 0, z: 0 },
        { x: index * 2 + 1, y: 0, z: 0 },
        { x: index * 2 + 1, y: 0, z: 2 },
        { x: index * 2, y: 0, z: 2 }
      ],
      fill: index % 2 ? '#246080' : '#80a0b0'
    }))
  })
  if (!draftId) throw new Error('Missing retained source')
  const freshSignal = () => new AbortController().signal
  const firstRepair = { draftId, partition: 0 }
  const first = await session.prepareAsync(
    session.repairDraft(firstRepair),
    freshSignal(),
    firstRepair
  )
  const firstDesign = session.resolve(first.artifactId)
  const controller = new AbortController()
  const create = vi.spyOn(elementApis, 'createElementsInParent')
  const publications: SharedPublication[] = []
  const stop = core.subscribeToSharedPublication((p) => {
    const document = prepareCollaborationPublication(p)
    if (document) publications.push(document)
  })
  const action = observeAiAction(
    createPreparedDesignAction(undefined, async () => {
      // Cancel after the final acknowledged creation member, before selection and
      // delivery. Current canonical membership decides when to inject cancellation.
      if (
        firstDesign.entries.every((entry) =>
          core.getElementMetadata(entry.descriptor.id)
        )
      )
        controller.abort()
    })
  )
  const execute = async (design: typeof firstDesign, signal: AbortSignal) => {
    const runtime = createAiAgentRuntime({
      provider: {
        requestActionBatch: async () => ({
          batchId: 'part',
          actions: [
            {
              id: 'apply',
              name: action.name,
              arguments: {
                design: deliverPreparedDesign(design),
                response: 'compact'
              },
              summary: 'Apply retained part'
            }
          ]
        })
      },
      actionDefinitions: [action],
      contextProvider: { getContext: async () => ({}) },
      permissionPolicy: { evaluate: () => 'allow' },
      confirmationHandler: { confirm: async () => true },
      transactionRunner: createAiTransactionRunner()
    })
    try {
      return await runtime.run({ intent: 'Apply retained part', signal })
    } finally {
      await runtime.dispose()
    }
  }
  try {
    const cancelled = await execute(firstDesign, controller.signal)
    expect(cancelled).toMatchObject({
      status: 'cancelled',
      transaction: { status: 'committed' },
      actionResults: [
        {
          result: {
            compositionId: firstDesign.rootId,
            appliedElementCount: firstDesign.entries.length,
            plannedElementCount: firstDesign.entries.length,
            appliedRange: { start: 0, end: firstDesign.entries.length }
          }
        }
      ]
    })
    const retained = snapshot()
    const acknowledgedIds = create.mock.calls.flatMap(([entries]) =>
      entries.map((entry) => entry.id)
    )
    expect(acknowledgedIds).toEqual(
      firstDesign.entries.map((entry) => entry.descriptor.id)
    )
    expect(factory.getUndoHistoryDepth()).toBe(1)

    // A complete acknowledged partition authorizes existing retained-source
    // continuation. A merely partial member would not authorize this selection.
    const repair = {
      draftId,
      partition: 1,
      continueFromArtifact: first.artifactId
    }
    const next = await session.prepareAsync(
      session.repairDraft(repair),
      freshSignal(),
      repair
    )
    const remaining = session.resolve(next.artifactId)
    const callsBeforeRecovery = create.mock.calls.length
    const recovered = await execute(remaining, freshSignal())
    expect(recovered, JSON.stringify(recovered)).toMatchObject({
      status: 'executed'
    })
    const createdOnRecovery = create.mock.calls
      .slice(callsBeforeRecovery)
      .flatMap(([entries]) => entries.map((entry) => entry.id))
    expect(createdOnRecovery).toEqual(
      remaining.entries.slice(1).map((entry) => entry.descriptor.id)
    )
    expect(createdOnRecovery.some((id) => acknowledgedIds.includes(id))).toBe(
      false
    )
    const complete = snapshot()
    const callsAfterRecovery = create.mock.calls.length
    const duplicate = await execute(remaining, freshSignal())
    expect(duplicate.status).toBe('failed')
    expect(create).toHaveBeenCalledTimes(callsAfterRecovery)
    expect(snapshot()).toEqual(complete)
    expect(Object.keys(complete.sceneTree.elements)).toHaveLength(2003)
    expect(complete.sceneTree.elements.workspace).toMatchObject({
      children: [firstDesign.rootId]
    })
    expect(factory.getUndoHistoryDepth()).toBe(2)
    await factory.undo()
    expect(snapshot()).toEqual(retained)
    await factory.undo()
    expect(snapshot()).toEqual(initial)
    await factory.redo()
    expect(snapshot()).toEqual(retained)
    await factory.redo()
    expect(snapshot()).toEqual(complete)
    await Promise.resolve()
    stop()

    const persisted = await persistPublications(initial, publications)
    expect(persisted).toEqual(complete)
    core.load(initial)
    factory.transact.reset()
    let echoes = 0
    const unlisten = core.subscribeToSharedPublication(() => echoes++)
    try {
      for (const publication of publications)
        await core.applyRemoteCanonicalChangeSlices({
          origin: publication.origin,
          slices: readDocumentPublicationSlices(publication) as Parameters<
            typeof core.applyRemoteCanonicalChangeSlices
          >[0]['slices']
        })
      await Promise.resolve()
      expect(snapshot()).toEqual(complete)
      expect(factory.getUndoHistoryDepth()).toBe(0)
      expect(echoes).toBe(0)
    } finally {
      unlisten()
    }
    core.load(persisted)
    expect(snapshot()).toEqual(complete)

    // Same owner and prepared artifacts without interruption form the canonical
    // oracle for final geometry, fills, membership and painter order.
    core.load(initial)
    expect((await execute(firstDesign, freshSignal())).status).toBe('executed')
    expect((await execute(remaining, freshSignal())).status).toBe('executed')
    expect(snapshot()).toEqual(complete)
  } finally {
    stop()
    create.mockRestore()
    core.load(initial)
  }
}, 30000)
