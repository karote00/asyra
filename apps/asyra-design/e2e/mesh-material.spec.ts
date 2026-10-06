import { expect, test } from '@playwright/test'
import { createTestDocumentURL, waitForAppReady } from './test-utils'

interface ShaderProgramSource {
  vertex: { source: string }
  fragment: { source: string }
}
interface BatchProbeInstruction {
  batcher: { shader: { gpuProgram: ShaderProgramSource } }
}
interface BatchProbeRuntime {
  renderer: {
    renderPipes: {
      batch: {
        execute: (instruction: BatchProbeInstruction) => void
        addToBatch: (...args: unknown[]) => void
      }
    }
  }
}
interface ShaderProbeGpu {
  requestAdapter: () => Promise<null | {
    requestDevice: () => Promise<{
      createShaderModule: (options: { code: string }) => {
        getCompilationInfo: () => Promise<{
          messages: { type: string; message: string }[]
        }>
      }
      destroy: () => void
    }>
  }>
}

// Exercise the neutral engine boundary with real GPU programs and two faces.
test('evaluates mesh material across triangles without baking a color image', async ({
  page
}, testInfo) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  const pixels = await page.evaluate(async () => {
    const { PixiRenderEngine, requireEngineObject } =
      await import('../e2e/fixtures/__tests__/render-engine-access')
    const engine = new PixiRenderEngine()
    const initialized = await engine.initialize({
      width: 200,
      height: 100,
      resolution: 1
    })
    try {
      const mesh = requireEngineObject(
        engine.execute({
          type: 'create-object',
          objectType: 'mesh',
          properties: {
            batched: true,
            geometry: {
              positions: [0, 0, 200, 0, 200, 100, 0, 100],
              indices: [0, 1, 2, 0, 2, 3],
              uvs: [0, 0, 1, 0, 1, 1, 0, 1]
            },
            material: {
              fills: [
                {
                  kind: 'gradient',
                  type: 'linear',
                  start: { x: 0, y: 0 },
                  end: { x: 1, y: 0 },
                  stops: [
                    { position: 0, color: [1, 0, 0, 1] },
                    { position: 1, color: [0, 0, 1, 1] }
                  ]
                }
              ]
            }
          }
        })
      )
      engine.execute({
        type: 'append-child',
        parent: initialized.root,
        child: mesh
      })
      engine.execute({ type: 'flush' })
      const snapshot = engine.query({
        type: 'snapshot',
        object: mesh,
        maxDimension: 256,
        nativeResolution: true
      })
      if (snapshot.type !== 'snapshot')
        throw new Error('Missing material snapshot')
      const bitmap = await createImageBitmap(
        await (await fetch(snapshot.dataUrl)).blob()
      )
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Missing pixel observation context')
      context.drawImage(bitmap, 0, 0)
      bitmap.close()
      return [
        [50, 25],
        [50, 75],
        [150, 25],
        [150, 75]
      ].map(([x, y]) => [...context.getImageData(x, y, 1, 1).data])
    } finally {
      engine.destroy()
    }
  })
  await testInfo.attach('material-pixels', {
    body: JSON.stringify({ pixels, errors }),
    contentType: 'application/json'
  })
  expect(errors).toEqual([])
  for (let i = 0; i < pixels.length; i++) {
    const expected = i < 2 ? [191, 0, 64, 255] : [63, 0, 192, 255]
    pixels[i].forEach((channel, j) =>
      expect(Math.abs(channel - expected[j])).toBeLessThanOrEqual(2)
    )
  }
})

for (const mode of ['linear', 'radial', 'diamond', 'angular'] as const) {
  test(`uses control-point geometry for ${mode} mesh materials`, async ({
    page
  }, testInfo) => {
    await page.goto(createTestDocumentURL())
    await waitForAppReady(page)
    const result = await page.evaluate(async (type) => {
      const { PixiRenderEngine, requireEngineObject } =
        await import('../e2e/fixtures/__tests__/render-engine-access')
      const engine = new PixiRenderEngine()
      const initialized = await engine.initialize({
        width: 200,
        height: 200,
        resolution: 1
      })
      try {
        const mesh = requireEngineObject(
          engine.execute({
            type: 'create-object',
            objectType: 'mesh',
            properties: {
              batched: true,
              geometry: {
                positions: [0, 0, 200, 0, 200, 200, 0, 200],
                indices: [0, 1, 2, 0, 2, 3],
                uvs: [0, 0, 1, 0, 1, 1, 0, 1]
              },
              material: {
                fills: [
                  {
                    kind: 'gradient',
                    type,
                    start: { x: 0.5, y: 0.5 },
                    end: { x: 1, y: 0.5 },
                    stops: [
                      { position: 0, color: [1, 0, 0, 1] },
                      { position: 1, color: [0, 0, 1, 1] }
                    ]
                  }
                ]
              }
            }
          })
        )
        engine.execute({
          type: 'append-child',
          parent: initialized.root,
          child: mesh
        })
        const snapshot = engine.query({
          type: 'snapshot',
          object: mesh,
          maxDimension: 256,
          nativeResolution: true
        })
        if (snapshot.type !== 'snapshot') throw new Error('No snapshot')
        const bitmap = await createImageBitmap(
          await (await fetch(snapshot.dataUrl)).blob()
        )
        const canvas = document.createElement('canvas')
        canvas.width = 200
        canvas.height = 200
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Missing pixel observation context')
        ctx.drawImage(bitmap, 0, 0)
        bitmap.close()
        return [
          [150, 100],
          [100, 150],
          [50, 100],
          [100, 50]
        ].map(([x, y]) => [...ctx.getImageData(x, y, 1, 1).data])
      } finally {
        engine.destroy()
      }
    }, mode)
    await testInfo.attach('pixels', {
      body: JSON.stringify(result),
      contentType: 'application/json'
    })
    const expectedPhases = {
      linear: [0.505, 0.005, -0.495, 0.005],
      angular: [0, 0.25, 0.5, 0.75],
      diamond: [0.51, 0.51, 0.5, 0.5],
      radial: [0.505, 0.505, 0.495, 0.495]
    }
    const phases = expectedPhases[mode]
    phases.forEach((phase, i) => {
      const t = Math.max(0, Math.min(1, phase))
      const expected = [255 * (1 - t), 0, 255 * t, 255]
      result[i].forEach((channel, j) =>
        expect(Math.abs(channel - expected[j])).toBeLessThanOrEqual(2)
      )
    })
  })
}

test('batches mixed materials and retains the batch across camera changes', async ({
  page
}, testInfo) => {
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  const work = await page.evaluate(async () => {
    const { PixiRenderEngine, requireEngineObject } =
      await import('../e2e/fixtures/__tests__/render-engine-access')
    const engine = new PixiRenderEngine()
    const initialized = await engine.initialize({
      width: 200,
      height: 100,
      resolution: 1
    })
    // Test-only adapter instrumentation: the app never reads engine internals.
    const runtime = initialized.runtime as BatchProbeRuntime
    const batch = runtime.renderer.renderPipes.batch
    const execute = batch.execute.bind(batch),
      add = batch.addToBatch.bind(batch)
    let draws = 0,
      packs = 0
    let gpuProgram: ShaderProgramSource | undefined
    batch.execute = (instruction: BatchProbeInstruction) => {
      draws++
      gpuProgram = instruction.batcher.shader.gpuProgram
      return execute(instruction)
    }
    batch.addToBatch = (...args: unknown[]) => {
      packs++
      return add(...args)
    }
    try {
      const camera = requireEngineObject(
        engine.execute({
          type: 'create-object',
          objectType: 'container',
          properties: { transformGroup: true }
        })
      )
      engine.execute({
        type: 'append-child',
        parent: initialized.root,
        child: camera
      })
      for (let i = 0; i < 100; i++) {
        if (i % 4 === 0) {
          const stroke = requireEngineObject(
            engine.execute({
              type: 'create-object',
              objectType: 'graphics',
              properties: { x: i * 2 }
            })
          )
          engine.execute({
            type: 'draw',
            object: stroke,
            operations: [
              { type: 'move-to', x: 1, y: 0 },
              { type: 'line-to', x: 1, y: 100 },
              { type: 'stroke', paint: { color: 0x00ff00 }, width: 2 }
            ]
          })
          engine.execute({
            type: 'append-child',
            parent: camera,
            child: stroke
          })
          continue
        }
        const mesh = requireEngineObject(
          engine.execute({
            type: 'create-object',
            objectType: 'mesh',
            properties: {
              x: i * 2,
              geometry: {
                positions: [0, 0, 2, 0, 2, 100, 0, 100],
                indices: [0, 1, 2, 0, 2, 3],
                uvs: [0, 0, 1, 0, 1, 1, 0, 1]
              },
              ...(i % 2
                ? {
                    material: {
                      fills: [
                        {
                          kind: 'gradient',
                          type: 'linear',
                          start: { x: 0, y: 0 },
                          end: { x: 1, y: 0 },
                          stops: [
                            { position: 0, color: [1, 0, 0, 1] },
                            { position: 1, color: [0, 0, 1, 1] }
                          ]
                        }
                      ]
                    }
                  }
                : { tint: 0x00ff00 })
            }
          })
        )
        engine.execute({ type: 'append-child', parent: camera, child: mesh })
      }
      engine.execute({ type: 'flush' })
      const initial = { draws, packs }
      draws = 0
      packs = 0
      for (let i = 0; i < 10; i++) {
        engine.execute({
          type: 'update-object',
          object: camera,
          properties: { x: i, scaleX: 1 + i * 0.01, scaleY: 1 + i * 0.01 }
        })
        engine.execute({ type: 'flush' })
      }
      const cameraWork = { draws, packs }
      const gpu = (navigator as Navigator & { gpu?: ShaderProbeGpu }).gpu
      const adapter = await gpu?.requestAdapter()
      const shaderErrors: string[] = []
      if (adapter) {
        if (!gpuProgram) throw new Error('Missing submitted GPU program')
        const device = await adapter.requestDevice()
        try {
          for (const source of [
            gpuProgram.vertex.source,
            gpuProgram.fragment.source
          ]) {
            const module = device.createShaderModule({ code: source })
            const info = await module.getCompilationInfo()
            shaderErrors.push(
              ...info.messages
                .filter((m) => m.type === 'error')
                .map((m) => m.message)
            )
          }
        } finally {
          device.destroy()
        }
      }
      return { initial, camera: cameraWork, webGPU: !!adapter, shaderErrors }
    } finally {
      engine.destroy()
    }
  })
  await testInfo.attach('batch-work', {
    body: JSON.stringify(work),
    contentType: 'application/json'
  })
  expect(work.shaderErrors).toEqual([])
  expect(work.initial.packs).toBe(100)
  expect(work.initial.draws).toBe(1)
  expect(work.camera.packs).toBe(0)
  expect(work.camera.draws).toBe(10)
})

test('preserves hard stops, ordered alpha layers, and empty or degenerate materials', async ({
  page
}) => {
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  const result = await page.evaluate(async () => {
    const { PixiRenderEngine, requireEngineObject } =
      await import('../e2e/fixtures/__tests__/render-engine-access')
    const engine = new PixiRenderEngine()
    await engine.initialize({ width: 200, height: 100, resolution: 1 })
    const materials = [
      {
        fills: [
          {
            kind: 'gradient',
            type: 'linear',
            start: { x: 0, y: 0 },
            end: { x: 1, y: 0 },
            stops: [
              { position: 0.5, color: [1, 0, 0, 1] },
              { position: 0.5, color: [0, 0, 1, 1] }
            ]
          }
        ]
      },
      {
        fills: [
          { kind: 'solid', color: [1, 0, 0, 0.5] },
          { kind: 'solid', color: [0, 0, 1, 0.5] }
        ]
      },
      {
        fills: [
          {
            kind: 'gradient',
            type: 'radial',
            start: { x: 0.5, y: 0.5 },
            end: { x: 0.5, y: 0.5 },
            stops: [
              { position: 0, color: [0, 1, 0, 1] },
              { position: 1, color: [1, 0, 0, 1] }
            ]
          }
        ]
      },
      { fills: [] }
    ]
    const output = []
    try {
      for (const material of materials) {
        const mesh = requireEngineObject(
          engine.execute({
            type: 'create-object',
            objectType: 'mesh',
            properties: {
              geometry: {
                positions: [0, 0, 200, 0, 200, 100, 0, 100],
                indices: [0, 1, 2, 0, 2, 3],
                uvs: [0, 0, 1, 0, 1, 1, 0, 1]
              },
              material
            }
          })
        )
        const snapshot = engine.query({
          type: 'snapshot',
          object: mesh,
          maxDimension: 256,
          nativeResolution: true
        })
        if (snapshot.type !== 'snapshot') throw new Error('No snapshot')
        const bitmap = await createImageBitmap(
          await (await fetch(snapshot.dataUrl)).blob()
        )
        const canvas = document.createElement('canvas')
        canvas.width = 200
        canvas.height = 100
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Missing pixel observation context')
        ctx.drawImage(bitmap, 0, 0)
        bitmap.close()
        output.push(
          [99, 100].map((x) => [...ctx.getImageData(x, 50, 1, 1).data])
        )
        engine.execute({ type: 'destroy-object', object: mesh })
      }
      return output
    } finally {
      engine.destroy()
    }
  })
  const expected = [
    [
      [255, 0, 0, 255],
      [0, 0, 255, 255]
    ],
    [
      [128, 64, 191, 255],
      [128, 64, 191, 255]
    ],
    [
      [0, 255, 0, 255],
      [0, 255, 0, 255]
    ],
    [
      [255, 255, 255, 255],
      [255, 255, 255, 255]
    ]
  ]
  result.forEach((pair, i) =>
    pair.forEach((pixel, j) =>
      pixel.forEach((channel, k) =>
        expect(Math.abs(channel - expected[i][j][k])).toBeLessThanOrEqual(1)
      )
    )
  )
})

test('rebuilds batch boundaries after explicit mesh batching changes', async ({
  page
}) => {
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  const counts = await page.evaluate(async () => {
    const { PixiRenderEngine, requireEngineObject } =
      await import('../e2e/fixtures/__tests__/render-engine-access')
    const engine = new PixiRenderEngine()
    const ready = await engine.initialize({
      width: 60,
      height: 20,
      resolution: 1
    })
    const runtime = ready.runtime as BatchProbeRuntime
    const batch = runtime.renderer.renderPipes.batch
    const execute = batch.execute.bind(batch)
    let draws = 0
    batch.execute = (instruction: BatchProbeInstruction) => {
      draws++
      return execute(instruction)
    }
    try {
      const meshes = [0, 1, 2].map((index) => {
        const mesh = requireEngineObject(
          engine.execute({
            type: 'create-object',
            objectType: 'mesh',
            properties: {
              x: index * 20,
              batched: true,
              geometry: {
                positions: [0, 0, 20, 0, 20, 20, 0, 20],
                indices: [0, 1, 2, 0, 2, 3],
                uvs: [0, 0, 1, 0, 1, 1, 0, 1]
              },
              material: { fills: [{ kind: 'solid', color: [1, 0, 0, 1] }] }
            }
          })
        )
        engine.execute({
          type: 'append-child',
          parent: ready.root,
          child: mesh
        })
        return mesh
      })
      const result = []
      for (const enabled of [true, false, true]) {
        engine.execute({
          type: 'update-object',
          object: meshes[1],
          properties: { batched: enabled }
        })
        draws = 0
        engine.execute({ type: 'flush' })
        result.push(draws)
      }
      // Invalid replacement leaves the last valid material/resource in place.
      let rejected = false
      try {
        engine.execute({
          type: 'update-object',
          object: meshes[1],
          properties: {
            material: { fills: [{ kind: 'solid', color: [NaN, 0, 0, 1] }] }
          }
        })
      } catch {
        rejected = true
      }
      if (!rejected) throw new Error('Invalid material accepted')
      engine.execute({ type: 'flush' })
      return result
    } finally {
      engine.destroy()
    }
  })
  expect(counts).toEqual([1, 3, 1])
})
