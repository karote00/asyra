import { test, expect } from '@playwright/test'
import {
  createTestDocumentURL,
  clickCanvas,
  waitForAppReady,
  getCanvasPosition,
  getZoomLevel,
  getToolbar
} from './test-utils'

/**
 * E2E Tests for Viewport Navigation
 * Based on: .project/bdd-features/viewport-navigation.feature
 */

test.describe('Viewport Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(createTestDocumentURL())
    await waitForAppReady(page)
  })

  test('should zoom in when scrolling mouse wheel up', async ({ page }) => {
    const pos = await getCanvasPosition(page, 0.5, 0.5)
    const initialZoom = await getZoomLevel(page)

    await page.mouse.move(pos.x, pos.y)

    // HOLD Meta (Command) key for zoom
    await page.keyboard.down('Meta')
    await page.mouse.wheel(0, -100)
    await page.keyboard.up('Meta')

    await expect(async () => {
      const newZoom = await getZoomLevel(page)
      expect(newZoom).toBeGreaterThan(initialZoom)
    }).toPass({ timeout: 2000 })
  })

  test('should zoom out when scrolling mouse wheel down', async ({ page }) => {
    const pos = await getCanvasPosition(page, 0.5, 0.5)
    const initialZoom = await getZoomLevel(page)

    await page.mouse.move(pos.x, pos.y)

    // HOLD Meta (Command) key for zoom
    await page.keyboard.down('Meta')
    await page.mouse.wheel(0, 100)
    await page.keyboard.up('Meta')

    await expect(async () => {
      const newZoom = await getZoomLevel(page)
      expect(newZoom).toBeLessThan(initialZoom)
    }).toPass({ timeout: 2000 })
  })

  test('should accumulate zoom level with multiple wheel events', async ({
    page
  }) => {
    const pos = await getCanvasPosition(page, 0.5, 0.5)
    const initialZoom = await getZoomLevel(page)

    await page.mouse.move(pos.x, pos.y)
    await page.keyboard.down('Meta')

    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -50)
      await page.waitForTimeout(50)
    }

    await expect(async () => {
      const afterZoomIn = await getZoomLevel(page)
      expect(afterZoomIn).toBeGreaterThan(initialZoom)
    }).toPass({ timeout: 2000 })

    const afterZoomIn = await getZoomLevel(page)

    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 50)
      await page.waitForTimeout(50)
    }
    await page.keyboard.up('Meta')

    await expect(async () => {
      const afterZoomOut = await getZoomLevel(page)
      expect(afterZoomOut).toBeLessThan(afterZoomIn)
    }).toPass({ timeout: 2000 })
  })

  test('should display zoom percentage in toolbar', async ({ page }) => {
    const toolbar = getToolbar(page)
    const zoomDisplay = toolbar.getByTestId('zoom-level')
    await expect(zoomDisplay).toBeVisible()
    await expect(zoomDisplay).toContainText(/%/)
  })

  test('should respect zoom limits', async ({ page }) => {
    const pos = await getCanvasPosition(page, 0.5, 0.5)
    await page.mouse.move(pos.x, pos.y)

    await page.keyboard.down('Meta')
    // Zoom out many times
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, 500)
      await page.waitForTimeout(20)
    }

    const minZoom = await getZoomLevel(page)
    expect(minZoom).toBeGreaterThan(0)

    // Zoom in many times
    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, -500)
      await page.waitForTimeout(20)
    }
    await page.keyboard.up('Meta')

    const maxZoom = await getZoomLevel(page)
    expect(maxZoom).toBeGreaterThan(minZoom)
  })
})

for (const aiPanelOpen of [false, true]) {
  for (const shape of ['portrait', 'landscape'] as const) {
    test(`zoom fit centers ${shape} content with AI panel ${aiPanelOpen ? 'open' : 'closed'}`, async ({
      page
    }, testInfo) => {
      await page.goto(createTestDocumentURL())
      await waitForAppReady(page)
      const start = await getCanvasPosition(page, 0.2, 0.2)
      await page.keyboard.press('r')
      await page.mouse.move(start.x, start.y)
      await page.mouse.down()
      await page.mouse.move(
        start.x + (shape === 'portrait' ? 80 : 400),
        start.y + (shape === 'portrait' ? 400 : 80),
        { steps: 5 }
      )
      await page.mouse.up()
      await page.keyboard.press('v')
      await page.keyboard.press('Escape')
      const readCamera = () =>
        page.evaluate(async () => {
          const { viewportApis } = await import('../src/common-apis/viewport')
          return {
            scale: viewportApis.getScale(),
            position: viewportApis.getPosition()
          }
        })
      for (const [index, width] of [1280, 960, 1600].entries()) {
        const cameraBeforeLayout = await readCamera()
        await page.setViewportSize({ width, height: 720 })
        const panelOpen = index === 1 ? !aiPanelOpen : aiPanelOpen
        const panel = page.getByTestId('ai-agent-panel')
        if (panelOpen && !(await panel.isVisible()))
          await page.getByRole('button', { name: 'Open Agent' }).click()
        if (!panelOpen && (await panel.isVisible()))
          await page.getByRole('button', { name: 'Close Agent panel' }).click()
        // Layout changes only update the available area, never the camera.
        expect(await readCamera()).toEqual(cameraBeforeLayout)
        await clickCanvas(page, 0.1, 0.5)
        await page.keyboard.press('Meta+1')
        await expect(async () => {
          const state = await page.evaluate(async () => {
            const { core } = await import('../src/testing/runtime-access')
            const { viewportApis } = await import('../src/common-apis/viewport')
            const bounds = core.getAllElementsBounds()
            if (!bounds) throw new Error('Expected drawn content')
            const anchor = document.getElementById('viewport-anchor')
            if (!anchor) throw new Error('Expected viewport anchor')
            const viewport = anchor.getBoundingClientRect()
            const sidebar =
              document.querySelector('[data-testid="ai-agent-panel"]') ??
              document.querySelector('[data-testid="properties-panel"]')
            if (!sidebar) throw new Error('Expected visible right sidebar')
            const visibleRight = sidebar.getBoundingClientRect().left
            const scale = viewportApis.getScale()
            const position = viewportApis.getPosition()
            return {
              contentX: ((bounds.minX + bounds.maxX) / 2) * scale + position.x,
              contentY: ((bounds.minY + bounds.maxY) / 2) * scale + position.y,
              viewportX: (viewport.left + visibleRight) / 2,
              contentRight: bounds.maxX * scale + position.x,
              visibleRight,
              viewportY: viewport.y + viewport.height / 2
            }
          })
          expect(state.contentX).toBeCloseTo(state.viewportX, 1)
          expect(state.contentY).toBeCloseTo(state.viewportY, 1)
          expect(state.contentRight).toBeLessThanOrEqual(
            state.visibleRight - 19
          )
        }).toPass({ timeout: 5000 })

        await page.screenshot({
          path: testInfo.outputPath(`centered-fit-${width}.png`)
        })
      }
    })
  }
}
