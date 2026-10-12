import { mkdir, open, writeFile, type FileHandle } from 'node:fs/promises'
import { constants } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { serializeToolPayload } from './payload.js'
import type { ExecutionRecordSink } from '../profiler/records.js'

/** One writer per invocation. Queued I/O never enters the canonical mutation path. */
export const createExecutionRecordSink = (
  directory: string,
  onError: (code: string) => void = (code) =>
    console.warn(JSON.stringify({ event: 'ai_recording_failed', code })),
  resumeRequestId?: string
): ExecutionRecordSink => {
  if (resumeRequestId && !/^[a-zA-Z0-9_-]{1,160}$/.test(resumeRequestId))
    throw new Error('Invalid record identity')
  let pending = Promise.resolve()
  let file: FileHandle | undefined
  let filename: string | null = resumeRequestId
    ? join(directory, `${resumeRequestId}.jsonl`)
    : null
  let identity: string | undefined = resumeRequestId
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
  const ensureFile = async () => {
    if (file || !filename) return
    await mkdir(directory, { recursive: true, mode: 0o700 })
    // Resume never creates a missing prefix. A fresh writer never overwrites evidence.
    file = await open(
      filename,
      resumeRequestId ? constants.O_WRONLY | constants.O_APPEND : 'ax',
      0o600
    )
  }
  let payloadSequence = 0
  const assets = new Map<
    string,
    { path: string; sha256: string; bytes: number }
  >()
  const payloads: {
    callId: string
    phase: string
    bytes: number
    serializationMs: number
    queueMs: number
    writeMs: number
  }[] = []
  return {
    writePayload(requestId, callId, phase, value) {
      if (closed || failed || resumeRequestId || identity !== requestId)
        return { status: 'failed', path: null }
      try {
        const started = performance.now()
        const { serialized, ...metadata } = serializeToolPayload(value)
        const serializationMs = performance.now() - started
        const queuedAt = performance.now()
        const cost = {
          callId,
          phase,
          bytes: metadata.bytes,
          serializationMs,
          queueMs: 0,
          writeMs: 0
        }
        payloads.push(cost)
        const relative = `${requestId}.payloads/${++payloadSequence}-${phase}.json`
        const target = join(directory, relative)
        pending = pending
          .then(async () => {
            if (failed) return
            cost.queueMs = performance.now() - queuedAt
            const writeStarted = performance.now()
            await mkdir(join(directory, `${requestId}.payloads`), {
              recursive: true,
              mode: 0o700
            })
            await writeFile(target, serialized, { flag: 'wx', mode: 0o600 })
            cost.writeMs = performance.now() - writeStarted
          })
          .catch(fail)
        return {
          status: 'queued',
          path: relative,
          ...metadata,
          serializationMs
        }
      } catch (error) {
        fail(error)
        return { status: 'failed', path: null }
      }
    },
    writeAsset(requestId, source, mediaType) {
      if (
        closed ||
        failed ||
        resumeRequestId ||
        identity !== requestId ||
        !['image/png', 'image/jpeg', 'image/webp'].includes(mediaType)
      )
        return { status: 'failed', path: null }
      try {
        const bytes = Buffer.from(source)
        const sha256 = createHash('sha256').update(bytes).digest('hex')
        const existing = assets.get(sha256)
        if (existing) return { status: 'queued', ...existing, reused: true }
        const extension =
          mediaType === 'image/jpeg' ? 'jpg' : mediaType.split('/')[1]
        const relative = `${requestId}.assets/${sha256}.${extension}`
        const asset = { path: relative, sha256, bytes: bytes.length }
        assets.set(sha256, asset)
        pending = pending
          .then(async () => {
            if (failed) return
            await mkdir(join(directory, `${requestId}.assets`), {
              recursive: true,
              mode: 0o700
            })
            await writeFile(join(directory, relative), bytes, {
              flag: 'wx',
              mode: 0o600
            })
          })
          .catch(fail)
        return { status: 'queued', ...asset, reused: false }
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
        pending = pending
          .then(async () => {
            if (failed) return
            await ensureFile()
            await file?.writeFile(line)
          })
          .catch(fail)
      } catch (error) {
        fail(error)
      }
    },
    checkpoint() {
      if (closed)
        return settled ?? Promise.resolve({ status: 'failed', path: filename })
      const result = pending.then(async () => {
        try {
          if (!failed) {
            await ensureFile()
            await file?.sync()
          }
        } catch (error) {
          fail(error)
        }
        let status: 'failed' | 'saved' | 'empty' = filename ? 'saved' : 'empty'
        if (failed) status = 'failed'
        return { status, path: filename }
      })
      pending = result.then(() => undefined)
      return result
    },
    flush() {
      if (settled) return settled
      closed = true
      settled = pending.then(async () => {
        try {
          if (!failed) {
            await ensureFile()
            await file?.sync()
          }
          await file?.close()
          if (identity && !failed && !resumeRequestId)
            await writeFile(
              join(directory, `${identity}.recording.json`),
              JSON.stringify({ payloads, assets: [...assets.values()] }),
              { flag: 'wx', mode: 0o600 }
            )
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
