import { expect, test } from '@playwright/test'
import { prepareDesign } from '../server/design-preparation'
import {
  createTestDocumentIdentity,
  getUndoHistoryDepth,
  waitForAppReady
} from './test-utils'

const text = (
  key: string,
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize = 20,
  textColor = '#273f36'
) => ({
  key,
  name: key,
  type: 'text',
  x,
  y,
  width,
  height,
  text: content,
  fontSize,
  lineHeight: fontSize * 1.2,
  textColor
})
const rect = (
  key: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string
) => ({ key, name: key, type: 'rect', x, y, width, height, fill })
const coffee = {
  name: 'Lento Coffee',
  x: 30,
  y: 30,
  width: 1440,
  height: 1180,
  fill: '#f6f2e9',
  children: [
    text('Brand', 'LENTO COFFEE', 64, 36, 360, 42, 26),
    text('Navigation', 'Our coffee    Journal    Visit', 1020, 40, 360, 36, 20),
    text('Hero', 'Good coffee.\nA slower morning.', 64, 145, 800, 164, 64),
    text(
      'Introduction',
      'Thoughtfully roasted in Kyoto. Made for your daily ritual.',
      64,
      332,
      680,
      66,
      23
    ),
    {
      key: 'Shop',
      name: 'Shop button',
      type: 'frame',
      x: 64,
      y: 425,
      width: 250,
      height: 64,
      fill: '#284e42',
      children: [
        text('Shop label', 'Explore our coffee', 24, 18, 210, 32, 21, '#ffffff')
      ]
    },
    {
      key: 'Hero illustration',
      name: 'Coffee illustration',
      type: 'frame',
      x: 960,
      y: 145,
      width: 390,
      height: 320,
      fill: '#e6dfcd',
      children: [
        {
          key: 'Saucer',
          name: 'Saucer',
          type: 'oval',
          x: 60,
          y: 220,
          width: 270,
          height: 50,
          fill: '#b8b39b'
        },
        {
          key: 'Handle',
          name: 'Handle',
          type: 'oval',
          x: 260,
          y: 140,
          width: 75,
          height: 90,
          fill: '#f6f2e9'
        },
        rect('Cup', 100, 120, 180, 120, '#faf8f0'),
        {
          key: 'Coffee',
          name: 'Coffee',
          type: 'oval',
          x: 100,
          y: 102,
          width: 180,
          height: 45,
          fill: '#624737'
        }
      ]
    },
    text('Collection', 'Find your everyday favourite', 64, 554, 900, 60, 36),
    {
      key: 'Products',
      name: 'Coffee collection',
      type: 'frame',
      x: 64,
      y: 660,
      width: 1312,
      height: 330,
      layout: 'row',
      gap: 32,
      children: [
        'House blend',
        'Seasonal single origin',
        'Slow Sunday decaf'
      ].map((name, i) => ({
        key: `Product ${i}`,
        name,
        type: 'frame',
        width: 416,
        height: 330,
        fill: '#e9e5d9',
        children: [
          rect(
            `Bag ${i}`,
            133,
            30,
            150,
            140,
            ['#a8b7a4', '#bd9b79', '#bcc2bb'][i]
          ),
          text(`Product label ${i}`, name, 24, 208, 368, 40, 25),
          text(
            `Notes ${i}`,
            [
              'Chocolate and hazelnut',
              'Bright, floral and balanced',
              'Gentle, full-bodied comfort'
            ][i],
            24,
            264,
            368,
            36,
            18
          )
        ]
      }))
    },
    text('Footer', 'Small batches. Lasting rituals.', 64, 1070, 700, 50, 28),
    text('Location', 'Kyoto, Japan', 1140, 1078, 240, 35, 20)
  ]
}
const mobile = {
  name: 'Daily focus',
  x: 30,
  y: 30,
  width: 390,
  height: 844,
  fill: '#edf1fa',
  children: [
    text('Title', 'Your day, simplified.', 24, 54, 342, 100, 36, '#233453'),
    text(
      'Subtitle',
      'Make space for what matters.',
      24,
      170,
      342,
      65,
      21,
      '#536482'
    ),
    ...[
      'Plan one meaningful task',
      'Protect your focus time',
      'Celebrate small progress'
    ].map((label, i) => ({
      key: `Task ${i}`,
      name: label,
      type: 'frame',
      x: 24,
      y: 280 + i * 130,
      width: 342,
      height: 106,
      fill: '#ffffff',
      children: [text(`Task text ${i}`, label, 20, 24, 302, 65, 22, '#233453')]
    })),
    text(
      'Prompt',
      'Start with one small step.',
      24,
      730,
      342,
      56,
      22,
      '#536482'
    )
  ]
}
const saas = {
  name: 'Orbit workspace',
  x: 30,
  y: 30,
  width: 960,
  height: 720,
  fill: '#111b31',
  children: [
    text('Brand', 'ORBIT', 48, 32, 200, 40, 24, '#bcc8ff'),
    text(
      'Title',
      'Bring the whole team\ninto focus.',
      48,
      120,
      800,
      140,
      52,
      '#ffffff'
    ),
    text(
      'Description',
      'One shared space for projects, decisions and progress.',
      48,
      288,
      800,
      60,
      23,
      '#b9c5de'
    ),
    ...['Plan together', 'Move with clarity', 'See the impact'].map(
      (label, i) => ({
        key: `Feature ${i}`,
        name: label,
        type: 'frame',
        x: 48 + i * 292,
        y: 410,
        width: 280,
        height: 220,
        fill: '#213052',
        children: [
          text(`Number ${i}`, `0${i + 1}`, 22, 22, 230, 44, 30, '#a9b5ff'),
          text(`Feature text ${i}`, label, 22, 98, 236, 96, 28, '#ffffff')
        ]
      })
    )
  ]
}
const landscape = {
  name: 'Quiet night',
  x: 30,
  y: 30,
  width: 480,
  height: 480,
  fill: '#142a44',
  children: [
    {
      key: 'Moon',
      name: 'Moon',
      type: 'oval',
      x: 310,
      y: 60,
      width: 92,
      height: 92,
      fill: '#f2d991'
    },
    {
      key: 'Distant hills',
      name: 'Distant hills',
      type: 'vector',
      x: 0,
      y: 185,
      width: 480,
      height: 295,
      fill: '#3b6580',
      rings: [
        [
          { x: 0, y: 130, outControl: { x: 130, y: 0 } },
          {
            x: 260,
            y: 100,
            inControl: { x: 170, y: 0 },
            outControl: { x: 350, y: 170 }
          },
          { x: 480, y: 40, inControl: { x: 430, y: 20 } },
          { x: 480, y: 295 },
          { x: 0, y: 295 }
        ]
      ]
    },
    {
      key: 'Near hills',
      name: 'Near hills',
      type: 'vector',
      x: 0,
      y: 300,
      width: 480,
      height: 180,
      fill: '#203f50',
      rings: [
        [
          { x: 0, y: 70, outControl: { x: 160, y: 170 } },
          { x: 480, y: 35, inControl: { x: 310, y: 0 } },
          { x: 480, y: 180 },
          { x: 0, y: 180 }
        ]
      ]
    },
    ...[
      [70, 70],
      [190, 110],
      [255, 55]
    ].map(([x, y], i) => ({
      key: `Star ${i}`,
      name: `Star ${i}`,
      type: 'oval',
      x,
      y,
      width: 5,
      height: 5,
      fill: '#eadcbb'
    }))
  ]
}

for (const [name, draft] of Object.entries({
  coffee,
  saas,
  mobile,
  landscape
})) {
  test(`applies a distinct editable ${name} provider draft`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width: 1600, height: 1000 })
    const design = prepareDesign(draft)
    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'ready' } })
    )
    await page.route('**/api/ai/action-batch', (route) =>
      route.fulfill({
        json: {
          batchId: name,
          actions: [
            {
              id: 'create',
              name: 'apply_prepared_design',
              arguments: { design },
              summary: `Create ${name} design`
            }
          ]
        }
      })
    )
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    const before = await getUndoHistoryDepth(page)
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await page
      .getByLabel('Message Agent')
      .fill(`Create an editable ${name} composition without a reference image.`)
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
      'data-outcome',
      'success'
    )
    await expect(page.getByLabel('Design context')).toHaveText('1 selected')
    expect(await getUndoHistoryDepth(page)).toBe(before + 1)
    const evidence = await page.evaluate(
      async ({ rootId, entries }) => {
        const { core } = await import('../src/testing/runtime-access')
        const { reviewDesign } =
          await import('../src/common-apis/design-review')
        return {
          review: reviewDesign(rootId),
          nodes: entries.map(({ descriptor }) => ({
            id: descriptor.id,
            type: core.getElementData(descriptor.id)?.type,
            values: core.getElementComputedData(descriptor.id, [
              'width',
              'height',
              'text'
            ])
          }))
        }
      },
      { rootId: design.rootId, entries: design.entries }
    )
    expect(evidence.nodes[0].values).toMatchObject({
      width: draft.width,
      height: draft.height
    })
    for (const [i, entry] of design.entries.entries()) {
      expect(evidence.nodes[i].type).toBe(entry.descriptor.type)
      if (entry.descriptor.type === 'text')
        expect(evidence.nodes[i].values?.text).toBe(entry.descriptor.text)
    }
    expect(evidence.review.complete).toBe(true)
    expect(
      evidence.review.findings.filter((f) => f.kind === 'text-overflow')
    ).toEqual([])
    await page.getByRole('button', { name: 'Close Agent panel' }).click()
    await page.evaluate(async () => {
      ;(
        await import('../src/common-apis/selection')
      ).selectionApis.clearSelection()
      ;(await import('../src/common-apis/viewport')).viewportApis.zoomFit()
    })
    await page.screenshot({
      path: testInfo.outputPath(`${name}.png`),
      fullPage: false
    })
  })
}
