import { expect, test } from '@playwright/test'

for (const width of [320, 394, 1440]) {
  test(`all site wordmarks share typography at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    let reference: unknown
    for (const route of [
      '/',
      '/docs',
      '/atlas',
      '/asyra-design',
      '/releases',
      '/roadmap'
    ]) {
      await page.goto(route)
      for (const region of ['header', 'footer']) {
        const logo = page
          .locator(region === 'footer' ? '.site-footer' : 'header')
          .first()
          .locator('a')
          .filter({ hasText: /^ASYRA$/ })
        await expect(logo).toHaveCount(1)
        const style = await logo.evaluate((el) => {
          const css = getComputedStyle(el)
          return {
            color: css.color,
            fontFamily: css.fontFamily,
            fontSize: css.fontSize,
            fontWeight: css.fontWeight,
            letterSpacing: css.letterSpacing,
            lineHeight: css.lineHeight
          }
        })
        if (!reference) reference = style
        expect.soft(style, `${route} ${region}`).toEqual(reference)
        await logo.screenshot({
          path: testInfo.outputPath(
            `${route.replaceAll('/', '') || 'home'}-${region}.png`
          )
        })
      }
    }
  })
}
