import sharp from 'sharp'
import { prepareDesign } from '../server/design-preparation'
import { createLocalImageTools } from '../server/local-image-tools'
import { AiImageToolIds } from '../server/ai-domain-prompt'
import {
  parseLocalVectorArtifact,
  prepareLocalVectorArtifact
} from '../server/local-vector-artifact'
import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { convertBuffer } from '@visioncortex/vtracer'
import { convertVTracerBuffer } from '../vtracer-tool-server.mjs'
import { expect, test, type Page, type Frame } from '@playwright/test'
import {
  captureBrowserErrors,
  getCapturedBrowserErrors,
  getCoreDocumentDigest,
  getUndoHistoryDepth,
  createRectangle,
  clickCanvas,
  getZoomLevel,
  getCanvasPosition,
  undo,
  redo,
  createTestDocumentIdentity,
  getPersistedDocumentDigest,
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

const captureProviderFrames = async (page: Page, outputPath: string) => {
  const frames: string[] = []
  await writeFile(outputPath, '')
  let pendingWrite = Promise.resolve()
  await page.exposeFunction('recordReviewFrame', (line: string) => {
    frames.push(line)
    pendingWrite = pendingWrite.then(() => appendFile(outputPath, line))
    return pendingWrite
  })
  await page.addInitScript(() => {
    const original = window.fetch
    window.fetch = async (...args) => {
      const response = await original(...args)
      if (
        response.headers.get('content-type')?.includes('application/x-ndjson')
      ) {
        const body = response.clone().body
        if (!body) throw new Error('Missing response stream')
        const reader = body.getReader()
        void (async () => {
          const decoder = new TextDecoder()
          try {
            while (true) {
              const chunk = await reader.read()
              if (chunk.done) break
              await (
                window as unknown as {
                  recordReviewFrame: (line: string) => Promise<void>
                }
              ).recordReviewFrame(decoder.decode(chunk.value, { stream: true }))
            }
          } catch {
            /* The test records partial frames when runtime cancels delivery. */
          }
        })()
      }
      return response
    }
  })
  return frames
}

const loadReferenceArtifact = async () => {
  const artifact = parseLocalVectorArtifact(
    await convertVTracerBuffer({
      bytes: await readFile('e2e/fixtures/reference-logo.png'),
      contentType: 'image/png',
      profile: 'photo-faithful',
      signal: new AbortController().signal
    })
  )
  // Fixture oracle: the detached mark occupies the lower-right strip, outside
  // the main circular artwork. Do not tie semantic assertions to tracer order.
  const marks = artifact.paths.filter(
    ({ bounds }) =>
      bounds.x > artifact.width * 0.75 && bounds.y > artifact.height * 0.92
  )
  expect(marks).toHaveLength(1)
  return { artifact, markId: marks[0].id }
}

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

for (const source of ['text', 'image'] as const) {
  test(`local subscription creates an editable ${source} drawing through the real Agent panel`, async ({
    page
  }, testInfo) => {
    test.skip(
      process.env.E2E_LOCAL_AI !== 'true',
      'Requires an explicitly enabled local subscription'
    )
    test.setTimeout(180_000)
    const frames = await captureProviderFrames(
      page,
      testInfo.outputPath('action-batch.ndjson')
    )
    const identity = createTestDocumentIdentity()
    await page.goto(identity.url)
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await expect(page.getByText('Local AI connected')).toBeVisible({
      timeout: 15_000
    })
    const responsePromise = page.waitForResponse(
      (response) => response.url().endsWith('/api/ai/action-batch'),
      { timeout: 150_000 }
    )
    if (source === 'image')
      await page
        .getByLabel('Choose images')
        .setInputFiles('e2e/fixtures/local-vector-reference.png')
    await page
      .getByLabel('Message Agent')
      .fill(
        source === 'text'
          ? '請畫一個 100×100 的藍色圓形。'
          : 'Trace the attached 64x64 image, preserving its blue square and white background at original size. Analyze plausible component conversions using the registered backend analysis tool. Use native Rectangles for eligible squares if they preserve this reference; retain any ineligible paths as vectors. Review the actual rendered result before finishing.'
      )
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    const response = await responsePromise
    await writeFile(
      testInfo.outputPath('provider-input.json'),
      response.request().postData() ?? '{}'
    )
    expect(response.status()).toBe(200)
    const message = page.getByTestId('ai-agent-message')
    await expect(message).toHaveAttribute(
      'data-outcome',
      /success|failed|failure/,
      { timeout: 150_000 }
    )
    await writeFile(testInfo.outputPath('action-batch.ndjson'), frames.join(''))
    await expect(message).toHaveAttribute('data-outcome', 'success')
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
    expect(elements.length).toBeGreaterThan(0)
    const blue = elements.find((element) =>
      (element.computed as { fills?: { color: string }[] }).fills?.some(
        (fill) => fill.color.toUpperCase() === '#0000FF'
      )
    )
    expect(blue).toBeTruthy()
    if (source === 'text') {
      expect(blue).toMatchObject({
        type: 'oval',
        computed: { width: 100, height: 100 }
      })
    } else {
      expect(blue?.type).toBe('rect')
      expect(frames.join('')).toContain(
        AiImageToolIds.ANALYZE_VECTOR_COMPONENTS
      )
      expect(
        elements.every((element) =>
          ['vector', 'rect', 'oval'].includes(element.type as string)
        )
      ).toBe(true)
    }
    await testInfo.attach('canonical-elements.json', {
      body: JSON.stringify(elements),
      contentType: 'application/json'
    })
    await page.screenshot({ path: testInfo.outputPath('local-ai-drawing.png') })
  })
}

test('local subscription continues a text-only drawing after a detail choice', async ({
  page
}) => {
  test.skip(
    process.env.E2E_LOCAL_AI !== 'true',
    'Requires an explicitly enabled local subscription'
  )
  test.setTimeout(180_000)
  await page.route(
    '**/api/ai/action-batch',
    (route) =>
      route.fulfill({
        json: {
          batchId: 'detail-question',
          actions: [
            {
              id: 'question',
              name: 'request_drawing_detail_choice',
              arguments: {},
              summary: 'Choose detail'
            }
          ]
        }
      }),
    { times: 1 }
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByLabel('Message Agent')
    .fill('Draw one blue circle, 100 pixels wide and 100 pixels tall.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await page.getByRole('button', { name: 'Choose Balanced detail' }).click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'success',
    { timeout: 150_000 }
  )
  const circles = await page.evaluate(async () => {
    const core = (await import('../src/testing/runtime-access')).core
    if (!core) throw new Error('App unavailable')
    return [...core.deps.sceneTree.getAllElements().values()]
      .filter((element) => element.get('type') === 'oval')
      .map((element) => element.getAllComputedData())
  })
  expect(circles).toEqual([
    expect.objectContaining({
      width: 100,
      height: 100,
      fills: expect.arrayContaining([
        expect.objectContaining({ color: '#0000FF' })
      ])
    })
  ])
})

test('local subscription traces the reference logo at 240px without its separate mark', async ({
  page
}, testInfo) => {
  test.skip(
    process.env.E2E_LOCAL_AI !== 'true',
    'Requires an explicitly enabled local subscription'
  )
  test.setTimeout(330_000)
  const identity = createTestDocumentIdentity()
  await page.goto(identity.url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await expect(page.getByText('Local AI connected')).toBeVisible({
    timeout: 15_000
  })
  await page
    .getByLabel('Choose images')
    .setInputFiles('e2e/fixtures/reference-logo.png')
  await page
    .getByLabel('Message Agent')
    .fill('畫這個 Logo，尺寸 240*240 px，不要右下角 TM 的字')
  const started = Date.now()
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  const messages = page.getByTestId('ai-agent-message')
  await expect(messages.last()).toHaveAttribute(
    'data-outcome',
    /success|failed|failure/,
    { timeout: 305_000 }
  )
  const balanced = page.getByRole('button', { name: /Balanced detail/ })
  if (await balanced.isVisible()) {
    await balanced.click()
    await expect(messages.last()).toHaveAttribute(
      'data-outcome',
      /success|failed|failure/,
      { timeout: 305_000 }
    )
  }
  await expect(messages.last()).toHaveAttribute('data-outcome', 'success')
  const elements = await page.evaluate(async () => {
    const core = (await import('../src/testing/runtime-access')).core
    if (!core) throw new Error('App runtime unavailable')
    return [...core.deps.sceneTree.getAllElements().values()]
      .filter((element) => element.get('type') !== 'workspace')
      .map((element) => ({
        id: element.id,
        type: element.get('type'),
        name: element.get('name'),
        computed: element.getAllComputedData()
      }))
  })
  const shapes = elements.filter(({ type }) => type !== 'group')
  const backgrounds = shapes.filter(({ type }) => type === 'oval')
  expect(backgrounds).toHaveLength(1)
  expect(backgrounds[0].computed).toMatchObject({ width: 240, height: 240 })
  expect(shapes.some(({ type }) => type === 'vector')).toBe(true)
  expect(
    shapes
      .flatMap(({ computed }) =>
        Object.values(
          (computed as { points: Record<string, { kind: string }> }).points ??
            {}
        )
      )
      .filter((point) => point.kind === 'control').length
  ).toBeGreaterThan(100)
  expect(elements.find(({ type }) => type === 'group')).toMatchObject({
    computed: { width: 240, height: 240 }
  })
  await writeFile(
    testInfo.outputPath('reference-state.json'),
    JSON.stringify({
      url: page.url(),
      elapsedMs: Date.now() - started,
      elements
    })
  )
  await page.screenshot({ path: testInfo.outputPath('reference-logo.png') })
  await page.screenshot({
    path: testInfo.outputPath('reference-detail.png'),
    clip: { x: 240, y: 40, width: 400, height: 360 }
  })
})

test('local subscription uses acknowledged drawing IDs for a dependent edit in one undo', async ({
  page
}, testInfo) => {
  test.skip(
    process.env.E2E_LOCAL_AI !== 'true',
    'Requires a local subscription'
  )
  test.setTimeout(330_000)
  const { getUndoHistoryDepth, undo, redo, getCoreDocumentDigest } =
    await import('./test-utils')
  const receipts: Promise<string>[] = []
  page.on('response', (response) => {
    if (
      response.url().endsWith('/api/ai/action-batch') &&
      response.headers()['content-type']?.includes('application/x-ndjson')
    )
      receipts.push(response.text())
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await expect(page.getByText('Local AI connected')).toBeVisible({
    timeout: 15_000
  })
  await page
    .getByLabel('Choose images')
    .setInputFiles('e2e/fixtures/reference-logo.png')
  await page
    .getByLabel('Message Agent')
    .fill(
      'Trace this image at 240 by 240 pixels with VTracer. First insert all paths, including TM, using the backend operation. After the app reports the actual created element IDs, use the registered visibility operation to hide only the separate TM mark at the lower right. Do not exclude the mark before insertion. Finish by explaining the result.'
    )
  const started = Date.now()
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'success',
    { timeout: 305_000 }
  )
  const frames = (await Promise.all(receipts)).flatMap((body) =>
    body
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
  )
  const batches = frames.filter((frame) => frame.type === 'batch')
  expect(batches.length).toBeGreaterThanOrEqual(2)
  expect(
    batches.flatMap((frame) =>
      frame.batch.actions.map((action: { name: string }) => action.name)
    )
  ).toContain('set_element_visibility')
  const visibility = await page.evaluate(async () => {
    const core = (await import('../src/testing/runtime-access')).core
    return [...core.deps.sceneTree.getAllElements().values()]
      .filter((element) =>
        ['oval', 'vector'].includes(String(element.get('type')))
      )
      .map((element) => ({
        name: element.get('name'),
        visible: element.get('visible')
      }))
  })
  const { artifact, markId } = await loadReferenceArtifact()
  expect(visibility).toHaveLength(artifact.paths.length)
  expect(visibility.filter((element) => element.visible === false)).toEqual([
    { name: markId, visible: false }
  ])
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  const after = await getCoreDocumentDigest(page)
  const elapsedMs = Date.now() - started
  await writeFile(
    testInfo.outputPath('operation-evidence.json'),
    JSON.stringify({
      elapsedMs,
      batchCount: batches.length,
      actionNames: batches.flatMap((frame) =>
        frame.batch.actions.map((action: { name: string }) => action.name)
      ),
      undoEntries: 1
    })
  )
  await page.screenshot({ path: testInfo.outputPath('dependent-edit.png') })
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(after)
})

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
    ovalPathIds: ['path-1']
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
    ovalPathIds: ['path-1']
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

test('local subscription receives fresh images during repeated refinement', async ({
  page
}, testInfo) => {
  test.skip(
    process.env.E2E_LOCAL_AI !== 'true',
    'Requires an explicitly enabled local subscription'
  )
  test.setTimeout(300_000)
  const images: string[] = []
  const frames = await captureProviderFrames(
    page,
    testInfo.outputPath('action-batch.ndjson')
  )
  page.on('request', (request) => {
    if (!request.headers()['x-ai-batch-receipt']) return
    const receipt = request.postDataJSON()
    for (const entry of receipt.actionResults ?? []) {
      if (entry.actionName === 'inspect_drawing' && entry.result.available)
        images.push(entry.result.image.dataUrl)
    }
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await expect(page.getByText('Local AI connected')).toBeVisible({
    timeout: 15_000
  })
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/ai/action-batch') &&
      !response.request().headers()['x-ai-batch-receipt'],
    { timeout: 270_000 }
  )
  await page
    .getByLabel('Message Agent')
    .fill(
      'Create one native Oval, a red (#FF0000) circle 100 by 100 pixels. Inspect the actual image returned. Then change that same circle to blue (#0000FF), inspect the updated image, and finally change it to green (#00FF00) and inspect again. Use separate operations so each intermediate color is rendered. In your final message, say which three colors you actually saw in the returned images. Do not ask clarification.'
    )
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  const response = await responsePromise
  expect(response.status()).toBe(200)
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    /success|failure|failed|partial/,
    { timeout: 270_000 }
  )
  await writeFile(testInfo.outputPath('action-batch.ndjson'), frames.join(''))
  await writeFile(
    testInfo.outputPath('review-count.json'),
    JSON.stringify({ images: images.length })
  )
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  expect(new Set(images).size).toBeGreaterThanOrEqual(3)
  for (const [index, dataUrl] of images.entries())
    await writeFile(
      testInfo.outputPath(`review-${index}.png`),
      Buffer.from(dataUrl.split(',')[1], 'base64')
    )
  const circles = await page.evaluate(async () => {
    const core = (await import('../src/testing/runtime-access')).core
    if (!core) throw new Error('App runtime unavailable')
    return [...core.deps.sceneTree.getAllElements().values()]
      .filter((element) => element.get('type') === 'oval')
      .map((element) => element.getAllComputedData())
  })
  expect(circles).toHaveLength(1)
  expect(circles[0]).toMatchObject({
    width: 100,
    height: 100,
    fills: expect.arrayContaining([
      expect.objectContaining({ color: '#00FF00' })
    ])
  })
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  await page.screenshot({ path: testInfo.outputPath('review-complete.png') })
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

test('local subscription reproduces a named logo through reference tools without an attachment', async ({
  page
}, testInfo) => {
  test.skip(
    process.env.E2E_LOCAL_AI !== 'true',
    'Requires an explicitly enabled local subscription'
  )
  test.setTimeout(330_000)
  const frames = await captureProviderFrames(
    page,
    testInfo.outputPath('reference-handoff.ndjson')
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await expect(page.getByText('Local AI connected')).toBeVisible({
    timeout: 15_000
  })
  await page
    .getByLabel('Message Agent')
    .fill('幫我畫星巴克的 logo，尺寸 480*480 px')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  try {
    const result = page.getByTestId('ai-agent-message').last()
    await expect(result).toHaveAttribute(
      'data-outcome',
      /success|partial|no-change|failed|cancelled/,
      { timeout: 305_000 }
    )
    const events = frames
      .join('')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'activity',
          tool: 'import_reference_image',
          status: 'completed'
        }),
        expect.objectContaining({
          type: 'activity',
          tool: 'vtracer',
          status: 'completed'
        })
      ])
    )
    await expect(result).toHaveAttribute('data-outcome', 'success')
    expect(await getCoreDocumentDigest(page)).not.toEqual(before)
  } finally {
    await page.screenshot({
      path: testInfo.outputPath('named-logo-result.png')
    })
  }
})

test('local subscription discovers APIs to reflect and center an existing vector', async ({
  page
}, testInfo) => {
  test.skip(process.env.E2E_LOCAL_AI !== 'true', 'Requires local subscription')
  test.setTimeout(240_000)
  const frames = await captureProviderFrames(
    page,
    testInfo.outputPath('action-batch.ndjson')
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const fixture = await page.evaluate(async () => {
    const { elementApis, transactionApis, selectionApis } =
      await import('../src/common-apis')
    const { core } = await import('../src/testing/runtime-access')
    const id = transactionApis.runTransaction(() =>
      elementApis.createVectorElementFromSinglePoint('a', { x: 20, y: 20 })
    )
    if (!id) throw new Error('Missing vector')
    const parentId = transactionApis.runTransaction(() => {
      elementApis.appendVectorAnchorPoint(id, {
        id: 'b',
        x: 80,
        y: 30,
        type: 'sharp',
        inHandle: null,
        outHandle: null
      })
      elementApis.appendVectorAnchorPoint(id, {
        id: 'c',
        x: 30,
        y: 70,
        type: 'sharp',
        inHandle: null,
        outHandle: null
      })
      const parent = core.createElementInParent(
        {
          type: 'frame',
          name: 'Test container',
          x: 0,
          y: 0,
          width: 300,
          height: 200
        },
        core.getCurrentWorkspaceId()
      )
      core.moveElements({
        elementIds: [id],
        targetParentId: parent,
        targetIndex: 0
      })
      return parent
    })
    elementApis.patchElementProperties(
      [
        {
          elementId: id,
          records: [
            {
              key: 'strokes',
              set: {
                'test-stroke': {
                  style: 'solid',
                  position: 'center',
                  width: 2,
                  dash: 20,
                  gap: 20,
                  fill: {
                    kind: 'solid',
                    defaultColorFormat: 'hex',
                    colorFormat: 'hex',
                    color: '#111111',
                    opacity: 1,
                    visible: true,
                    gradient: null
                  },
                  joinType: 'miter',
                  capType: 'butt',
                  miterAngle: 28.96
                }
              }
            }
          ]
        }
      ],
      { undoable: false }
    )
    selectionApis.selectElements([id])
    return {
      id,
      parentId,
      before: elementApis.getVectorAnchorPoints(id),
      count: core.getCanonicalElementCount()
    }
  })
  const depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await expect(page.getByText('Local AI connected')).toBeVisible({
    timeout: 15_000
  })
  const prompt =
    '把選取的向量左右翻轉，保留原本的物件，完成後將它置中於父容器。'
  await page.getByLabel('Message Agent').fill(prompt)
  const started = Date.now()
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  const message = page.getByTestId('ai-agent-message').last()
  await expect(message).not.toHaveAttribute('data-outcome', 'active', {
    timeout: 210_000
  })
  const state = await page.evaluate(async (id) => {
    const { elementApis } = await import('../src/common-apis')
    const { core } = await import('../src/testing/runtime-access')
    return {
      points: elementApis.getVectorAnchorPoints(id),
      count: core.getCanonicalElementCount(),
      data: core.getElementData(id)
    }
  }, fixture.id)
  await writeFile(
    testInfo.outputPath('live-vector-evidence.json'),
    JSON.stringify(
      {
        prompt,
        elapsedMs: Date.now() - started,
        fixture,
        state,
        reply: await message.innerText()
      },
      null,
      2
    )
  )
  await writeFile(testInfo.outputPath('action-batch.ndjson'), frames.join(''))
  await page.screenshot({ path: testInfo.outputPath('live-vector-result.png') })
  await expect(message).toHaveAttribute('data-outcome', 'success')
  expect(state.count).toBe(fixture.count)
  expect(state.points.map((p) => p.id)).toEqual(fixture.before.map((p) => p.id))
  const xs = state.points.map((p) => p.x)
  const ys = state.points.map((p) => p.y)
  expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(150, 5)
  expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(100, 5)
  for (let i = 1; i < state.points.length; i++) {
    expect(state.points[i].x - state.points[0].x).toBeCloseTo(
      -(fixture.before[i].x - fixture.before[0].x),
      5
    )
    expect(state.points[i].y - state.points[0].y).toBeCloseTo(
      fixture.before[i].y - fixture.before[0].y,
      5
    )
  }
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  await undo(page)
  const restored = await page.evaluate(
    async (id) =>
      (await import('../src/common-apis')).elementApis.getVectorAnchorPoints(
        id
      ),
    fixture.id
  )
  expect(restored).toEqual(fixture.before)
})

// Only used with an isolated test-owned document; never a general App policy.
const focusRecordedCanvas = async (page: Page) => {
  await clickCanvas(page, 0.1, 0.5)
}

test('recording navigation releases composer focus and fits the drawing', async ({
  page
}) => {
  test.setTimeout(20_000)
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await createRectangle(page)
  const initialZoom = await getZoomLevel(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  const composer = page.getByLabel('Message Agent')
  await composer.fill('Keep this draft')
  await expect(composer).toBeFocused()
  page.setDefaultTimeout(3000)
  await focusRecordedCanvas(page)
  await expect(composer).not.toBeFocused()
  await page.keyboard.press('Meta+1')
  await expect.poll(() => getZoomLevel(page)).not.toBe(initialZoom)
  await expect(composer).toHaveValue('Keep this draft')
})

// Observe a fixed, unobscured canvas region at native screenshot resolution.
// The existing safe canvas area excludes toolbar/sidebars/footer overlays; the
// open conversation can cover more of its right edge. Record the region explicitly.
const captureRecordedCanvas = async (
  page: Page,
  clip?: { x: number; y: number; width: number; height: number }
) => {
  if (!clip) {
    const topLeft = await getCanvasPosition(page, 0, 0)
    const bottomRight = await getCanvasPosition(page, 1, 1)
    const panelLocator = page.getByTestId('ai-agent-panel')
    const panel = (await panelLocator.isVisible())
      ? await panelLocator.boundingBox()
      : null
    const right = panel ? Math.min(bottomRight.x, panel.x) : bottomRight.x
    clip = {
      x: topLeft.x,
      y: topLeft.y,
      width: right - topLeft.x,
      height: bottomRight.y - topLeft.y
    }
  }
  if (clip.width <= 0 || clip.height <= 0)
    throw new Error('No unobscured recording canvas region')
  const captureStartedAt = Date.now()
  const png = await page.screenshot({ clip, caret: 'hide' })
  const capturedAt = Date.now()
  const pixels = await sharp(png).ensureAlpha().raw().toBuffer()
  return { clip, png, pixels, capturedAt, captureStartedAt }
}

const waitForRecordedDrawing = async (
  page: Page,
  timeline: unknown[],
  started: number,
  maximumDurationMs = 900_000,
  observation?: {
    baseline?: Awaited<ReturnType<typeof captureRecordedCanvas>>
    imagePath?: string
    stopAfterFirstVisibleMs?: number
  }
) => {
  const message = page.getByTestId('ai-agent-message').last()
  const baseline = observation
    ? (observation.baseline ?? (await captureRecordedCanvas(page)))
    : undefined
  let lastUnchangedAtMs = baseline
    ? Math.max(0, baseline.captureStartedAt - started)
    : 0
  let visibleChangeObserved = false
  if (baseline)
    timeline.push({
      interaction: 'canvas-baseline',
      elapsedMs: lastUnchangedAtMs,
      region: baseline.clip
    })
  const observeCanvas = async () => {
    if (!baseline || visibleChangeObserved) return
    const current = await captureRecordedCanvas(page, baseline.clip)
    const elapsedMs = Math.max(0, current.capturedAt - started)
    if (current.pixels.equals(baseline.pixels)) {
      // Screenshot sampling itself has a duration; its start is the safe
      // lower bound, not the later time when Playwright returns the image.
      lastUnchangedAtMs = Math.max(0, current.captureStartedAt - started)
      return
    }
    visibleChangeObserved = true
    timeline.push({
      interaction: 'first-visible-canvas-change',
      elapsedMs,
      lastUnchangedAtMs,
      region: baseline.clip,
      evidence: 'screenshot-pixels',
      quality: 'not-assessed'
    })
    if (observation?.imagePath)
      await writeFile(observation.imagePath, current.png)
    if (observation?.stopAfterFirstVisibleMs !== undefined) {
      await page.waitForTimeout(observation.stopAfterFirstVisibleMs)
      const stop = page.getByRole('button', {
        name: 'Cancel request',
        exact: true
      })
      // A control may temporarily disappear during a render. Only a terminal
      // conversation outcome can establish that there is no active request.
      await expect
        .poll(
          async () => {
            if (await stop.isVisible()) return true
            const outcome = await message.getAttribute('data-outcome')
            return !!outcome && outcome !== 'active'
          },
          { timeout: 30_000 }
        )
        .toBe(true)
      const outcomeBeforeStop = await message.getAttribute('data-outcome')
      const active = outcomeBeforeStop === 'active'
      if (active) await stop.click()
      await expect(message).not.toHaveAttribute('data-outcome', 'active', {
        timeout: 30_000
      })
      timeline.push({
        interaction: 'first-output-stop',
        elapsedMs: Date.now() - started,
        cancelledActiveRequest: active,
        settledOutcome: await message.getAttribute('data-outcome')
      })
    }
  }
  let initiallyFitted = false
  let interruption: Error | undefined
  const onNavigation = (frame: Frame) => {
    if (frame !== page.mainFrame()) return
    timeline.push({
      elapsedMs: Date.now() - started,
      interaction: 'page-navigation',
      url: frame.url()
    })
    interruption = new Error(
      'Recording interrupted by page reload or navigation; inspect the navigation and development-reload timeline. This is not drawing completion.'
    )
  }
  page.on('framenavigated', onNavigation)
  // Browser-local navigation must not wait for a screenshot RPC to finish.
  // The fixture state is disposed below; ordinary App usage never installs it.
  const observerKey = `recording-first-fit-${started}`
  await page.evaluate(
    async ({ observerKey, started }) => {
      const { core, testRuntimeState } =
        await import('../src/testing/runtime-access')
      const { viewportApis } = await import('../src/common-apis/viewport')
      const observer: { frame: number; result?: unknown } = { frame: 0 }
      const fitWhenReady = () => {
        const bounds = core.getAllElementsBounds()
        if (bounds && bounds.maxX > bounds.minX && bounds.maxY > bounds.minY) {
          viewportApis.zoomFit()
          observer.result = {
            elapsedMs: Date.now() - started,
            interaction: 'fit-zoom',
            reason: 'first-objects',
            bounds
          }
        } else observer.frame = requestAnimationFrame(fitWhenReady)
      }
      testRuntimeState.set(observerKey, observer)
      fitWhenReady()
    },
    { observerKey, started }
  )
  const fit = async (reason: 'first-objects' | 'settled') => {
    if (reason === 'first-objects') {
      const result = await page.evaluate(async (key) => {
        const { testRuntimeState } =
          await import('../src/testing/runtime-access')
        return testRuntimeState.get<{ result?: unknown }>(key)?.result
      }, observerKey)
      if (!result) return false
      timeline.push(result)
      return true
    }
    const bounds = await page.evaluate(async () =>
      (
        await import('../src/testing/runtime-access')
      ).core.getAllElementsBounds()
    )
    if (!bounds) return false
    await focusRecordedCanvas(page)
    await page.keyboard.press('Meta+1')
    timeline.push({
      elapsedMs: Date.now() - started,
      interaction: 'fit-zoom',
      reason,
      bounds
    })
    return true
  }
  try {
    while (true) {
      if (interruption) throw interruption
      if (Date.now() - started > maximumDurationMs)
        throw new Error('Recording guard reached before settlement')
      const confirmation = page.getByLabel('AI action confirmation')
      if (await confirmation.isVisible()) {
        await expect(confirmation).toContainText('Undoable')
        await expect(confirmation).toContainText('No external effect')
        timeline.push({
          elapsedMs: Date.now() - started,
          interaction: 'approve',
          summary: await confirmation.innerText()
        })
        await confirmation
          .getByRole('button', { name: 'Approve', exact: true })
          .click()
        await expect(confirmation).toBeHidden()
      }
      if (!initiallyFitted) initiallyFitted = await fit('first-objects')
      await observeCanvas()
      if (!initiallyFitted) initiallyFitted = await fit('first-objects')
      if (
        visibleChangeObserved &&
        observation?.stopAfterFirstVisibleMs !== undefined
      )
        break
      // Questions pause a turn; they are not terminal recording milestones.
      if (await page.getByLabel('Question', { exact: true }).isVisible()) break
      const outcome = await message.getAttribute('data-outcome', {
        timeout: 1000
      })
      if (outcome && outcome !== 'active') {
        await fit('settled')
        await observeCanvas()
        break
      }
      await page.waitForTimeout(1000)
    }
  } catch (error) {
    throw interruption ?? error
  } finally {
    page.off('framenavigated', onNavigation)
    if (!page.isClosed())
      await page.evaluate(async (key) => {
        const { testRuntimeState } =
          await import('../src/testing/runtime-access')
        const observer = testRuntimeState.get<{ frame: number }>(key)
        if (observer) cancelAnimationFrame(observer.frame)
        testRuntimeState.delete(key)
      }, observerKey)
  }
}

test('recording does not count conversation changes as canvas output', async ({
  page
}) => {
  test.setTimeout(20_000)
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page.evaluate(() => {
    const message = document.createElement('div')
    message.dataset.testid = 'ai-agent-message'
    message.dataset.outcome = 'active'
    document.body.append(message)
  })
  const timeline: { interaction?: string }[] = []
  const recording = waitForRecordedDrawing(
    page,
    timeline,
    Date.now(),
    15_000,
    {}
  )
  try {
    await expect
      .poll(() =>
        timeline.some((entry) => entry.interaction === 'canvas-baseline')
      )
      .toBe(true)
    await page
      .getByLabel('Message Agent')
      .fill('This UI update is not drawing output.')
    await page.waitForTimeout(1200)
  } finally {
    await page.evaluate(() => {
      const message = document.querySelector<HTMLElement>(
        '[data-testid="ai-agent-message"]'
      )
      if (!message) throw new Error('Missing recording fixture')
      message.dataset.outcome = 'success'
    })
    await recording
  }
  expect(
    timeline.some(
      (entry) => entry.interaction === 'first-visible-canvas-change'
    )
  ).toBe(false)
})

test('recording distinguishes unchanged canvas from newly visible pixels', async ({
  page
}, testInfo) => {
  test.setTimeout(20_000)
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.evaluate(() => {
    const message = document.createElement('div')
    message.dataset.testid = 'ai-agent-message'
    message.dataset.outcome = 'active'
    document.body.append(message)
  })
  const timeline: {
    interaction?: string
    elapsedMs?: number
    lastUnchangedAtMs?: number
  }[] = []
  const recording = waitForRecordedDrawing(
    page,
    timeline,
    Date.now(),
    15_000,
    {}
  )
  try {
    await expect
      .poll(
        () => timeline.some((entry) => entry.interaction === 'canvas-baseline'),
        { timeout: 3000 }
      )
      .toBe(true)
    await page.waitForTimeout(1200)
    expect(
      timeline.some(
        (entry) => entry.interaction === 'first-visible-canvas-change'
      )
    ).toBe(false)
    await createRectangle(page)
    await expect
      .poll(() =>
        timeline.some(
          (entry) => entry.interaction === 'first-visible-canvas-change'
        )
      )
      .toBe(true)
    const changed = timeline.find(
      (entry) => entry.interaction === 'first-visible-canvas-change'
    )
    if (!changed || changed.lastUnchangedAtMs === undefined)
      throw new Error('Missing visible observation')
    expect(changed.elapsedMs).toBeGreaterThanOrEqual(changed.lastUnchangedAtMs)
    await page.screenshot({
      path: testInfo.outputPath('first-visible-canvas.png')
    })
  } finally {
    await page.evaluate(() => {
      const message = document.querySelector<HTMLElement>(
        '[data-testid="ai-agent-message"]'
      )
      if (!message) throw new Error('Missing recording fixture')
      message.dataset.outcome = 'success'
    })
    await recording
    await writeFile(
      testInfo.outputPath('visible-timeline.json'),
      JSON.stringify(timeline, null, 2)
    )
  }
  expect(
    timeline.filter(
      (entry) => entry.interaction === 'first-visible-canvas-change'
    )
  ).toHaveLength(1)
})

test('first-output recording holds visible pixels for ten seconds then stops an active request', async ({
  page
}) => {
  test.setTimeout(25_000)
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', async (route) => {
    await gate
    await route.abort().catch(() => undefined)
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page.getByLabel('Message Agent').fill('Draw a shape')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'active'
  )
  // Use the actual App control, including its accessible name and cancellation.
  await expect(
    page.getByRole('button', { name: 'Cancel request' })
  ).toBeVisible()
  await focusRecordedCanvas(page)
  const timeline: { interaction?: string; elapsedMs?: number }[] = []
  const recording = waitForRecordedDrawing(page, timeline, Date.now(), 18_000, {
    stopAfterFirstVisibleMs: 10_000
  })
  await expect
    .poll(() =>
      timeline.some((entry) => entry.interaction === 'canvas-baseline')
    )
    .toBe(true)
  await createRectangle(page)
  try {
    await recording
  } finally {
    release()
  }
  const first = timeline.find(
    (entry) => entry.interaction === 'first-visible-canvas-change'
  )
  const stopped = timeline.find(
    (entry) => entry.interaction === 'first-output-stop'
  )
  expect(first).toBeDefined()
  expect(stopped).toBeDefined()
  expect(
    Number(stopped?.elapsedMs) - Number(first?.elapsedMs)
  ).toBeGreaterThanOrEqual(10_000)
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'cancelled'
  )
})

test('first-output recording waits for a temporarily absent Stop control and proves cancellation', async ({
  page
}) => {
  test.setTimeout(25_000)
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.evaluate(() => {
    const message = document.createElement('div')
    message.dataset.testid = 'ai-agent-message'
    message.dataset.outcome = 'active'
    document.body.append(message)
    const stop = document.createElement('button')
    stop.textContent = 'Stop'
    stop.setAttribute('aria-label', 'Cancel request')
    Object.assign(stop.style, {
      position: 'fixed',
      right: '10px',
      bottom: '10px',
      zIndex: '10000'
    })
    stop.addEventListener('click', () => {
      message.dataset.outcome = 'cancelled'
      stop.remove()
    })
    stop.style.display = 'none'
    setTimeout(() => {
      stop.style.display = 'block'
    }, 13_000)
    document.body.append(stop)
  })
  const timeline: { interaction?: string; elapsedMs?: number }[] = []
  const recording = waitForRecordedDrawing(page, timeline, Date.now(), 18_000, {
    stopAfterFirstVisibleMs: 10_000
  })
  await expect
    .poll(() =>
      timeline.some((entry) => entry.interaction === 'canvas-baseline')
    )
    .toBe(true)
  await createRectangle(page)
  await recording
  const first = timeline.find(
    (entry) => entry.interaction === 'first-visible-canvas-change'
  )
  const stopped = timeline.find(
    (entry) => entry.interaction === 'first-output-stop'
  )
  expect(first).toBeDefined()
  expect(stopped).toBeDefined()
  expect(
    Number(stopped?.elapsedMs) - Number(first?.elapsedMs)
  ).toBeGreaterThanOrEqual(10_000)
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'cancelled'
  )
})

test('recording fits new offscreen objects while screenshot capture is pending', async ({
  page
}) => {
  test.setTimeout(25_000)
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.evaluate(() => {
    const message = document.createElement('div')
    message.dataset.testid = 'ai-agent-message'
    message.dataset.outcome = 'active'
    document.body.append(message)
  })
  const baseline = await captureRecordedCanvas(page)
  const originalScreenshot = page.screenshot.bind(page)
  let release!: () => void
  const hold = new Promise<void>((resolve) => {
    release = resolve
  })
  let entered!: () => void
  const capturing = new Promise<void>((resolve) => {
    entered = resolve
  })
  page.screenshot = async (...args) => {
    entered()
    await hold
    return originalScreenshot(...args)
  }
  const recording = waitForRecordedDrawing(page, [], Date.now(), 20_000, {
    baseline
  })
  try {
    await capturing
    const initial = await getZoomLevel(page)
    await page.evaluate(async () => {
      const { elementApis } = await import('../src/common-apis')
      const created = elementApis.createElement({
        type: 'rect',
        workspacePosition: { x: 20000, y: 20000 },
        width: 2000,
        height: 2000
      })
      if (!created) throw new Error('Missing offscreen fixture element')
    })
    await expect.poll(() => getZoomLevel(page)).not.toBe(initial)
  } finally {
    release()
    page.screenshot = originalScreenshot
    await page.evaluate(() => {
      const message = document.querySelector<HTMLElement>(
        '[data-testid="ai-agent-message"]'
      )
      if (!message) throw new Error('Missing recording fixture')
      message.dataset.outcome = 'success'
    })
    await recording
  }
})

test('recording fits first objects before any batch receipt and fits again only at settlement', async ({
  page
}) => {
  test.setTimeout(30_000)
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await createRectangle(page)
  await page.evaluate(() => {
    const message = document.createElement('div')
    message.dataset.testid = 'ai-agent-message'
    message.dataset.outcome = 'active'
    document.body.append(message)
  })
  const timeline: unknown[] = []
  const navigation = waitForRecordedDrawing(page, timeline, Date.now(), 20_000)
  try {
    await expect.poll(() => timeline.length).toBe(1)
    expect(timeline[0]).toMatchObject({
      interaction: 'fit-zoom',
      reason: 'first-objects'
    })
    const fittedZoom = await getZoomLevel(page)
    await createRectangle(page, 0.8, 0.8)
    await page.waitForTimeout(2200)
    expect(timeline).toHaveLength(1)
    expect(await getZoomLevel(page)).toBe(fittedZoom)
    await page.evaluate(() => {
      const message = document.querySelector<HTMLElement>(
        '[data-testid="ai-agent-message"]'
      )
      if (!message) throw new Error('Missing recording fixture')
      message.dataset.outcome = 'success'
    })
    await navigation
    expect(timeline).toHaveLength(2)
    expect(timeline[1]).toMatchObject({
      interaction: 'fit-zoom',
      reason: 'settled'
    })
  } finally {
    await page.evaluate(() => {
      const message = document.querySelector<HTMLElement>(
        '[data-testid="ai-agent-message"]'
      )
      if (message) message.dataset.outcome = 'success'
    })
    await navigation.catch(() => undefined)
  }
})

for (const state of ['question', 'success'] as const) {
  test(`recording with objects handles ${state} without treating questions as completion`, async ({
    page
  }) => {
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    await createRectangle(page)
    await page.evaluate((state) => {
      const message = document.createElement('div')
      message.dataset.testid = 'ai-agent-message'
      message.dataset.outcome = state === 'success' ? 'success' : 'active'
      document.body.append(message)
      if (state === 'question') {
        const question = document.createElement('button')
        question.setAttribute('aria-label', 'Question')
        question.textContent = 'Choose a view'
        document.body.append(question)
      }
    }, state)
    const timeline: unknown[] = []
    await waitForRecordedDrawing(page, timeline, Date.now())
    expect(timeline).toHaveLength(state === 'success' ? 2 : 1)
    expect(timeline[0]).toMatchObject({ reason: 'first-objects' })
    if (state === 'success')
      expect(timeline[1]).toMatchObject({
        interaction: 'fit-zoom',
        reason: 'settled'
      })
  })
}

test('recording driver completes an undoable confirmation in its isolated document', async ({
  page
}, testInfo) => {
  test.setTimeout(20_000)
  const frames = await captureProviderFrames(
    page,
    testInfo.outputPath('recorded.ndjson')
  )
  const artifact = parseLocalVectorArtifact(
    '<svg width="100" height="100"><path d="M0,0L100,0L100,100L0,100Z" fill="#008800"/></svg>'
  )
  const drawing = prepareLocalVectorArtifact(artifact, {
    imageArtifactId: artifact.imageArtifactId,
    compositionRole: 'Recording fixture',
    bounds: { x: 0, y: 0, width: 100, height: 100 },
    excludePathIds: []
  })
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) => {
    if (route.request().headers()['x-ai-batch-receipt'])
      return route.fulfill({ json: { accepted: true } })
    return route.fulfill({
      contentType: 'application/x-ndjson',
      body: [
        {
          type: 'batch',
          receiptToken: '11111111-1111-1111-1111-111111111111',
          batch: {
            batchId: 'recording-insert',
            actions: [
              {
                id: 'insert',
                name: 'insert_vector_composition',
                arguments: drawing,
                summary: 'Insert test drawing'
              }
            ]
          }
        },
        {
          type: 'result',
          batch: {
            batchId: 'recording-remove',
            actions: [
              {
                id: 'remove',
                name: 'remove_ai_composition',
                arguments: { compositionId: drawing.groupDescriptor.id },
                summary: 'Remove test drawing'
              }
            ]
          }
        }
      ]
        .map((frame) => JSON.stringify(frame))
        .join('\n')
    })
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByLabel('Message Agent')
    .fill('Draw, then remove the test drawing.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByLabel('AI action confirmation')).toBeVisible()
  const timeline: unknown[] = []
  await waitForRecordedDrawing(page, timeline, Date.now())
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'success'
  )
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  expect(timeline).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ interaction: 'approve' })
    ])
  )
  await expect
    .poll(() => frames.join('').includes('recording-remove'))
    .toBe(true)
  await expect
    .poll(() => readFile(testInfo.outputPath('recorded.ndjson'), 'utf8'))
    .toBe(frames.join(''))
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

test.describe('live execution acceptance recording', () => {
  for (const firstOutputOnly of [false, true]) {
    const title = firstOutputOnly
      ? 'local subscription records first output of Taipei 101 then stops after ten seconds'
      : 'local subscription draws the upper two Taipei 101 tiers and spire from one brief'
    test(title, async ({ browser }, testInfo) => {
      test.skip(
        process.env.E2E_LOCAL_AI !== 'true',
        'Requires the local subscription opt-in; never use a mock as visual acceptance'
      )
      // A harness cleanup guard, not an App request quota or a performance SLA.
      // Reserve a cleanup minute after the driver guard so failure artifacts survive.
      const recordingTimeoutMs = 30 * 60 * 1000
      test.setTimeout(recordingTimeoutMs + 60_000)
      expect(process.env.AI_PROVIDER_BACKEND).toBe('local-codex')
      expect(process.env.AI_PROVIDER_MODEL).toBe('gpt-6-astra')
      const context = await browser.newContext({
        baseURL: String(testInfo.project.use.baseURL),
        viewport: { width: 1920, height: 1080 },
        recordVideo: {
          dir: testInfo.outputDir,
          size: { width: 1920, height: 1080 }
        }
      })
      const page = await context.newPage()
      page.setDefaultTimeout(30_000)
      captureBrowserErrors(page)
      const brief =
        'Draw only Taipei 101’s two uppermost large bamboo-shaped sections, plus the full crown and spire above them, as a highly detailed, realistic 2D illustration from a fixed elevated three-quarter view looking down at the building, with clearly visible top surfaces and consistent perspective. Use editable shapes, preserve visible façade details, and scale at 1 cm = 1 px.'
      const identity = createTestDocumentIdentity('aiPerformance=profile')
      await captureProviderFrames(
        page,
        testInfo.outputPath('action-batch.ndjson')
      )
      const inspections: Promise<void>[] = []
      const receipts: unknown[] = []
      const timeline: unknown[] = []
      let started = Date.now()
      page.on('websocket', (socket) => {
        if (
          new URL(socket.url()).port !==
          new URL(String(testInfo.project.use.baseURL)).port
        )
          return
        socket.on('framereceived', ({ payload }) => {
          try {
            const event = JSON.parse(String(payload))
            if (event.type === 'full-reload')
              timeline.push({
                elapsedMs: Date.now() - started,
                interaction: 'development-reload',
                path: event.path ?? null
              })
          } catch {
            /* Not a Vite JSON message. */
          }
        })
      })
      page.on('request', (request) => {
        if (!request.headers()['x-ai-batch-receipt']) return
        const receipt = request.postDataJSON()
        for (const entry of receipt.actionResults ?? []) {
          receipts.push({
            elapsedMs: Date.now() - started,
            actionName: entry.actionName,
            status: entry.status,
            available: entry.result?.available,
            current: entry.result?.current,
            timing: entry.result?.timing,
            evidence: entry.result?.evidence
          })
          if (
            entry.actionName === 'inspect_drawing' &&
            entry.result?.available === true &&
            typeof entry.result.image?.dataUrl === 'string'
          ) {
            inspections.push(
              writeFile(
                testInfo.outputPath(`inspection-${inspections.length}.png`),
                Buffer.from(entry.result.image.dataUrl.split(',')[1], 'base64')
              )
            )
          }
        }
      })
      try {
        await page.goto(identity.url)
        await waitForAppReady(page)
        await page.getByRole('button', { name: 'Open Agent' }).click()
        await expect(page.getByText('Local AI connected')).toBeVisible({
          timeout: 30_000
        })
        await page.getByLabel('Message Agent').fill(brief)
        await page.evaluate(async () => {
          const profile = (
            await import('../src/testing/runtime-access')
          ).getActiveAiDrawingPerformanceProfile()
          if (!profile) throw new Error('Missing live App performance profile')
          profile.reset()
        })
        const canvasBaseline = await captureRecordedCanvas(page)
        started = Date.now()
        await page.getByRole('button', { name: 'Send', exact: true }).click()
        await focusRecordedCanvas(page)
        const message = page.getByTestId('ai-agent-message').last()
        await expect(message).toBeVisible()
        await waitForRecordedDrawing(
          page,
          timeline,
          started,
          recordingTimeoutMs,
          {
            baseline: canvasBaseline,
            imagePath: testInfo.outputPath('first-visible-canvas.png'),
            ...(firstOutputOnly ? { stopAfterFirstVisibleMs: 10_000 } : {})
          }
        )
        if (firstOutputOnly) {
          expect(timeline).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                interaction: 'first-visible-canvas-change'
              }),
              expect.objectContaining({ interaction: 'first-output-stop' })
            ])
          )
          await expect(
            page.getByRole('button', { name: 'Cancel request', exact: true })
          ).toBeHidden({ timeout: 30_000 })
          expect(getCapturedBrowserErrors(page)).toEqual([])
          return
        }
        await page.screenshot({
          path: testInfo.outputPath('completed-app.png')
        })
        await writeFile(
          testInfo.outputPath('outcome.txt'),
          await message.innerText()
        )
        await writeFile(
          testInfo.outputPath('document.json'),
          JSON.stringify(
            await page.evaluate(async () =>
              (await import('../src/testing/runtime-access')).core.save()
            )
          )
        )
        await expect(page.getByLabel('Question', { exact: true })).toHaveCount(
          0
        )
        await expect(message).toHaveAttribute('data-outcome', 'success')
        const canonicalDigest = await getCoreDocumentDigest(page)
        await expect
          .poll(() => getPersistedDocumentDigest(identity.fileId), {
            timeout: 30_000,
            intervals: [1000],
            message:
              'The completed drawing must match its full durable checkpoint'
          })
          .toEqual(canonicalDigest)
        await writeFile(
          testInfo.outputPath('durable-completion.json'),
          JSON.stringify(
            { documentId: identity.fileId, canonicalDigest },
            null,
            2
          )
        )
        expect(getCapturedBrowserErrors(page)).toEqual([])
        expect(inspections.length).toBeGreaterThan(0)
        // The recording intentionally includes ten seconds of the finished view.
        await page.waitForTimeout(10_000)
      } finally {
        if (!page.isClosed()) {
          const stop = page.getByRole('button', {
            name: 'Cancel request',
            exact: true
          })
          if (await stop.isVisible()) await stop.click()
          await writeFile(
            testInfo.outputPath('document.json'),
            JSON.stringify(
              await page.evaluate(async () =>
                (await import('../src/testing/runtime-access')).core.save()
              )
            )
          )
          await writeFile(
            testInfo.outputPath('owner-profile.json'),
            JSON.stringify(
              await page.evaluate(
                async () =>
                  (await import('../src/testing/runtime-access'))
                    .getActiveAiDrawingPerformanceProfile()
                    ?.snapshot() ?? null
              )
            )
          )
          await page.screenshot({ path: testInfo.outputPath('last-app.png') })
        }
        await Promise.all(inspections)
        await writeFile(
          testInfo.outputPath('execution-evidence.json'),
          JSON.stringify(
            {
              brief,
              documentId: identity.fileId,
              recordingMode: firstOutputOnly ? 'first-output' : 'full-artwork',
              model: process.env.AI_PROVIDER_MODEL,
              // The production provider rejects a non-medium thread acknowledgement.
              requiredEffort: 'medium',
              timeline,
              receipts
            },
            null,
            2
          )
        )
        await writeFile(
          testInfo.outputPath('live-browser-errors.json'),
          JSON.stringify(getCapturedBrowserErrors(page))
        )
        await context.close()
        const video = page.video()
        if (video)
          await testInfo.attach('execution-video', {
            path: await video.path(),
            contentType: 'video/webm'
          })
      }
    })
  }
})

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

test('recording identifies page reload as an interruption instead of a missing message', async ({
  page
}) => {
  test.setTimeout(20_000)
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.evaluate(() => {
    const message = document.createElement('div')
    message.dataset.testid = 'ai-agent-message'
    message.dataset.outcome = 'active'
    document.body.append(message)
  })
  page.setDefaultTimeout(2000)
  const timeline: unknown[] = []
  const running = waitForRecordedDrawing(
    page,
    timeline,
    Date.now(),
    10000,
    {}
  ).then(
    () => null,
    (error: Error) => error.message
  )
  await expect.poll(() => timeline.length).toBe(1)
  await page.reload()
  expect(await running).toContain(
    'Recording interrupted by page reload or navigation'
  )
  expect(timeline).toEqual([
    expect.objectContaining({ interaction: 'canvas-baseline' }),
    expect.objectContaining({ interaction: 'page-navigation' })
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
