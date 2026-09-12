import * as greenhouse from '../../domain/greenhouse'
import { RenderMesh } from '@asyra/render'
import {
  SPATIAL_PROPERTY,
  type SpatialDescriptor
} from '../../engine/spatial-contract'
import { InstancedMesh, type BufferGeometry } from 'three'
// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import * as crops from '../../domain/crop-models'
import * as projection from '../../render-app/site-projection'
import { ThreeEngine, type GraphicsDriver } from '../../engine/three-engine'
import { bootstrap } from '../bootstrap'
import * as navigation from '../../render-app/camera-navigation'

it.each(['navigation', 'history', 'redo-branch', 'soil-edit'] as const)(
  'preserves runtime ownership and disposal for %s',
  async (mode) => {
    const structure = vi.spyOn(greenhouse, 'createStructure')
    const updates = vi.spyOn(RenderMesh.prototype, 'update')
    const build = vi.spyOn(projection, 'buildSiteMeshes')
    const cropBuild = vi.spyOn(crops, 'createCropModels')
    const preset = vi.spyOn(projection, 'cameraPreset')
    let measurementMs = 0
    const measureScene = navigation.measureScene
    const measure = vi
      .spyOn(navigation, 'measureScene')
      .mockImplementation((...args) => {
        const started = performance.now()
        const result = measureScene(...args)
        measurementMs += performance.now() - started
        return result
      })
    const pan = vi.spyOn(navigation, 'panCamera')
    const driver: GraphicsDriver = {
      domElement: document.createElement('canvas'),
      autoClear: true,
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      setClearColor: vi.fn(),
      clear: vi.fn(),
      clearDepth: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn()
    }
    let pending: FrameRequestCallback | undefined
    const disconnect = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn()
        disconnect = disconnect
      }
    )
    const host = document.createElement('div')
    host.getBoundingClientRect = () => new DOMRect(0, 0, 640, 480)
    const runtime = await bootstrap(
      host,
      () =>
        new ThreeEngine({
          createDriver: () => driver,
          requestFrame: (cb) => {
            pending = cb
            return 1
          },
          cancelFrame: () => {
            pending = undefined
          }
        })
    )
    const flush = () => {
      const callback = pending
      pending = undefined
      callback?.(0)
    }
    try {
      flush()
      const notify = vi.fn(),
        unsubscribe = runtime.subscribe(notify)
      if (mode === 'navigation') {
        await runtime.setCamera('joint')
        runtime.pan(20, 10)
        const firstPan = pan.mock.results.at(-1)?.value
        const firstInput = pan.mock.calls.at(-1)?.[0]
        runtime.zoom(-10000)
        expect.soft(runtime.getZoom()).toBe(10000)
        runtime.pan(20, 10)
        const secondPan = pan.mock.results.at(-1)?.value
        const secondInput = pan.mock.calls.at(-1)?.[0]
        if (!firstInput || !secondInput)
          throw new Error('Missing camera commands')
        expect(secondInput.position).toEqual(firstPan.position)
        for (let axis = 0; axis < 3; axis++) {
          expect
            .soft(secondPan.target[axis] - secondInput.target[axis])
            .toBeCloseTo(firstPan.target[axis] - firstInput.target[axis], 8)
        }
        runtime.orbit(40, -12)
        runtime.pan(0, 0)
        const rotated = pan.mock.calls.at(-1)?.[0]
        expect(rotated?.target).toEqual(secondPan.target)
        expect(rotated?.position).not.toEqual(secondPan.position)
        runtime.actualSize()
        expect(runtime.getZoom()).toBe(100)
        await runtime.setCamera('overview')
        runtime.pan(0, 0)
        const beforeDolly = pan.mock.calls.at(-1)?.[0]
        runtime.dolly(-Math.log(2) * 1000)
        runtime.pan(0, 0)
        const afterDolly = pan.mock.calls.at(-1)?.[0]
        if (!beforeDolly || !afterDolly) throw new Error('Missing dolly camera')
        expect(runtime.getZoom()).toBe(200)
        expect(afterDolly.fov).toBe(beforeDolly.fov)
        expect(afterDolly.target).toEqual(beforeDolly.target)
        expect(navigation.cameraDistance(afterDolly)).toBeCloseTo(
          navigation.cameraDistance(beforeDolly) / 2
        )
        runtime.dolly(Math.log(2) * 1000)
        expect(runtime.getZoom()).toBe(100)
        runtime.dolly(-100000)
        expect(runtime.getZoom()).toBe(10000)
        runtime.actualSize()
        // World-space movement is independent of optical zoom and camera presets.
        const movementDistance = () => {
          runtime.pan(0, 0)
          const before = pan.mock.calls.at(-1)?.[0]
          runtime.move(0, 0, 1.5) // One second at the keyboard's base rate.
          runtime.pan(0, 0)
          const after = pan.mock.calls.at(-1)?.[0]
          if (!before || !after) throw new Error('Missing movement camera')
          expect(after.fov).toBe(before.fov)
          return Math.hypot(
            ...after.position.map((v, i) => v - before.position[i])
          )
        }
        const overviewSpeed = movementDistance()
        expect.soft(overviewSpeed).toBeCloseTo(6)
        runtime.zoom(-Math.log(4) / 0.001)
        expect.soft(movementDistance()).toBeCloseTo(overviewSpeed, 8)
        runtime.actualSize()
        runtime.zoom(-Math.log(15.21) / 0.001)
        expect(runtime.getZoom()).toBe(1521)
        const doorwaySpeed = movementDistance()
        expect.soft(doorwaySpeed).toBeGreaterThan(5)
        expect.soft(doorwaySpeed).toBeCloseTo(overviewSpeed, 8)
        runtime.zoom(-10000)
        const detailSpeed = movementDistance()
        expect.soft(detailSpeed).toBeCloseTo(overviewSpeed, 8)
        runtime.actualSize()
        expect.soft(movementDistance()).toBeCloseTo(overviewSpeed, 8)
        await runtime.setCamera('joint')
        const jointSpeed = movementDistance()
        expect.soft(jointSpeed).toBeCloseTo(overviewSpeed)
        runtime.zoom(-10000)
        expect.soft(movementDistance()).toBeCloseTo(jointSpeed, 8)
        const speedNotify = vi.fn()
        const stopSpeed = runtime.subscribeMovementSpeed(speedNotify)
        runtime.setMovementSpeed(0.1)
        expect(runtime.getMovementSpeed()).toBe(0.1)
        expect(movementDistance()).toBeCloseTo(0.1, 8)
        runtime.setMovementSpeed(0.1)
        expect(speedNotify).toHaveBeenCalledTimes(1)
        expect(() => runtime.setMovementSpeed(Number.NaN)).toThrow()
        expect(() => runtime.setMovementSpeed(0)).toThrow()
        expect(() => runtime.setMovementSpeed(61)).toThrow()
        expect(runtime.getMovementSpeed()).toBe(0.1)
        runtime.setMovementSpeed(6)
        stopSpeed()
        await runtime.setCamera('overview')
        notify.mockClear()
        const initial = runtime.getView()
        const presetCount = preset.mock.calls.length
        for (let i = 0; i < 20; i++) {
          runtime.move(0.01, -0.01, 0.02)
          runtime.dolly(1)
          runtime.look(1, -1)
          runtime.orbit(2, 1)
          runtime.zoom(1)
          runtime.pan(4, -2)
          flush()
        }
        runtime.fit()
        flush()
        runtime.actualSize()
        flush()
        expect(runtime.getZoom()).toBe(100)
        expect(preset).toHaveBeenCalledTimes(presetCount)
        expect(measure).toHaveBeenCalledTimes(1)
        expect(notify).not.toHaveBeenCalled()
        expect(runtime.getView()).toBe(initial)
        expect(build).toHaveBeenCalledTimes(1)
        await Promise.all([
          runtime.setLayer('film', false),
          runtime.setLayer('steel', false)
        ])
        flush()
        expect(runtime.getView().layers.film).toBe(false)
        expect(runtime.getView().layers.steel).toBe(false)
        await runtime.setOpacity(0.35)
        await runtime.setCamera('inside')
        flush()
        expect(runtime.getView().filmOpacity).toBe(0.35)
        expect(runtime.getView().camera).toBe('inside')
        await expect(runtime.setOpacity(Number.NaN)).rejects.toThrow()
        expect(runtime.getView().filmOpacity).toBe(0.35)
        expect(build).toHaveBeenCalledTimes(1)
        expect(pending).toBeUndefined()
      } else if (mode === 'soil-edit') {
        const initial = runtime.getConfiguration()
        const previous = build.mock.results[0].value as projection.SiteMesh[]
        const changed = {
          ...initial,
          strips: initial.strips.map((strip, i) =>
            i === 0 ? { ...strip, width: 1.1 } : strip
          )
        }
        const gpuGeometries = () => {
          const result = new Set<BufferGeometry>()
          const scene = vi.mocked(driver.render).mock.calls[0]?.[0]
          scene?.traverse((object) => {
            if (object instanceof InstancedMesh) result.add(object.geometry)
          })
          return result
        }
        const renderedInstances = () => {
          const result: string[] = []
          vi.mocked(driver.render).mock.calls[0]?.[0].traverse((object) => {
            if (object instanceof InstancedMesh)
              result.push(
                JSON.stringify([
                  object.geometry.uuid,
                  object.count,
                  object.matrixWorld.elements,
                  Array.from(object.instanceMatrix.array).slice(
                    0,
                    object.count * 16
                  )
                ])
              )
          })
          return result.sort().join('\n')
        }
        const originalRendered = renderedInstances()
        const originalGpu = gpuGeometries()
        expect(originalGpu.size).toBeGreaterThan(0)
        updates.mockClear()
        measurementMs = 0
        const started = performance.now()
        await runtime.setConfiguration(changed)
        const submitted = performance.now()
        flush()
        const flushed = performance.now()
        expect.soft(structure).toHaveBeenCalledTimes(1)
        const unchanged = previous.filter((mesh) =>
          ['steel', 'film', 'barriers', 'dimensions', 'base'].includes(mesh.id)
        )
        for (const mesh of unchanged) {
          expect
            .soft(
              updates.mock.calls.some(
                ([patch]) =>
                  (
                    patch?.[SPATIAL_PROPERTY] as
                      Extract<SpatialDescriptor, { kind: 'mesh' }> | undefined
                  )?.shape === mesh.descriptor.shape
              )
            )
            .toBe(false)
          expect
            .soft(
              (build.mock.results.at(-1)?.value as projection.SiteMesh[]).find(
                (next) => next.id === mesh.id
              )?.descriptor === mesh.descriptor
            )
            .toBe(true)
        }
        const nextGpu = gpuGeometries()
        expect(nextGpu.size).toBe(originalGpu.size)
        expect([...nextGpu].every((shape) => originalGpu.has(shape))).toBe(true)
        const next = build.mock.results.at(-1)?.value as projection.SiteMesh[]
        if (process.env.FIELDSCOPE_PROFILE === '1')
          // eslint-disable-next-line no-console -- Opt-in permanent timing evidence accompanies deterministic work assertions.
          console.log(
            JSON.stringify({
              updateMs: submitted - started,
              measurementMs,
              flushMs: flushed - submitted,
              cropBuilds: cropBuild.mock.calls.length
            })
          )
        expect.soft(cropBuild).toHaveBeenCalledTimes(1)
        const before = previous.find((mesh) =>
          mesh.id.startsWith('cucumber-1914')
        )?.descriptor
        const after = next.find(
          (mesh) =>
            mesh.id ===
            previous.find((item) => item.id.startsWith('cucumber-1914'))?.id
        )?.descriptor
        if (!before || !after)
          throw new Error('Missing planted crop descriptors')
        expect.soft(after.shape === before.shape).toBe(true)
        expect(after.instances).not.toEqual(before.instances)
        for (const layer of ['supports', 'net', 'ties', 'clips']) {
          const originals = previous.filter((mesh) => mesh.layer === layer)
          const updates = next.filter((mesh) => mesh.layer === layer)
          expect
            .soft(updates.every((mesh) => !!mesh.descriptor.instances))
            .toBe(true)
          expect
            .soft(
              updates.every(
                (mesh, i) =>
                  mesh.descriptor.shape === originals[i]?.descriptor.shape
              )
            )
            .toBe(true)
        }

        const changedRendered = renderedInstances()
        expect(changedRendered === originalRendered).toBe(false)
        await runtime.undo()
        flush()
        expect(renderedInstances() === originalRendered).toBe(true)
        await runtime.redo()
        flush()
        expect(renderedInstances() === changedRendered).toBe(true)
        expect(runtime.getConfiguration()).toEqual(changed)
        expect.soft(cropBuild).toHaveBeenCalledTimes(1)
      } else {
        const configNotify = vi.fn()
        const stopConfig = runtime.subscribeConfiguration(configNotify)
        const originalConfig = runtime.getConfiguration()
        const depth = runtime.getUndoDepth()
        const changedConfig = {
          ...originalConfig,
          width: 8,
          length: 12.7,
          height: 4.5,
          netTop: 2.6,
          netBottom: 0.5,
          topExtension: 0.3,
          soilInset: 0.12,
          startInset: 0.4,
          endInset: 0.8,
          strips: [
            { id: 'fixture-1', kind: 'drain' as const, width: 0.3 },
            { id: 'fixture-2', kind: 'soil' as const, width: 1 },
            { id: 'fixture-3', kind: 'drain' as const, width: 0.3 },
            { id: 'fixture-4', kind: 'soil' as const, width: 2 }
          ]
        }
        if (mode === 'history') {
          const configurationPresetCount = preset.mock.calls.length
          await runtime.setConfiguration(changedConfig)
          flush()
          expect(preset).toHaveBeenCalledTimes(configurationPresetCount + 1)
          expect(runtime.getConfiguration()).toEqual(changedConfig)
          expect(runtime.getUndoDepth()).toBe(depth + 1)
          expect(build).toHaveBeenCalledTimes(2)
          expect(measure).toHaveBeenCalledTimes(2)
          expect(configNotify).toHaveBeenCalledTimes(1)
          runtime.orbit(5, 2)
          runtime.zoom(5)
          flush()
          expect(build).toHaveBeenCalledTimes(2)
          await runtime.undo()
          flush()
          expect(runtime.getConfiguration()).toEqual(originalConfig)
          expect(runtime.getUndoDepth()).toBe(depth)
          expect(preset).toHaveBeenCalledTimes(configurationPresetCount + 2)
          expect(build).toHaveBeenCalledTimes(3)
          await runtime.redo()
          flush()
          expect(runtime.getConfiguration()).toEqual(changedConfig)
          expect(preset).toHaveBeenCalledTimes(configurationPresetCount + 3)
          expect(build).toHaveBeenCalledTimes(4)
          await expect(
            runtime.setConfiguration({ ...changedConfig, netBottom: 4 })
          ).rejects.toThrow()
          expect(runtime.getConfiguration()).toEqual(changedConfig)
          expect(build).toHaveBeenCalledTimes(4)
          expect(runtime.getUndoDepth()).toBe(depth + 1)
          await runtime.setConfiguration(changedConfig)
          expect(build).toHaveBeenCalledTimes(4)
        } else {
          await runtime.setConfiguration(changedConfig)
          await runtime.undo()
          flush()
          await runtime.setConfiguration({ ...originalConfig, length: 20 })
          await runtime.redo()
          flush()
          expect(runtime.getConfiguration().length).toBe(20)
        }
        stopConfig()
      }
      unsubscribe()
    } finally {
      await runtime.dispose()
      expect(driver.dispose).toHaveBeenCalledTimes(1)
      expect(disconnect).toHaveBeenCalledTimes(1)
      expect(() => runtime.orbit(1, 1)).toThrow()
      await runtime.dispose()
      expect(cropBuild).toHaveBeenCalledTimes(
        mode === 'soil-edit' || mode === 'navigation' ? 1 : 2
      )
      structure.mockRestore()
      updates.mockRestore()
      cropBuild.mockRestore()
      build.mockRestore()
      preset.mockRestore()
      measure.mockRestore()
      pan.mockRestore()
      vi.unstubAllGlobals()
    }
  },
  15000
)
