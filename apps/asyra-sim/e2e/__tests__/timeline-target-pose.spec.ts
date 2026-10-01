import { expect, test } from '@playwright/test'

test('timeline dragging keeps last checked feedback until valid target evidence arrives', async ({
  page
}, info) => {
  test.setTimeout(45_000)

  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  const history = await page.getByTestId('history-depth').textContent()
  const workers: string[] = []
  page.on('worker', (worker) => workers.push(worker.url()))

  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.getByLabel('Experiment', { exact: true }).selectOption({
    label: 'Tool and table collision - r1'
  })
  await page.getByRole('tab', { name: 'Preview', exact: true }).click()

  const time = page.getByLabel('Sampled trajectory preview time')
  const feedback = page.getByTestId('playback-feedback')
  const bounds = await time.boundingBox()

  if (!bounds) throw new Error('Missing Sim Preview timeline control')

  const drag = async (target: number) => {
    const previous = Number(await time.inputValue())
    const x = (value: number) =>
      bounds.x + 8 + ((bounds.width - 16) * value) / 8
    const y = bounds.y + bounds.height / 2

    await page.mouse.move(x(previous), y)
    await page.mouse.down()
    await page.mouse.move(x(target), y)
    await page.mouse.up()

    await expect
      .poll(async () => Number(await time.inputValue()))
      .not.toBe(previous)
    return Number(await time.inputValue())
  }

  const first = await drag(3.888)
  await expect(feedback).toContainText(`Checked ${first.toFixed(4)} s`, {
    timeout: 15_000
  })
  await expect(feedback).toHaveAttribute('data-kind', 'collision')
  await expect(feedback).toHaveAttribute('data-pose-matches', 'true')

  await page.evaluate(() => {
    if (!document.querySelector('[data-testid="playback-feedback"]'))
      throw new Error('Missing playback feedback')

    const frames: {
      kind: string | null
      matches: string | null
      pendingTime: string | null
      height: number
      text: string
    }[] = []
    const capture = () => {
      const notice = document.querySelector('[data-testid="playback-feedback"]')

      if (!notice) return
      frames.push({
        kind: notice.getAttribute('data-kind'),
        matches: notice.getAttribute('data-pose-matches'),
        pendingTime: notice.getAttribute('data-pending-time'),
        height: notice.getBoundingClientRect().height,
        text: notice.textContent ?? ''
      })
    }
    const observer = new MutationObserver(capture)

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true
    })
    Object.assign(window, { targetFeedbackTrace: { frames, observer } })
  })

  const second = await drag(3.92)

  await expect(feedback).toContainText(`Checked ${second.toFixed(4)} s`, {
    timeout: 15_000
  })
  await expect(feedback).toHaveAttribute('data-kind', 'collision')
  await expect(feedback).toHaveAttribute('data-pose-matches', 'true')

  const frames = await page.evaluate(() => {
    const trace = Reflect.get(window, 'targetFeedbackTrace') as {
      frames: {
        kind: string | null
        matches: string | null
        pendingTime: string | null
        height: number
        text: string
      }[]
      observer: MutationObserver
    }

    trace.observer.disconnect()
    return trace.frames
  })
  expect(frames.length).toBeGreaterThan(0)
  expect(frames.every((frame) => frame.kind !== 'checking')).toBe(true)
  expect(
    frames.some(
      (frame) =>
        frame.kind === 'collision' &&
        frame.matches === 'false' &&
        frame.text.includes(`Checked ${first.toFixed(4)} s`)
    )
  ).toBe(true)
  const heights = frames.map((frame) => frame.height)
  expect(
    Math.max(...heights) - Math.min(...heights),
    `Feedback card heights: ${heights.join(', ')}`
  ).toBeLessThanOrEqual(24)
  expect(
    frames.every((frame) => frame.text.includes('Collision - gripper'))
  ).toBe(true)
  expect(frames.at(-1)?.text.includes(`Checked ${second.toFixed(4)} s`)).toBe(
    true
  )

  const observations = page
    .getByTestId('live-observations')
    .locator('summary')
    .filter({ hasText: 'Playback observations' })
  const recorded = await observations.textContent()

  await time.fill(String(first))
  await expect(feedback).toContainText(`Checked ${first.toFixed(4)} s`)
  await expect(feedback).toHaveAttribute('data-pose-matches', 'true')
  await expect(observations).toHaveText(recorded ?? '')
  expect(workers).toHaveLength(1)
  await expect(page.getByTestId('analysis-result')).toHaveCount(0)
  await expect(page.getByTestId('history-depth')).toHaveText(history ?? '')
  await page.screenshot({ path: info.outputPath('target-feedback-reused.png') })

  await info.attach('timeline-target-feedback', {
    contentType: 'application/json',
    body: JSON.stringify({
      component: 'Sim Preview timeline control',
      firstTarget: first,
      secondTarget: second,
      previousEvidenceRetainedUntilTargetCheck: true,
      staleFindingAppliedToTarget: false,
      liveWorkerCount: workers.length,
      reusedRecordCount: recorded,
      formalRunCreated: false,
      historyUnchanged: true,
      screenshots: ['target-checking.png', 'target-feedback-reused.png']
    })
  })
})
