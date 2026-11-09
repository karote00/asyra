import { setTimeout as delay } from 'node:timers/promises'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import {
  readFileSync,
  readdirSync,
  openSync,
  closeSync,
  readSync,
  fstatSync,
  existsSync
} from 'node:fs'
import { URL } from 'node:url'

export const createReportWindow = (sentAt, duration) => ({
  workDeadlineAt: sentAt + duration,
  reportTimeoutMs: null,
  keepReportSession: true,
  announceWorkDeadline: false,
  reportInstructions: readFileSync(
    new URL('./taipei-101-self-report.txt', import.meta.url),
    'utf8'
  )
})

/** Match retained native exchanges before extracting only public report text. */
export const collectSameThreadReport = (records, readPayload) => {
  const exchange = (kind, phase) => {
    const matches = records.filter(
      (record) =>
        record.stage === 'host_observation' &&
        record.evidence?.callId === `evaluation-${kind}` &&
        record.evidence?.phase === phase
    )

    if (matches.length !== 1 || !matches[0].evidence.path) {
      throw new Error(`Missing or ambiguous ${kind} ${phase} evidence`)
    }

    return readPayload(matches[0].evidence.path)
  }

  const workInput = exchange('work', 'input')
  const work = exchange('work', 'output')
  const reportInput = exchange('report', 'input')
  const report = exchange('report', 'output')

  if (
    !work.nativeThreadId ||
    [workInput.threadId, reportInput.threadId, report.nativeThreadId].some(
      (id) => id !== work.nativeThreadId
    )
  ) {
    throw new Error('Work and report must use the same native thread')
  }

  if (
    !work.nativeTurnId ||
    !report.nativeTurnId ||
    work.nativeTurnId === report.nativeTurnId
  ) {
    throw new Error('Work and report require distinct native turns')
  }

  const text = records
    .filter(
      (record) =>
        record.stage === 'provider_notification' &&
        record.evidence?.method === 'item/completed' &&
        record.evidence?.phase === 'public-activity' &&
        record.evidence?.kind === 'agentMessage'
    )
    .map((record) => readPayload(record.diagnostic.output.payload.path))
    .filter(
      (payload) =>
        payload.stage === 'native-public-activity' &&
        payload.kind === 'agentMessage' &&
        payload.phase === 'commentary' &&
        payload.nativeThreadId === report.nativeThreadId &&
        payload.nativeTurnId === report.nativeTurnId &&
        typeof payload.text === 'string'
    )
    .map((payload) => payload.text)
    .join('\n\n')

  if (!text.trim()) {
    throw new Error('The original report turn has no completed public report')
  }

  return {
    nativeThreadId: report.nativeThreadId,
    nativeTurnId: report.nativeTurnId,
    work,
    workInput,
    reportInput,
    report,
    text
  }
}

/** Consume each trace byte once; do not rescan growing records every poll. */
export const createWorkPhaseObserver = (
  directory,
  matches = (record) =>
    record.stage === 'host_observation' &&
    record.evidence?.callId === 'evaluation-report' &&
    record.evidence?.phase === 'input'
) => {
  const files = new Map()
  let settled
  let bytesRead = 0

  return {
    get bytesRead() {
      return bytesRead
    },

    poll() {
      if (settled || !existsSync(directory)) {
        return settled
      }

      for (const name of readdirSync(directory).filter((name) =>
        name.endsWith('.jsonl')
      )) {
        const state = files.get(name) ?? {
          offset: 0,
          pending: '',
          decoder: new StringDecoder('utf8')
        }

        files.set(name, state)
        const fd = openSync(path.join(directory, name), 'r')

        try {
          const size = fstatSync(fd).size

          while (state.offset < size) {
            const buffer = Buffer.alloc(Math.min(size - state.offset, 65536))
            const count = readSync(fd, buffer, 0, buffer.length, state.offset)

            if (!count) {
              break
            }

            bytesRead += count
            state.offset += count
            const lines = (
              state.pending + state.decoder.write(buffer.subarray(0, count))
            ).split('\n')

            state.pending = lines.pop()
            for (const line of lines.filter(Boolean)) {
              const record = JSON.parse(line)

              if (!settled && matches(record)) {
                settled = record
              }
            }
          }
        } finally {
          closeSync(fd)
        }
      }

      return settled
    }
  }
}

/** Retain independent evidence even when another collector loses its browser. */
export const collectEvidenceStages = async (stages) => {
  const failures = []

  for (const [stage, collect] of stages) {
    try {
      await collect()
    } catch (error) {
      failures.push({
        stage,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return failures
}

/** Report ownership survives a failed browser collector; no report time budget. */
export const waitForRecordedReport = async (
  directory,
  providerAvailable,
  requestId,
  wait = (milliseconds) => delay(milliseconds)
) => {
  if (typeof requestId !== 'string' || !requestId) {
    throw Error('Report provider request identity is required')
  }

  const observer = createWorkPhaseObserver(
    directory,
    (record) =>
      record.requestId === requestId &&
      ((record.stage === 'host_observation' &&
        record.evidence?.callId === 'evaluation-report' &&
        record.evidence?.phase === 'output') ||
        record.stage === 'settlement')
  )

  for (;;) {
    const record = observer.poll()

    if (record) {
      if (record.stage === 'settlement') {
        throw Error(
          'Provider settled before report completion: ' +
            record.evidence?.outcome
        )
      }

      return record
    }

    if (!providerAvailable()) {
      throw Error('Provider service ended before report completion')
    }

    await wait(1000)
  }
}
