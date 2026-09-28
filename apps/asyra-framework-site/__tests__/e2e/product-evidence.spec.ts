import { expect, test } from '@playwright/test'

for (const width of [320, 390, 1440]) {
  test(`product evidence is readable and unoccluded at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 960 })
    await page.goto('/')

    const section = page.locator('#built-with-asyra')
    await section.scrollIntoViewIfNeeded()
    await expect(
      section.getByRole('heading', { name: 'FieldScope', level: 3 })
    ).toBeVisible()
    await expect(
      section.getByRole('heading', { name: 'Asyra Sim', level: 3 })
    ).toBeVisible()
    await expect(section).toContainText('cucumber and tomato crops')
    await expect(section).toContainText(
      'does not simulate robot patrol or harvesting'
    )
    await expect(section).toContainText('Development checkpoint - not R0')
    await expect(section).toContainText('not independently certified')

    for (const [name, href] of [
      [
        'Crop model source ↗',
        'https://github.com/karote00/asyra/blob/main/apps/fieldscope/src/domain/crop-layout.ts'
      ],
      [
        'Crop layout tests ↗',
        'https://github.com/karote00/asyra/blob/main/apps/fieldscope/src/domain/__tests__/crop-layout.test.ts'
      ],
      ['Open the workbench ↗', 'https://asyra-sim.vercel.app'],
      [
        'Analysis tests ↗',
        'https://github.com/karote00/asyra/blob/main/apps/asyra-sim/src/features/__tests__/analysis.test.ts'
      ]
    ]) {
      const link = section.getByRole('link', { name })
      await expect(link).toHaveAttribute('href', href)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }

    const [fieldScopeBox, simBox] = await Promise.all(
      ['FieldScope', 'Asyra Sim'].map(async (name) => {
        const card = section
          .getByRole('heading', { name, level: 3 })
          .locator('xpath=..')
        const box = await card.boundingBox()
        if (!box) throw new Error(`Missing ${name} case card`)
        expect(box.x).toBeGreaterThanOrEqual(-1)
        expect(box.x + box.width).toBeLessThanOrEqual(width + 1)
        expect(
          await card.evaluate(
            (element) => element.scrollWidth <= element.clientWidth
          )
        ).toBe(true)
        return box
      })
    )
    if (width >= 768)
      expect(fieldScopeBox.x + fieldScopeBox.width).toBeLessThanOrEqual(
        simBox.x + 1
      )
    else
      expect(fieldScopeBox.y + fieldScopeBox.height).toBeLessThanOrEqual(
        simBox.y + 1
      )

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    for (const [name, file] of [
      ['FieldScope', 'fieldscope'],
      ['Asyra Sim', 'asyra-sim']
    ]) {
      const heading = section.getByRole('heading', { name, level: 3 })
      await heading.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        window.scrollTo(0, window.scrollY + bounds.top - 150)
      })
      await expect(heading).toBeVisible()
      const card = heading.locator('xpath=..')
      const cardBox = await card.boundingBox()
      if (!cardBox) throw new Error(`Missing ${name} case card`)
      expect(cardBox.y).toBeGreaterThanOrEqual(80)
      expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(960)
      expect(
        await heading.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          const hit = document.elementFromPoint(
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2
          )
          return hit === element || element.contains(hit)
        })
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`product-evidence-${file}-${width}.png`)
      })
    }
  })
}
