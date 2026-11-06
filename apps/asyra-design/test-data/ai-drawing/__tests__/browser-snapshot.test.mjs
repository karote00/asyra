import { Buffer } from 'node:buffer'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readBrowserSnapshot } from '../browser-snapshot.mjs'

test('captures once and transfers complete evidence through bounded messages', async () => {
  const source = {
    document: {
      rows: Array.from({ length: 60000 }, (_, index) => ({
        id: index,
        text: 'window reflection'
      }))
    },
    report: 'Complete report'
  }
  let captures = 0,
    serializations = 0,
    disposed = 0
  const sizes = []

  const handle = (value) => {
    const preview =
      typeof value === 'object' ? 'JSHandle@object' : String(value)

    assert.ok(
      Buffer.byteLength(preview) <= 2 * 1024 * 1024,
      'Oversized handle initializer preview'
    )

    return {
      evaluate: async (fn, args) => {
        const result = fn(value, args)
        const bytes = Buffer.byteLength(JSON.stringify(result))

        assert.ok(
          bytes <= 2 * 1024 * 1024,
          `Oversized protocol message: ${bytes}`
        )
        sizes.push(bytes)

        return result
      },

      evaluateHandle: async (fn) => {
        serializations++

        return handle(fn(value))
      },

      dispose: async () => {
        disposed++
      }
    }
  }

  const page = {
    evaluate: async (fn) => handle(await fn()).evaluate((value) => value),

    evaluateHandle: async (fn) => handle(await fn())
  }
  const metrics = []
  const result = await readBrowserSnapshot(
    page,
    () => {
      captures++

      return source
    },
    (value) => metrics.push(value)
  )

  assert.deepEqual(result, source)
  assert.equal(captures, 1)
  assert.equal(serializations, 1)
  assert.equal(disposed, 2)
  assert.ok(sizes.length > 2)
  assert.equal(metrics.length, 1)
  assert.equal(metrics[0].characters, JSON.stringify(source).length)
})

test('releases browser handles if a chunk transfer fails without repeating capture', async () => {
  let captures = 0,
    disposed = 0
  const page = {
    evaluateHandle: async (fn) => {
      await fn()

      return {
        dispose: async () => {
          disposed++
        },

        evaluateHandle: async () => ({
          dispose: async () => {
            disposed++
          },

          evaluate: async (fn, args) => {
            const result = fn({ text: 'payload' }, args)

            if (typeof result === 'number') {
              return result
            }

            throw new Error('Transfer disconnected')
          }
        })
      }
    }
  }

  await assert.rejects(
    readBrowserSnapshot(page, () => {
      captures++

      return { data: 'evidence' }
    }),
    /Transfer disconnected/
  )
  assert.equal(captures, 1)
  assert.equal(disposed, 2)
})
