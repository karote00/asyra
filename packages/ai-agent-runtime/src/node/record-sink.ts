import { mkdir, open, writeFile, type FileHandle } from 'node:fs/promises'
import { join } from 'node:path'
import { serializeToolPayload } from './payload.js'
import type { ExecutionRecordSink } from '../profiler/records.js'

/** One writer per invocation. Queued I/O never enters the canonical mutation path. */
export const createExecutionRecordSink = (
  directory: string,
  onError: (code: string) => void = (code) =>
    console.warn(JSON.stringify({ event: 'ai_recording_failed', code }))
): ExecutionRecordSink => {
  let pending = Promise.resolve()
  let file: FileHandle | undefined
  let filename: string | null = null
  let identity: string | undefined
  let failed = false
  let closed = false
  let settled: ReturnType<ExecutionRecordSink['flush']> | undefined
  const fail = (error: unknown) => {
    if (failed) return
    failed = true
    const code = (error as { code?: unknown })?.code
    try {
      onError(
        typeof code === 'string' && /^[A-Z_]+$/.test(code)
          ? code
          : 'RECORD_WRITE_FAILED'
      )
    } catch {
      // Diagnostic error observers are also non-authoritative.
    }
  }
  let payloadSequence = 0
  return {
    writePayload(requestId, _callId, phase, value) {
      if (closed || failed || identity !== requestId)
        return { status: 'failed', path: null }
      try {
        const { serialized, ...metadata } = serializeToolPayload(value)
        const relative = `${requestId}.payloads/${++payloadSequence}-${phase}.json`
        const target = join(directory, relative)
        pending = pending
          .then(async () => {
            if (failed) return
            await mkdir(join(directory, `${requestId}.payloads`), {
              recursive: true,
              mode: 0o700
            })
            await writeFile(target, serialized, { flag: 'wx', mode: 0o600 })
          })
          .catch(fail)
        return { status: 'queued', path: relative, ...metadata }
      } catch (error) {
        fail(error)
        return { status: 'failed', path: null }
      }
    },
    write(record) {
      if (closed || failed) return
      try {
        if (!/^[a-zA-Z0-9_-]{1,160}$/.test(record.requestId))
          throw new Error('Invalid record identity')
        if (identity && identity !== record.requestId)
          throw new Error('Mixed record identity')
        identity = record.requestId
        filename = join(directory, `${identity}.jsonl`)
        const line = JSON.stringify(record) + '\n'
        const target = filename
        pending = pending
          .then(async () => {
            if (failed) return
            if (!file) {
              await mkdir(directory, { recursive: true, mode: 0o700 })
              // A collision is an error; existing evidence is never overwritten.
              file = await open(target, 'ax', 0o600)
            }
            await file.writeFile(line)
          })
          .catch(fail)
      } catch (error) {
        fail(error)
      }
    },
    flush() {
      if (settled) return settled
      closed = true
      settled = pending.then(async () => {
        try {
          await file?.close()
        } catch (error) {
          fail(error)
        }
        let status: 'saved' | 'failed' | 'empty' = 'empty'
        if (filename) status = 'saved'
        if (failed) status = 'failed'
        return { status, path: filename }
      })
      return settled
    }
  }
}
