import * as trajectoryImport from '../../storage/trajectory-import'
import {
  canonicalCsvMapping,
  definitionToDraft,
  trajectoryToCsv
} from '../../ui/experiments/experiment-draft'
// @vitest-environment jsdom
import { expect, it, onTestFinished, vi } from 'vitest'
import core, { runTransaction } from '@asyra/core'
import type { SharedPublication } from '@asyra/core/contracts'
import { SharedDataChannelNames } from '@asyra/utils'
import { PropertyFields } from '../../constants'
import { bootstrap } from '../bootstrap'
import { VisualAssetArchive } from '../../storage/visual-archive'
import { decodeRestrictedGlb } from '../../engine/glb/decode'
import { ThreeEngine, type GraphicsDriver } from '../../engine/three-engine'
import {
  createWorkcellFrame,
  DEFAULT_CAMERA
} from '../../render-app/workcell-frame'

it('composes the normal workcell runtime and cleans up surface subscriptions and resources', async () => {
  const host = document.createElement('div')
  host.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 640,
    height: 480,
    left: 0,
    top: 0,
    right: 640,
    bottom: 480,
    toJSON: () => ({})
  })
  const canvas = document.createElement('canvas')
  const driver: GraphicsDriver = {
    domElement: canvas,
    autoClear: true,
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    clear: vi.fn(),
    clearDepth: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn()
  }
  let onResize: ResizeObserverCallback | undefined,
    frame: FrameRequestCallback | undefined
  const disconnect = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        onResize = callback
      }
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = disconnect
    }
  )
  const runtime = await bootstrap(
    host,
    () =>
      new ThreeEngine({
        createDriver: () => driver,
        requestFrame: (callback) => {
          frame = callback
          return 1
        },
        cancelFrame: () => {
          frame = undefined
        }
      }),
    undefined,
    new VisualAssetArchive({ decode: decodeRestrictedGlb, dispose: vi.fn() })
  )
  onTestFinished(async () => {
    await runtime.dispose()
    vi.unstubAllGlobals()
  })
  const candidate = runtime.getCandidates()[0],
    model = runtime.getWorkcell(candidate.id)
  expect(candidate.name).toBe('A - Baseline workcell')
  expect(model.bodies.every((body) => body.visuals?.length === 1)).toBe(true)
  expect(model.bodies.every((body) => body.colliders.length === 0)).toBe(true)
  expect(runtime.getVisualAssets(model).size).toBe(11)
  expect(runtime.features.live.getState()).toEqual({
    status: 'idle',
    sample: null,
    error: null
  })
  const resumeEditing = runtime.pauseEditing()

  expect(() => runtime.features.live.getRecords()).not.toThrow()

  resumeEditing()
  expect((await runtime.captureSnapshot()).visualSources).toHaveLength(11)
  expect(
    model.bodies.filter((body) => body.joint.kind === 'revolute')
  ).toHaveLength(6)
  const experiments = runtime.getExperiments(candidate.id)
  expect(experiments).toHaveLength(6)
  expect(new Set(experiments.map((item) => item.id)).size).toBe(6)
  for (const item of experiments) {
    expect(runtime.preflightExperiment(item.id).blockers).toEqual([])
    const snapshot = runtime.createExperimentSnapshot(item.id, [])
    expect(snapshot.version).toBe(2)
    expect(snapshot.methodDescriptor?.manifest.name).toBe(
      'Original-part continuous clearance'
    )
    expect(
      snapshot.workcell.bodies.every(
        (body) =>
          body.colliders.length > 0 &&
          body.colliders.every((part) => part.geometry.kind === 'mesh')
      )
    ).toBe(true)
  }
  const experiment = experiments[0]
  if (!experiment) throw new Error('Expected synthetic experiment')
  expect(experiment.definition.trajectory.keyframes).toHaveLength(3)
  const preflight = runtime.preflightExperiment(experiment.id)
  expect(preflight.blockers).toEqual([])
  expect(preflight.pairs.length).toBeGreaterThan(0)
  const frozen = runtime.createExperimentSnapshot(experiment.id, [])
  const authored = {
    version: 1 as const,
    kind: 'csv' as const,
    text: trajectoryToCsv(model, experiment.definition.trajectory),
    mapping: canonicalCsvMapping(model)
  }
  const parseInput = vi.spyOn(trajectoryImport, 'prepareTrajectoryCsv')
  const convertInput = vi.spyOn(trajectoryImport, 'previewTrajectoryCsv')
  try {
    const preview = runtime.experimentInputs.previewTrajectory(authored, model)
    if (!preview.value) throw new Error('Expected valid authored input')
    await runtime.features.edit.updateExperiment(experiment.id, 1, {
      ...definitionToDraft(experiment.definition),
      trajectoryInput: authored
    })
    expect(runtime.preflightExperiment(experiment.id).blockers).toEqual([])
    const currentSnapshot = runtime.createExperimentSnapshot(experiment.id, [])
    expect(currentSnapshot.trajectory).toEqual(preview.value.trajectory)
    expect(currentSnapshot).not.toHaveProperty('trajectoryInput')
    expect(parseInput).toHaveBeenCalledOnce()
    expect(convertInput).toHaveBeenCalledOnce()
    await runtime.features.edit.updateExperiment(experiment.id, 2, {
      ...definitionToDraft(experiment.definition),
      trajectoryInput: {
        ...authored,
        text: authored.text.replace(/,0$/, ',100')
      }
    })
    expect(() => runtime.preflightExperiment(experiment.id)).toThrow(
      'out-of-limit'
    )
    expect(() => runtime.createExperimentSnapshot(experiment.id, [])).toThrow(
      'out-of-limit'
    )
    expect(parseInput).toHaveBeenCalledTimes(2)
    expect(convertInput).toHaveBeenCalledTimes(2)
    await runtime.features.history.undo()
    expect(
      runtime.createExperimentSnapshot(experiment.id, []).trajectory
    ).toEqual(preview.value.trajectory)
    expect(convertInput).toHaveBeenCalledTimes(2)
    await runtime.features.history.undo()
  } finally {
    parseInput.mockRestore()
    convertInput.mockRestore()
  }

  expect(frozen.version).toBe(2)
  expect(
    frozen.workcell.bodies.every((body) =>
      body.colliders.every((part) => part.geometry.kind === 'mesh')
    )
  ).toBe(true)
  expect(frozen.methodDescriptor?.manifest.name).toBe(
    'Original-part continuous clearance'
  )
  runtime.setFrame(
    createWorkcellFrame(
      model,
      {
        camera: DEFAULT_CAMERA,
        selectedId: null,
        grid: true
      },
      runtime.getVisualAssets(model)
    )
  )
  frame?.(1)
  const depth = runtime.getHistoryDepth()
  runtime.setCamera({ ...DEFAULT_CAMERA, position: [4, 3, 5] })
  frame?.(2)
  expect(runtime.getHistoryDepth()).toBe(depth)
  onResize?.(
    [{ contentRect: { width: 800, height: 600 } }] as ResizeObserverEntry[],
    {} as ResizeObserver
  )
  expect(driver.setSize).toHaveBeenLastCalledWith(800, 600)
  expect(runtime.getHistoryDepth()).toBe(depth)
  canvas.getBoundingClientRect = () => ({
    x: 300,
    y: 150,
    left: 300,
    top: 150,
    right: 700,
    bottom: 450,
    width: 400,
    height: 300,
    toJSON: () => ({})
  })
  runtime.setFrame({
    camera: {
      kind: 'camera',
      position: [0, 0, 5],
      target: [0, 0, 0],
      fov: 60,
      near: 0.01,
      far: 100
    },
    meshes: [
      {
        id: 'surface-proof',
        elementId: model.bodies[0].id,
        visible: true,
        descriptor: {
          kind: 'mesh',
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          shape: { kind: 'box', size: [1, 1, 1] },
          color: 0xffffff,
          opacity: 1,
          wireframe: false,
          selectable: true
        }
      }
    ]
  })
  frame?.(2)
  expect(runtime.pick(500, 300)).toBe(model.bodies[0].id)
  expect(runtime.pick(250, 300)).toBeNull()
  const listener = vi.fn(),
    unsubscribe = runtime.subscribe(listener)
  const publications = vi.fn<(publication: SharedPublication) => void>()
  const stopPublications = core.subscribeToSharedPublication(publications)
  const originalBody = model.bodies[0]
  const projectedColor = () =>
    (
      core.getElementComputedData(originalBody.id)?.[PropertyFields.BODY] as
        { color: number } | undefined
    )?.color
  expect(projectedColor()).toBe(originalBody.color)
  await runtime.features.edit.upsert(candidate.id, {
    ...originalBody,
    color: 0x123456,
    name: 'Changed base'
  })
  expect(listener).toHaveBeenCalledOnce()
  expect(projectedColor()).toBe(0x123456)
  expect(publications).toHaveBeenCalledOnce()
  await runtime.features.history.undo()
  expect(projectedColor()).toBe(originalBody.color)
  await runtime.features.history.redo()
  expect(projectedColor()).toBe(0x123456)
  expect(publications).toHaveBeenCalledTimes(3)
  expect(
    new Set(publications.mock.calls.map(([value]) => value.publicationId)).size
  ).toBe(3)
  for (const [publication] of publications.mock.calls)
    for (const slice of publication.slices)
      for (const batch of slice.batches)
        expect([
          SharedDataChannelNames.SCENE_TREE,
          SharedDataChannelNames.PROPS
        ]).toContain(batch.channel)
  const currentBody = runtime
    .getWorkcell(candidate.id)
    .bodies.find((body) => body.id === originalBody.id)
  if (!currentBody) throw new Error('Expected retained body')
  await runtime.features.edit.upsert(candidate.id, currentBody)
  expect(publications).toHaveBeenCalledTimes(3)
  expect(() =>
    runTransaction(() => {
      core.updateElementData(originalBody.id, { name: 'Rolled back' })
      throw new Error('Reject transaction')
    })
  ).toThrow('Reject transaction')
  expect(core.getElementData(originalBody.id)?.name).toBe('Changed base')
  expect(publications).toHaveBeenCalledTimes(3)
  expect(listener).toHaveBeenCalledTimes(3)
  stopPublications()
  unsubscribe()
  await runtime.dispose()
  await runtime.dispose()
  expect(() => runtime.setCamera(DEFAULT_CAMERA)).toThrow('closed')
  expect(disconnect).toHaveBeenCalledOnce()
  expect(driver.dispose).toHaveBeenCalledOnce()
  expect(host.childElementCount).toBe(0)
  vi.unstubAllGlobals()
})
