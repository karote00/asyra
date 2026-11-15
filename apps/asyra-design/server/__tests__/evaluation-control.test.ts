import { expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { createEvaluationControl } from '../evaluation-control'

it('requires the current work window and latches only an explicit operator stop', async () => {
  const root = join(process.cwd(), 'tmp')

  mkdirSync(root, { recursive: true })
  const directory = mkdtempSync(join(root, 'evaluation-control-test-'))
  const file = join(directory, 'evaluation-control.json')
  const stop = vi.fn()

  writeFileSync(file, JSON.stringify({ workDeadlineAt: 2 }))
  expect(createEvaluationControl(directory, 1, stop)).toBeUndefined()
  const control = createEvaluationControl(directory, 2, stop)

  expect(control).toBeDefined()
  try {
    // Neither diagnostic failures nor a stale work window authorize cancellation.
    for (const command of [
      {
        workDeadlineAt: 2,
        stop: { kind: 'tool-failure', message: 'Read unavailable' }
      },
      {
        workDeadlineAt: 1,
        stop: { kind: 'operator-stop', message: 'Stale command' }
      },
      { workDeadlineAt: 2, stop: { kind: 'operator-stop', message: '' } }
    ]) {
      writeFileSync(file, JSON.stringify(command))
      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(stop).not.toHaveBeenCalled()
    }

    writeFileSync(
      file,
      JSON.stringify({
        workDeadlineAt: 2,
        stop: {
          kind: 'operator-stop',
          message: 'User requested stop',
          callId: 'operator'
        }
      })
    )
    await vi.waitFor(() =>
      expect(stop).toHaveBeenCalledWith({
        kind: 'operator-stop',
        message: 'User requested stop',
        callId: 'operator'
      })
    )
    control?.stop({ kind: 'work-deadline', message: 'Later deadline' })
    expect(stop).toHaveBeenCalledOnce()
  } finally {
    control?.dispose()
    rmSync(directory, { recursive: true, force: true })
  }
})

it('disposes the control without terminating work', () => {
  const root = join(process.cwd(), 'tmp')

  mkdirSync(root, { recursive: true })
  const directory = mkdtempSync(join(root, 'evaluation-control-test-'))
  const stop = vi.fn()

  writeFileSync(
    join(directory, 'evaluation-control.json'),
    JSON.stringify({ workDeadlineAt: 2 })
  )
  const control = createEvaluationControl(directory, 2, stop)

  control?.dispose()
  control?.stop({ kind: 'work-deadline', message: 'Already disposed' })
  expect(stop).not.toHaveBeenCalled()
  rmSync(directory, { recursive: true, force: true })
})
