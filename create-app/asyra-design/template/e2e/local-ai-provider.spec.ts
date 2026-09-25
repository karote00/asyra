import sharp from 'sharp'
import { createLocalImageTools } from '../server/local-image-tools'
import { AiImageToolIds } from '../server/ai-domain-prompt'
import {
  parseLocalVectorArtifact,
  prepareLocalVectorArtifact
} from '../server/local-vector-artifact'
import { readFile, writeFile } from 'node:fs/promises'
import { convertBuffer } from '@visioncortex/vtracer'
import { convertVTracerBuffer } from '../vtracer-tool-server.mjs'
import { expect, test, type Page } from '@playwright/test'
import {
  captureBrowserErrors,
  getCapturedBrowserErrors,
  getCoreDocumentDigest,
  getUndoHistoryDepth,
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

const captureProviderFrames = async (page: Page, outputPath: string) => {
  const frames: string[] = []
  await page.exposeFunction('recordReviewFrame', async (line: string) => {
    frames.push(line)
    await writeFile(outputPath, frames.join(''))
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
        elements: { id: string }[]
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
    expect(
      inspection.elements.map((element: { id: string }) => element.id)
    ).toContain(id)
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
