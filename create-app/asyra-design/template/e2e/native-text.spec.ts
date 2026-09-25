import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  createTestDocumentIdentity,
  waitForAppReady,
  undo,
  redo,
  getUndoHistoryDepth,
  getCoreDocumentDigest,
  getPersistedDocumentDigest
} from './test-utils'

test('native text stays editable and survives undo, redo and save', async ({
  page
}, testInfo) => {
  const identity = createTestDocumentIdentity()
  await page.goto(identity.url)
  await waitForAppReady(page)
  await page.evaluate(async () => {
    const { core, elementApis, hierarchyApis } =
      await import('../src/testing/runtime-access')
    const { selectionApis } = await import('../src/common-apis/selection')
    const { transactionApis } = await import('../src/common-apis/transaction')
    const parent = hierarchyApis.getWorkspaceId()
    if (!parent) throw new Error('Missing workspace')
    transactionApis.runTransaction(() =>
      elementApis.createElementsInParent(
        [
          {
            id: 'native-text-example',
            name: 'Editable heading',
            type: 'text',
            x: 80,
            y: 80,
            width: 320,
            height: 120,
            visible: true,
            lock: false,
            props: {
              position: 'native-text-position',
              dimension: 'native-text-dimension',
              typography: 'native-text-typography'
            },
            text: 'Editable design\nHello 世界',
            fontFamily: 'sans-serif',
            fontSize: 32,
            fontWeight: 'bold',
            fontStyle: 'normal',
            textAlign: 'left',
            lineHeight: 40,
            letterSpacing: 0,
            textColor: '#ffffff'
          }
        ],
        parent,
        { undoable: true }
      )
    )
    selectionApis.selectElements(['native-text-example'])
    if (!core.getElementData('native-text-example'))
      throw new Error('Text creation failed')
  })
  const measure = () =>
    page.evaluate(async () => {
      const { core } = await import('../src/testing/runtime-access')
      return core.measureElementContentBounds(['native-text-example'])[0].bounds
    })
  const initialContent = await measure()
  expect(initialContent?.width).toBeGreaterThan(0)
  expect(initialContent?.width).toBeLessThan(320)
  expect(initialContent?.height).toBeGreaterThan(40)
  expect(initialContent?.height).toBeLessThan(120)
  await page.evaluate(async () =>
    (await import('../src/common-apis/viewport')).viewportApis.zoomFit()
  )
  expect(await measure()).toEqual(initialContent)
  const captures = await page.evaluate(async () => {
    const { core, elementApis } = await import('../src/testing/runtime-access')
    elementApis.updateElementProperties(
      ['native-text-example'],
      { textColor: '#183f35' },
      { undoable: true }
    )
    const { viewportApis } = await import('../src/common-apis/viewport')
    const snapshots = []
    for (const scale of [0.25, 2]) {
      viewportApis.zoomToCenter(scale, 400, 300)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
      snapshots.push(
        core.captureElementSnapshot('native-text-example', 1024, {
          nativeResolution: true
        })
      )
    }
    viewportApis.zoomFit()
    return snapshots
  })
  for (const [index, capture] of captures.entries()) {
    expect(capture.width).toBe(capture.bounds.width)
    expect(capture.height).toBe(capture.bounds.height)
    await writeFile(
      testInfo.outputPath(`text-capture-${index}.png`),
      Buffer.from(capture.dataUrl.split(',')[1], 'base64')
    )
    await testInfo.attach(`text-capture-${index}.png`, {
      body: Buffer.from(capture.dataUrl.split(',')[1], 'base64'),
      contentType: 'image/png'
    })
  }
  await undo(page)
  expect(captures[0].width).toBeGreaterThan(0)
  expect(captures[0].dataUrl === captures[1].dataUrl).toBe(true)
  const content = page.getByRole('textbox', { name: 'Content', exact: true })
  await expect(content).toHaveValue('Editable design\nHello 世界')
  const depth = await getUndoHistoryDepth(page)
  await content.fill('Updated heading\nHello 世界')
  await content.press('Tab')
  await expect.poll(() => getUndoHistoryDepth(page)).toBe(depth + 1)
  const readText = () =>
    page.evaluate(async () => {
      const { core } = await import('../src/testing/runtime-access')
      return (
        core.getElementComputedData('native-text-example') as unknown as {
          text: string
        }
      ).text
    })
  await expect.poll(readText).toBe('Updated heading\nHello 世界')
  await undo(page)
  await expect.poll(readText).toBe('Editable design\nHello 世界')
  await redo(page)
  await expect.poll(readText).toBe('Updated heading\nHello 世界')
  expect(
    await page.evaluate(async () => {
      const { core } = await import('../src/testing/runtime-access')
      return JSON.stringify(await core.save())
    })
  ).toContain('Updated heading')
  const review = () =>
    page.evaluate(async () =>
      (await import('../src/common-apis/design-review')).reviewDesign(
        'native-text-example'
      )
    )
  expect(await review()).toMatchObject({ complete: true, findings: [] })
  await page.evaluate(async () => {
    const { elementApis } = await import('../src/testing/runtime-access')
    elementApis.updateElementProperties(
      ['native-text-example'],
      { height: 20 },
      { undoable: true }
    )
  })
  expect((await review()).findings).toContainEqual(
    expect.objectContaining({
      kind: 'text-overflow',
      elementId: 'native-text-example'
    })
  )
  await undo(page)
  expect(await review()).toMatchObject({ complete: true, findings: [] })
  const savedDigest = await getCoreDocumentDigest(page)
  await expect
    .poll(() => getPersistedDocumentDigest(identity.fileId), {
      timeout: 15_000
    })
    .toEqual(savedDigest)
  await page.reload()
  await waitForAppReady(page)
  await expect.poll(readText).toBe('Updated heading\nHello 世界')
  await page.evaluate(async () => {
    const { selectionApis } = await import('../src/common-apis/selection')
    selectionApis.selectElements(['native-text-example'])
  })
  await expect(content).toHaveValue('Updated heading\nHello 世界')
  await page.screenshot({
    path: testInfo.outputPath('native-text.png'),
    fullPage: true
  })
})
