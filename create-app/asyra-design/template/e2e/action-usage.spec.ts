import { expect, test } from '@playwright/test'
import { AiActionNames } from '../src/constants/ai-actions'
import { prepareDesign } from '../server/design-preparation'
import { createPreparedDrawingArtifact } from './action-batch-interceptor'
import { createTestDocumentIdentity, waitForAppReady } from './test-utils'

const draft = {
  type: 'frame',
  name: 'Usage fixture',
  width: 240,
  height: 180,
  children: [
    {
      key: 'a',
      type: 'rect',
      name: 'Surface A',
      x: 10,
      y: 10,
      width: 40,
      height: 30,
      fill: '#112233'
    },
    {
      key: 'b',
      type: 'rect',
      name: 'Surface B',
      x: 90,
      y: 50,
      width: 50,
      height: 40,
      fill: '#445566'
    }
  ]
}
for (const name of Object.values(AiActionNames)) {
  test(`registered action usage - ${name}`, async ({ page }) => {
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    await page.waitForFunction(async () => {
      const fixture = await import('../e2e/fixtures/action-usage-cases')
      return fixture.isActionFixtureReady()
    })
    const drawing = createPreparedDrawingArtifact(
      [
        {
          bounds: { x: 300, y: 100, width: 100, height: 100 },
          primitive: 'vector',
          role: 'source-shape',
          paths: [
            {
              closed: true,
              points: [
                { x: 300, y: 100 },
                { x: 400, y: 100 },
                { x: 400, y: 200 },
                { x: 300, y: 200 }
              ]
            }
          ],
          style: { fillColor: '#0000FF' }
        }
      ],
      {
        batchId: 'usage-vector',
        fileId: 'usage-vector',
        compositionRole: 'reference'
      }
    )
    const result = await page.evaluate(
      async (input) => {
        const { runActionUsageCase } =
          await import('../e2e/fixtures/action-usage-cases')
        try {
          return await runActionUsageCase(
            input.name,
            input.design,
            input.drawing,
            input.additional
          )
        } catch (error) {
          const messages: string[] = []
          let current = error
          while (current instanceof Error && messages.length < 8) {
            messages.push(`${current.name}: ${current.message}`)
            current = current.cause
          }
          throw new Error(messages.join(' -> '))
        }
      },
      {
        name,
        design: prepareDesign(draft, 'usage-seed'),
        drawing,
        additional: prepareDesign(draft, 'usage-additional')
      }
    )
    expect(result).toMatchObject({ name, status: 'success' })
  })
}
