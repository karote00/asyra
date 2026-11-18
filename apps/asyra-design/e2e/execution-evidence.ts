import { expect, type Page } from '@playwright/test'

/** Test-local continuity and phase evidence; never changes product state. */
interface Participant {
  name: string
  readRuntime(): Promise<number>
  read(): Promise<unknown>
  subscribe(listener: (kind: 'navigation' | 'closed') => void): () => void
}
interface SourceIdentity {
  sourceIdentityStatus: 'captured' | 'unavailable'
  sourceRevision?: string
  sourceFingerprint?: string
}

const describeError = (error: unknown) =>
  error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { message: String(error) }

export async function createExecutionEvidence(options: {
  participants: Participant[]
  captureSource(): Promise<SourceIdentity>
  readCheckpoint(): Promise<unknown>
  attach(value: unknown): Promise<void>
}) {
  const sourceBefore = await options.captureSource()
  const violations: { kind: string; participant?: string; detail?: unknown }[] =
    []
  const phases: unknown[] = []
  const navigation: unknown[] = []
  const baselines = new Map<string, number>()
  let permitted: { name: string; remaining: number } | undefined
  const dispose = options.participants.map((participant) =>
    participant.subscribe((kind) => {
      const planned =
        kind === 'navigation' &&
        permitted?.name === participant.name &&
        permitted.remaining === 1

      if (planned && permitted) {
        permitted.remaining--
      } else {
        violations.push({
          kind:
            kind === 'closed' ? 'participant-closed' : 'unexpected-navigation',
          participant: participant.name
        })
      }

      navigation.push({
        participant: participant.name,
        kind,
        planned,
        at: Date.now()
      })
    })
  )

  if (sourceBefore.sourceIdentityStatus !== 'captured') {
    violations.push({ kind: 'source-unavailable' })
  }

  for (const participant of options.participants) {
    try {
      baselines.set(participant.name, await participant.readRuntime())
    } catch (error) {
      violations.push({
        kind: 'runtime-unavailable',
        participant: participant.name,
        detail: describeError(error)
      })
    }
  }

  const environmentError = (cause?: unknown) =>
    new Error('E2E execution environment continuity failed', { cause })

  const assertContinuous = async () => {
    for (const participant of options.participants) {
      try {
        const actual = await participant.readRuntime()

        if (actual !== baselines.get(participant.name)) {
          violations.push({
            kind: 'runtime-replaced',
            participant: participant.name,
            detail: { expected: baselines.get(participant.name), actual }
          })
        }
      } catch (error) {
        violations.push({
          kind: 'runtime-unavailable',
          participant: participant.name,
          detail: describeError(error)
        })
      }
    }

    if (violations.length) {
      throw environmentError()
    }
  }

  const capture = async () => {
    const participants = []

    for (const participant of options.participants) {
      try {
        // Do not use a cached snapshot after a runtime or connection is lost.
        await participant.readRuntime()
        participants.push({
          name: participant.name,
          status: 'captured',
          value: await participant.read()
        })
      } catch (error) {
        violations.push({
          kind: 'snapshot-unavailable',
          participant: participant.name
        })
        participants.push({
          name: participant.name,
          status: 'unavailable',
          error: describeError(error)
        })
      }
    }

    let checkpoint: unknown

    try {
      checkpoint = { status: 'captured', value: await options.readCheckpoint() }
    } catch (error) {
      violations.push({ kind: 'checkpoint-unavailable' })
      checkpoint = { status: 'unavailable', error: describeError(error) }
    }

    return { participants, checkpoint }
  }

  const phase = async <T>(
    name: string,
    action: () => Promise<T>,
    expected?: unknown
  ): Promise<T> => {
    const startedAt = Date.now()
    const before = await capture()
    let original: unknown
    let failed = false
    let result!: T

    try {
      await assertContinuous()
      result = await action()
    } catch (error) {
      original = error
      failed = true
    }

    const after = await capture()

    try {
      await assertContinuous()
    } catch (error) {
      if (!failed) {
        original = error
        failed = true
      }
    }

    phases.push({
      name,
      startedAt,
      endedAt: Date.now(),
      expected,
      before,
      after,
      status: failed ? 'failed' : 'passed',
      ...(failed ? { error: describeError(original) } : {})
    })
    if (violations.length) {
      throw environmentError(original)
    }

    if (failed) {
      throw original
    }

    return result
  }

  return {
    assertContinuous,
    phase,

    reload: async (name: string, action: () => Promise<void>) => {
      if (!baselines.has(name) || permitted) {
        throw new Error('Invalid planned reload participant')
      }

      await phase('planned reload - ' + name, async () => {
        permitted = { name, remaining: 1 }
        try {
          await action()
          if (permitted.remaining !== 0) {
            violations.push({
              kind: 'planned-reload-missing',
              participant: name
            })
          }

          const participant = options.participants.find(
            (entry) => entry.name === name
          )

          if (!participant) {
            throw new Error('Missing planned reload participant')
          }

          const next = await participant.readRuntime()

          if (next === baselines.get(name)) {
            violations.push({
              kind: 'planned-runtime-unchanged',
              participant: name
            })
          }

          baselines.set(name, next)
        } finally {
          permitted = undefined
        }
      })
    },

    finish: async (originalError?: unknown) => {
      let sourceAfter: SourceIdentity = { sourceIdentityStatus: 'unavailable' }

      try {
        try {
          sourceAfter = await options.captureSource()
        } catch (error) {
          violations.push({
            kind: 'source-unavailable',
            detail: describeError(error)
          })
        }

        if (sourceAfter.sourceIdentityStatus !== 'captured') {
          violations.push({ kind: 'source-unavailable' })
        } else if (
          sourceAfter.sourceFingerprint !== sourceBefore.sourceFingerprint ||
          sourceAfter.sourceRevision !== sourceBefore.sourceRevision
        ) {
          violations.push({ kind: 'source-changed' })
        }

        try {
          await assertContinuous()
        } catch {
          /* Violations remain in the attachment. */
        }

        try {
          await options.attach({
            originalError:
              originalError === undefined
                ? undefined
                : describeError(originalError),
            sourceBefore,
            sourceAfter,
            navigation,
            phases,
            violations
          })
        } catch (error) {
          if (originalError !== undefined) {
            throw new AggregateError(
              [originalError, error],
              'E2E failure evidence attachment failed'
            )
          }

          throw error
        }

        if (violations.length) {
          throw environmentError(originalError)
        }
      } finally {
        for (const stop of dispose) {
          stop()
        }
      }
    }
  }
}

/** Observe canonical replay settlement; elapsed time is not completion. */
const readHistoryState = (page: Page) =>
  page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')

    return {
      depth: core.getUndoHistoryDepth(),
      replaying: core.isInUndoRedo()
    }
  })

/** Dispatch real input; held-replay tests own its subsequent settlement. */
export async function dispatchHistoryShortcut(
  page: Page,
  direction: 'undo' | 'redo',
  assertContinuous?: () => Promise<void>
) {
  await assertContinuous?.()
  // A real user activates the target tab before a keyboard interaction.
  // Focus emulation does not guarantee that background painting is scheduled.
  await page.bringToFront()
  // The toolbar padding blurs editable fields without invoking a tool.
  await page.getByTestId('toolbar').click({ position: { x: 5, y: 5 } })
  await assertContinuous?.()
  const before = await readHistoryState(page)

  await page.keyboard.press(
    direction === 'undo' ? 'ControlOrMeta+z' : 'ControlOrMeta+Shift+z'
  )

  return before
}

/** Perform one history shortcut through the real UI and await its result. */
async function replayHistory(
  page: Page,
  direction: 'undo' | 'redo',
  assertContinuous?: () => Promise<void>
) {
  const before = await dispatchHistoryShortcut(
    page,
    direction,
    assertContinuous
  )

  await expect
    .poll(() => readHistoryState(page))
    .toEqual({
      depth:
        direction === 'undo' ? Math.max(0, before.depth - 1) : before.depth + 1,
      replaying: false
    })
  await assertContinuous?.()
}

export async function undo(page: Page, assertContinuous?: () => Promise<void>) {
  await replayHistory(page, 'undo', assertContinuous)
}

export async function redo(page: Page, assertContinuous?: () => Promise<void>) {
  await replayHistory(page, 'redo', assertContinuous)
}

/** Observe a live document through public APIs without changing its history. */
export function observeExecutionPage(page: Page, name: string) {
  return {
    name,

    readRuntime: () => page.evaluate(() => performance.timeOrigin),

    read: async () => {
      if (page.url() === 'about:blank') {
        return {
          runtimeId: await page.evaluate(() => performance.timeOrigin),
          state: 'not-started'
        }
      }

      const snapshot = await page.evaluate(async () => {
        const { core } = await import('../src/testing/runtime-access')
        const data = await core.save()

        return {
          runtimeId: performance.timeOrigin,
          historyDepth: core.getUndoHistoryDepth(),
          document: {
            version: data.version,
            sceneTree: data.sceneTree,
            props: data.props
          }
        }
      })

      return snapshot
    },

    subscribe(listener: (kind: 'navigation' | 'closed') => void) {
      // A full document load replaces the runtime; hash navigation does not.
      const loaded = () => listener('navigation')

      const closed = () => listener('closed')

      page.on('load', loaded)
      page.on('close', closed)

      return () => {
        page.off('load', loaded)
        page.off('close', closed)
      }
    }
  }
}
