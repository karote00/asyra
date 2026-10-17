import { expect, test, type Page } from '@playwright/test'
import { FEATURE_MOVEMENT_THRESHOLD } from '../src/constants/movement-thresholds'
import {
  createTestDocumentURL,
  createRectangle,
  resetCanvas,
  setSelectedGradient,
  waitForAppReady
} from './test-utils'
import {
  getGradientHandleClientPosition,
  getSelectedGradientSnapshot,
  openGradientFillEditor
} from './gradient-test-utils'

interface SampledColor {
  r: number
  g: number
  b: number
  a: number
  localY: number
}

const sampleSelectedElementColors = async (
  page: Page,
  samplePoints: { x: number; y: number }[]
): Promise<SampledColor[]> => {
  const snapshot = await getSelectedGradientSnapshot(page)
  if (!snapshot) {
    throw new Error('Missing selected gradient snapshot')
  }

  const clip = {
    x: Math.max(
      0,
      Math.floor(snapshot.rect.x * snapshot.zoom + snapshot.viewport.x)
    ),
    y: Math.max(
      0,
      Math.floor(snapshot.rect.y * snapshot.zoom + snapshot.viewport.y)
    ),
    width: Math.max(1, Math.ceil(snapshot.rect.width * snapshot.zoom)),
    height: Math.max(1, Math.ceil(snapshot.rect.height * snapshot.zoom))
  }
  const imageBuffer = await page.screenshot({ clip, scale: 'css' })
  const imageBase64 = imageBuffer.toString('base64')

  return page.evaluate(
    async ({
      base64,
      points,
      originY,
      height,
      clipY
    }: {
      base64: string
      points: { x: number; y: number }[]
      originY: number
      height: number
      clipY: number
    }) => {
      const response = await fetch(`data:image/png;base64,${base64}`)
      const blob = await response.blob()
      const bitmap = await createImageBitmap(blob)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      if (!context) {
        return []
      }

      context.drawImage(bitmap, 0, 0)

      return points.map((point) => {
        const x = Math.max(
          0,
          Math.min(canvas.width - 1, Math.round(point.x * (canvas.width - 1)))
        )
        const y = Math.max(
          0,
          Math.min(canvas.height - 1, Math.round(point.y * (canvas.height - 1)))
        )
        const [r, g, b, a] = context.getImageData(x, y, 1, 1).data

        return { r, g, b, a, localY: (clipY + y + 0.5 - originY) / height }
      })
    },
    {
      base64: imageBase64,
      points: samplePoints,
      originY: snapshot.rect.y * snapshot.zoom + snapshot.viewport.y,
      height: snapshot.rect.height * snapshot.zoom,
      clipY: clip.y
    }
  )
}

const expectColorNear = (
  actual: SampledColor,
  expected: { r: number; g: number; b: number },
  tolerance = 24
) => {
  expect(actual.r).toBeGreaterThanOrEqual(expected.r - tolerance)
  expect(actual.r).toBeLessThanOrEqual(expected.r + tolerance)
  expect(actual.g).toBeGreaterThanOrEqual(expected.g - tolerance)
  expect(actual.g).toBeLessThanOrEqual(expected.g + tolerance)
  expect(actual.b).toBeGreaterThanOrEqual(expected.b - tolerance)
  expect(actual.b).toBeLessThanOrEqual(expected.b + tolerance)
  expect(actual.a).toBeGreaterThan(200)
}

const getBrightness = (color: SampledColor) => color.r + color.g + color.b

const DEFAULT_TEST_GRADIENT = {
  gradientType: 'linear',
  gradientStops: [
    { position: 0, color: '#ffffff', opacity: 1 },
    { position: 0.5, color: '#ff0000', opacity: 1 },
    { position: 1, color: '#000000', opacity: 1 }
  ],
  metadata: {}
} as const

// Independent oracle for this fixed white/red/black linear ramp. Interior
// samples interpolate; moving a handle must not pin colors to the shape edges.
const expectRampSamples = async (
  page: Page,
  samples: SampledColor[],
  expectedHandleY: readonly [number, number]
) => {
  const snapshot = await getSelectedGradientSnapshot(page)
  expect(snapshot?.gradient?.gradientStops).toEqual(
    DEFAULT_TEST_GRADIENT.gradientStops
  )
  if (!snapshot?.gradient) throw new Error('Missing canonical gradient')
  const handles = snapshot.gradient.gradientHandles
  expect(handles[0].x).toBeCloseTo(0.5, 2)
  expect(handles[1].x).toBeCloseTo(0.5, 2)
  expect(handles[0].y).toBeCloseTo(expectedHandleY[0], 2)
  expect(handles[1].y).toBeCloseTo(expectedHandleY[1], 2)
  const span = expectedHandleY[1] - expectedHandleY[0]
  expect(Math.abs(span)).toBeGreaterThan(0.05)
  for (const sample of samples) {
    const phase = Math.min(
      1,
      Math.max(0, (sample.localY - expectedHandleY[0]) / span)
    )
    expectColorNear(
      sample,
      {
        r: 255 * Math.min(1, 2 - 2 * phase),
        g: 255 * Math.max(0, 1 - 2 * phase),
        b: 255 * Math.max(0, 1 - 2 * phase)
      },
      12
    )
  }
}

test.describe('Gradient Fill Render', () => {
  test.afterEach(async ({ page }, testInfo) => {
    await testInfo.attach('gradient-state', {
      body: JSON.stringify(await getSelectedGradientSnapshot(page)),
      contentType: 'application/json'
    })
    await page.screenshot({ path: testInfo.outputPath('gradient-canvas.png') })
    await testInfo.attach('gradient-canvas', {
      path: testInfo.outputPath('gradient-canvas.png'),
      contentType: 'image/png'
    })
  })

  test.beforeEach(async ({ page }) => {
    await page.goto(createTestDocumentURL())
    await waitForAppReady(page)
    await resetCanvas(page)
  })

  test('renders the default vertical gradient with a brighter top than bottom', async ({
    page
  }) => {
    await createRectangle(page, 0.3, 0.3)
    await openGradientFillEditor(page)

    await setSelectedGradient(page, {
      ...DEFAULT_TEST_GRADIENT,
      gradientHandles: [
        { x: 0.5, y: 0 },
        { x: 0.5, y: 1 }
      ]
    })
    await page.waitForTimeout(200)

    const [top, bottom] = await sampleSelectedElementColors(page, [
      { x: 0.15, y: 0.1 },
      { x: 0.85, y: 0.9 }
    ])

    await expectRampSamples(page, [top, bottom], [0, 1])
    expect(top.r).toBeGreaterThan(bottom.r)
    expect(top.g).toBeGreaterThan(bottom.g)
    expect(top.b).toBeGreaterThan(bottom.b)
    expect(getBrightness(top)).toBeGreaterThan(getBrightness(bottom) + 120)
  })

  test('keeps stop colors visually stable while dragging the start handle downward', async ({
    page
  }) => {
    await createRectangle(page, 0.3, 0.3)
    await openGradientFillEditor(page)

    await setSelectedGradient(page, {
      ...DEFAULT_TEST_GRADIENT,
      gradientHandles: [
        { x: 0.5, y: 0 },
        { x: 0.5, y: 1 }
      ]
    })
    await page.waitForTimeout(200)

    const startHandle = await getGradientHandleClientPosition(page, 0)
    const before = await getSelectedGradientSnapshot(page)
    const clientDeltaY = (before?.rect.height ?? 0) * (before?.zoom ?? 1) * 0.9

    await page.mouse.move(startHandle.x, startHandle.y)
    await page.mouse.down()

    for (let step = 1; step <= 90; step += 1) {
      const currentY = startHandle.y + (clientDeltaY * step) / 90
      await page.mouse.move(startHandle.x, currentY, { steps: 1 })
      await page.waitForTimeout(8)
      // The existing Feature treats sub-threshold motion as a click, not a drag.
      const appliedFraction =
        (clientDeltaY * step) / (90 * (before?.zoom ?? 1)) >
        FEATURE_MOVEMENT_THRESHOLD.gradientHandle
          ? (0.9 * step) / 90
          : 0

      // Stay outside the center-axis color-stop overlays throughout the drag.
      const [top, bottom] = await sampleSelectedElementColors(page, [
        { x: 0.15, y: 0.1 },
        { x: 0.85, y: 0.9 }
      ])

      await expectRampSamples(page, [top, bottom], [appliedFraction, 1])
    }

    await page.mouse.up()
    await page.waitForTimeout(160)
  })

  test('renders reversed vertical handles as black-to-white from top to bottom', async ({
    page
  }) => {
    await createRectangle(page, 0.3, 0.3)
    await openGradientFillEditor(page)

    await setSelectedGradient(page, {
      ...DEFAULT_TEST_GRADIENT,
      gradientHandles: [
        { x: 0.5, y: 1 },
        { x: 0.5, y: 0 }
      ]
    })
    await page.waitForTimeout(200)

    const [top, middle, bottom] = await sampleSelectedElementColors(page, [
      { x: 0.15, y: 0.1 },
      { x: 0.15, y: 0.5 },
      { x: 0.85, y: 0.9 }
    ])

    await expectRampSamples(page, [top, middle, bottom], [1, 0])
    expect(getBrightness(bottom)).toBeGreaterThan(getBrightness(top) + 500)
  })

  test('renders interpolated boundary colors when the start handle begins above the shape', async ({
    page
  }) => {
    await createRectangle(page, 0.3, 0.3)
    await openGradientFillEditor(page)

    await setSelectedGradient(page, {
      ...DEFAULT_TEST_GRADIENT,
      gradientHandles: [
        { x: 0.5, y: -0.25 },
        { x: 0.5, y: 1 }
      ]
    })
    await page.waitForTimeout(200)

    const [top, middle, bottom] = await sampleSelectedElementColors(page, [
      { x: 0.15, y: 0.1 },
      { x: 0.15, y: 0.5 },
      { x: 0.85, y: 0.9 }
    ])

    await expectRampSamples(page, [top, middle, bottom], [-0.25, 1])
    expect(getBrightness(top)).toBeGreaterThan(getBrightness(bottom) + 350)
  })

  test('keeps stop colors stable while dragging the start handle upward beyond the shape', async ({
    page
  }) => {
    await createRectangle(page, 0.3, 0.3)
    await openGradientFillEditor(page)

    await setSelectedGradient(page, {
      ...DEFAULT_TEST_GRADIENT,
      gradientHandles: [
        { x: 0.5, y: 0 },
        { x: 0.5, y: 1 }
      ]
    })
    await page.waitForTimeout(200)

    const startHandle = await getGradientHandleClientPosition(page, 0)
    const before = await getSelectedGradientSnapshot(page)
    const clientDeltaY = (before?.rect.height ?? 0) * (before?.zoom ?? 1) * 0.9

    await page.mouse.move(startHandle.x, startHandle.y)
    await page.mouse.down()

    for (let step = 1; step <= 90; step += 1) {
      const currentY = startHandle.y - (clientDeltaY * step) / 90
      await page.mouse.move(startHandle.x, currentY, { steps: 1 })
      await page.waitForTimeout(8)
      // The existing Feature treats sub-threshold motion as a click, not a drag.
      const appliedFraction =
        (clientDeltaY * step) / (90 * (before?.zoom ?? 1)) >
        FEATURE_MOVEMENT_THRESHOLD.gradientHandle
          ? (0.9 * step) / 90
          : 0

      // Stay outside the center-axis color-stop overlays throughout the drag.
      const [top, bottom] = await sampleSelectedElementColors(page, [
        { x: 0.15, y: 0.1 },
        { x: 0.85, y: 0.9 }
      ])

      await expectRampSamples(page, [top, bottom], [-appliedFraction, 1])
    }

    await page.mouse.up()
    await page.waitForTimeout(160)
  })

  test('keeps stop colors stable while dragging the end handle downward beyond the shape', async ({
    page
  }) => {
    await createRectangle(page, 0.3, 0.3)
    await openGradientFillEditor(page)

    await setSelectedGradient(page, {
      ...DEFAULT_TEST_GRADIENT,
      gradientHandles: [
        { x: 0.5, y: 0 },
        { x: 0.5, y: 1 }
      ]
    })
    await page.waitForTimeout(200)

    const endHandle = await getGradientHandleClientPosition(page, 1)
    const before = await getSelectedGradientSnapshot(page)
    const clientDeltaY = (before?.rect.height ?? 0) * (before?.zoom ?? 1) * 0.9

    await page.mouse.move(endHandle.x, endHandle.y)
    await page.mouse.down()

    for (let step = 1; step <= 90; step += 1) {
      const currentY = endHandle.y + (clientDeltaY * step) / 90
      await page.mouse.move(endHandle.x, currentY, { steps: 1 })
      await page.waitForTimeout(8)
      // The existing Feature treats sub-threshold motion as a click, not a drag.
      const appliedFraction =
        (clientDeltaY * step) / (90 * (before?.zoom ?? 1)) >
        FEATURE_MOVEMENT_THRESHOLD.gradientHandle
          ? (0.9 * step) / 90
          : 0

      // Stay outside the center-axis color-stop overlays throughout the drag.
      const [top, bottom] = await sampleSelectedElementColors(page, [
        { x: 0.15, y: 0.1 },
        { x: 0.85, y: 0.9 }
      ])

      await expectRampSamples(page, [top, bottom], [0, 1 + appliedFraction])
    }

    await page.mouse.up()
    await page.waitForTimeout(160)
  })
})
