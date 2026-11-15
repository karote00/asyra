import { readFileSync, statSync, watchFile, unwatchFile } from 'node:fs'
import { join } from 'node:path'
export interface EvaluationStopReason {
  kind: 'operator-stop' | 'work-deadline'
  message: string
  callId?: string
  tool?: string
}

const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

/** Evaluation-only, recorder-owned control; a different work window cannot stop this request. */
export const createEvaluationControl = (
  directory: string | undefined,
  workDeadlineAt: number,
  stop: (reason: EvaluationStopReason) => void
) => {
  if (!directory) {
    return undefined
  }

  const file = join(directory, 'evaluation-control.json')

  const read = () => {
    try {
      if (statSync(file).size > 8192) {
        return undefined
      }

      const value: unknown = JSON.parse(readFileSync(file, 'utf8'))

      return record(value) && value.workDeadlineAt === workDeadlineAt
        ? value
        : undefined
    } catch {
      return undefined
    }
  }

  if (!read()) {
    return undefined
  }

  let latched = false

  const finish = (reason: EvaluationStopReason) => {
    if (latched) {
      return
    }

    latched = true
    unwatchFile(file, changed)
    stop(reason)
  }

  const changed = () => {
    const reason = read()?.stop

    if (
      !record(reason) ||
      reason.kind !== 'operator-stop' ||
      typeof reason.message !== 'string' ||
      !reason.message.trim() ||
      reason.message.length > 2000
    ) {
      return
    }

    finish({
      kind: reason.kind as EvaluationStopReason['kind'],
      message: reason.message,
      ...(typeof reason.callId === 'string'
        ? { callId: reason.callId.slice(0, 256) }
        : {})
    })
  }

  watchFile(file, { interval: 100, persistent: false }, changed)

  return {
    stop: finish,

    dispose: () => {
      latched = true
      unwatchFile(file, changed)
    }
  }
}
