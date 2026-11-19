import { test, expect } from '@playwright/test'
import {
  createTestDocumentURL,
  waitForAppReady,
  resetCanvas,
  createRectangle,
  hasSelectedElement,
  getCanvasPosition,
  getSelectedElementRect,
  getElementCount,
  undo,
  redo
} from './test-utils'

test.describe('Rectangle creation handoff', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(createTestDocumentURL())
    await waitForAppReady(page)
    await resetCanvas(page)
  })

  for (const repeated of [false, true]) {
    test(`holding R beyond 100ms ${repeated ? 'with' : 'without'} key repeat preserves drag resizing`, async ({
      page
    }) => {
      const from = await getCanvasPosition(page, 0.25, 0.25)
      const to = await getCanvasPosition(page, 0.65, 0.65)
      const start = { x: Math.round(from.x), y: Math.round(from.y) }
      const end = { x: Math.round(to.x), y: Math.round(to.y) }
      const zoom = await page.evaluate(async () => {
        const { core } = await import('../src/testing/runtime-access')

        return core.getSystemProperty<number>('zoom')
      })

      if (typeof zoom !== 'number' || zoom <= 0) {
        throw new Error('A valid viewport scale is required')
      }

      await page.keyboard.down('r')
      try {
        await expect(page.getByTestId('tool-rectangle')).toHaveAttribute(
          'data-active',
          'true'
        )
        await page.waitForTimeout(150)
        await page.mouse.move(start.x, start.y)
        await page.mouse.down()
        await expect.poll(() => getSelectedElementRect(page)).not.toBeNull()
        if (repeated) {
          await page.keyboard.down('r')
        }

        await page.mouse.move(end.x, end.y, { steps: 8 })
        await expect
          .poll(async () => {
            const rect = await getSelectedElementRect(page)

            return rect && { width: rect.width, height: rect.height }
          })
          .toEqual({
            width: (end.x - start.x) / zoom,
            height: (end.y - start.y) / zoom
          })
      } finally {
        await page.mouse.up()
        await page.keyboard.up('r')
      }

      const completed = await getSelectedElementRect(page)

      expect(completed).toMatchObject({
        width: (end.x - start.x) / zoom,
        height: (end.y - start.y) / zoom
      })
      await undo(page)
      await expect.poll(() => getElementCount(page)).toBe(0)
      await redo(page)
      await expect.poll(() => getSelectedElementRect(page)).toEqual(completed)
    })
  }

  test('a fresh different tool press still finalizes the active rectangle gesture', async ({
    page
  }) => {
    const start = await getCanvasPosition(page, 0.25, 0.25)
    const end = await getCanvasPosition(page, 0.65, 0.65)

    await page.keyboard.press('r')
    await expect(page.getByTestId('tool-rectangle')).toHaveAttribute(
      'data-active',
      'true'
    )
    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    try {
      await page.mouse.move(end.x, end.y, { steps: 8 })
      await expect.poll(() => getSelectedElementRect(page)).not.toBeNull()
      const beforeSwitch = await getSelectedElementRect(page)

      await page.keyboard.press('v')
      await expect(page.getByTestId('tool-select')).toHaveAttribute(
        'data-active',
        'true'
      )
      await page.mouse.move(start.x, start.y, { steps: 8 })
      expect(await getSelectedElementRect(page)).toEqual(beforeSwitch)
    } finally {
      await page.mouse.up()
    }

    await undo(page)
    await expect.poll(() => getElementCount(page)).toBe(0)
  })

  test('rectangle creation hands off canonical selection and visible controls on a slow main thread', async ({
    page
  }) => {
    const session = await page.context().newCDPSession(page)

    await session.send('Emulation.setCPUThrottlingRate', { rate: 8 })
    try {
      await createRectangle(page, 0.3, 0.3)
      const state = await page.evaluate(async () => {
        const { core } = await import('../src/testing/runtime-access')
        const { hierarchyApis } = await import('../src/common-apis/hierarchy')

        return {
          tool: core.getSystemProperty('primaryTool'),
          selected: core.getSelectedElementIds(),
          elements: hierarchyApis.getFlattenedElementIds()
        }
      })

      expect(state.selected, JSON.stringify(state)).toHaveLength(1)
      expect(state.elements).toEqual(state.selected)
      expect(state.tool).toBe('select')
      expect(await hasSelectedElement(page), JSON.stringify(state)).toBe(true)
    } finally {
      await session.send('Emulation.setCPUThrottlingRate', { rate: 1 })
      await session.detach()
    }
  })

  test('rectangle helper waits for the real interaction queue before handing off selection', async ({
    page
  }) => {
    await page.evaluate(async () => {
      const { core, getSessionManager, testRuntimeState } =
        await import('../src/testing/runtime-access')
      const gate = new Promise<void>((resolve) => {
        testRuntimeState.set('rectangle-queue-release', resolve)
      })
      const pending = getSessionManager().runAfterCancellingActiveSessions(
        () => core.getSystemContextSnapshot(),
        () => {
          testRuntimeState.set('rectangle-queue-entered', true)

          return gate
        },
        'rectangle-handoff-regression'
      )

      testRuntimeState.set('rectangle-queue-pending', pending)
    })
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const { testRuntimeState } =
            await import('../src/testing/runtime-access')

          return testRuntimeState.get('rectangle-queue-entered')
        })
      )
      .toBe(true)
    const creation = createRectangle(page, 0.3, 0.3)
    let outcome: string | undefined

    try {
      // Keep the real queue blocked beyond the old helper's total fixed waits.
      outcome = await Promise.race([
        creation.then(() => 'returned-before-admission'),
        new Promise<string>((resolve) =>
          setTimeout(() => resolve('pending'), 1000)
        )
      ])
    } finally {
      await page.evaluate(async () => {
        const { testRuntimeState } =
          await import('../src/testing/runtime-access')

        testRuntimeState.get<() => void>('rectangle-queue-release')?.()
        await testRuntimeState.get<Promise<unknown>>('rectangle-queue-pending')
        for (const name of [
          'rectangle-queue-release',
          'rectangle-queue-entered',
          'rectangle-queue-pending'
        ]) {
          testRuntimeState.delete(name)
        }
      })
      await creation
    }

    await expect
      .poll(() =>
        page.evaluate(async () => {
          const { core } = await import('../src/testing/runtime-access')

          return core.getSelectedElementIds()
        })
      )
      .toHaveLength(1)

    await expect(page.getByTestId('prop-x')).toBeVisible()
    expect(outcome).toBe('pending')
  })

  test('rectangle helper rejects when pointer input never creates an element', async ({
    page
  }) => {
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas')

      if (!canvas) {
        throw new Error('The real input canvas is required')
      }

      canvas.addEventListener(
        'mousedown',
        (event) => event.stopImmediatePropagation(),
        {
          capture: true,
          once: true
        }
      )
    })
    await expect(createRectangle(page, 0.3, 0.3)).rejects.toThrow(
      'Rectangle creation must acknowledge a new canonical selection and finish its transaction'
    )
    const state = await page.evaluate(async () => {
      const { core } = await import('../src/testing/runtime-access')
      const { hierarchyApis } = await import('../src/common-apis/hierarchy')

      return {
        selected: core.getSelectedElementIds(),
        elements: hierarchyApis.getFlattenedElementIds(),
        tool: core.getSystemProperty('primaryTool')
      }
    })

    expect(state).toEqual({ selected: [], elements: [], tool: 'rect' })
  })
})
