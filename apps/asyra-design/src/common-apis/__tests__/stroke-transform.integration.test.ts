import { afterAll, beforeAll, expect, it } from 'vitest'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import { createDefaultStroke } from '@asyra/utils'
import core from '../../contexts'
import { strokeApis } from '../strokes'
import { historyApis } from '../history'

beforeAll(async () => {
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.VECTOR
    ]
  })
  await core.start(document.createElement('div'), { width: 128, height: 128 })
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
})
afterAll(() => core.destroy())

it.each(['single', 'batch'])(
  'preserves transformed Vector geometry and history during %s Stroke edits',
  async (mode) => {
    const groupId = `group-${mode}`
    const vectorId = `vector-${mode}`
    const strokeId = `stroke-${mode}`
    const a = `a-${mode}`
    const b = `b-${mode}`
    const segment = `segment-${mode}`
    const network = `network-${mode}`

    core.createElementInParent(
      { id: groupId, type: 'group', x: 100, y: 200 },
      'workspace'
    )
    core.createElementInParent(
      {
        id: vectorId,
        type: 'vector',
        x: 0,
        y: 0,
        width: 20,
        height: 10,
        pointCoordinateSpace: 'workspace',
        points: {
          [a]: {
            id: a,
            kind: 'anchor',
            anchorType: 'sharp',
            handleMode: 'none',
            x: 0,
            y: 0
          },
          [b]: {
            id: b,
            kind: 'anchor',
            anchorType: 'sharp',
            handleMode: 'none',
            x: 20,
            y: 10
          }
        },
        segments: {
          [segment]: {
            id: segment,
            startId: a,
            endId: b,
            inControlId: null,
            outControlId: null
          }
        },
        networks: {
          [network]: {
            id: network,
            closed: false,
            pointIds: [a, b],
            segmentIds: [segment]
          }
        },
        strokes: [createDefaultStroke({ id: strokeId, width: 3 })]
      },
      groupId
    )
    core.updateElementProperties([
      {
        elementId: vectorId,
        values: { x: 45, y: 60, width: 80, height: 30, rotation: 0.4 }
      }
    ])
    const keys = [
      'x',
      'y',
      'width',
      'height',
      'rotation',
      'points',
      'segments',
      'networks'
    ]
    const before = structuredClone(core.getElementComputedData(vectorId, keys))
    const parent = core.getElementMetadata(vectorId)?.parentId
    const publications: unknown[] = []
    const stop = core.subscribeToSharedPublication((publication) =>
      publications.push(publication)
    )

    try {
      if (mode === 'single') {
        strokeApis.updateStrokeFields(vectorId, strokeId, { width: 5 })
      } else {
        strokeApis.updateStrokeFieldsBatch([
          { elementId: vectorId, strokeId, patch: { width: 5 } }
        ])
      }

      expect(core.getElementComputedData(vectorId, keys)).toEqual(before)
      expect(core.getElementMetadata(vectorId)?.parentId).toBe(parent)
      expect(core.getElementComputedData(vectorId, ['strokes'])).toMatchObject({
        strokes: [{ id: strokeId, width: 5 }]
      })
      expect(publications).toHaveLength(1)
      await historyApis.undo({ mode: 'atomic' })
      expect(core.getElementComputedData(vectorId, keys)).toEqual(before)
      expect(core.getElementComputedData(vectorId, ['strokes'])).toMatchObject({
        strokes: [{ id: strokeId, width: 3 }]
      })
      await historyApis.redo({ mode: 'atomic' })
      expect(core.getElementComputedData(vectorId, keys)).toEqual(before)
      expect(core.getElementComputedData(vectorId, ['strokes'])).toMatchObject({
        strokes: [{ id: strokeId, width: 5 }]
      })
      expect(publications).toHaveLength(3)
    } finally {
      stop()
    }
  }
)
