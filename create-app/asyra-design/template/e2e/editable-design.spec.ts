import { expect, test } from '@playwright/test'
import { prepareDesign } from '../server/design-preparation'
import {
  createTestDocumentIdentity,
  waitForAppReady,
  getUndoHistoryDepth,
  getCoreDocumentDigest,
  getPersistedDocumentDigest,
  getPersistedDocumentCheckpoint,
  undo,
  redo
} from './test-utils'

test('the Agent applies editable text, hierarchy and curves in one durable Undo', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  const identity = createTestDocumentIdentity()
  const design = prepareDesign({
    type: 'frame',
    name: 'Field Notes',
    x: 40,
    y: 40,
    width: 700,
    height: 500,
    fill: '#f4f0e8',
    children: [
      {
        key: 'heading',
        name: 'Editorial heading',
        type: 'text',
        x: 40,
        y: 35,
        width: 610,
        height: 65,
        text: 'Ideas worth exploring',
        fontSize: 38,
        lineHeight: 48,
        fontWeight: 'bold',
        textColor: '#183f35'
      },
      {
        key: 'body',
        name: 'Description',
        type: 'text',
        x: 40,
        y: 110,
        width: 570,
        height: 70,
        text: 'A collection of field notes, sketches and small discoveries.',
        fontSize: 20,
        lineHeight: 28,
        textColor: '#385248'
      },
      {
        key: 'card',
        name: 'Feature card',
        type: 'frame',
        x: 40,
        y: 220,
        width: 620,
        height: 230,
        fill: '#d9e6cb',
        children: [
          {
            key: 'petal',
            name: 'Editable leaf',
            type: 'vector',
            x: 35,
            y: 35,
            width: 140,
            height: 140,
            fill: '#245640',
            rings: [
              [
                { x: 0, y: 70, outControl: { x: 0, y: 0 } },
                {
                  x: 140,
                  y: 70,
                  inControl: { x: 140, y: 0 },
                  outControl: { x: 140, y: 140 }
                },
                { x: 0, y: 70, inControl: { x: 0, y: 140 } }
              ]
            ]
          },
          {
            key: 'card-title',
            name: 'Card title',
            type: 'text',
            x: 210,
            y: 55,
            width: 360,
            height: 100,
            text: 'Make room for curiosity',
            fontSize: 28,
            lineHeight: 36,
            fontWeight: 'bold',
            textColor: '#183f35'
          }
        ]
      }
    ]
  })
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({
      json: {
        batchId: 'editable-design',
        actions: [
          {
            id: 'apply-design',
            name: 'apply_prepared_design',
            arguments: { design },
            summary: 'Create the editorial design'
          }
        ]
      }
    })
  )
  await page.goto(identity.url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page),
    depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByLabel('Message Agent')
    .fill('Create an editable editorial page with a leaf illustration.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  const read = () =>
    page.evaluate(async (ids) => {
      const { core } = await import('../src/testing/runtime-access')
      const heading = core.getElementComputedData(ids.heading) as unknown as {
        text: string
      }
      const card = core.getElementData(ids.card)
      const leaf = core.getElementComputedData(ids.petal) as unknown as {
        points: Record<string, { kind: string }>
      }
      return {
        text: heading?.text,
        children: card?.children,
        controlCount: Object.values(leaf?.points ?? {}).filter(
          (p) => p.kind === 'control'
        ).length
      }
    }, design.keyToId)
  await expect.poll(read).toEqual({
    text: 'Ideas worth exploring',
    children: [design.keyToId.petal, design.keyToId['card-title']],
    controlCount: 4
  })
  const after = await getCoreDocumentDigest(page)
  expect(after).not.toEqual(before)
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(after)
  await expect
    .poll(() => getPersistedDocumentDigest(identity.fileId), { timeout: 15000 })
    .toEqual(after)
  await page.reload()
  await waitForAppReady(page)
  await expect
    .poll(read)
    .toMatchObject({ text: 'Ideas worth exploring', controlCount: 4 })
  await page.evaluate(async () => {
    const { viewportApis } = await import('../src/common-apis/viewport')
    viewportApis.zoomFit()
  })
  await page.screenshot({
    path: testInfo.outputPath('editable-design.png'),
    fullPage: true
  })
  const unchangedObjects = () =>
    page.evaluate(
      async (ids) => {
        const { core } = await import('../src/testing/runtime-access')
        return ids.map((id) => ({
          data: core.getElementData(id),
          computed: core.getElementComputedData(id)
        }))
      },
      [design.keyToId.body, design.keyToId.card, design.keyToId.petal]
    )
  const unchanged = await unchangedObjects()
  await page.evaluate(async () => {
    const runtime = await import('../src/testing/runtime-access')
    runtime.startDocumentPublicationCapture('targeted-edit')
  })
  const beforeEdit = await getCoreDocumentDigest(page)
  const editDepth = await getUndoHistoryDepth(page)
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({
      json: {
        batchId: 'targeted-edit',
        actions: [
          {
            id: 'edit-title',
            name: 'update_design_element',
            arguments: {
              elementId: design.keyToId.heading,
              name: 'Revised heading',
              properties: {
                text: 'Explore something new',
                fontSize: 32,
                textColor: '#245640',
                x: 55
              }
            },
            summary: 'Refine the heading'
          }
        ]
      }
    })
  )
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByLabel('Message Agent')
    .fill('Change only the heading text, size, color and position.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'success'
  )
  await expect.poll(read).toMatchObject({ text: 'Explore something new' })
  const headingStyle = await page.evaluate(async (id) => {
    const { core } = await import('../src/testing/runtime-access')
    return core.getElementComputedData(id, ['fontSize', 'textColor', 'x'])
  }, design.keyToId.heading)
  expect(headingStyle).toEqual({ fontSize: 32, textColor: '#245640', x: 55 })
  expect(await unchangedObjects()).toEqual(unchanged)
  expect(await getUndoHistoryDepth(page)).toBe(editDepth + 1)
  const afterEdit = await getCoreDocumentDigest(page)
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(beforeEdit)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(afterEdit)
  try {
    await expect
      .poll(() => getPersistedDocumentDigest(identity.fileId), {
        timeout: 15000
      })
      .toEqual(afterEdit)
  } catch (error) {
    const persisted = await getPersistedDocumentCheckpoint(identity.fileId)
    const current = await page.evaluate(async () =>
      (await import('../src/testing/runtime-access')).core.save()
    )
    const differences: unknown[] = []
    const compare = (a: unknown, b: unknown, path: string) => {
      if (differences.length >= 20 || JSON.stringify(a) === JSON.stringify(b))
        return
      if (a && b && typeof a === 'object' && typeof b === 'object') {
        const left = a as Record<string, unknown>,
          right = b as Record<string, unknown>
        for (const key of new Set([
          ...Object.keys(left),
          ...Object.keys(right)
        ]))
          compare(left[key], right[key], `${path}.${key}`)
      } else differences.push({ path, current: a, persisted: b })
    }
    compare(current.sceneTree, persisted.checkpoint?.sceneTree, 'sceneTree')
    compare(current.props, persisted.checkpoint?.props, 'props')
    const transport = await page.evaluate(async () => {
      const runtime = await import('../src/testing/runtime-access')
      const handle = runtime.getActiveCollaborationHandle()
      return {
        status: handle?.getStatus(),
        state: handle?.getSessionState(),
        failures:
          runtime.readDocumentPublicationDecodeFailures('targeted-edit'),
        count: runtime.readTestCapture('targeted-edit').length
      }
    })
    await testInfo.attach('durable-edit-transport', {
      body: JSON.stringify(transport),
      contentType: 'application/json'
    })
    await testInfo.attach('durable-edit-differences', {
      body: JSON.stringify(differences, null, 2),
      contentType: 'application/json'
    })
    throw error
  }
  await page.reload()
  await waitForAppReady(page)
  await expect.poll(read).toMatchObject({ text: 'Explore something new' })
  await page.screenshot({
    path: testInfo.outputPath('targeted-edit.png'),
    fullPage: true
  })
})
