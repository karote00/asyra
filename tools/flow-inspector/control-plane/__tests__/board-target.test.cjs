/* global fetch */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { chromium, expect } = require('@playwright/test')
const { startServer } = require('../server.cjs')

test(
  'flow target work decomposition operates on desktop tablet and narrow board with retained audit',
  { timeout: 60000 },
  async () => {
    const { randomUUID } = require('node:crypto')
    const { LOCAL_ACTOR } = require('../service.cjs')
    const root = path.resolve(__dirname, '../../../..')
    const parent = path.join(root, 'tmp/flow-inspector/visual-review')
    fs.mkdirSync(parent, { recursive: true })
    const artifacts = fs.mkdtempSync(path.join(parent, 'targets-')),
      temporary = path.join(artifacts, 'browser-tmp')
    fs.mkdirSync(temporary)
    const previous = process.env.TMPDIR
    process.env.TMPDIR = temporary
    let browser
    let fixturePR = 0
    const server = await startServer(root, {
      serviceOptions: {
        directory: path.join(artifacts, 'runs'),
        agentOptions: { available: () => true },
        deliveryAdapter: {
          repository: 'offline/fixture',
          base: 'main',
          inspect: async () => ({
            baseSha: 'a'.repeat(40),
            baseTree: 'b'.repeat(40)
          }),
          deliver: async (preview, checkpoint) => {
            await checkpoint('create-pr', { expectedHead: 'c'.repeat(40) })
            return {
              number: ++fixturePR,
              url: 'https://github.com/offline/fixture/pull/' + fixturePR,
              state: 'open',
              headSha: 'c'.repeat(40),
              draft: false
            }
          },
          observe: async () => ({
            state: 'merged',
            headSha: 'c'.repeat(40),
            checks: { status: 'passed' },
            stale: false
          })
        }
      }
    })
    try {
      browser = await chromium.launch({
        channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || undefined,
        downloadsPath: temporary
      })
      const page = await browser.newPage({
        viewport: { width: 1600, height: 1100 }
      })
      await page.goto(server.origin + '/transaction-atomicity')
      const frame = page.frameLocator('iframe')
      await frame.locator('[data-step-id="finalize-transaction-state"]').click()
      await frame.locator('#proof-controls > summary').click()
      await frame.locator('#target-controls > summary').click()
      await frame
        .locator('#target-objective')
        .fill('Offline browser acceptance - flow development')
      await frame.locator('#target-create').click()
      await expect(frame.locator('#target-result')).toContainText('Revision 1')
      await frame
        .getByText('Work editor and revision preview', { exact: true })
        .click()
      await frame
        .locator('#target-work-title')
        .fill('Implement journal promise')
      await frame
        .locator('#target-work-step')
        .selectOption('record-reversible-journal')
      await frame.locator('#target-obligations input').first().check()
      await frame
        .locator('#target-work-scope')
        .fill('Exact browser task promise')
      await frame.locator('#target-add-work').click()
      await frame
        .locator('#target-reason')
        .fill('Assign journal and retain remaining obligations')
      await frame.locator('#target-save').click()
      await expect(frame.locator('#target-result')).toContainText('Revision 2')
      await expect(frame.locator('#target-pending')).toContainText(
        'deferred.outcome'
      )
      const id = server.service.targets().records[0].id
      const target = server.service.getTarget(id),
        work = target.works[0]
      const taskId = server.service.startTask(
        {
          requestId: randomUUID(),
          stepId: work.stepId,
          objective: work.scope,
          allowedFiles: work.allowedFiles,
          adapter: 'demonstration',
          scenario:
            process.platform === 'darwin' ? 'repair' : 'scope-violation',
          contractDigest: server.service.contract().digest,
          revision: 1,
          budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 1 }
        },
        LOCAL_ACTOR
      )
      await server.service.waitTask(taskId)
      const prepareReview = async (taskId) => {
        const preview = await server.service.reviewTask(
          taskId,
          { action: 'prepare' },
          LOCAL_ACTOR
        )
        await server.service.reviewTask(
          taskId,
          {
            action: 'confirm',
            previewDigest: preview.previewDigest,
            confirm: true
          },
          LOCAL_ACTOR
        )
      }
      if (process.platform === 'darwin') {
        assert.equal(
          server.service.getTask(taskId).verificationStatus,
          'passed'
        )
        await prepareReview(taskId)
      }
      await frame.locator('#refresh').click()
      await frame.getByText('Connect an admitted task', { exact: true }).click()
      await frame.locator('#target-link-task').selectOption(taskId)
      await frame.locator('#target-link').click()
      await expect(frame.locator('#target-result')).toContainText('Revision 3')
      await expect(frame.locator('#target-observations')).toContainText(taskId)
      await frame
        .locator('#target-work-title')
        .fill('Implement dependent outcome')
      await frame
        .locator('#target-work-step')
        .selectOption('finalize-transaction-state')
      await frame.locator('#target-obligations input').first().check()
      await frame.locator('#target-work-scope').fill('Outcome after journal')
      await frame.locator('#target-prerequisites').selectOption([work.id])
      await frame
        .locator('#target-handoff')
        .fill('Journal behavior verified in this source')
      await frame.locator('#target-add-work').click()
      await frame
        .locator('#target-reason')
        .fill('Record prerequisite explicitly')
      await frame.locator('#target-save').click()
      await expect(frame.locator('#target-result')).toContainText('Revision 4')
      await expect(frame.locator('#target-items')).toContainText('blocked')
      await expect(frame.locator('#target-items')).toContainText('unconfirmed')
      const secondWork = server.service.getTarget(id).works[1]
      const secondTask = server.service.startTask(
        {
          requestId: randomUUID(),
          stepId: secondWork.stepId,
          objective: secondWork.scope,
          allowedFiles: secondWork.allowedFiles,
          adapter: 'demonstration',
          scenario:
            process.platform === 'darwin' ? 'repair' : 'scope-violation',
          contractDigest: server.service.contract().digest,
          revision: 1,
          budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 1 }
        },
        LOCAL_ACTOR
      )
      await server.service.waitTask(secondTask)
      if (process.platform === 'darwin') await prepareReview(secondTask)
      const prepareButton = frame.locator('#target-items button').first()
      await prepareButton.focus()
      await frame.locator('#refresh').evaluate((el) => el.click())
      await expect(
        frame.locator('#target-link-task option[value="' + secondTask + '"]')
      ).toHaveCount(1)
      await expect(prepareButton).toBeFocused()
      await frame.locator('#target-link-work').selectOption(secondWork.id)
      await frame.locator('#target-link-task').selectOption(secondTask)
      await frame.locator('#target-link').click()
      await expect(frame.locator('#target-result')).toContainText('Revision 5')
      await frame
        .getByText('Task, attempt and PR observations', { exact: true })
        .click()
      await expect(frame.locator('#target-observations')).toContainText(
        secondTask
      )
      if (process.platform === 'darwin') {
        await expect(frame.locator('#target-observations')).toContainText(
          'https://github.com/offline/fixture/pull/1'
        )
        await expect(frame.locator('#target-observations')).toContainText(
          'https://github.com/offline/fixture/pull/2'
        )
      }
      for (const [name, width, height] of [
        ['desktop', 1600, 1100],
        ['tablet', 820, 1180],
        ['narrow', 390, 844]
      ]) {
        await page.setViewportSize({ width, height })
        if (width <= 900 && (await page.locator('.sidebar').isVisible()))
          await page
            .getByRole('button', { name: 'Close Inspector catalog' })
            .click()
        await frame.locator('#target-controls').scrollIntoViewIfNeeded()
        assert.ok(
          await frame
            .locator('#detail')
            .evaluate((el) => el.scrollWidth - el.clientWidth <= 1)
        )
        await frame
          .locator('#target-items')
          .screenshot({ path: path.join(artifacts, name + '-work.png') })
        const observations = frame.locator('#target-observations > article')
        for (let index = 0; index < (await observations.count()); index++) {
          const observation = observations.nth(index)
          await observation.scrollIntoViewIfNeeded()
          const top = await observation.evaluate(
            (el) => el.getBoundingClientRect().top
          )
          await frame.locator('#detail').evaluate((el, delta) => {
            el.scrollTop += delta
          }, top - 64)
          await expect(observation).toBeInViewport({ ratio: 1 })
          await page.screenshot({
            path: path.join(artifacts, name + '-observation-' + index + '.png')
          })
        }
        await frame.locator('#target-result').scrollIntoViewIfNeeded()
        await page.screenshot({ path: path.join(artifacts, name + '.png') })
        await expect(frame.locator('.step-card')).toHaveCount(7)
        await expect(frame.locator('[data-route-id]')).toHaveCount(10)
      }
      const viewport = frame.locator('.flow-viewport')
      const position = await viewport.evaluate((el) => [
        el.scrollLeft,
        el.scrollTop,
        el.dataset.zoomScale
      ])
      await frame.getByRole('button', { name: 'Close step details' }).click()
      await expect(viewport).toBeVisible()
      assert.deepEqual(
        await viewport.evaluate((el) => [
          el.scrollLeft,
          el.scrollTop,
          el.dataset.zoomScale
        ]),
        position
      )
      await page.reload()
      await frame.locator('[data-step-id="finalize-transaction-state"]').click()
      await frame.locator('#proof-controls > summary').click()
      await frame.locator('#target-controls > summary').click()
      await frame.locator('#target-select').selectOption(id)
      await expect(frame.locator('#target-result')).toContainText('Revision 5')
      const current = server.service.getTarget(id)
      const allocation = structuredClone(current.history.at(-1).state)
      allocation.works.forEach((w) => {
        delete w.taskIds
      })
      server.service.decideTarget(
        {
          action: 'revise',
          targetId: id,
          requestId: randomUUID(),
          expectedRevision: 5,
          reason: 'Second client explicit decision',
          ...allocation
        },
        LOCAL_ACTOR
      )
      const refreshed = page.waitForResponse(
        (response) =>
          response.url().endsWith('/api/targets/' + id) &&
          response.request().method() === 'GET' &&
          response.ok()
      )
      await frame.locator('#refresh').click()
      await refreshed
      // Observe the fetched record; refreshing must not replace the local draft.
      await expect(frame.locator('#target-audit')).toContainText(
        'Second client explicit decision'
      )
      await expect(frame.locator('#target-result')).toContainText('Revision 6')
      await frame
        .locator('#target-reason')
        .fill('Do not overwrite from stale editor')
      const rejectedSave = page.waitForRequest(
        (request) =>
          request.url().endsWith('/api/targets/decide') &&
          request.method() === 'POST'
      )
      await frame.locator('#target-save').click()
      assert.equal((await rejectedSave).postDataJSON().expectedRevision, 5)
      await expect(frame.locator('#target-notice')).toContainText('stale')
      const api = await fetch(server.origin + '/api/targets/' + id).then((r) =>
        r.json()
      )
      assert.deepEqual(
        api,
        JSON.parse(JSON.stringify(server.service.getTarget(id)))
      )
      assert.equal(api.history.length, 6)
      assert.equal(api.status, 'pending')
      fs.writeFileSync(
        path.join(artifacts, 'review.json'),
        JSON.stringify(
          {
            origin: server.origin,
            fidelity:
              'deterministic offline browser fixture; no model or GitHub requests',
            target: api
          },
          null,
          2
        )
      )
    } finally {
      await browser?.close()
      await server.close()
      if (previous === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = previous
    }
  }
)
