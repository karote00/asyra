import { it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const nativeModule = new URL(
  '../../test-data/knowledge-evaluation/native-delivery.mjs',
  import.meta.url
).href

it('characterizes actual native progressing and silent unfinished output with separate later execution', async () => {
  const { loadFixtures, runNativeDelivery } = await import(
    /* @vite-ignore */ nativeModule
  )
  const fixture = { ...(await loadFixtures())[0], raw: '{"ok":true}' }
  for (const outputProbe of ['progressive', 'silent']) {
    const result = await runNativeDelivery({
      fixture,
      outputProbe
    })
    expect(result.requests).toBe(2)
    expect(result.comparison.exact).toBe(true)
    expect(result.nativeReplyExact).toBe(true)
    expect(result.cleanup.errors).toEqual([])
    expect(result.outputProbe).toEqual({
      mode: outputProbe,
      emittedArgumentBytes: outputProbe === 'progressive' ? 64000 : 0,
      completed: false,
      publicItems: expect.any(Array)
    })
    expect(
      result.outputProbe.publicItems.every(
        (item: { kind: string }) => item.kind === 'userMessage'
      )
    ).toBe(true)
    // The fixture has known differing byte schedules. Neither is exposed as an
    // unfinished item by the native public stream. Later invocation is real.
    const records = (await readFile(result.receipt.path, 'utf8'))
      .trim()
      .split('\n')
      .map(JSON.parse)
    const before = records.findIndex(
      (r: { stage: string }) => r.stage === 'unfinished-output-probe'
    )
    const invoked = records.findIndex(
      (r: { stage: string }) => r.stage === 'native-call'
    )
    expect(before).toBeGreaterThan(-1)
    expect(invoked).toBeGreaterThan(before)
    const ref = records[before].receipt
    const witness = JSON.parse(
      await readFile(join(result.directory, ref.path), 'utf8')
    )
    expect(witness).toEqual(result.outputProbe)
  }
}, 100000)

it('preserves a disconnected unfinished native output without inventing invocation', async () => {
  const { loadFixtures, runNativeDelivery } = await import(
    /* @vite-ignore */ nativeModule
  )
  let error: Error | undefined
  try {
    await runNativeDelivery({
      fixture: { ...(await loadFixtures())[0], raw: '{"ok":true}' },
      outputProbe: 'interrupted'
    })
  } catch (value) {
    error = value as Error
  }
  expect(error?.message).toMatch(/Native turn failed/)
  const directory = error?.message.split('; evidence: ')[1]
  expect(directory).toBeTruthy()
  if (!directory) throw new Error('Missing native failure evidence')
  const result = JSON.parse(
    await readFile(join(directory, 'result.json'), 'utf8')
  )
  const records = (await readFile(result.receipt.path, 'utf8'))
    .trim()
    .split('\n')
    .map(JSON.parse)
  expect(
    records.some(
      (r: { stage: string }) => r.stage === 'unfinished-output-probe'
    )
  ).toBe(true)
  expect(
    records.some((r: { stage: string }) => r.stage === 'native-call')
  ).toBe(false)
  expect(result.outcome).toBeUndefined()
  expect(result.cleanup.errors).toEqual([])
}, 55000)
