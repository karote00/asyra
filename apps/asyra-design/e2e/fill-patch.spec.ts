import { writeFile } from 'node:fs/promises'
import { createDesignPreparationSession } from '../server/design-preparation'
import { test, expect, type Page } from '@playwright/test'
import {
  createTestDocumentURL,
  waitForAppReady,
  resetCanvas,
  createRectangle,
  getTransactionSnapshot,
  getPersistedDocumentCheckpoint,
  getCoreDocumentDigest,
  getPersistedDocumentDigest,
  undo,
  redo
} from './test-utils'
import { openGradientFillEditor } from './gradient-test-utils'

const readFill = (page: Page) =>
  page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const elementId = core.getSelectedElementIds()[0]
    const fills = core.getElementComputedData(elementId, ['fills'])?.fills
    if (!Array.isArray(fills) || !fills[0]) {
      throw new Error('Missing selected fill')
    }
    return fills[0]
  })

test.beforeEach(async ({ page }) => {
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  await resetCanvas(page)
  await createRectangle(page, 0.3, 0.3)
})

test('nested gradient batch patches reach the durable checkpoint and survive reload', async ({
  page
}) => {
  test.setTimeout(60_000)
  const fileId = new URL(page.url()).searchParams.get('fileId')
  if (!fileId) {
    throw new Error('The test document has no file ID')
  }
  const result = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { fillApis } = await import('../src/common-apis')
    const elementId = core.getSelectedElementIds()[0]
    const fillId = (
      core.getElementComputedData(elementId, ['fills'])?.fills as {
        id: string
      }[]
    )[0].id
    const initial = {
      gradientType: 'linear' as const,
      gradientHandles: [
        { x: 0, y: 0 },
        { x: 1, y: 0.35 }
      ],
      gradientStops: [
        { position: 0, color: '#214e5d', opacity: 1 },
        { position: 1, color: '#1a4152', opacity: 1 }
      ]
    }
    fillApis.updateFillFields(elementId, fillId, {
      kind: 'gradient',
      gradient: initial
    })
    const gradient = {
      ...initial,
      gradientHandles: [
        { x: 0.2, y: 0 },
        { x: 0.63, y: 1 }
      ],
      gradientStops: [
        { position: 0, color: '#1f4856', opacity: 1 },
        { position: 0.58, color: '#254e5c', opacity: 1 },
        { position: 1, color: '#214a58', opacity: 1 }
      ]
    }
    fillApis.updateFillFieldsBatch([{ elementId, fillId, patch: { gradient } }])
    return { elementId, fillId, gradient }
  })
  await expect
    .poll(
      async () => {
        const saved = await getPersistedDocumentCheckpoint(fileId)
        return (
          saved.checkpoint as {
            props?: Record<string, { gradient?: unknown }>
          } | null
        )?.props?.[result.fillId]?.gradient
      },
      { timeout: 25_000 }
    )
    .toEqual(result.gradient)
  await page.reload()
  await waitForAppReady(page)
  const reloaded = await page.evaluate(async ({ elementId }) => {
    const { core } = await import('../src/testing/runtime-access')
    return (
      core.getElementComputedData(elementId, ['fills'])?.fills as {
        gradient: unknown
      }[]
    )[0].gradient
  }, result)
  expect(reloaded).toEqual(result.gradient)
})

test('new-value fill patches preserve intervening fields and exact Undo/Redo', async ({
  page
}) => {
  const initial = await readFill(page)
  const initialHistory = await getTransactionSnapshot(page)
  await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { fillApis } = await import('../src/common-apis')
    const id = core.getSelectedElementIds()[0]
    const fillId = (
      core.getElementComputedData(id, ['fills'])?.fills as { id: string }[]
    )[0].id
    fillApis.updateFillField(id, fillId, 'color', '#123456')
    fillApis.updateFillFields(id, fillId, { opacity: 0.35, visible: false })
  })
  const final = { ...initial, color: '#123456', opacity: 0.35, visible: false }
  await expect.poll(() => readFill(page)).toEqual(final)
  expect((await getTransactionSnapshot(page)).undoCount).toBe(
    initialHistory.undoCount + 2
  )
  await undo(page)
  await expect
    .poll(() => readFill(page))
    .toEqual({ ...initial, color: '#123456' })
  await undo(page)
  await expect.poll(() => readFill(page)).toEqual(initial)
  await redo(page)
  await redo(page)
  await expect.poll(() => readFill(page)).toEqual(final)
  const history = await getTransactionSnapshot(page)
  await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { fillApis } = await import('../src/common-apis')
    const id = core.getSelectedElementIds()[0]
    const fillId = (
      core.getElementComputedData(id, ['fills'])?.fills as { id: string }[]
    )[0].id
    fillApis.updateFillFields(id, fillId, { opacity: 0.35, visible: false })
    fillApis.updateFillFields(id, fillId, {})
  })
  expect(await getTransactionSnapshot(page)).toEqual(history)
})

test('Fill UI opacity and visibility preserve color with independent Undo', async ({
  page
}, testInfo) => {
  const initial = await readFill(page)
  const opacity = page.getByTestId('prop-fill-opacity-0')
  await opacity.fill('35')
  await opacity.press('Enter')
  await expect.poll(() => readFill(page)).toEqual({ ...initial, opacity: 0.35 })
  await page.getByTestId('prop-fill-visible-0').click()
  await expect
    .poll(() => readFill(page))
    .toEqual({ ...initial, opacity: 0.35, visible: false })
  await undo(page)
  await expect.poll(() => readFill(page)).toEqual({ ...initial, opacity: 0.35 })
  await undo(page)
  await expect.poll(() => readFill(page)).toEqual(initial)
  await page.screenshot({ path: testInfo.outputPath('fill-panel.png') })
})

for (const gradientType of ['linear', 'radial', 'angular', 'diamond']) {
  test(`${gradientType} gradient preserves all other fields through edits and replay`, async ({
    page
  }, testInfo) => {
    await openGradientFillEditor(page)
    await page
      .getByTestId('prop-fill-gradient-type-0')
      .selectOption(gradientType)
    const initial = await readFill(page)
    expect(initial.gradient.gradientType).toBe(gradientType)
    const history = await getTransactionSnapshot(page)
    await page.getByTestId('prop-fill-gradient-flip-0').click()
    const flipped = await readFill(page)
    expect(flipped.gradient).not.toEqual(initial.gradient)
    expect(flipped.color).toBe(flipped.gradient.gradientStops[0].color)
    expect({
      ...flipped,
      color: initial.color,
      gradient: initial.gradient
    }).toEqual(initial)
    expect((await getTransactionSnapshot(page)).undoCount).toBe(
      history.undoCount + 1
    )
    await page.screenshot({
      path: testInfo.outputPath(`${gradientType}-fill.png`)
    })
    await page.getByTestId('prop-fill-color-picker-0-trigger').click()
    await undo(page)
    await expect.poll(() => readFill(page)).toEqual(initial)
    await redo(page)
    await expect.poll(() => readFill(page)).toEqual(flipped)
  })
}

test('batch recolor preserves independent fill values and replays as one commit', async ({
  page
}) => {
  const firstId = await page.evaluate(
    async () =>
      (
        await import('../src/testing/runtime-access')
      ).core.getSelectedElementIds()[0]
  )
  await createRectangle(page, 0.6, 0.6)
  const setup = await page.evaluate(async (firstId) => {
    const { core } = await import('../src/testing/runtime-access')
    const { fillApis } = await import('../src/common-apis')
    const secondId = core.getSelectedElementIds()[0]
    const read = (id: string) =>
      (core.getElementComputedData(id, ['fills'])?.fills as { id: string }[])[0]
    fillApis.updateFillFields(firstId, read(firstId).id, { opacity: 0.3 })
    fillApis.updateFillFields(secondId, read(secondId).id, { opacity: 0.7 })
    return { ids: [firstId, secondId], before: [read(firstId), read(secondId)] }
  }, firstId)
  const readAll = () =>
    page.evaluate(async (ids) => {
      const { core } = await import('../src/testing/runtime-access')
      return ids.map(
        (id) =>
          (core.getElementComputedData(id, ['fills'])?.fills as unknown[])[0]
      )
    }, setup.ids)
  const history = await getTransactionSnapshot(page)
  expect(
    await page.evaluate(async (ids) => {
      const { fillApis } = await import('../src/common-apis')
      return fillApis.updatePrimaryFillColors(
        ids.map((elementId) => ({ elementId, color: '#654321' }))
      )
    }, setup.ids)
  ).toEqual(['changed', 'changed'])
  const expected = setup.before.map((fill) => ({ ...fill, color: '#654321' }))
  await expect.poll(readAll).toEqual(expected)
  expect((await getTransactionSnapshot(page)).undoCount).toBe(
    history.undoCount + 1
  )
  await undo(page)
  await expect.poll(readAll).toEqual(setup.before)
  await redo(page)
  await expect.poll(readAll).toEqual(expected)
  const committed = await getTransactionSnapshot(page)
  const rejected = await page.evaluate(async (ids) => {
    const { fillApis } = await import('../src/common-apis')
    const targets = fillApis.getFillTargetsAtIndex(ids, 0)
    try {
      fillApis.updateFillFieldsBatch(
        targets.map((target, index) => ({
          ...target,
          patch: { opacity: index === 0 ? 0.8 : ('invalid' as never) }
        }))
      )
      return false
    } catch {
      return true
    }
  }, setup.ids)
  expect(rejected).toBe(true)
  expect(await readAll()).toEqual(expected)
  expect(await getTransactionSnapshot(page)).toEqual(committed)
})

test('invalid fill values reject without changing data or history', async ({
  page
}) => {
  const initial = await readFill(page)
  const history = await getTransactionSnapshot(page)
  const rejected = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { fillApis } = await import('../src/common-apis')
    const id = core.getSelectedElementIds()[0]
    const fillId = (
      core.getElementComputedData(id, ['fills'])?.fills as { id: string }[]
    )[0].id
    try {
      fillApis.updateFillFields(id, fillId, {
        color: '#123456',
        opacity: 'invalid' as never
      })
      return false
    } catch {
      return true
    }
  })
  expect(rejected).toBe(true)
  expect(await readFill(page)).toEqual(initial)
  expect(await getTransactionSnapshot(page)).toEqual(history)
})

test('multi-selection Fill UI edits both elements in one Undo action', async ({
  page
}, testInfo) => {
  const firstId = await page.evaluate(
    async () =>
      (
        await import('../src/testing/runtime-access')
      ).core.getSelectedElementIds()[0]
  )
  await createRectangle(page, 0.6, 0.6)
  const ids = await page.evaluate(async (firstId) => {
    const { core } = await import('../src/testing/runtime-access')
    const ids = [firstId, core.getSelectedElementIds()[0]]
    core.selectElements(ids, { undoable: false })
    return ids
  }, firstId)
  const readAll = () =>
    page.evaluate(async (ids) => {
      const { core } = await import('../src/testing/runtime-access')
      return ids.map((id) => core.getElementComputedData(id, ['fills'])?.fills)
    }, ids)
  const initial = await readAll()
  const history = await getTransactionSnapshot(page)
  const opacity = page.getByTestId('prop-fill-opacity-0')
  await opacity.fill('35')
  await opacity.press('Enter')
  const expected = initial.map((fills) =>
    fills.map((fill) => ({ ...fill, opacity: 0.35 }))
  )
  await expect.poll(readAll).toEqual(expected)
  expect((await getTransactionSnapshot(page)).undoCount).toBe(
    history.undoCount + 1
  )
  await undo(page)
  await expect.poll(readAll).toEqual(initial)
  await redo(page)
  await expect.poll(readAll).toEqual(expected)
  await page.getByTestId('prop-fill-visible-0').click()
  const hidden = expected.map((fills) =>
    fills.map((fill) => ({ ...fill, visible: false }))
  )
  await expect.poll(readAll).toEqual(hidden)
  await undo(page)
  await expect.poll(readAll).toEqual(expected)
  await page.getByTestId('prop-fill-add').click()
  await expect
    .poll(async () => (await readAll()).map((fills) => fills.length))
    .toEqual([2, 2])
  const added = await readAll()
  expect(added[0][1].id).not.toBe(added[1][1].id)
  await page.getByTestId('prop-fill-remove-1').click()
  await expect.poll(readAll).toEqual(expected)
  await undo(page)
  await expect.poll(readAll).toEqual(added)
  await undo(page)
  await expect.poll(readAll).toEqual(expected)
  await openGradientFillEditor(page)
  await page.getByTestId('prop-fill-gradient-type-0').selectOption('radial')
  const gradient = await readAll()
  for (const fills of gradient) {
    expect(fills[0].gradient.gradientType).toBe('radial')
  }
  const gradientHistory = await getTransactionSnapshot(page)
  await page.getByTestId('prop-fill-gradient-flip-0').click()
  const flipped = await readAll()
  expect(flipped[0][0].gradient).toEqual(flipped[1][0].gradient)
  expect(flipped[0][0].gradient).not.toEqual(gradient[0][0].gradient)
  expect((await getTransactionSnapshot(page)).undoCount).toBe(
    gradientHistory.undoCount + 1
  )
  await page.getByTestId('prop-fill-color-picker-0-trigger').click()
  await undo(page)
  await expect.poll(readAll).toEqual(gradient)
  await redo(page)
  await expect.poll(readAll).toEqual(flipped)
  await page.screenshot({ path: testInfo.outputPath('multi-fill-panel.png') })
})

test('shared Fill intents preserve local masks, peers, Undo/Redo and durable reload', async ({
  page,
  browser
}, testInfo) => {
  test.setTimeout(120_000)
  const first = await page.evaluate(
    async () =>
      (
        await import('../src/testing/runtime-access')
      ).core.getSelectedElementIds()[0]
  )
  await createRectangle(page, 0.6, 0.6)
  const ids = await page.evaluate(
    async (first) => [
      first,
      (
        await import('../src/testing/runtime-access')
      ).core.getSelectedElementIds()[0]
    ],
    first
  )
  const read = (client: Page = page) =>
    client.evaluate(async (ids) => {
      const { core } = await import('../src/testing/runtime-access')
      return ids.map(
        (id) =>
          (
            core.getElementComputedData(id, ['fills'])?.fills as
              { id: string; color: string; opacity: number }[] | undefined
          )?.[0]
      )
    }, ids)
  const invoke = (
    name: string,
    args: Record<string, unknown>,
    client: Page = page
  ) =>
    client.evaluate(
      async ({ name, args }) => {
        const { createBasicApiActions } =
          await import('../src/ai/basic-api-actions')
        const { createAiTransactionRunner } =
          await import('../src/ai/transaction')
        const action = createBasicApiActions().find(
          (action) => action.name === name
        )
        if (!action) {
          throw new Error(`Missing action ${name}`)
        }
        return createAiTransactionRunner().run(
          'Shared property intent',
          (runMutation) =>
            action.execute(args, {
              signal: new AbortController().signal,
              runMutation
            })
        )
      },
      { name, args }
    )
  const target = (elementId: string) =>
    page.evaluate(async (elementId) => {
      const { core } = await import('../src/testing/runtime-access')
      const [root] = core.readElementPropertyTargets([
        { elementId, propertyName: 'fills', path: [] }
      ])
      const slot = root.children[0]
      return {
        elementId,
        propertyName: 'fills',
        path: [{ key: slot.key, childId: slot.childId }],
        expectedRootId: root.propertyId,
        expectedPropertyId: slot.propertyId
      }
    }, elementId)
  const evidence: { step: string; state: unknown }[] = []
  const record = async (step: string) =>
    evidence.push({
      step,
      state: await page.evaluate(async () => {
        const { core, readTestCapture } =
          await import('../src/testing/runtime-access')
        return {
          canonical: core.getCanonicalOwnerSnapshot(),
          publications: readTestCapture('shared-property')
        }
      })
    })
  await page.evaluate(async () =>
    (
      await import('../src/testing/runtime-access')
    ).startSharedPublicationCapture('shared-property')
  )
  const initial = await read()
  const sourceId = initial[0]?.id
  if (!sourceId) {
    throw new Error('Missing independent source')
  }
  await page.evaluate(
    async (ids) =>
      (await import('../src/common-apis')).fillApis.shareFillAtIndex(
        ids[0],
        [ids[1]],
        0
      ),
    ids
  )
  const shared = await read()
  expect(shared).toMatchObject([
    { color: initial[0]?.color },
    { color: initial[0]?.color }
  ])
  expect(shared[1]?.id).not.toBe(sourceId)
  const peerContext = await browser.newContext()
  const peer = await peerContext.newPage()
  try {
    await peer.goto(page.url())
    await waitForAppReady(peer)
    await expect.poll(() => read(peer)).toEqual(shared)
    const local = await target(ids[1])
    await invoke('api_core_updateElementPropertyTargets', {
      updates: [{ target: local, values: { color: '#334455' } }]
    })
    const overridden = await read()
    expect(overridden).toMatchObject([shared[0], { color: '#334455' }])
    await expect.poll(() => read(peer)).toEqual(overridden)
    await undo(page)
    await expect.poll(() => read()).toEqual(shared)
    await redo(page)
    await expect.poll(() => read()).toEqual(overridden)
    await invoke(
      'api_core_updateSharedPropertySources',
      {
        updates: [
          { propertyId: sourceId, values: { color: '#abcdef', opacity: 0.6 } }
        ]
      },
      peer
    )
    await expect
      .poll(() => read())
      .toMatchObject([
        { color: '#abcdef', opacity: 0.6 },
        { color: '#334455', opacity: 0.6 }
      ])
    await invoke('api_core_resetElementPropertyOverrides', {
      updates: [{ target: await target(ids[1]), keys: ['color'] }]
    })
    await expect
      .poll(() => read())
      .toMatchObject([
        { color: '#abcdef', opacity: 0.6 },
        { color: '#abcdef', opacity: 0.6 }
      ])
    await undo(page)
    await expect
      .poll(() => read())
      .toMatchObject([{ color: '#abcdef' }, { color: '#334455' }])
    await redo(page)
    const reset = await read()
    await invoke('api_core_detachElementPropertyTargets', {
      targets: [await target(ids[1])]
    })
    const detached = await read()
    await record('detached')
    await invoke(
      'api_core_updateSharedPropertySources',
      { updates: [{ propertyId: sourceId, values: { color: '#102030' } }] },
      peer
    )
    await expect
      .poll(() => read())
      .toMatchObject([{ color: '#102030' }, { color: '#abcdef' }])
    await undo(page)
    await expect
      .poll(() => read())
      .toMatchObject([{ color: '#102030' }, { color: '#102030' }])
    await redo(page)
    await record('after-redo-detach')
    await expect
      .poll(() => read())
      .toMatchObject([{ color: '#102030' }, detached[1]])
    expect(reset[1]?.id).not.toBe(detached[1]?.id)
    const beforeInvalid = await read()
    await expect(
      invoke('api_core_updateElementPropertyTargets', {
        updates: [
          { target: await target(ids[0]), values: { opacity: 0.2 } },
          {
            target: { elementId: 'missing', propertyName: 'fills', path: [] },
            values: { opacity: 0.2 }
          }
        ]
      })
    ).rejects.toThrow()
    expect(await read()).toEqual(beforeInvalid)
    await invoke('api_core_shareElementPropertyTargets', {
      updates: [{ target: await target(ids[1]), sourceId }]
    })
    const final = await read()
    await expect.poll(() => read(peer)).toEqual(final)
    const savedDigest = await getCoreDocumentDigest(page)
    const fileId = new URL(page.url()).searchParams.get('fileId')
    if (!fileId) {
      throw new Error('Missing document identity')
    }
    await expect
      .poll(() => getPersistedDocumentDigest(fileId), { timeout: 25_000 })
      .toEqual(savedDigest)
    await page.reload()
    await waitForAppReady(page)
    await expect.poll(() => read()).toEqual(final)
    await invoke('api_core_updateElementPropertyTargets', {
      updates: [{ target: await target(ids[1]), values: { opacity: 0.25 } }]
    })
    await expect
      .poll(() => read(peer))
      .toMatchObject([{ opacity: 0.6 }, { opacity: 0.25 }])
    const nextDigest = await getCoreDocumentDigest(page)
    await expect
      .poll(() => getPersistedDocumentDigest(fileId), { timeout: 25_000 })
      .toEqual(nextDigest)
    await page.reload()
    await waitForAppReady(page)
    await expect
      .poll(() => read())
      .toMatchObject([{ opacity: 0.6 }, { opacity: 0.25 }])
  } finally {
    await writeFile(
      testInfo.outputPath('shared-property-lifecycle.json'),
      JSON.stringify(evidence, null, 2)
    )
    await testInfo.attach('shared-property-lifecycle', {
      body: JSON.stringify(evidence, null, 2),
      contentType: 'application/json'
    })
    await peerContext.close()
  }
})

test('Stroke batches preserve intervening fields and multi-owner Undo/Redo', async ({
  page
}) => {
  const setup = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { elementApis, strokeApis } = await import('../src/common-apis')
    const first = core.getSelectedElementIds()[0]
    const second = elementApis.createElement({
      type: 'rect',
      width: 80,
      height: 60,
      workspacePosition: { x: 100, y: 100 }
    })
    if (!second) {
      throw new Error('Second target missing')
    }
    const ids = [first, second]
    const targets = ids.map((elementId) => {
      const receipt = strokeApis.addStroke(elementId)
      if (!receipt.changed || receipt.unavailableIds.length) {
        throw new Error('Stroke creation did not settle')
      }
      const strokeId = receipt.value
      if (!strokeId) {
        throw new Error('Missing created Stroke')
      }
      return { elementId, strokeId }
    })
    strokeApis.updatePrimaryStrokeColors(
      ids.map((elementId) => ({ elementId, color: '#123456' }))
    )
    const before = ids.map(
      (id) => core.getElementComputedData(id, ['strokes'])?.strokes
    )
    return { ids, targets, before }
  })
  const readAll = () =>
    page.evaluate(async (ids) => {
      const { core } = await import('../src/testing/runtime-access')
      return ids.map(
        (id) => core.getElementComputedData(id, ['strokes'])?.strokes
      )
    }, setup.ids)
  const history = await getTransactionSnapshot(page)
  await page.evaluate(async (targets) => {
    const { strokeApis } = await import('../src/common-apis')
    strokeApis.updateStrokeFieldsBatch(
      targets.map((target) => ({ ...target, patch: { width: 7 } }))
    )
  }, setup.targets)
  const expected = setup.before.map((strokes) =>
    (strokes as Record<string, unknown>[]).map((stroke) => ({
      ...stroke,
      width: 7
    }))
  )
  await expect.poll(readAll).toEqual(expected)
  expect((await getTransactionSnapshot(page)).undoCount).toBe(
    history.undoCount + 1
  )
  await undo(page)
  await expect.poll(readAll).toEqual(setup.before)
  await redo(page)
  await expect.poll(readAll).toEqual(expected)
  await expect(
    page.evaluate(async (targets) => {
      const { strokeApis } = await import('../src/common-apis')
      strokeApis.updateStrokeFieldsBatch([
        { ...targets[0], patch: { width: 20 } },
        { elementId: 'missing', strokeId: 'missing', patch: { width: 20 } }
      ])
    }, setup.targets)
  ).rejects.toThrow('Missing Stroke')
  expect(await readAll()).toEqual(expected)
})

test('prepared shared fills remain canonical across slices, edits, Undo and persistence', async ({
  page
}) => {
  const session = createDesignPreparationSession()
  const prepared = session.prepare({
    type: 'group',
    name: 'Linked paint',
    sharedFills: { red: '#ff0000' },
    children: [
      {
        key: 'a',
        type: 'rect',
        name: 'First',
        width: 50,
        height: 50,
        fill: { shared: 'red' }
      },
      {
        key: 'nested',
        type: 'group',
        name: 'Nested',
        x: 70,
        children: [
          {
            key: 'b',
            type: 'oval',
            name: 'Linked',
            width: 50,
            height: 50,
            fill: { shared: 'red' }
          },
          {
            key: 'c',
            type: 'rect',
            name: 'Independent',
            x: 70,
            width: 50,
            height: 50,
            fill: '#ff0000'
          }
        ]
      }
    ]
  })
  const design = session.resolve(prepared.artifactId)
  await page.evaluate(async (design) => {
    const { deliverPreparedDesign } = await import('../src/ai/prepared-design')
    const { createPreparedDesignAction } =
      await import('../src/ai/design-actions')
    const { createAiTransactionRunner } = await import('../src/ai/transaction')
    await createAiTransactionRunner().run(
      'Prepared shared fill test',
      (runMutation) =>
        createPreparedDesignAction().execute(
          { design: deliverPreparedDesign(design) },
          { signal: new AbortController().signal, runMutation }
        )
    )
  }, design)
  const ids = ['a', 'b', 'c'].map((key) => design.keyToId[key])
  const read = () =>
    page.evaluate(async (ids) => {
      const { core } = await import('../src/testing/runtime-access')
      return ids.map(
        (id) =>
          (
            core.getElementComputedData(id, ['fills'])?.fills as
              { id: string; color: string }[] | undefined
          )?.[0]
      )
    }, ids)
  const initial = await read()
  expect(initial).toMatchObject([
    { id: prepared.sharedFillIds?.red, color: '#ff0000' },
    { id: prepared.sharedFillIds?.red, color: '#ff0000' },
    { color: '#ff0000' }
  ])
  expect(initial[2]?.id).not.toBe(initial[0]?.id)
  await undo(page)
  await expect.poll(read).toEqual([undefined, undefined, undefined])
  await redo(page)
  await expect.poll(read).toEqual(initial)
  await page.evaluate(async (ids) => {
    const { fillApis } = await import('../src/common-apis')
    fillApis.updateFillsAtIndex([ids[0], ids[1]], 0, { color: '#334455' })
  }, ids)
  await expect
    .poll(read)
    .toMatchObject([
      { color: '#334455' },
      { color: '#334455' },
      { color: '#ff0000' }
    ])
  await undo(page)
  await expect.poll(read).toEqual(initial)
  await page.evaluate(async (id) => {
    const { fillApis } = await import('../src/common-apis')
    fillApis.detachFillsAtIndex([id], 0)
    fillApis.updateFillsAtIndex([id], 0, { color: '#abcdef' })
  }, ids[1])
  await expect
    .poll(read)
    .toMatchObject([
      { color: '#ff0000' },
      { color: '#abcdef' },
      { color: '#ff0000' }
    ])
  await undo(page)
  await undo(page)
  await expect.poll(read).toEqual(initial)
  // Use the ordinary canonical save/load route; no reconstructed test documents.
  await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    core.load(await core.save())
  })
  await expect.poll(read).toEqual(initial)
})
