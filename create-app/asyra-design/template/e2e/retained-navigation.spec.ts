import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { createTestDocumentURL, waitForAppReady } from './test-utils'
import { installNavigationWorkProbe } from './navigation-work-probe'

test('wheel input avoids unused engine hit tests while pointer targets remain available', async ({
  page
}) => {
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  const result = await page.evaluate(async () => {
    const { PixiRenderEngine } =
      await import('../e2e/fixtures/__tests__/render-engine-access')
    const engine = new PixiRenderEngine()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const initialized = await engine.initialize({
      host,
      width: 300,
      height: 300
    })
    const canvas = initialized.surface as HTMLCanvasElement
    // Test-only inspection of the concrete adapter; product consumers use Core.
    const runtime = initialized.runtime as {
      renderer: {
        events: {
          rootBoundary: { hitTest: (x: number, y: number) => unknown }
        }
      }
    }
    const boundary = runtime.renderer.events.rootBoundary
    const originalHitTest = boundary.hitTest.bind(boundary)
    let hitTests = 0
    boundary.hitTest = (x, y) => {
      hitTests++
      return originalHitTest(x, y)
    }
    let nativeWheels = 0
    canvas.addEventListener('wheel', () => nativeWheels++)
    const pointerTargets: unknown[] = []
    const unsubscribe = engine.subscribeToInteraction((event) => {
      if (event.type === 'pointerdown') pointerTargets.push(event.target)
    })
    try {
      const object = engine.execute({
        type: 'create-object',
        requestId: 'interactive-target',
        objectType: 'graphics',
        properties: { eventMode: 'static' }
      }).object
      if (!object) throw new Error('Missing interactive handle')
      engine.execute({
        type: 'draw',
        object,
        operations: [
          { type: 'rect', x: 20, y: 20, width: 60, height: 60 },
          { type: 'fill', paint: { color: '#338899' } }
        ]
      })
      engine.execute({
        type: 'append-child',
        parent: initialized.root,
        child: object
      })
      engine.execute({ type: 'flush' })
      const bounds = canvas.getBoundingClientRect()
      for (const metaKey of [false, true]) {
        canvas.dispatchEvent(
          new WheelEvent('wheel', {
            clientX: bounds.left + 40,
            clientY: bounds.top + 40,
            deltaY: 1,
            metaKey,
            bubbles: true
          })
        )
      }
      const wheelHitTests = hitTests
      canvas.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: bounds.left + 40,
          clientY: bounds.top + 40,
          pointerId: 1,
          pointerType: 'mouse',
          button: 0,
          buttons: 1,
          bubbles: true
        })
      )
      const query = engine.query({ type: 'hit-test', point: { x: 40, y: 40 } })
      return {
        wheelHitTests,
        nativeWheels,
        pointerHits: pointerTargets.filter((target) => target === object)
          .length,
        explicitHit: query.type === 'hit' && query.target === object,
        requiredHitTests: hitTests - wheelHitTests
      }
    } finally {
      unsubscribe()
      engine.destroy()
      host.remove()
    }
  })
  expect(result).toEqual({
    wheelHitTests: 0,
    nativeWheels: 2,
    pointerHits: 1,
    explicitHit: true,
    requiredHitTests: 2
  })
})

test('retains camera batches and bounds geometry uploads for a local edit', async ({
  page
}, testInfo) => {
  await installNavigationWorkProbe(page)
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  const work = await page.evaluate(async () => {
    const { PixiRenderEngine } =
      await import('../e2e/fixtures/__tests__/render-engine-access')
    const engine = new PixiRenderEngine()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const { root } = await engine.initialize({ host, width: 300, height: 300 })
    const camera = engine.execute({
      type: 'create-object',
      requestId: 'camera',
      objectType: 'container',
      properties: { transformGroup: true }
    }).object
    if (!camera) throw new Error('Missing camera handle')
    engine.execute({ type: 'append-child', parent: root, child: camera })
    const objects = []
    const operations = [
      { type: 'clear' as const },
      { type: 'rect' as const, x: 0, y: 0, width: 4, height: 4 },
      { type: 'fill' as const, paint: { color: '#338899' } }
    ]
    for (let index = 0; index < 1024; index++) {
      const object = engine.execute({
        type: 'create-object',
        requestId: String(index),
        objectType: 'graphics',
        properties: {
          batched: true,
          x: (index % 32) * 6,
          y: Math.floor(index / 32) * 6
        }
      }).object
      if (!object) throw new Error('Missing graphic handle')
      engine.execute({ type: 'draw', object, operations })
      engine.execute({ type: 'append-child', parent: camera, child: object })
      objects.push(object)
    }
    const reset = () => {
      window.navigationGpuWork = {
        draws: 0,
        vertexUploadBytes: 0,
        uniformMatrices: 0
      }
    }
    reset()
    engine.execute({ type: 'flush' })
    const cold = { ...window.navigationGpuWork }
    reset()
    for (let index = 0; index < 5; index++) {
      engine.execute({
        type: 'update-object',
        object: camera,
        properties: {
          x: index * 2,
          scaleX: 1 + index / 100,
          scaleY: 1 + index / 100
        }
      })
      engine.execute({ type: 'flush' })
    }
    const navigation = { ...window.navigationGpuWork }
    reset()
    engine.execute({
      type: 'draw',
      object: objects[512],
      operations: [
        { type: 'clear' },
        { type: 'rect', x: 0, y: 0, width: 5, height: 5 },
        { type: 'fill', paint: { color: '#ff3300' } }
      ]
    })
    engine.execute({ type: 'flush' })
    const edit = { ...window.navigationGpuWork }
    engine.destroy()
    host.remove()
    return { cold, navigation, edit }
  })
  await writeFile(
    testInfo.outputPath('retained-work.json'),
    JSON.stringify(work, null, 2)
  )
  expect(work.cold.draws).toBeLessThan(32)
  expect(work.navigation.draws).toBeLessThan(160)
  expect(work.navigation.vertexUploadBytes).toBe(0)
  expect(work.edit.vertexUploadBytes).toBeGreaterThan(0)
  expect(work.edit.vertexUploadBytes).toBeLessThan(
    work.cold.vertexUploadBytes / 2
  )
})

test('native linear material preserves source-space colors and polygon coverage', async ({
  page
}, testInfo) => {
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  const evidence = await page.evaluate(async () => {
    const { PixiRenderEngine } =
      await import('../e2e/fixtures/__tests__/render-engine-access')
    const engine = new PixiRenderEngine()
    const { root } = await engine.initialize({
      host: {},
      width: 300,
      height: 150
    })
    const object = engine.execute({
      type: 'create-object',
      requestId: 'gradient',
      objectType: 'graphics',
      properties: { batched: true }
    }).object
    const resource = engine.execute({
      type: 'create-resource',
      requestId: 'material',
      descriptor: {
        kind: 'gradient',
        data: {
          type: 'linear',
          textureSpace: 'local',
          start: { x: 0, y: 0 },
          end: { x: 1, y: 0.3 },
          colorStops: [
            { offset: 0, color: '#31545d' },
            { offset: 0.5, color: '#557b80' },
            { offset: 1, color: '#294b55' }
          ]
        }
      }
    }).resource
    if (!object || !resource) throw new Error('Missing native material handles')
    engine.execute({
      type: 'draw',
      object,
      operations: [
        {
          type: 'poly',
          points: [
            { x: 0, y: 0 },
            { x: 300, y: 0 },
            { x: 280, y: 150 },
            { x: 20, y: 150 }
          ],
          close: true
        },
        { type: 'fill', paint: { resource } }
      ]
    })
    engine.execute({ type: 'append-child', parent: root, child: object })
    engine.execute({ type: 'flush' })
    const result = engine.query({
      type: 'snapshot',
      object,
      maxDimension: 400,
      nativeResolution: true
    })
    if (result.type !== 'snapshot')
      throw new Error('Missing source-space snapshot')
    const bitmap = await createImageBitmap(
      await (await fetch(result.dataUrl)).blob()
    )
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Missing pixel comparison context')
    context.drawImage(bitmap, 0, 0)
    const points = [
      [40, 20],
      [150, 75],
      [250, 100],
      [0, 149]
    ]
    const samples = points.map(([x, y]) =>
      Array.from(context.getImageData(x, y, 1, 1).data)
    )
    bitmap.close()
    engine.destroy()
    return {
      samples,
      dataUrl: result.dataUrl,
      width: result.width,
      height: result.height
    }
  })
  await testInfo.attach('native-gradient-source', {
    body: Buffer.from(evidence.dataUrl.split(',')[1], 'base64'),
    contentType: 'image/png'
  })
  expect([evidence.width, evidence.height]).toEqual([300, 150])
  const colors = [
    [49, 84, 93],
    [85, 123, 128],
    [41, 75, 85]
  ]
  for (const [index, [x, y]] of [
    [40, 20],
    [150, 75],
    [250, 100]
  ].entries()) {
    const t = Math.max(
      0,
      Math.min(1, ((x + 0.5) / 300 + ((y + 0.5) / 150) * 0.3) / 1.09)
    )
    const part = t <= 0.5 ? 0 : 1
    const ratio = (t - part * 0.5) * 2
    colors[part].forEach((value, channel) => {
      const expected = value + (colors[part + 1][channel] - value) * ratio
      expect(
        Math.abs(evidence.samples[index][channel] - expected)
      ).toBeLessThanOrEqual(2)
    })
    expect(evidence.samples[index][3]).toBe(255)
  }
  expect(evidence.samples[3]).toEqual([255, 255, 255, 255])
})
