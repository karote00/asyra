import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

async function clickExposedSlide(page: Page, side: Locator) {
  await side.scrollIntoViewIfNeeded()
  const point = await side.evaluate((element) => {
    const stage = element.parentElement
    const center = stage?.querySelector('[data-active="true"]')
    if (!stage || !center) return null
    const stageBounds = stage.getBoundingClientRect()
    const sideBounds = element.getBoundingClientRect()
    const centerBounds = center.getBoundingClientRect()
    const offset = Number(element.getAttribute('data-offset'))
    const left =
      offset > 0
        ? Math.max(centerBounds.right, stageBounds.left)
        : Math.max(sideBounds.left, stageBounds.left)
    const right =
      offset > 0
        ? Math.min(sideBounds.right, stageBounds.right)
        : Math.min(centerBounds.left, stageBounds.right)
    const top = Math.max(sideBounds.top, stageBounds.top)
    const bottom = Math.min(sideBounds.bottom, stageBounds.bottom)

    for (const verticalPart of [0.25, 0.5, 0.75]) {
      for (const horizontalPart of [0.25, 0.5, 0.75]) {
        const x = left + (right - left) * horizontalPart
        const y = top + (bottom - top) * verticalPart
        if (
          document.elementFromPoint(x, y)?.closest('[data-side-preview]') ===
          element
        )
          return { x, y }
      }
    }
    return null
  })
  expect(point, 'side image has a visible, clickable area').not.toBeNull()
  if (point) await page.mouse.click(point.x, point.y)
}

for (const width of [320, 390, 1024, 1440]) {
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

    const carousel = section.getByRole('region', {
      name: 'FieldScope image slider'
    })
    await expect(carousel).toBeVisible()
    expect(
      await carousel.locator('[data-testid="product-evidence-slide"]').count()
    ).toBe(3)
    expect(await carousel.getByRole('button').count()).toBe(
      width >= 1025 ? 3 : 2
    )
    expect(await carousel.locator('[data-side-preview="true"]').count()).toBe(2)
    const initialSlideGeometry = await carousel
      .locator('[data-testid="product-evidence-slide"]')
      .evaluateAll((slides) =>
        slides.map((slide) => {
          const bounds = slide.getBoundingClientRect()
          const image = slide.querySelector('img')
          const imageBounds = image?.getBoundingClientRect()
          return {
            active: slide.getAttribute('data-active') === 'true',
            width: bounds.width,
            x: bounds.x,
            left: bounds.left,
            right: bounds.right,
            y: bounds.y,
            height: bounds.height,
            bottom: bounds.bottom,
            transition: getComputedStyle(slide).transitionProperty,
            imageRatio: imageBounds
              ? imageBounds.width / imageBounds.height
              : 0,
            imageShadow: image ? getComputedStyle(image).boxShadow : 'none',
            frameShadow: getComputedStyle(slide).boxShadow
          }
        })
      )
    const centerSlide = initialSlideGeometry.find((slide) => slide.active)
    const sideSlides = initialSlideGeometry.filter((slide) => !slide.active)
    expect(centerSlide).toBeDefined()
    expect(sideSlides).toHaveLength(2)
    expect(centerSlide?.imageRatio).toBeCloseTo(1440 / 1174, 2)
    expect(centerSlide?.imageShadow).not.toBe('none')
    expect(centerSlide?.frameShadow).toBe('none')
    const stageBox = await carousel.boundingBox()
    expect(stageBox).not.toBeNull()
    const expectedInset = width >= 1025 ? 12 : 8
    expect(
      Math.abs((centerSlide?.y ?? 0) - (stageBox?.y ?? 0) - expectedInset - 1)
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(
        (centerSlide?.width ?? 0) / (centerSlide?.height ?? 1) - 1440 / 1174
      )
    ).toBeLessThan(0.01)
    expect(
      Math.abs(
        (centerSlide?.x ?? 0) +
          (centerSlide?.width ?? 0) / 2 -
          ((stageBox?.x ?? 0) + (stageBox?.width ?? 0) / 2)
      )
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(
        (centerSlide?.bottom ?? 0) -
          (stageBox?.y ?? 0) -
          (stageBox?.height ?? 0) +
          expectedInset +
          1
      )
    ).toBeLessThanOrEqual(1)
    for (const side of sideSlides) {
      expect(
        Math.abs(side.width / (centerSlide?.width ?? 1) - 0.9)
      ).toBeLessThan(0.01)
      expect(
        Math.abs(side.bottom - (centerSlide?.bottom ?? 0))
      ).toBeLessThanOrEqual(1)
      expect(side.transition).toContain('transform')
    }
    const inlineOverlapRatios = sideSlides.map((side) => {
      const overlap =
        side.x < (centerSlide?.x ?? 0)
          ? side.right - (centerSlide?.x ?? 0)
          : (centerSlide?.x ?? 0) + (centerSlide?.width ?? 0) - side.x
      return overlap / side.width
    })
    expect(
      inlineOverlapRatios.every((ratio) => Math.abs(ratio - 0.75) < 0.02)
    ).toBe(true)
    const fieldScopeImages = carousel.locator(
      '[data-testid="product-evidence-slide"] img'
    )
    const fieldScopeSources = [
      '/product-evidence/fieldscope-greenhouse-overview.webp',
      '/product-evidence/fieldscope-greenhouse-end-elevation.webp',
      '/product-evidence/fieldscope-greenhouse-internal-detail.webp'
    ]
    expect(
      await fieldScopeImages.evaluateAll((items) =>
        items.map((image) => image.getAttribute('src'))
      )
    ).toEqual(fieldScopeSources)
    const simShowcase = section.locator('[data-testid="asyra-sim-showcase"]')
    await expect(simShowcase).toHaveAttribute(
      'aria-label',
      'Asyra Sim image slider'
    )
    expect(
      await simShowcase
        .locator('[data-testid="product-evidence-slide"]')
        .count()
    ).toBe(1)
    await expect(simShowcase.getByRole('img')).toHaveAttribute(
      'src',
      '/product-evidence/asyra-sim-workcell.webp'
    )
    const simFrame = simShowcase.locator(
      '[data-testid="product-evidence-slide"]'
    )
    const simFrameGeometry = await simFrame.evaluate((frame) => {
      const image = frame.querySelector('img')
      if (!image) return null
      const frameBounds = frame.getBoundingClientRect()
      const imageBounds = image.getBoundingClientRect()
      return {
        frameRatio: frameBounds.width / frameBounds.height,
        imageRatio: imageBounds.width / imageBounds.height,
        imageShadow: getComputedStyle(image).boxShadow,
        frameShadow: getComputedStyle(frame).boxShadow
      }
    })
    expect(simFrameGeometry?.frameRatio).toBeCloseTo(1440 / 1174, 2)
    expect(simFrameGeometry?.imageRatio).toBeCloseTo(1440 / 960, 2)
    expect(simFrameGeometry?.imageShadow).not.toBe('none')
    expect(simFrameGeometry?.frameShadow).toBe('none')
    expect(await simShowcase.getByRole('button').count()).toBe(
      width >= 1025 ? 1 : 0
    )
    const showcaseGeometry = await Promise.all(
      [carousel, simShowcase].map(async (showcase) =>
        showcase.evaluate((element) => element.getBoundingClientRect().toJSON())
      )
    )
    expect(
      Math.abs(showcaseGeometry[0].width - showcaseGeometry[1].width)
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(showcaseGeometry[0].height - showcaseGeometry[1].height)
    ).toBeLessThanOrEqual(1)
    const simSlide = await simShowcase
      .locator('[data-testid="product-evidence-slide"]')
      .boundingBox()
    expect(simSlide).not.toBeNull()
    expect(
      Math.abs((simSlide?.width ?? 0) - (centerSlide?.width ?? 0))
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs((simSlide?.height ?? 0) - (centerSlide?.height ?? 0))
    ).toBeLessThanOrEqual(1)
    if (width >= 768) {
      const fieldScopeCard = section
        .getByRole('heading', { name: 'FieldScope', level: 3 })
        .locator('xpath=..')
      const simCard = section
        .getByRole('heading', { name: 'Asyra Sim', level: 3 })
        .locator('xpath=..')
      const fieldScopeSummary = fieldScopeCard.locator(
        '[data-testid="product-case-summary"]'
      )
      const simSummary = simCard.locator('[data-testid="product-case-summary"]')
      await expect(fieldScopeSummary).toBeVisible()
      await expect(simSummary).toBeVisible()
      const [
        fieldScopeSummaryBox,
        simSummaryBox,
        fieldScopeCardBox,
        simCardBox
      ] = await Promise.all([
        fieldScopeSummary.boundingBox(),
        simSummary.boundingBox(),
        fieldScopeCard.boundingBox(),
        simCard.boundingBox()
      ])
      if (
        !fieldScopeSummaryBox ||
        !simSummaryBox ||
        !fieldScopeCardBox ||
        !simCardBox
      )
        throw new Error('Missing product card summary or geometry')
      expect(
        Math.abs(fieldScopeSummaryBox.width - fieldScopeCardBox.width)
      ).toBeLessThanOrEqual(1)
      expect(
        Math.abs(simSummaryBox.width - simCardBox.width)
      ).toBeLessThanOrEqual(1)
      expect(
        Math.abs(fieldScopeSummaryBox.height - simSummaryBox.height)
      ).toBeLessThanOrEqual(1)
      const fieldScopeSummaryLines = await fieldScopeSummary.evaluate(
        (element) => {
          const range = document.createRange()
          range.selectNodeContents(element)
          return new Set(
            Array.from(range.getClientRects(), (rect) => Math.round(rect.y))
          ).size
        }
      )
      if (width >= 1280) expect(fieldScopeSummaryLines).toBe(1)
      const [fieldScopeSliderBox, simSliderBox] = await Promise.all([
        carousel.boundingBox(),
        simShowcase.boundingBox()
      ])
      if (!fieldScopeSliderBox || !simSliderBox)
        throw new Error('Missing product slider geometry')
      expect(
        Math.abs(fieldScopeSliderBox.y - simSliderBox.y)
      ).toBeLessThanOrEqual(1)
      expect(
        Math.abs(fieldScopeCardBox.height - simCardBox.height)
      ).toBeLessThanOrEqual(1)
    }
    await carousel.screenshot({
      path: testInfo.outputPath(
        `product-evidence-fieldscope-slider-${width}.png`
      )
    })
    await simShowcase.screenshot({
      path: testInfo.outputPath(`product-evidence-sim-slider-${width}.png`)
    })

    const firstSide = carousel.locator('[data-side-preview="true"]').nth(0)
    await clickExposedSlide(page, firstSide)
    await expect(carousel.locator('[data-active="true"] img')).toHaveAttribute(
      'src',
      fieldScopeSources[1]
    )
    const motionSamples = await carousel
      .locator('[data-testid="product-evidence-slide"][data-slide-index="1"]')
      .evaluate(async (slide) => {
        const samples: {
          x: number
          width: number
          bottom: number
          stageBottom: number
        }[] = []
        for (let frame = 0; frame < 8; frame += 1) {
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve())
          )
          const bounds = slide.getBoundingClientRect()
          const stageBottom =
            slide.parentElement?.getBoundingClientRect().bottom ?? 0
          samples.push({
            x: bounds.x,
            width: bounds.width,
            bottom: bounds.bottom,
            stageBottom
          })
        }
        return {
          samples,
          transition: getComputedStyle(slide).transitionProperty,
          transform: (slide as HTMLElement).style.transform
        }
      })
    expect(motionSamples.transition).toContain('transform')
    expect(motionSamples.transform).toContain('translateX(')
    expect(motionSamples.transform).not.toMatch(/translate(?:Y|3d)/u)
    expect(motionSamples.samples.at(-1)?.x).toBeLessThan(
      motionSamples.samples[0].x - 3
    )
    expect(
      motionSamples.samples.every(
        (sample, index, samples) =>
          index === 0 || sample.x <= samples[index - 1].x + 1
      )
    ).toBe(true)
    expect(motionSamples.samples.at(-1)?.width).toBeGreaterThan(
      motionSamples.samples[0].width + 3
    )
    expect(
      motionSamples.samples.every(
        (sample) =>
          Math.abs(sample.bottom - sample.stageBottom + expectedInset + 1) <= 1
      )
    ).toBe(true)
    await carousel.press('ArrowLeft')
    await expect(carousel.locator('[data-active="true"] img')).toHaveAttribute(
      'src',
      fieldScopeSources[0]
    )
    await carousel.dispatchEvent('pointerdown', {
      pointerId: 7,
      pointerType: 'touch',
      clientX: 280,
      clientY: 400
    })
    await carousel.dispatchEvent('pointerup', {
      pointerId: 7,
      pointerType: 'touch',
      clientX: 60,
      clientY: 402
    })
    await expect(carousel.locator('[data-active="true"] img')).toHaveAttribute(
      'src',
      fieldScopeSources[1]
    )
    await page.waitForTimeout(700)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(
      await page.evaluate(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
    ).toBe(true)
    const secondSide = carousel.locator('[data-side-preview="true"]').nth(1)
    await clickExposedSlide(page, secondSide)
    await expect(carousel.locator('[data-active="true"] img')).toHaveAttribute(
      'src',
      fieldScopeSources[2]
    )
    expect(await carousel.getByRole('button').count()).toBe(
      width >= 1025 ? 3 : 2
    )
    const reducedMotionDurations = await carousel
      .locator('[data-testid="product-evidence-slide"]')
      .evaluateAll((slides) =>
        slides.flatMap((slide) =>
          getComputedStyle(slide)
            .transitionDuration.split(',')
            .map((duration) => Number.parseFloat(duration))
        )
      )
    expect(reducedMotionDurations.every((duration) => duration <= 0.001)).toBe(
      true
    )
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    const imageGroups: [string, { src: string; alt: string }[]][] = [
      [
        'FieldScope',
        fieldScopeSources.map((src, index) => ({
          src,
          alt: [
            'FieldScope oblique overview of the four-bay greenhouse, crop rows, and steel frame',
            'FieldScope end elevation of the four connected greenhouse bays and planted rows',
            'FieldScope aisle view with tomato fruit, leaves, and greenhouse support structure'
          ][index]
        }))
      ],
      [
        'Asyra Sim',
        [
          {
            src: '/product-evidence/asyra-sim-workcell.webp',
            alt: 'Asyra Sim synthetic six-axis robot workcell with fixture post and table'
          }
        ]
      ]
    ]
    for (const [name, imageGroup] of imageGroups) {
      const card = section
        .getByRole('heading', { name, level: 3 })
        .locator('xpath=..')
      const images = card.locator('[data-testid="product-evidence-slide"] img')
      expect(await images.count()).toBe(imageGroup.length)
      for (const [index, imageInfo] of imageGroup.entries()) {
        const image = images.nth(index)
        await expect(image).toHaveAttribute('src', imageInfo.src)
        await expect(image).toHaveAttribute('alt', imageInfo.alt)
        await image.scrollIntoViewIfNeeded()
        const imageState = await image.evaluate(
          (element: HTMLImageElement) => ({
            loaded: element.complete && element.naturalWidth > 0,
            ratio: element.naturalWidth / element.naturalHeight,
            objectFit: getComputedStyle(element).objectFit,
            box: element.getBoundingClientRect().toJSON(),
            active: element.closest('[data-active="true"]') !== null
          })
        )
        expect(imageState.loaded, `${name} screenshot did not load`).toBe(true)
        expect(imageState.ratio).toBeGreaterThan(1.2)
        expect(imageState.objectFit).toBe('contain')
        expect(
          Math.abs(
            imageState.box.width / imageState.box.height - imageState.ratio
          )
        ).toBeLessThan(0.02)
        if (imageState.active) {
          await expect(image).toBeVisible()
          expect(imageState.box.x).toBeGreaterThanOrEqual(0)
          expect(imageState.box.x + imageState.box.width).toBeLessThanOrEqual(
            width + 1
          )
          expect(imageState.box.width).toBeGreaterThanOrEqual(
            width < 768 ? 180 : 300
          )
        }
      }
    }

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
      const images = card.getByRole('img')
      const image = images.first()
      const description =
        name === 'FieldScope'
          ? card.getByText(
              'Model cucumber and tomato crops in a greenhouse, with a parked robot concept and conservative lane and energy assessments.',
              { exact: true }
            )
          : card.getByText(
              'Edit synthetic six-axis workcells, review robot trajectories, and compare geometry-analysis runs in a browser-local workbench.',
              { exact: true }
            )
      const link = card.getByRole('link').first()
      const imageBoxes = await Promise.all(
        (await images.all()).map((item) => item.boundingBox())
      )
      const imageBox = await image.boundingBox()
      const lastImageBox = imageBoxes.at(-1)
      const textBox = await description.boundingBox()
      const linkBox = await link.boundingBox()
      if (!imageBox || !lastImageBox || !textBox || !linkBox)
        throw new Error(`Incomplete ${name} evidence card`)
      expect(lastImageBox.y + lastImageBox.height).toBeLessThanOrEqual(
        textBox.y
      )
      expect(textBox.y + textBox.height).toBeLessThanOrEqual(linkBox.y)
      for (const locator of [
        heading,
        image,
        images.last(),
        description,
        link
      ]) {
        await locator.scrollIntoViewIfNeeded()
        await expect(locator).toBeInViewport()
      }
      await heading.scrollIntoViewIfNeeded()
      const headingHit = await heading.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        const hit = document.elementFromPoint(
          bounds.left + bounds.width / 2,
          bounds.top + bounds.height / 2
        )
        return {
          isUnoccluded: hit === element || element.contains(hit),
          hitElement: hit?.tagName.toLowerCase(),
          hitClass: typeof hit?.className === 'string' ? hit.className : ''
        }
      })
      expect(
        headingHit.isUnoccluded,
        `${name} heading center is covered by ${headingHit.hitElement}.${headingHit.hitClass}`
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`product-evidence-${file}-${width}.png`)
      })
    }
    await section.screenshot({
      path: testInfo.outputPath(`homepage-product-evidence-${width}.png`)
    })
  })
}

test('desktop center image opens a layered, selectable preview and locks page scroll', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/')
  const carousel = page.getByRole('region', { name: 'FieldScope image slider' })
  await carousel.scrollIntoViewIfNeeded()
  await carousel
    .getByRole('button', { name: /Open FieldScope image preview/u })
    .click()

  const dialog = page.getByRole('dialog', { name: /FieldScope image preview/u })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[data-testid="preview-slide"]')).toHaveCount(3)
  await expect(dialog.locator('[data-testid="preview-thumbnail"]')).toHaveCount(
    3
  )
  await expect(
    dialog.locator('[data-testid="preview-slide"][data-active="true"]')
  ).toHaveAttribute('data-scale', '1')
  await expect(
    dialog.locator('[data-testid="preview-slide"][data-depth="1"]').first()
  ).toHaveAttribute('data-scale', '0.9')
  await expect(
    dialog.locator('[data-testid="preview-slide"][data-depth="2"]')
  ).toHaveCount(0)
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden')
  expect(
    await dialog.evaluate(
      (element) => getComputedStyle(element, '::backdrop').backdropFilter
    )
  ).toContain('blur')
  const previewSideScales = await dialog
    .locator('[data-testid="preview-slide"][data-depth="1"]')
    .evaluateAll((slides) =>
      slides.map((slide) => Number(slide.getAttribute('data-scale')))
    )
  expect(previewSideScales).toEqual([0.9, 0.9])
  const overlapRatios = await dialog
    .locator('[data-testid="preview-slide"]')
    .evaluateAll((slides) => {
      const center = slides
        .find((slide) => slide.getAttribute('data-active') === 'true')
        ?.getBoundingClientRect()
      if (!center) return []
      return slides
        .filter((slide) => slide.getAttribute('data-depth') === '1')
        .map((slide) => {
          const side = slide.getBoundingClientRect()
          const overlap =
            side.left < center.left
              ? side.right - center.left
              : center.right - side.left
          return overlap / side.width
        })
    })
  expect(overlapRatios).toHaveLength(2)
  expect(overlapRatios.every((ratio) => Math.abs(ratio - 0.75) < 0.02)).toBe(
    true
  )
  expect(
    await dialog
      .locator('[data-testid="preview-slide"] img')
      .evaluateAll((images) =>
        images.every((image) => getComputedStyle(image).boxShadow !== 'none')
      )
  ).toBe(true)
  const previewFrameRatios = await dialog
    .locator('[data-testid="preview-slide"]')
    .evaluateAll((slides) =>
      slides.map((slide) => {
        const frame = slide.getBoundingClientRect()
        const image = slide.querySelector('img')?.getBoundingClientRect()
        return {
          frame: frame.width / frame.height,
          image: image ? image.width / image.height : 0
        }
      })
    )
  expect(
    previewFrameRatios.every(
      ({ frame }) => Math.abs(frame - 1440 / 1174) < 0.01
    )
  ).toBe(true)
  expect(
    previewFrameRatios.every(
      ({ image }) => Math.abs(image - 1440 / 1174) < 0.01
    )
  ).toBe(true)
  await dialog.screenshot({
    path: testInfo.outputPath('product-evidence-preview-1440.png')
  })

  const movingSlide = dialog.getByRole('button', {
    name: /Show FieldScope image: Four-bay end elevation/u
  })
  await movingSlide.evaluate((element) => element.getBoundingClientRect().x)
  await dialog.locator('[data-testid="preview-thumbnail"]').nth(2).click()
  const motionSamples = await movingSlide.evaluate(async (element) => {
    const positions: number[] = []
    for (let frame = 0; frame < 12; frame += 1) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      )
      positions.push(element.getBoundingClientRect().x)
    }
    return {
      positions,
      transition: getComputedStyle(element).transitionProperty
    }
  })
  expect(motionSamples.transition).toContain('transform')
  expect(
    new Set(motionSamples.positions.map((position) => Math.round(position)))
      .size
  ).toBeGreaterThan(2)
  await expect(
    dialog.locator('[data-testid="preview-slide"][data-active="true"] img')
  ).toHaveAttribute(
    'src',
    '/product-evidence/fieldscope-greenhouse-internal-detail.webp'
  )
  await dialog.getByRole('button', { name: /Close preview/u }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden')
})

test('preview animates the selected image for every adjacent and non-adjacent jump', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/')
  const carousel = page.getByRole('region', { name: 'FieldScope image slider' })
  await carousel.scrollIntoViewIfNeeded()
  await carousel
    .getByRole('button', { name: /Open FieldScope image preview/u })
    .click()
  const dialog = page.getByRole('dialog', { name: /FieldScope image preview/u })
  await expect(dialog).toBeVisible()

  // Cover all directed pairs, including first-to-last and last-to-first.
  for (const targetIndex of [2, 0, 1, 0, 2, 1, 2]) {
    const motion = await dialog.evaluate(async (element, index) => {
      const slide = element.querySelector<HTMLElement>(
        `[data-testid="preview-slide"][data-slide-index="${index}"]`
      )
      if (!slide) throw new Error(`Missing preview image ${index}`)
      const thumbnail = element.querySelectorAll<HTMLButtonElement>(
        '[data-testid="preview-thumbnail"]'
      )[index]
      const before = slide.getBoundingClientRect()
      thumbnail.click()
      const samples = []
      for (let frame = 0; frame < 12; frame += 1) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve())
        )
        const box = slide.getBoundingClientRect()
        samples.push({
          x: box.x,
          width: box.width,
          centerY: box.y + box.height / 2
        })
      }
      await Promise.all(
        slide.getAnimations().map((animation) => animation.finished)
      )
      const after = slide.getBoundingClientRect()
      return {
        before: { x: before.x, width: before.width },
        after: { x: after.x, width: after.width },
        samples,
        retained:
          slide ===
          element.querySelector(
            `[data-testid="preview-slide"][data-slide-index="${index}"]`
          )
      }
    }, targetIndex)
    expect(motion.retained).toBe(true)
    expect(motion.after.width).toBeGreaterThan(motion.before.width + 10)
    expect(
      motion.samples.some(
        (sample) =>
          sample.width > motion.before.width + 1 &&
          sample.width < motion.after.width - 1
      ),
      `Selected image ${targetIndex} must have intermediate scale, not jump to the center`
    ).toBe(true)
    expect(
      new Set(motion.samples.map(({ x }) => Math.round(x))).size
    ).toBeGreaterThan(2)
    expect(
      Math.max(...motion.samples.map(({ centerY }) => centerY)) -
        Math.min(...motion.samples.map(({ centerY }) => centerY))
    ).toBeLessThan(1)
    await expect(
      dialog.locator('[data-testid="preview-slide"][data-active="true"]')
    ).toHaveAttribute('data-slide-index', String(targetIndex))
  }
  await dialog.screenshot({
    path: testInfo.outputPath('preview-cross-image-selection.png')
  })

  const interrupted = await dialog.evaluate(async (element) => {
    const thumbnails = element.querySelectorAll<HTMLButtonElement>(
      '[data-testid="preview-thumbnail"]'
    )
    const returningSlide = element.querySelector<HTMLElement>(
      '[data-testid="preview-slide"][data-slide-index="2"]'
    )
    if (!returningSlide) throw new Error('Missing returning preview image')
    thumbnails[0].click()
    for (let frame = 0; frame < 4; frame += 1)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      )
    const before = returningSlide.getBoundingClientRect().width
    thumbnails[2].click()
    const widths = []
    for (let frame = 0; frame < 8; frame += 1) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      )
      widths.push(returningSlide.getBoundingClientRect().width)
    }
    await Promise.all(
      returningSlide.getAnimations().map((animation) => animation.finished)
    )
    return {
      before,
      widths,
      after: returningSlide.getBoundingClientRect().width
    }
  })
  expect(interrupted.before).toBeLessThan(interrupted.after - 1)
  expect(
    interrupted.widths.some(
      (width) => width > interrupted.before + 1 && width < interrupted.after - 1
    )
  ).toBe(true)
  await expect(
    dialog.locator('[data-testid="preview-slide"][data-active="true"]')
  ).toHaveAttribute('data-slide-index', '2')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await dialog.locator('[data-testid="preview-thumbnail"]').nth(0).click()
  const selected = dialog.locator(
    '[data-testid="preview-slide"][data-active="true"]'
  )
  await expect(selected).toHaveAttribute('data-slide-index', '0')
  const reducedMotion = await selected.evaluate((element) => ({
    duration: Number.parseFloat(getComputedStyle(element).transitionDuration),
    animations: element.getAnimations().length
  }))
  expect(reducedMotion.duration).toBeLessThanOrEqual(0.001)
  expect(reducedMotion.animations).toBe(0)
  await dialog.getByRole('button', { name: /Close preview/u }).click()
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden')
})

test('tablet center image keeps the inline slider without opening a preview', async ({
  page
}) => {
  await page.setViewportSize({ width: 1024, height: 960 })
  await page.goto('/')
  const carousel = page.getByRole('region', { name: 'FieldScope image slider' })
  await carousel.scrollIntoViewIfNeeded()
  await expect(carousel.getByRole('button')).toHaveCount(2)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('resizing an open preview to tablet closes it and restores page scrolling', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/')
  const carousel = page.getByRole('region', { name: 'FieldScope image slider' })
  await carousel.scrollIntoViewIfNeeded()
  await carousel
    .getByRole('button', { name: /Open FieldScope image preview/u })
    .click()
  const dialog = page.getByRole('dialog', { name: /FieldScope image preview/u })
  await expect(dialog).toBeVisible()
  await page.setViewportSize({ width: 1024, height: 960 })
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden')
})

test('FieldScope keeps its first view readable without JavaScript', async ({
  browser
}) => {
  const context = await browser.newContext({
    baseURL: process.env.SITE_URL ?? 'http://127.0.0.1:3036',
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 }
  })
  try {
    const page = await context.newPage()
    await page.goto('/')
    const section = page.locator('#built-with-asyra')
    const carousel = section.getByRole('region', {
      name: 'FieldScope image slider'
    })
    await expect(carousel.locator('[data-active="true"] img')).toHaveAttribute(
      'src',
      '/product-evidence/fieldscope-greenhouse-overview.webp'
    )
    await expect(section).toContainText(
      'The same greenhouse model, shown in overview, end elevation, and crop-aisle views.'
    )
    await expect(
      section.getByRole('heading', { name: 'Asyra Sim', level: 3 })
    ).toBeVisible()
  } finally {
    await context.close()
  }
})
