import sharp from 'sharp'
import { prepareDesign } from '../server/design-preparation'
import { createLocalImageTools } from '../server/local-image-tools'
import { AiImageToolIds } from '../server/ai-domain-prompt'
import {
  parseLocalVectorArtifact,
  prepareLocalVectorArtifact
} from '../server/local-vector-artifact'
import { readFile, writeFile } from 'node:fs/promises'
import { convertBuffer } from '@visioncortex/vtracer'
import { convertVTracerBuffer } from '../vtracer-tool-server.mjs'
import { expect, test } from '@playwright/test'
import {
  captureBrowserErrors,
  getCapturedBrowserErrors,
  getCoreDocumentDigest,
  getUndoHistoryDepth,
  createRectangle,
  undo,
  redo,
  createTestDocumentIdentity,
  waitForAppReady
} from './test-utils'

test.beforeEach(({ page }) => {
  page.setDefaultTimeout(30_000)
  captureBrowserErrors(page)
})

test.afterEach(async ({ page }, testInfo) => {
  const errors = getCapturedBrowserErrors(page)
  await writeFile(
    testInfo.outputPath('browser-errors.json'),
    JSON.stringify(errors)
  )
  if (errors.length)
    await testInfo.attach('browser-errors', {
      body: JSON.stringify(errors),
      contentType: 'application/json'
    })
})

test('reference spline contours improve rendered fidelity and remain editable through one Undo', async ({
  page
}, testInfo) => {
  const bytes = await readFile('e2e/fixtures/reference-logo.png')
  // The polygon branch exists only as the previous-behavior comparison oracle.
  const baselineSvg = convertBuffer(bytes, {
    hierarchical: 'stacked',
    filterSpeckle: 4,
    mode: 'polygon',
    optimize: 0,
    pathPrecision: 2,
    preset: 'photo'
  })
  const started = performance.now()
  const splineSvg = await convertVTracerBuffer({
    bytes,
    contentType: 'image/png',
    profile: 'photo-faithful',
    signal: new AbortController().signal
  })
  const conversionMs = performance.now() - started
  const snapshots: string[] = []
  const normalizedSources: string[] = []
  const metrics: unknown[] = []
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  for (const [index, svg] of [baselineSvg, splineSvg].entries()) {
    const artifact = parseLocalVectorArtifact(svg)
    const minX = Math.min(...artifact.paths.map((p) => p.bounds.x))
    const minY = Math.min(...artifact.paths.map((p) => p.bounds.y))
    const sourceWidth =
      Math.max(...artifact.paths.map((p) => p.bounds.x + p.bounds.width)) - minX
    const sourceHeight =
      Math.max(...artifact.paths.map((p) => p.bounds.y + p.bounds.height)) -
      minY
    normalizedSources.push(
      svg.replace(
        /<svg[^>]*>/,
        `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="${minX} ${minY} ${sourceWidth} ${sourceHeight}" preserveAspectRatio="none">`
      )
    )
    const parsedPaths = artifact.paths
      .map((path) => {
        const commands = path.rings
          .map((ring) => {
            let d = `M${ring[0].x},${ring[0].y}`
            ring.forEach((start, pointIndex) => {
              const end = ring[(pointIndex + 1) % ring.length]
              if (start.outControl || end.inControl) {
                const out = start.outControl ?? start
                const incoming = end.inControl ?? end
                d += ` C${out.x},${out.y} ${incoming.x},${incoming.y} ${end.x},${end.y}`
              } else d += ` L${end.x},${end.y}`
            })
            return `${d} Z`
          })
          .join(' ')
        return `<path d="${commands}" fill="${path.fill}"/>`
      })
      .join('')
    normalizedSources.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="${minX} ${minY} ${sourceWidth} ${sourceHeight}" preserveAspectRatio="none">${parsedPaths}</svg>`
    )
    const drawing = prepareLocalVectorArtifact(artifact, {
      imageArtifactId: artifact.imageArtifactId,
      compositionRole:
        index === 0 ? 'Reference - polygon baseline' : 'Reference - curves',
      bounds: { x: 20 + 300 * index, y: 20, width: 250, height: 250 },
      excludePathIds: []
    })
    const before = await getCoreDocumentDigest(page)
    const history = await getUndoHistoryDepth(page)
    await page.route(
      '**/api/ai/action-batch',
      (route) =>
        route.fulfill({
          json: {
            batchId: `reference-quality-${index}`,
            actions: [
              {
                id: 'draw',
                name: 'insert_vector_composition',
                arguments: drawing,
                summary: 'Draw reference'
              }
            ]
          }
        }),
      { times: 1 }
    )
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await page
      .getByLabel('Message Agent')
      .fill('Draw the submitted reference with editable contours.')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
      'data-outcome',
      'success'
    )
    await page.getByRole('button', { name: 'Close Agent panel' }).click()
    expect(await getUndoHistoryDepth(page)).toBe(history + 1)
    const after = await getCoreDocumentDigest(page)
    const state = await page.evaluate(
      async ({ groupId, childIds }) => {
        const core = (await import('../src/testing/runtime-access')).core
        if (!core) throw new Error('App runtime unavailable')
        const elements = childIds.map((id) => {
          const element = core.deps.sceneTree.getAllElements().get(id)
          if (!element) throw new Error('Missing reference element')
          return {
            id,
            points: element.get('points'),
            segments: element.get('segments'),
            networks: element.get('networks')
          }
        })
        return {
          elements,
          computed: childIds.map((id) => core.getElementComputedData(id)),
          snapshot: core.captureElementSnapshot(groupId, 1000),
          zoom: core.getSystemProperty('zoom')
        }
      },
      {
        groupId: drawing.groupDescriptor.id,
        childIds: drawing.slices.flatMap((s) => s.descriptors.map((d) => d.id))
      }
    )
    const expected = drawing.slices.flatMap((s) =>
      s.descriptors.map((d) => ({
        id: d.id,
        points: d.points,
        segments: d.segments,
        networks: d.networks
      }))
    )
    expect(state.elements).toEqual(expected)
    await writeFile(
      testInfo.outputPath(`geometry-${index}.json`),
      JSON.stringify({
        expected: drawing.slices.flatMap((s) => s.descriptors),
        computed: state.computed
      })
    )
    // Snapshot dimensions follow rendered content bounds and its aspect ratio;
    // the requested dimension is an upper bound, not a fixed canvas width.
    expect(state.snapshot.width).toBeGreaterThan(0)
    expect(state.snapshot.width).toBeLessThanOrEqual(1000)
    const controls = state.elements
      .flatMap((e) =>
        Object.values(e.points as Record<string, { kind: string }>)
      )
      .filter((p) => p.kind === 'control').length
    if (index === 1) expect(controls).toBeGreaterThan(100)
    snapshots.push(state.snapshot.dataUrl)
    metrics.push({
      mode: index === 0 ? 'polygon' : 'spline',
      svgBytes: svg.length,
      pointCount: drawing.pointCount,
      elementCount: drawing.elementCount,
      controls,
      conversionMs: index === 1 ? conversionMs : null,
      zoom: state.zoom,
      bounds: state.snapshot.bounds
    })
    await writeFile(
      testInfo.outputPath(`reference-${index}.png`),
      Buffer.from(state.snapshot.dataUrl.split(',')[1], 'base64')
    )
    await page.screenshot({
      path: testInfo.outputPath(`reference-app-${index}.png`)
    })
    await undo(page)
    expect(await getCoreDocumentDigest(page)).toEqual(before)
    await redo(page)
    expect(await getCoreDocumentDigest(page)).toEqual(after)
  }
  const comparison = await page.evaluate(
    async ({ original, images }) => {
      const rasterized: string[] = []
      const pixels = async (source: string) => {
        const image = new Image()
        image.src = source
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = 250
        canvas.height = 250
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas 2D context unavailable')
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, 250, 250)
        context.drawImage(image, 0, 0, 250, 250)
        rasterized.push(canvas.toDataURL())
        return context.getImageData(0, 0, 250, 250).data
      }
      const reference = await pixels(original)
      const errors = []
      for (const image of images) {
        const data = await pixels(image)
        let error = 0
        for (let i = 0; i < data.length; i++)
          if (i % 4 !== 3) error += Math.abs(data[i] - reference[i])
        errors.push(error / (250 * 250 * 3))
      }
      return {
        polygonMeanAbsoluteError: errors[0],
        splineMeanAbsoluteError: errors[1],
        polygonToolMeanAbsoluteError: errors[2],
        splineToolMeanAbsoluteError: errors[3],
        normalizedToolErrors: errors.slice(4),
        rasterized
      }
    },
    {
      original: `data:image/png;base64,${bytes.toString('base64')}`,
      images: [
        ...snapshots,
        ...[baselineSvg, splineSvg, ...normalizedSources].map(
          (svg) =>
            `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
        )
      ]
    }
  )
  await writeFile(
    testInfo.outputPath('reference-quality.json'),
    JSON.stringify(
      {
        url: page.url(),
        viewport: page.viewportSize(),
        metrics,
        comparison: { ...comparison, rasterized: undefined }
      },
      null,
      2
    )
  )
  for (const [index, dataUrl] of comparison.rasterized.entries())
    await writeFile(
      testInfo.outputPath(`diagnostic-${index}.png`),
      Buffer.from(dataUrl.split(',')[1], 'base64')
    )
  expect(comparison.normalizedToolErrors[0]).toBe(
    comparison.normalizedToolErrors[1]
  )
  expect(comparison.normalizedToolErrors[2]).toBe(
    comparison.normalizedToolErrors[3]
  )
  expect(comparison.splineMeanAbsoluteError).toBeLessThan(
    comparison.polygonMeanAbsoluteError
  )
})

for (const contour of ['linear', 'cubic'] as const) {
  test(`native ${contour} compound contours preserve their transparent holes`, async ({
    page
  }, testInfo) => {
    const outline =
      contour === 'linear'
        ? 'M10,10L90,10L90,90L10,90Z'
        : 'M10,50C10,-10,90,-10,90,50C90,110,10,110,10,50Z'
    const artifact = parseLocalVectorArtifact(
      `<svg width="100" height="100"><path d="${outline} M40,40L40,60L60,60L60,40Z" fill="#008800"/></svg>`
    )
    const drawing = prepareLocalVectorArtifact(artifact, {
      imageArtifactId: artifact.imageArtifactId,
      compositionRole: 'Cubic hole',
      bounds: { x: 20, y: 20, width: 160, height: 180 },
      excludePathIds: []
    })
    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'ready' } })
    )
    await page.route('**/api/ai/action-batch', (route) =>
      route.fulfill({
        json: {
          batchId: 'cubic-hole',
          actions: [
            {
              id: 'draw',
              name: 'insert_vector_composition',
              arguments: drawing,
              summary: 'Draw curve with hole'
            }
          ]
        }
      })
    )
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await page
      .getByLabel('Message Agent')
      .fill('Draw the curved shape with its central hole.')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
      'data-outcome',
      'success'
    )
    const capture = await page.evaluate(async (id) => {
      const core = (await import('../src/testing/runtime-access')).core
      if (!core) throw new Error('No App')
      const image = core.captureElementSnapshot(id, 720)
      const bitmap = new Image()
      bitmap.src = image.dataUrl
      await bitmap.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas 2D context unavailable')
      ctx.drawImage(bitmap, 0, 0)
      return {
        image,
        pixel: Array.from(
          ctx.getImageData(
            Math.floor(image.width / 2),
            Math.floor(image.height / 2),
            1,
            1
          ).data
        )
      }
    }, drawing.groupDescriptor.id)
    await writeFile(
      testInfo.outputPath('cubic-hole.png'),
      Buffer.from(capture.image.dataUrl.split(',')[1], 'base64')
    )
    expect(capture.pixel).toEqual([255, 255, 255, 255])
  })
}

test('backend-selected circles become native Ovals through the ordinary Agent action', async ({
  page
}, testInfo) => {
  const artifact = parseLocalVectorArtifact(
    '<svg width="100" height="100"><path d="M50,0L85,15L100,50L85,85L50,100L15,85L0,50L15,15Z" fill="#008800"/></svg>'
  )
  const drawing = prepareLocalVectorArtifact(artifact, {
    imageArtifactId: artifact.imageArtifactId,
    compositionRole: 'Native circle',
    bounds: { x: 50, y: 50, width: 240, height: 240 },
    excludePathIds: [],
    componentMappings: [{ pathId: 'path-1', componentType: 'oval' }]
  })
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({
      json: {
        batchId: 'native-oval',
        actions: [
          {
            id: 'draw',
            name: 'insert_vector_composition',
            arguments: drawing,
            summary: 'Draw the circle'
          }
        ]
      }
    })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByLabel('Message Agent')
    .fill('Draw a 240 by 240 green circle using Oval.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  const elements = await page.evaluate(async () => {
    const core = (await import('../src/testing/runtime-access')).core
    if (!core) throw new Error('App runtime unavailable')
    return [...core.deps.sceneTree.getAllElements().values()]
      .filter(
        (element) =>
          !['workspace', 'group'].includes(String(element.get('type')))
      )
      .map((element) => ({
        type: element.get('type'),
        computed: element.getAllComputedData()
      }))
  })
  expect(elements).toHaveLength(1)
  expect(elements[0]).toMatchObject({
    type: 'oval',
    computed: { width: 240, height: 240 }
  })
  expect(drawing.pointCount).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('native-oval.png') })
})

test('rendered inspection is fresh after repeated edits and remains one Undo', async ({
  page
}, testInfo) => {
  const artifact = parseLocalVectorArtifact(
    '<svg width="100" height="100"><path d="M50,0L100,50L50,100L0,50Z" fill="#FF0000"/></svg>'
  )
  const drawing = prepareLocalVectorArtifact(artifact, {
    imageArtifactId: artifact.imageArtifactId,
    compositionRole: 'Review drawing',
    bounds: { x: 50, y: 50, width: 100, height: 100 },
    excludePathIds: [],
    componentMappings: [{ pathId: 'path-1', componentType: 'oval' }]
  })
  const id = drawing.slices[0].descriptors[0].id
  const receipts: {
    actionResults: {
      actionName: string
      result: {
        available: boolean
        image: { dataUrl: string; width: number }
        elementId: string
      }
    }[]
  }[] = []
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', async (route) => {
    if (route.request().headers()['x-ai-batch-receipt']) {
      receipts.push(route.request().postDataJSON())
      return route.fulfill({ json: { accepted: true } })
    }
    const actions = [
      { name: 'insert_vector_composition', arguments: drawing },
      {
        name: 'inspect_drawing',
        arguments: { elementId: drawing.groupDescriptor.id }
      },
      {
        name: 'update_composition_elements',
        arguments: {
          updates: [{ elementId: id, style: { fillColor: '#0000FF' } }]
        }
      },
      {
        name: 'inspect_drawing',
        arguments: { elementId: drawing.groupDescriptor.id }
      },
      {
        name: 'update_composition_elements',
        arguments: {
          updates: [{ elementId: id, style: { fillColor: '#00FF00' } }]
        }
      },
      {
        name: 'inspect_drawing',
        arguments: { elementId: drawing.groupDescriptor.id }
      }
    ]
    const frames: unknown[] = actions.map((action, index) => ({
      type: 'batch',
      receiptToken: `${String(index + 1).repeat(8)}-1111-1111-1111-111111111111`,
      batch: {
        batchId: `review-${index}`,
        actions: [
          {
            ...action,
            id: `action-${index}`,
            summary: 'Review and refine drawing'
          }
        ]
      }
    }))
    frames.push({
      type: 'result',
      batch: {
        batchId: 'done',
        actions: [
          {
            id: 'report',
            name: 'report_outcome',
            arguments: {
              outcome: 'completed',
              message: 'The drawing has been reviewed.'
            },
            summary: 'Done'
          }
        ]
      }
    })
    return route.fulfill({
      contentType: 'application/x-ndjson',
      body: frames.map((frame) => JSON.stringify(frame)).join('\n')
    })
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByLabel('Message Agent')
    .fill('Draw, inspect, and refine the circle twice.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  const inspections = receipts
    .flatMap((receipt) => receipt.actionResults)
    .filter((result) => result.actionName === 'inspect_drawing')
    .map((result) => result.result)
  expect(inspections).toHaveLength(3)
  expect(inspections.every((result) => result.available)).toBe(true)
  expect(new Set(inspections.map((result) => result.image.dataUrl)).size).toBe(
    3
  )
  const pixels = await page.evaluate(
    async (images) =>
      Promise.all(
        images.map(async (dataUrl) => {
          const image = new Image()
          image.src = dataUrl
          await image.decode()
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas context unavailable')
          ctx.drawImage(image, 0, 0)
          return [
            ...ctx.getImageData(
              Math.floor(image.width / 2),
              Math.floor(image.height / 2),
              1,
              1
            ).data
          ]
        })
      ),
    inspections.map((result) => result.image.dataUrl)
  )
  expect(pixels).toEqual([
    [255, 0, 0, 255],
    [0, 0, 255, 255],
    [0, 255, 0, 255]
  ])
  for (const [index, inspection] of inspections.entries()) {
    expect(inspection.image.width).toBeLessThanOrEqual(1024)
    expect(inspection.elementId).toBe(drawing.groupDescriptor.id)
    expect(inspection).not.toHaveProperty('elements')
    await writeFile(
      testInfo.outputPath(`inspection-${index}.png`),
      Buffer.from(inspection.image.dataUrl.split(',')[1], 'base64')
    )
  }
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  const after = await getCoreDocumentDigest(page)
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(after)
})

test('backend component mappings render native Rectangle and Oval with remaining Vector', async ({
  page
}, testInfo) => {
  const tools = createLocalImageTools(
    {
      metadata: {
        imageAttachments: [
          {
            dataUrl: 'data:image/png;base64,YQ==',
            mediaType: 'image/png',
            size: 1
          }
        ]
      }
    },
    async () =>
      '<svg width="100" height="100"><path d="M0,0L40,0L40,40L0,40Z" fill="#FF0000"/><path d="M90,20C90,31.0457,81.0457,40,70,40C58.9543,40,50,31.0457,50,20C50,8.9543,58.9543,0,70,0C81.0457,0,90,8.9543,90,20Z" fill="#0000FF"/><path d="M0,60L40,100L0,100Z" fill="#00FF00"/></svg>'
  )
  const signal = new AbortController().signal
  const source = JSON.parse(
    await tools.call(
      AiImageToolIds.VTRACER,
      {
        attachmentIndex: 0,
        plan: {
          strategy: 'preserve-vectors',
          reason: 'Preserve the supplied irregular vector artwork.'
        }
      },
      signal
    )
  )
  const evidence = JSON.parse(
    await tools.call(
      AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
      {
        imageArtifactId: source.imageArtifactId,
        pathIds: ['path-1', 'path-2', 'path-3']
      },
      signal
    )
  )
  expect(evidence.paths[0].candidates).toContainEqual(
    expect.objectContaining({ componentType: 'rect', eligible: true })
  )
  expect(evidence.paths[1].candidates).toContainEqual(
    expect.objectContaining({ componentType: 'oval', eligible: true })
  )
  expect(
    evidence.paths[2].candidates.every(
      (candidate: { eligible: boolean }) => !candidate.eligible
    )
  ).toBe(true)
  await testInfo.attach('component-analysis', {
    body: JSON.stringify(evidence),
    contentType: 'application/json'
  })
  const prepared = tools.resolveBatch({
    batchId: 'components',
    actions: [
      {
        id: 'draw',
        name: 'insert_vector_composition',
        summary: 'Draw reviewed components',
        arguments: {
          imageArtifactId: source.imageArtifactId,
          analysisIds: [evidence.analysisId],
          compositionRole: 'Component review',
          bounds: { x: 50, y: 50, width: 180, height: 200 },
          excludePathIds: [],
          componentMappings: [
            { pathId: 'path-1', componentType: 'rect' },
            { pathId: 'path-2', componentType: 'oval' }
          ]
        }
      }
    ]
  })
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({
      json: prepared
    })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByLabel('Message Agent')
    .fill('Use the appropriate native components for this drawing.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  const types = await page.evaluate(async () => {
    const core = (await import('../src/testing/runtime-access')).core
    if (!core) throw new Error('App unavailable')
    return [...core.deps.sceneTree.getAllElements().values()]
      .filter(
        (element) =>
          !['group', 'workspace'].includes(String(element.get('type')))
      )
      .map((element) => element.get('type'))
      .sort()
  })
  expect(types).toEqual(['oval', 'rect', 'vector'])
  await page.screenshot({ path: testInfo.outputPath('component-mapping.png') })
  const after = await getCoreDocumentDigest(page)
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(after)
})

test('pre-trace decomposition renders an editable oval below reference vectors in one Undo', async ({
  page
}, testInfo) => {
  // The uploaded .png file contains WebP bytes; preserve the actual user input.
  const bytes = await readFile('e2e/fixtures/reference-logo.png')
  const tools = createLocalImageTools({
    metadata: {
      imageAttachments: [
        {
          dataUrl: `data:image/png;base64,${bytes.toString('base64')}`,
          mediaType: 'image/png',
          size: bytes.length
        }
      ]
    }
  })
  const summary = JSON.parse(
    await tools.call(
      AiImageToolIds.VTRACER,
      {
        attachmentIndex: 0,
        plan: {
          strategy: 'separate-background',
          reason:
            'A native circular base with white foreground preserves this reference.',
          background: {
            componentType: 'oval',
            bounds: { x: 0, y: 0, width: 250, height: 250 },
            fill: '#00643C'
          },
          foregroundColors: ['#FFFFFF'],
          colorTolerance: 24,
          clipToBackground: true
        }
      },
      new AbortController().signal
    )
  )
  const prepared = tools.resolveBatch({
    batchId: 'layered-reference',
    actions: [
      {
        id: 'draw',
        name: 'insert_vector_composition',
        summary: 'Draw reference',
        arguments: {
          imageArtifactId: summary.imageArtifactId,
          compositionRole: 'Separated reference',
          bounds: { x: 50, y: 50, width: 240, height: 240 },
          excludePathIds: []
        }
      }
    ]
  })
  const drawing = prepared.actions[0].arguments
  const descriptors = drawing.slices.flatMap(
    (slice: {
      descriptors: { id: string; type: string; width: number; height: number }[]
    }) => slice.descriptors
  )
  expect(descriptors[0]).toMatchObject({
    type: 'oval',
    width: 240,
    height: 240
  })
  expect(
    descriptors
      .slice(1)
      .every((descriptor: { type: string }) => descriptor.type === 'vector')
  ).toBe(true)
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({ json: prepared })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByLabel('Message Agent')
    .fill('Draw this reference at 240 by 240 with a native background.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  const snapshot = await page.evaluate(
    async ({ groupId, backgroundId }) => {
      const core = (await import('../src/testing/runtime-access')).core
      if (!core) throw new Error('App unavailable')
      const background = core.deps.sceneTree.getAllElements().get(backgroundId)
      if (background?.get('type') !== 'oval')
        throw new Error('Missing editable native background')
      return core.captureElementSnapshot(groupId, 1000)
    },
    { groupId: drawing.groupDescriptor.id, backgroundId: descriptors[0].id }
  )
  const rendered = Buffer.from(snapshot.dataUrl.split(',')[1], 'base64')
  await writeFile(testInfo.outputPath('layered-reference.png'), rendered)
  await page.screenshot({
    path: testInfo.outputPath('layered-reference-app.png')
  })
  const reference = await sharp(bytes)
    .extract({ left: 0, top: 0, width: 250, height: 250 })
    .resize(1000, 1000)
    .flatten({ background: '#ffffff' })
    .removeAlpha()
    .raw()
    .toBuffer()
  const actual = await sharp(rendered)
    .resize(1000, 1000)
    .flatten({ background: '#ffffff' })
    .removeAlpha()
    .raw()
    .toBuffer()
  let error = 0
  for (let index = 0; index < actual.length; index++)
    error += Math.abs(actual[index] - reference[index])
  const meanError = error / actual.length
  await writeFile(
    testInfo.outputPath('layered-reference-metrics.json'),
    JSON.stringify({
      meanError,
      summary,
      descriptors,
      captureBounds: snapshot.bounds
    })
  )
  expect(meanError).toBeLessThan(12)
  expect(
    summary.paths.every((path: { fill: string }) => path.fill === '#FFFFFF')
  ).toBe(true)
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  const after = await getCoreDocumentDigest(page)
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(after)
})

test('backend contour refinement renders the measured straight edge with one Undo', async ({
  page
}, testInfo) => {
  const tools = createLocalImageTools(
    {
      metadata: {
        imageAttachments: [
          {
            dataUrl: 'data:image/png;base64,YQ==',
            mediaType: 'image/png',
            size: 1
          }
        ]
      }
    },
    async () =>
      '<svg width="100" height="100"><path fill="#008800" d="M10,10C30,10.08 70,10.08 90,10L90,90L10,90Z"/></svg>'
  )
  const signal = new AbortController().signal
  const original = JSON.parse(
    await tools.call(
      AiImageToolIds.VTRACER,
      {
        attachmentIndex: 0,
        plan: {
          strategy: 'preserve-vectors',
          reason: 'Measure the intended straight edge.'
        }
      },
      signal
    )
  )
  const review = JSON.parse(
    await tools.call(
      AiImageToolIds.REVIEW_VECTOR_CONTOURS,
      {
        imageArtifactId: original.imageArtifactId,
        pathIds: ['path-1'],
        quality: { mode: 'cleanup', targetSize: { width: 400, height: 400 } }
      },
      signal
    )
  )
  const proposal = review.proposals.find(
    (p: { kind: string }) => p.kind === 'straighten'
  )
  const refined = JSON.parse(
    await tools.call(
      AiImageToolIds.APPLY_CONTOUR_REFINEMENTS,
      { reviewId: review.reviewId, proposalIds: [proposal.id] },
      signal
    )
  )
  expect(refined.maxDisplacementPx).toBeLessThanOrEqual(0.5)
  const prepared = tools.resolveBatch({
    batchId: 'contour-refinement',
    actions: [
      {
        id: 'draw',
        name: 'insert_vector_composition',
        arguments: {
          imageArtifactId: refined.imageArtifactId,
          compositionRole: 'Refined contour',
          bounds: { x: 50, y: 50, width: 400, height: 400 },
          excludePathIds: []
        },
        summary: 'Draw refined contour'
      }
    ]
  })
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({ json: prepared })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page),
    depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page.getByLabel('Message Agent').fill('Draw the refined contour.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  const drawing = prepared.actions[0].arguments
  const capture = await page.evaluate(async (id) => {
    const core = (await import('../src/testing/runtime-access')).core
    if (!core) throw new Error('Missing App')
    const group = core.deps.sceneTree.getAllElements().get(id)
    if (!group) throw new Error('Missing group')
    return core.captureElementSnapshot(id, 1000)
  }, drawing.groupDescriptor.id)
  const rendered = Buffer.from(capture.dataUrl.split(',')[1], 'base64')
  await writeFile(testInfo.outputPath('refined-contour.png'), rendered)
  await page.screenshot({
    path: testInfo.outputPath('refined-contour-app.png')
  })
  const { data, info } = await sharp(rendered)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  // The straight edge fills the same first interior scan line across its width.
  const firstRows = []
  for (const x of [100, 300, 500, 700, 900]) {
    let y = 0
    while (y < info.height && data[(y * info.width + x) * 4 + 3] < 200) y++
    firstRows.push(y)
  }
  expect(Math.max(...firstRows) - Math.min(...firstRows)).toBeLessThanOrEqual(1)
  expect(Math.max(...firstRows)).toBeLessThan(3)
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  const after = await getCoreDocumentDigest(page)
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(after)
})

for (const mode of ['explicit IDs', 'aligned rows'] as const) {
  test(`registered Fill actions use new values for multiple targets and one Undo - ${mode}`, async ({
    page
  }) => {
    const identity = createTestDocumentIdentity()
    await page.goto(identity.url)
    await waitForAppReady(page)
    await createRectangle(page, 0.3, 0.3)
    const firstId = await page.evaluate(
      async () =>
        (
          await import('../src/testing/runtime-access')
        ).core.getSelectedElementIds()[0]
    )
    await createRectangle(page, 0.6, 0.6)
    const state = await page.evaluate(
      async ({ firstId, mode }) => {
        const { core } = await import('../src/testing/runtime-access')
        const { createBasicApiActions } =
          await import('../src/ai/basic-api-actions')
        const { transactionApis, fillApis } = await import('../src/common-apis')
        const ids = [firstId, core.getSelectedElementIds()[0]]
        const targets = fillApis.getFillTargetsAtIndex(ids, 0)
        fillApis.updateFillFieldsBatch(
          targets.map((target, index) => ({
            ...target,
            patch: { opacity: index ? 0.7 : 0.3 }
          }))
        )
        const read = () =>
          ids.map((id) => core.getElementComputedData(id, ['fills'])?.fills)
        const before = read()
        const actions = createBasicApiActions()
        const action = actions.find(
          (action) =>
            action.name ===
            (mode === 'aligned rows'
              ? 'api_fill_updateFillsAtIndex'
              : 'api_fill_updateFillFieldsBatch')
        )
        if (!action) throw new Error('Missing registered Fill batch action')
        const result = await action.execute(
          mode === 'aligned rows'
            ? {
                elementIds: ids,
                index: 0,
                patch: [{ color: '#125678' }, { color: '#876543' }]
              }
            : {
                updates: targets.map((target) => ({
                  ...target,
                  patch: { color: '#125678' }
                }))
              },
          {
            signal: new AbortController().signal,
            runMutation: async (mutate) =>
              transactionApis.runTransaction(mutate)
          }
        )
        return { ids, before, after: read(), result }
      },
      { firstId, mode }
    )
    expect(state.result.status).toBe('complete')
    expect(state.after).toEqual(
      state.before.map((fills, index) =>
        fills.map((fill) => ({
          ...fill,
          color: mode === 'aligned rows' && index === 1 ? '#876543' : '#125678'
        }))
      )
    )
    await undo(page)
    const read = () =>
      page.evaluate(async (ids) => {
        const { core } = await import('../src/testing/runtime-access')
        return ids.map(
          (id) => core.getElementComputedData(id, ['fills'])?.fills
        )
      }, state.ids)
    await expect.poll(read).toEqual(state.before)
    await redo(page)
    await expect.poll(read).toEqual(state.after)
  })
}

test('canonical fill reference edits and plural record patches have distinct contracts', async ({
  page
}, testInfo) => {
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await createRectangle(page)
  const evidence = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const elementId = core.getSelectedElementIds()[0]
    const before = core.getElementComputedData(elementId, ['fills'])
    const fill = (before.fills as { id: string; color: string }[])[0]
    if (!fill) throw new Error('Missing rectangle fill')
    let rejected = ''
    try {
      core.updateElementProperties([{ elementId, values: { fills: [fill] } }])
    } catch (error) {
      rejected = error instanceof Error ? error.message : String(error)
    }
    const afterRejection = core.getElementComputedData(elementId, ['fills'])
    const ids = core.patchElementProperties([
      {
        elementId,
        records: [
          {
            key: 'fills',
            set: {
              [fill.id]: {
                kind: 'gradient',
                gradient: {
                  gradientType: 'linear',
                  gradientHandles: [
                    { x: 0, y: 0 },
                    { x: 0.08, y: 1 }
                  ],
                  gradientStops: [
                    { position: 0, color: '#1c3d46', opacity: 1 },
                    { position: 1, color: '#1b3c45', opacity: 1 }
                  ]
                }
              }
            }
          }
        ]
      }
    ])
    return {
      rejected,
      before,
      afterRejection,
      ids,
      elementId,
      fillId: fill.id,
      after: core.getElementComputedData(elementId, ['fills'])
    }
  })
  await writeFile(
    testInfo.outputPath('property-semantics.json'),
    JSON.stringify(evidence, null, 2)
  )
  expect(evidence.rejected).toContain('fills')
  expect(evidence.afterRejection).toEqual(evidence.before)
  expect(evidence.ids).toEqual([evidence.elementId])
  expect(evidence.after.fills).toEqual([
    expect.objectContaining({
      id: evidence.fillId,
      kind: 'gradient',
      gradient: expect.objectContaining({ gradientType: 'linear' })
    })
  ])
})

test('plural AI visibility uses one Undo and preserves target status', async ({
  page
}) => {
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await createRectangle(page, 0.3, 0.3)
  const firstId = await page.evaluate(
    async () =>
      (
        await import('../src/testing/runtime-access')
      ).core.getSelectedElementIds()[0]
  )
  await createRectangle(page, 0.6, 0.6)
  const state = await page.evaluate(async (firstId) => {
    const { core } = await import('../src/testing/runtime-access')
    const { transactionApis } = await import('../src/common-apis')
    const { createBasicApiActions } =
      await import('../src/ai/basic-api-actions')
    const ids = [firstId, core.getSelectedElementIds()[0]]
    const action = createBasicApiActions().find(
      (entry) => entry.name === 'api_element_setElementsVisible'
    )
    if (!action) throw new Error('Missing plural visibility action')
    const read = () => ids.map((id) => core.getElementData(id)?.visible)
    const before = read()
    const result = await action.execute(
      { elementIds: ids, visible: false },
      {
        signal: new AbortController().signal,
        runMutation: async (mutate) => transactionApis.runTransaction(mutate)
      }
    )
    return { ids, before, after: read(), result }
  }, firstId)
  expect(state.result).toMatchObject({
    status: 'complete',
    value: ['changed', 'changed']
  })
  expect(state.after).toEqual([false, false])
  const read = () =>
    page.evaluate(async (ids) => {
      const { core } = await import('../src/testing/runtime-access')
      return ids.map((id) => core.getElementData(id)?.visible)
    }, state.ids)
  await undo(page)
  await expect.poll(read).toEqual(state.before)
  await redo(page)
  await expect.poll(read).toEqual(state.after)
})

test('ready design parts continue in an existing container with one undo entry', async ({
  page
}, testInfo) => {
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getUndoHistoryDepth(page)
  const first = prepareDesign(
    {
      type: 'frame',
      name: 'Ready surface',
      x: 500,
      y: 300,
      width: 400,
      height: 400,
      children: [
        {
          type: 'rect',
          key: 'surface',
          name: 'Surface',
          x: 20,
          y: 20,
          width: 360,
          height: 360,
          fill: '#235678'
        }
      ]
    },
    'surface'
  )
  const second = prepareDesign(
    {
      type: 'group',
      name: 'Later details',
      children: [
        {
          type: 'rect',
          key: 'detail',
          name: 'Detail',
          x: 60,
          y: 80,
          width: 40,
          height: 200,
          fill: '#aaddff'
        }
      ]
    },
    'details'
  )
  const result = await page.evaluate(
    async ({ first, second }) => {
      const { core } = await import('../src/testing/runtime-access')
      const { createPreparedDesignAction } =
        await import('../src/ai/design-actions')
      const { createAiTransactionRunner } =
        await import('../src/ai/transaction')
      const { viewportApis } = await import('../src/common-apis/viewport')
      const action = createPreparedDesignAction()
      let initialSurface: unknown
      let finalSurface: unknown
      await createAiTransactionRunner().run(
        'Ready parts',
        async (runMutation) => {
          const context = { signal: new AbortController().signal, runMutation }
          const receipt = await action.execute(
            { design: first, response: 'compact' },
            context as never
          )
          initialSurface = core.getElementComputedData(first.keyToId.surface, [
            'x',
            'y',
            'width',
            'height'
          ])
          await action.execute(
            {
              design: second,
              parentId: receipt.compositionId,
              response: 'compact'
            },
            context as never
          )
          finalSurface = core.getElementComputedData(first.keyToId.surface, [
            'x',
            'y',
            'width',
            'height'
          ])
        }
      )
      viewportApis.zoomFit()
      return {
        initialSurface,
        finalSurface,
        parent: core.getElementData(second.rootId)?.parentId
      }
    },
    { first, second }
  )
  expect(result.parent).toBe(first.rootId)
  expect(result.finalSurface).toEqual(result.initialSurface)
  expect(await getUndoHistoryDepth(page)).toBe(before + 1)
  const finalDigest = await getCoreDocumentDigest(page)
  await page.screenshot({ path: testInfo.outputPath('ready-parts.png') })
  await undo(page)
  expect(
    await page.evaluate(
      async (id) =>
        (await import('../src/testing/runtime-access')).core.getElementData(
          id
        ) ?? null,
      first.rootId
    )
  ).toBeNull()
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(finalDigest)
})
