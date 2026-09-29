import { expect, test } from '@playwright/test'

test('the homepage uses one interactive story instead of loading the retired film', async ({
  page
}) => {
  const media: string[] = []
  page.on('request', (request) => {
    if (/\.(mp4|webm)(\?|$)/.test(request.url())) media.push(request.url())
  })
  await page.goto('/')
  await page.locator('#start-building').scrollIntoViewIfNeeded()
  await expect(page.locator('video')).toHaveCount(0)
  await expect(page.locator('[data-shared-scene]')).toHaveCount(1)
  expect(media).toEqual([])
})
