import assert from 'node:assert/strict'
import test from 'node:test'
import { withConsumer } from './packed-consumer.mjs'
import * as advanced from './parity/advanced.mjs'
import * as services from './parity/services.mjs'
import * as geometry from './parity/geometry.mjs'
import * as ui from './parity/interactions.mjs'
import * as inspector from './parity/inspector-input.mjs'
import * as vectorInput from './parity/vector-input.mjs'
import * as documentCases from './parity/document.mjs'

async function prepare(page) {
  await page.reload()
  await page.evaluate(() => globalThis.ready)
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        globalThis.requestAnimationFrame(() =>
          globalThis.requestAnimationFrame(resolve)
        )
      )
  )
  await page.evaluate(() => {
    const editor = globalThis.editor
    const checked = new Set()
    const api = Object.fromEntries(
      Object.entries(editor.common).map(([group, methods]) => [
        group,
        Object.fromEntries(
          Object.entries(methods).map(([name, method]) => [
            name,
            (...args) => {
              checked.add(group + '.' + name)

              return method(...args)
            }
          ])
        )
      ])
    )

    const canonical = (value) =>
      JSON.stringify(value, (_key, v) =>
        v && typeof v === 'object' && !Array.isArray(v)
          ? Object.fromEntries(
              Object.entries(v).sort(([a], [b]) => a.localeCompare(b))
            )
          : v
      )

    function equal(actual, expected) {
      if (canonical(actual) !== canonical(expected)) {
        throw new Error(
          'Expected ' +
            canonical(expected) +
            ' but received ' +
            canonical(actual)
        )
      }
    }

    function ok(value, label) {
      if (!value) {
        throw new Error('Expected ' + label)
      }
    }

    globalThis.parity = {
      editor,
      api,
      equal,
      ok,
      checked,

      tx: (callback) => api.transaction.runTransaction(callback)
    }
  })
}

test('packed Design feature parity', async (context) => {
  await withConsumer(
    ['sdk/canvas', 'sdk/design'],
    'workspace.js',
    async (page) => {
      page.setDefaultTimeout(4000)
      const attempted = new Set()

      for (const [name, scenario] of Object.entries({
        ...geometry,
        ...documentCases,
        ...services,
        ...advanced
      })) {
        await context.test(name, async () => {
          await prepare(page)
          try {
            await page.evaluate(scenario)
          } finally {
            for (const id of await page.evaluate(() => [
              ...globalThis.parity.checked
            ])) {
              attempted.add(id)
            }
          }
        })
      }

      for (const [name, scenario] of Object.entries({
        ...ui,
        ...inspector,
        ...vectorInput
      })) {
        await context.test(name, async () => {
          await prepare(page)
          await scenario(page)
        })
      }

      const all = await page.evaluate(() =>
        Object.entries(globalThis.editor.common).flatMap(([group, methods]) =>
          Object.keys(methods).map((name) => group + '.' + name)
        )
      )
      const excluded = new Set([
        'history.createAiHistoryProjection',
        ...[
          'getAiDrawingProgress',
          'setAiDrawingProgress',
          'clearAiDrawingProgress',
          'isAiDrawingProgressState',
          'isAiDrawingProgressStateOrNull'
        ].map((name) => 'systemContext.' + name)
      ])
      const inScope = all.filter((id) => !excluded.has(id))
      const missing = inScope.filter((id) => !attempted.has(id))

      context.diagnostic(
        inScope.length -
          missing.length +
          ' / ' +
          inScope.length +
          ' public non-AI common methods invoked'
      )
      await context.test(
        'every public non-AI common method has an external caller',
        () => assert.deepEqual(missing, [])
      )
    }
  )
})
