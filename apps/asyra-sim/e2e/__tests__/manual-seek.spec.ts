import { showSetup } from '../workflow'
import { expect, test, type Locator } from '@playwright/test'

async function expectLiveCheck(
  feedback: Locator,
  kind: string,
  time: number,
  timeout: number
) {
  await expect
    .poll(() => feedback.getAttribute('data-pending-time'), { timeout })
    .toBeNull()
  await expect(feedback).toHaveAttribute('data-pose-matches', 'true', {
    timeout
  })
  await expect(feedback).toHaveAttribute('data-kind', kind, { timeout })
  await expect(feedback).toContainText(`Checked ${time.toFixed(4)} s`, {
    timeout
  })
}

for (const kind of ['clearance', 'collision']) {
  test(`cold manual dragging preserves ${kind} feedback and reuses checked targets`, async ({
    page
  }, info) => {
    await page.goto('/')
    await expect(page.getByRole('status')).toHaveText('Local runtime ready')
    await page.getByRole('button', { name: 'Experiments', exact: true }).click()
    await page.getByLabel('Experiment', { exact: true }).selectOption({
      label: 'Tool and table collision - r1'
    })

    // Widen the clearance-only interval through the ordinary authored setting.
    if (kind === 'clearance') {
      await showSetup(page)
      await page.getByLabel('Minimum clearance (mm)').fill('200')
      await page.keyboard.press('Tab')
    }

    await page.getByRole('tab', { name: 'Preview', exact: true }).click()
    const slider = page.getByLabel('Sampled trajectory preview time')
    const feedback = page.getByTestId('playback-feedback')
    const history = await page.getByTestId('history-depth').textContent()
    const interactions: unknown[] = []
    await slider.evaluate((element) => {
      const input = element as HTMLInputElement
      const types = [
        'pointerdown',
        'pointermove',
        'pointerup',
        'input',
        'change'
      ]
      const events: unknown[] = []
      const listener = (event: Event) => {
        if (events.length < 512)
          events.push({
            type: event.type,
            value: input.value,
            timeStamp: event.timeStamp,
            pointerType:
              event instanceof PointerEvent ? event.pointerType : null,
            clientX: 'clientX' in event ? event.clientX : null
          })
      }
      for (const type of types) input.addEventListener(type, listener)
      Object.assign(window, { manualSeekInputEvents: events })
    })

    const targets =
      kind === 'collision'
        ? [3.872, 3.92, 3.968, 4.016, 4.064, 3.92]
        : [3.52, 3.568, 3.616, 3.664, 3.712, 3.568]
    const sampled: number[] = []
    const drag = async (target: number) => {
      const bounds = await slider.boundingBox()
      if (!bounds) throw new Error('Missing manual time slider')
      const rangeMin = Number(await slider.getAttribute('min'))
      const rangeMax = Number(await slider.getAttribute('max'))
      const rangeStep = Number(await slider.getAttribute('step'))
      expect(rangeMax).toBeGreaterThan(rangeMin)
      const thumbWidth = await slider.evaluate(
        (element) =>
          Number.parseFloat(
            getComputedStyle(element, '::-webkit-slider-thumb').width
          ) || 0
      )
      const previous = Number(await slider.inputValue())
      const x = (time: number) =>
        bounds.x +
        bounds.height / 2 +
        ((bounds.width - bounds.height) * (time - rangeMin)) /
          (rangeMax - rangeMin)
      const previousX = x(previous)
      const targetX = x(target)
      const y = bounds.y + bounds.height / 2

      await page.mouse.move(previousX, y)
      await page.mouse.down()
      await page.mouse.move(targetX, y, { steps: 1 })
      await page.mouse.up()

      const actual = Number(await slider.inputValue())
      interactions.push({
        min: rangeMin,
        max: rangeMax,
        step: rangeStep,
        previous,
        target,
        actual,
        previousX,
        targetX,
        bounds,
        thumbWidth
      })
      await info.attach(`manual-seek-input-${sampled.length}`, {
        contentType: 'application/json',
        body: JSON.stringify({
          interaction: interactions.at(-1),
          events: await page.evaluate(() =>
            Reflect.get(window, 'manualSeekInputEvents')
          ),
          feedback: await page.evaluate(() => {
            const notice = document.querySelector(
              '[data-testid="playback-feedback"]'
            )
            return notice
              ? {
                  kind: notice.getAttribute('data-kind'),
                  text: notice.textContent
                }
              : null
          })
        })
      })
      expect(actual, `manual drag did not advance from ${previous}`).not.toBe(
        previous
      )
      await expectLiveCheck(feedback, kind, actual, info.timeout)
      sampled.push(actual)
    }

    await drag(targets[0])
    await page.evaluate(() => {
      const frames: {
        kind: string | null
        complete: string | null
        matches: string | null
        height: number
        pending: string | null
        text: string
      }[] = []
      if (!document.querySelector('[data-testid="playback-feedback"]'))
        throw new Error('Missing playback notice')

      const observer = new MutationObserver((mutations) => {
        const current = document.querySelector<HTMLElement>(
          '[data-testid="playback-feedback"]'
        )
        if (
          !current ||
          !mutations.some(
            ({ target }) =>
              current === target ||
              current.contains(target) ||
              target.contains(current)
          )
        )
          return
        if (frames.length >= 512)
          throw new Error('Manual feedback trace exceeded its bound')

        const notice = document.querySelector(
          '[data-testid="playback-feedback"]'
        )

        if (!notice) return

        frames.push({
          kind: current.getAttribute('data-kind'),
          complete: current.getAttribute('data-complete'),
          matches: current.getAttribute('data-pose-matches'),
          height: current.getBoundingClientRect().height,
          pending: current.getAttribute('data-pending-time'),
          text: current.textContent ?? ''
        })
      })
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true
      })
      Object.assign(window, { manualSeekTrace: { frames, observer } })
    })

    // Oracle negative control: malformed feedback must remain observable and
    // fail the same kind/pose pairing contract used for real drag mutations.
    const negativeControl = await page.evaluate(async (expectedKind) => {
      const notice = document.querySelector<HTMLElement>(
        '[data-testid="playback-feedback"]'
      )
      if (!notice) throw new Error('Missing playback notice')
      const originalKind = notice.getAttribute('data-kind')
      const originalMatches = notice.getAttribute('data-pose-matches')
      notice.setAttribute('data-kind', 'checking')
      notice.setAttribute('data-pose-matches', 'false')
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
      const trace = Reflect.get(window, 'manualSeekTrace') as {
        frames: {
          kind: string | null
          complete: string | null
          matches: string | null
          pending: string | null
          text: string
        }[]
      }
      const observed = trace.frames.some(
        (frame) => frame.kind === 'checking' && frame.matches === 'false'
      )
      const invalid = trace.frames.some(
        (frame) => frame.kind !== expectedKind || frame.matches !== 'true'
      )
      trace.frames.length = 0
      if (originalKind === null) notice.removeAttribute('data-kind')
      else notice.setAttribute('data-kind', originalKind)
      if (originalMatches === null) notice.removeAttribute('data-pose-matches')
      else notice.setAttribute('data-pose-matches', originalMatches)
      return { observed, invalid }
    }, kind)
    expect(negativeControl.observed).toBe(true)
    expect(negativeControl.invalid).toBe(true)

    for (const target of targets.slice(1)) await drag(target)

    await page.screenshot({ path: info.outputPath(`${kind}-cold-seek.png`) })
    const records =
      (await page
        .getByTestId('live-observations')
        .locator('summary')
        .filter({ hasText: 'Playback observations' })
        .textContent()) ?? ''

    // Revisit exact observed values through the control; completed records must not grow.
    for (const time of sampled.slice(0, 3)) {
      await slider.fill(String(time))
      await expectLiveCheck(feedback, kind, time, info.timeout)
    }
    await expect(
      page
        .getByTestId('live-observations')
        .locator('summary')
        .filter({ hasText: 'Playback observations' })
    ).toHaveText(records)

    const frames = await page.evaluate(() => {
      const trace = Reflect.get(window, 'manualSeekTrace') as {
        frames: {
          kind: string | null
          complete: string | null
          matches: string | null
          height: number
          pending: string | null
          text: string
        }[]
        observer: MutationObserver
      }
      trace.observer.disconnect()
      return trace.frames
    })
    expect(frames.length).toBeGreaterThan(0)
    for (const frame of frames) {
      if (frame.matches === 'true' && frame.kind === kind) {
        expect(frame.kind).toBe(kind)
        expect(frame.complete).toBe('true')
        expect(frame.text).toContain('Checked ')
      } else {
        expect([kind, 'checking', 'unresolved']).toContain(frame.kind)
        if (frame.kind === 'unresolved') {
          expect(frame.complete).toBe('false')
          expect(frame.text).toContain('Incomplete coverage')
        }
        if (frame.matches !== 'true')
          expect(frame.text).toContain('Current pose is not yet checked')
      }
      if (frame.pending !== null)
        expect(Number.isFinite(Number(frame.pending))).toBe(true)
    }
    const inputEvents = await page.evaluate(
      () => Reflect.get(window, 'manualSeekInputEvents') as unknown[]
    )
    interactions.push(...inputEvents)

    await info.attach('manual-seek-trace', {
      contentType: 'application/json',
      body: JSON.stringify({
        url: page.url(),
        viewport: page.viewportSize(),
        dpr: 1,
        camera: 'default',
        kind,
        sampled,
        interactions,
        records,
        frames
      })
    })
    expect(frames.length).toBeGreaterThan(0)
    expect(
      frames.some(
        (frame) =>
          frame.kind === kind &&
          frame.matches === 'true' &&
          frame.complete === 'true'
      )
    ).toBe(true)
    expect(new Set(sampled).size).toBeGreaterThan(1)
    const heights = frames.map((frame) => frame.height)
    expect(
      Math.max(...heights) - Math.min(...heights),
      `Feedback card heights: ${heights.join(', ')}`
    ).toBeLessThanOrEqual(24)
    await expect(
      page.getByRole('button', { name: 'Play trajectory', exact: true })
    ).toBeVisible()
    await expect(page.getByTestId('analysis-result')).toHaveCount(0)
    await expect(page.getByTestId('history-depth')).toHaveText(history ?? '')
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    await page.screenshot({
      path: info.outputPath(`${kind}-warm-seek-dark.png`)
    })

    await slider.fill('0')
    await expectLiveCheck(
      feedback,
      kind === 'clearance' ? 'clearance' : 'clear',
      0,
      info.timeout
    )
    await expect(feedback.locator('[data-pair-kind="collision"]')).toHaveCount(
      0
    )
    // A wide authored threshold still warns about other robot parts at rest.
    await expect(
      feedback.locator('[data-pair-id]').filter({ hasText: 'fixture table' })
    ).toHaveCount(0)
  })
}
