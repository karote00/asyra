import { prepareCollaborationPublication } from '../../src/collaboration/factory-adapter'
import { expect, it, vi } from 'vitest'
import {
  CollaborationMessageTypes,
  encodePublicationMessageFrames,
  decodePublicationFramePublication
} from '../../src/collaboration/protocol'
import { prepareDesign } from '../design-preparation'
import { designPreparationExamples } from '../design-preparation-examples'
import { deliverPreparedDesign } from '../../src/ai/prepared-design'
import { applyCanonicalChangesToDocument } from '../document-canonical-reducer'
import { readDocumentPublicationSlices } from '../../src/collaboration/document-publication'
import type {
  SharedPublication,
  AppDocumentData
} from '../../src/collaboration/app-protocol-types'

it('replays prepared sibling creation, Undo and Redo into the exact durable property graph', async () => {
  vi.stubGlobal('window', {})
  const { default: core } = await import('../../src/contexts')
  const { applyPreset, PresetProfiles, PresetDefaults } =
    await import('@asyra/preset')
  const { createPreparedDesignAction } =
    await import('../../src/ai/design-actions')
  const { createAiTransactionRunner } = await import('../../src/ai/transaction')
  const { historyApis } = await import('../../src/common-apis/history')
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.VECTOR,
      PresetDefaults.SELECTION
    ]
  })
  core.load({
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
          children: [],
          visible: true,
          lock: false
        }
      }
    }
  })
  const save = async () =>
    JSON.parse(JSON.stringify(await core.save())) as AppDocumentData
  let durable = await save()
  const publications: SharedPublication[] = []
  const stop = core.subscribeToSharedPublication((publication) =>
    publications.push(publication)
  )
  let sequence = 0
  const replay = async () => {
    expect(publications.length).toBeGreaterThan(0)
    for (const publication of publications.splice(0)) {
      const prepared = prepareCollaborationPublication(publication)
      if (!prepared) continue
      const wire = decodePublicationFramePublication(
        encodePublicationMessageFrames({
          type: CollaborationMessageTypes.PUBLICATION,
          publication: prepared,
          fromActorId: 'prepared-publication-test',
          sequence: ++sequence
        })
      ).publication
      for (const changes of readDocumentPublicationSlices(wire)) {
        durable = applyCanonicalChangesToDocument(durable, changes)
      }
    }
    expect(durable).toEqual(await save())
  }
  try {
    const example = designPreparationExamples.find(
      (entry) => entry.draft.name === 'Repeated visible detail'
    )
    if (!example) throw new Error('Missing current multi-face example')
    const action = createPreparedDesignAction()
    const runner = createAiTransactionRunner()
    const signal = new AbortController().signal
    for (const identity of ['first', 'second']) {
      await runner.run(identity, (runMutation) =>
        action.execute(
          {
            design: deliverPreparedDesign(
              prepareDesign(example.draft, identity)
            )
          },
          { signal, runMutation }
        )
      )
      await replay()
    }
    const complete = await save()
    await historyApis.undo()
    await replay()
    expect(await save()).not.toEqual(complete)
    await historyApis.redo()
    await replay()
    expect(await save()).toEqual(complete)
  } finally {
    stop()
    vi.unstubAllGlobals()
  }
})
