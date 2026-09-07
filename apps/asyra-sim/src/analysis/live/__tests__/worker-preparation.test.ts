import { expect, it, vi } from 'vitest'
import { INSTALLED_METHOD_CATALOG } from '../../../extensions/installed-methods'
import { originalWorkcellSnapshot } from '../../methods/__tests__/workcell-fixture'
import * as meshIndex from '../../methods/mesh-index'
import { runOriginalPartMethod } from '../../methods/original-part-method'
import { LiveWorkerHost } from '../worker-host'
import { LIVE_LIMITS, LiveMessages, type LiveResponse } from '../protocol'
import { sampleSnapshot } from '../sample'

it('reuses complete original preparation through the installed live Worker and isolates successor Workers', async () => {
  const snapshot = await originalWorkcellSnapshot()
  const messages: LiveResponse[] = []
  // This proves preparation ownership, not a shared CI machine's 500 ms SLA.
  // Profile real elapsed time separately; deadline behavior is tested below.
  const host = new LiveWorkerHost(
    INSTALLED_METHOD_CATALOG,
    (message) => messages.push(message),
    () => 0
  )
  const build = vi.spyOn(meshIndex, 'buildMeshIndex')
  const durations: number[] = []

  try {
    await host.handle({ type: LiveMessages.OPEN, snapshot })
    let firstBuilds = 0
    for (const [i, time] of [3.8, 3.9, 4, 4.1, 4.2].entries()) {
      const start = performance.now()
      await host.handle({ type: LiveMessages.SAMPLE, id: i + 1, time })
      durations.push(performance.now() - start)
      expect(messages.at(-1)?.type).toBe(LiveMessages.RESULT)
      if (!i) firstBuilds = build.mock.calls.length
      expect(build).toHaveBeenCalledTimes(firstBuilds)
    }
    expect(firstBuilds).toBeGreaterThan(0)
    // eslint-disable-next-line no-console -- permanent bounded normal Worker host profile
    console.info(
      JSON.stringify({
        profile: 'live-original-worker-poses',
        indexBuilds: firstBuilds,
        poseMs: durations.map(Math.round)
      })
    )

    const successor = new LiveWorkerHost(
      INSTALLED_METHOD_CATALOG,
      () => undefined,
      () => 0
    )
    await successor.handle({ type: LiveMessages.OPEN, snapshot })
    await successor.handle({ type: LiveMessages.SAMPLE, id: 1, time: 4 })
    expect(build).toHaveBeenCalledTimes(firstBuilds * 2)
  } finally {
    build.mockRestore()
  }

  for (const message of messages) {
    if (message.type === LiveMessages.RESULT)
      expect(message.evidence).toEqual(
        runOriginalPartMethod(sampleSnapshot(snapshot, message.time))
      )
  }
}, 20000)

it('reports installed original-method deadline exhaustion and gives the next sample a fresh budget', async () => {
  const snapshot = await originalWorkcellSnapshot()
  const messages: LiveResponse[] = []
  let ticks = 0
  const now = vi.fn(() => ticks++ * (LIVE_LIMITS.sampleDurationMs + 1))
  const host = new LiveWorkerHost(
    INSTALLED_METHOD_CATALOG,
    (message) => messages.push(message),
    now
  )

  await host.handle({ type: LiveMessages.OPEN, snapshot })
  await host.handle({ type: LiveMessages.SAMPLE, id: 1, time: 4 })

  expect(messages.at(-1)).toEqual({
    type: LiveMessages.ERROR,
    id: 1,
    time: 4,
    pairs: []
  })
  expect(messages.some((message) => message.type === LiveMessages.RESULT)).toBe(
    false
  )

  now.mockReturnValue(ticks * (LIVE_LIMITS.sampleDurationMs + 1))
  await host.handle({ type: LiveMessages.SAMPLE, id: 2, time: 4 })

  expect(messages.at(-1)).toEqual({
    type: LiveMessages.RESULT,
    id: 2,
    time: 4,
    evidence: runOriginalPartMethod(sampleSnapshot(snapshot, 4))
  })
}, 20000)
