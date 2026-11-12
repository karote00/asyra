import { readFileSync, writeFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import sharp from 'sharp'
import type { SharedPublication } from '@asyra/core/contracts'
import { createTestDocumentURL, waitForAppReady } from './test-utils'

interface SceneRow {
  id: string
  matrix: number[]
  handle: unknown
}
interface ReviewState {
  ids: string[]
  groups: string[]
  rootIds: string[]
  before: SceneRow[]
  state: () => SceneRow[]
  parentId: string
  siblings: string[]
}
interface GroupResult {
  groupId: string
  publications: readonly SharedPublication[]
  order: string[]
}

const fixture = new URL(
  '../test-data/ai-drawing/fixtures/hierarchy-20261110.json.gz',
  import.meta.url
)
const metadata = JSON.parse(
  readFileSync(
    new URL(
      '../test-data/ai-drawing/fixtures/hierarchy-20261110.json',
      import.meta.url
    ),
    'utf8'
  )
)

test('recorded hierarchy preserves pixels, world geometry, order, history and shared replay with bounded work', async ({
  page
}, testInfo) => {
  test.setTimeout(240_000)
  await page.route('**/recorded-hierarchy-fixture.json', (route) =>
    route.fulfill({
      contentType: 'application/gzip',
      body: readFileSync(fixture)
    })
  )
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  const setup = await page.evaluate(async (rootIds: string[]) => {
    const { core, getActiveCollaborationHandle, testRuntimeState } =
      await import('../src/testing/runtime-access')
    const { viewportApis } = await import('../src/common-apis/viewport')

    await getActiveCollaborationHandle()?.dispose()
    const response = await fetch('/recorded-hierarchy-fixture.json')

    if (!response.body) {
      throw new Error('Missing recorded fixture stream')
    }

    const document = await new Response(
      response.body.pipeThrough(new DecompressionStream('gzip'))
    ).json()

    core.load(document)

    core.selectElements([], { undoable: false })
    viewportApis.zoomFit()
    const ids = Object.keys(document.sceneTree.elements).filter(
      (id) =>
        !['workspace', 'group'].includes(document.sceneTree.elements[id].type)
    )
    const groups = Object.keys(document.sceneTree.elements).filter(
      (id) => document.sceneTree.elements[id].type === 'group'
    )

    const state = () =>
      ids.map((id) => {
        const element = core.deps.render.getElementById(id)

        if (!element) {
          throw new Error(`Missing rendered element ${id}`)
        }

        const matrix = element.worldTransform

        return {
          id,
          matrix: [
            matrix.a,
            matrix.b,
            matrix.c,
            matrix.d,
            matrix.tx,
            matrix.ty
          ],
          handle: element.getEngineHandle()
        }
      })

    const before = state()
    const parentId = core.getElementMetadata(rootIds[0])?.parentId

    if (!parentId) {
      throw new Error('Missing recorded parent')
    }

    const siblings = core.getElementChildren(parentId, 0, 100_000).elementIds

    testRuntimeState.set('hierarchy-scene', {
      ids,
      groups,
      rootIds,
      before,
      state,
      parentId,
      siblings
    })
    // Establish the previous rendering policy on identical canonical geometry.
    groups.forEach((id) => {
      const node = core.deps.render.getElementById(id)

      if (node) {
        node.transformGroup = false
      }
    })
    core.deps.render.requestRender()

    return { count: ids.length, roots: rootIds.length }
  }, metadata.groupElementIds)

  expect(setup).toEqual({ count: 25539, roots: 4 })
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  const viewport = page.locator('#viewport-anchor')

  const viewEvidence: {
    phase: string
    name: string
    scale: number
    fraction: number
    viewport: unknown
    deviceScale: number
  }[] = []

  const detailViews = async (phase: string) => {
    const images: Buffer[] = []
    const camera = await page.evaluate(async () => {
      const { viewportApis } = await import('../src/common-apis/viewport')

      return {
        scale: viewportApis.getScale(),
        position: viewportApis.getPosition()
      }
    })

    for (const [name, fraction] of [
      ['crown', 0.23],
      ['tiers', 0.5],
      ['base', 0.9]
    ] as const) {
      await page.evaluate(
        async ({ fraction, scale }) => {
          const { core } = await import('../src/testing/runtime-access')
          const { viewportApis } = await import('../src/common-apis/viewport')
          const bounds = core.getAllElementsBounds()
          const anchor = document
            .getElementById('viewport-anchor')
            ?.getBoundingClientRect()

          if (!bounds || !anchor) {
            throw new Error('Missing detail viewport')
          }

          viewportApis.zoomToCenter(scale, 0, 0)
          viewportApis.panTo(
            anchor.x +
              anchor.width / 2 -
              (bounds.minX + (bounds.maxX - bounds.minX) * 0.68) * scale,
            anchor.y +
              anchor.height / 2 -
              (bounds.minY + (bounds.maxY - bounds.minY) * fraction) * scale
          )
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
        },
        { fraction, scale: camera.scale * 8 }
      )
      viewEvidence.push({
        phase,
        name,
        fraction,
        scale: camera.scale * 8,
        viewport: await viewport.boundingBox(),
        deviceScale: await page.evaluate(() => devicePixelRatio)
      })
      images.push(
        await viewport.screenshot({
          path: testInfo.outputPath(`${phase}-${name}.png`)
        })
      )
    }

    await page.evaluate(async ({ scale, position }) => {
      const { viewportApis } = await import('../src/common-apis/viewport')

      viewportApis.zoomToCenter(scale, 0, 0)
      viewportApis.panTo(position.x, position.y)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
    }, camera)

    return images
  }

  const before = await viewport.screenshot({
    path: testInfo.outputPath('recorded-before.png')
  })
  const baselineDetails = await detailViews('baseline')

  await page.evaluate(async () => {
    const { core, testRuntimeState } =
      await import('../src/testing/runtime-access')
    const review = testRuntimeState.get<ReviewState>('hierarchy-scene')

    if (!review) {
      throw new Error('Missing recorded review state')
    }

    review.groups.forEach((id) => {
      const node = core.deps.render.getElementById(id)

      if (node) {
        node.transformGroup = true
      }
    })
    core.deps.render.requestRender()
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
  })
  const isolated = await viewport.screenshot({
    path: testInfo.outputPath('recorded-isolated.png')
  })
  const isolatedDetails = await detailViews('isolated')
  const result = await page.evaluate(async () => {
    const {
      core,
      hierarchyApis,
      testRuntimeState,
      subscribeToDiagnosticCounters,
      startDocumentPublicationCapture,
      readTestCapture,
      stopTestCapture
    } = await import('../src/testing/runtime-access')
    const review = testRuntimeState.get<ReviewState>('hierarchy-scene')

    if (!review) {
      throw new Error('Missing recorded review state')
    }

    const counters: Record<string, number> = {}
    const dispose = subscribeToDiagnosticCounters((name, value) => {
      counters[name] = (counters[name] ?? 0) + value
    })
    const read = core.sceneTreeSaveData.bind(core)
    let wholeReads = 0

    core.sceneTreeSaveData = () => {
      wholeReads++

      return read()
    }

    startDocumentPublicationCapture('hierarchy-publication')
    let publications: readonly SharedPublication[] = []
    let groupId: string

    try {
      groupId = hierarchyApis.groupElements(review.rootIds).groupId
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
    } finally {
      core.sceneTreeSaveData = read
      dispose()
      publications = [
        ...readTestCapture('hierarchy-publication')
      ] as readonly SharedPublication[]
      stopTestCapture('hierarchy-publication')
    }

    const after = review.state()
    let maxMatrixDelta = 0
    let changedHandles = 0

    after.forEach((item: SceneRow, index: number) => {
      if (item.handle !== review.before[index].handle) {
        changedHandles++
      }

      item.matrix.forEach((value: number, axis: number) => {
        maxMatrixDelta = Math.max(
          maxMatrixDelta,
          Math.abs(value - review.before[index].matrix[axis])
        )
      })
    })
    const order = core.getElementChildren(groupId, 0, 10).elementIds

    testRuntimeState.set('hierarchy-result', { groupId, publications, order })

    return {
      wholeReads,
      counters,
      maxMatrixDelta,
      changedHandles,
      order,
      publications: publications.length
    }
  })

  await testInfo.attach('group-work', {
    body: JSON.stringify(result),
    contentType: 'application/json'
  })
  expect(result.wholeReads).toBe(0)
  expect(result.changedHandles).toBe(0)
  expect(result.maxMatrixDelta).toBeLessThan(1e-7)
  expect(result.order).toEqual(metadata.groupElementIds)
  expect(result.publications).toBe(1)
  expect(result.counters['ui-context-hierarchy-node-visit'] ?? 0).toBeLessThan(
    100
  )
  const after = await viewport.screenshot({
    path: testInfo.outputPath('recorded-after.png')
  })

  await testInfo.attach('baseline-pixels', {
    body: before,
    contentType: 'image/png'
  })
  const groupedDetails = await detailViews('grouped')
  const rawAfter = await sharp(after).removeAlpha().raw().toBuffer()

  const rawIsolated = await sharp(isolated).removeAlpha().raw().toBuffer()

  writeFileSync(
    testInfo.outputPath('group-work.json'),
    JSON.stringify(result, null, 2)
  )
  expect(rawAfter.equals(rawIsolated)).toBe(true)
  for (let i = 0; i < isolatedDetails.length; i++) {
    expect(
      (await sharp(groupedDetails[i]).raw().toBuffer()).equals(
        await sharp(isolatedDetails[i]).raw().toBuffer()
      )
    ).toBe(true)
  }

  const policyPixels = []

  for (const [baseline, candidate] of [
    [before, isolated],
    ...baselineDetails.map((buffer, i) => [buffer, isolatedDetails[i]])
  ]) {
    const a = await sharp(baseline).removeAlpha().raw().toBuffer()
    const b = await sharp(candidate).removeAlpha().raw().toBuffer()
    let changedPixels = 0
    let maxChannelDelta = 0
    let absoluteDelta = 0
    let foregroundPixels = 0

    for (let i = 0; i < a.length; i += 3) {
      let changed = false

      if (Math.max(a[i], a[i + 1], a[i + 2]) > 40) {
        foregroundPixels++
      }

      for (let c = 0; c < 3; c++) {
        const delta = Math.abs(a[i + c] - b[i + c])

        changed ||= delta !== 0
        maxChannelDelta = Math.max(maxChannelDelta, delta)
        absoluteDelta += delta
      }

      if (changed) {
        changedPixels++
      }
    }

    policyPixels.push({
      changedPixels,
      maxChannelDelta,
      absoluteDelta,
      pixels: a.length / 3,
      foregroundPixels
    })
  }

  writeFileSync(
    testInfo.outputPath('render-policy-pixels.json'),
    JSON.stringify(policyPixels, null, 2)
  )
  // Changing render domains changes float32 GPU transform composition. Keep
  // strict reparent equality above, and bound only the old/new policy AA delta.
  for (const sample of policyPixels) {
    expect(sample.foregroundPixels).toBeGreaterThan(1000)
    expect(sample.changedPixels / sample.pixels).toBeLessThan(0.0005)
    expect(sample.absoluteDelta / (sample.pixels * 3)).toBeLessThan(0.01)
    expect(sample.maxChannelDelta).toBeLessThanOrEqual(64)
  }

  writeFileSync(
    testInfo.outputPath('detail-views.json'),
    JSON.stringify(viewEvidence, null, 2)
  )
  const replay = await page.evaluate(async () => {
    const {
      core,
      historyApis,
      testRuntimeState,
      startDocumentPublicationCapture,
      readTestCapture,
      stopTestCapture
    } = await import('../src/testing/runtime-access')
    const { createPublicationProcessor } =
      await import('../src/collaboration/publication-processor')
    const review = testRuntimeState.get<ReviewState>('hierarchy-scene')

    if (!review) {
      throw new Error('Missing recorded review state')
    }

    const result = testRuntimeState.get<GroupResult>('hierarchy-result')

    if (!result) {
      throw new Error('Missing recorded result')
    }

    await historyApis.undo()
    const undo = core.getElementChildren(review.parentId, 0, 100_000).elementIds

    await historyApis.redo()
    const redo = core.getElementChildren(result.groupId, 0, 10).elementIds

    await historyApis.undo()
    startDocumentPublicationCapture('hierarchy-remote-echo')
    const applyPublication = createPublicationProcessor({
      decideRemotePublication: (publication) => publication,

      applyRemoteCanonicalChangeSlices: (input) =>
        core.applyRemoteCanonicalChangeSlices({
          origin: input.origin,
          // Match the frontend boundary after the production wire decoder validates it.
          slices: input.slices as Parameters<
            typeof core.applyRemoteCanonicalChangeSlices
          >[0]['slices']
        })
    })

    for (const publication of result.publications) {
      if (!(await applyPublication(publication))) {
        throw new Error('Recorded publication was rejected')
      }
    }

    const echoes = readTestCapture('hierarchy-remote-echo').length

    stopTestCapture('hierarchy-remote-echo')
    const remote = core.getElementChildren(result.groupId, 0, 10).elementIds
    const after = review.state()
    let maxMatrixDelta = 0

    after.forEach((item: SceneRow, index: number) =>
      item.matrix.forEach((value: number, axis: number) => {
        maxMatrixDelta = Math.max(
          maxMatrixDelta,
          Math.abs(value - review.before[index].matrix[axis])
        )
      })
    )

    return {
      undo,
      original: review.siblings,
      redo,
      remote,
      maxMatrixDelta,
      echoes
    }
  })

  expect(replay.undo).toEqual(replay.original)
  expect(replay.redo).toEqual(metadata.groupElementIds)
  expect(replay.remote).toEqual(metadata.groupElementIds)
  expect(replay.maxMatrixDelta).toBeLessThan(1e-7)
  expect(replay.echoes).toBe(0)
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  const remote = await viewport.screenshot({
    path: testInfo.outputPath('recorded-remote.png')
  })

  expect(
    (await sharp(remote).removeAlpha().raw().toBuffer()).equals(rawIsolated)
  ).toBe(true)
  writeFileSync(
    testInfo.outputPath('work-counts.json'),
    JSON.stringify({ setup, result, replay, policyPixels }, null, 2)
  )
  await testInfo.attach('work-counts', {
    body: JSON.stringify({ setup, result, replay }, null, 2),
    contentType: 'application/json'
  })
})
