import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import {
  createRecordCollector,
  recordDigestWindowSize
} from '../record-collector.js'
import { createFileRecordCollector } from '../file-record-collector.js'

const record = (sequence: number, event = 'ai_request_trace') => ({
  event,
  sequence,
  schemaVersion: 2,
  requestId: 'persisted-request'
})

it('resumes persisted evidence after collector restart without duplicating the prefix', async () => {
  const root = resolve('tmp')
  await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'record-restart-'))
  let collector = createFileRecordCollector({ directory })
  try {
    const prefix = [record(0, 'ai_request_started'), record(1)]
    expect(await collector.accept(prefix)).toMatchObject({
      complete: false,
      acknowledgedSequence: 1
    })
    await collector.dispose()
    collector = createFileRecordCollector({ directory })
    expect(await collector.accept(prefix)).toMatchObject({
      complete: false,
      acknowledgedSequence: 1
    })
    expect(
      await collector.accept([record(2, 'ai_request_usage')])
    ).toMatchObject({ complete: true, acknowledgedSequence: 2 })
    await collector.dispose()
    collector = createFileRecordCollector({ directory })
    expect(
      await collector.accept([record(2, 'ai_request_usage')])
    ).toMatchObject({ complete: true })
    const lines = (
      await readFile(join(directory, 'persisted-request.jsonl'), 'utf8')
    )
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
    expect(lines).toEqual([...prefix, record(2, 'ai_request_usage')])
    await expect(
      collector.accept([{ ...record(1), changed: true }])
    ).rejects.toThrow('retry')
  } finally {
    await collector.dispose()
    await rm(directory, { recursive: true, force: true })
  }
})

it('rejects an unterminated persisted record instead of appending corrupt JSON', async () => {
  const root = resolve('tmp')
  await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'record-truncated-'))
  const path = join(directory, 'persisted-request.jsonl')
  const prefix = JSON.stringify(record(0, 'ai_request_started'))
  await writeFile(path, prefix)
  const collector = createFileRecordCollector({ directory })
  try {
    await expect(collector.accept([record(1)])).rejects.toThrow('Unterminated')
    expect(await readFile(path, 'utf8')).toBe(prefix)
  } finally {
    await collector.dispose()
    await rm(directory, { recursive: true, force: true })
  }
})

it('streams long durable recordings and verifies old retries without a total-record ceiling', async () => {
  const root = resolve('tmp')
  await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'record-long-'))
  const path = join(directory, 'persisted-request.jsonl')
  const count = 50_010
  await writeFile(
    path,
    Array.from({ length: count }, (_, sequence) =>
      JSON.stringify(
        record(sequence, sequence ? 'ai_request_trace' : 'ai_request_started')
      )
    ).join('\n') + '\n'
  )
  let collector = createFileRecordCollector({ directory })
  try {
    expect(
      await collector.accept([record(0, 'ai_request_started'), record(1)])
    ).toMatchObject({ acknowledgedSequence: 1, complete: false })
    expect(await collector.accept([record(2), record(3)])).toMatchObject({
      acknowledgedSequence: 3
    })
    await expect(
      collector.accept([{ ...record(1), changed: true }, record(count)])
    ).rejects.toThrow('retry')
    expect(
      await collector.accept([record(count, 'ai_request_usage')])
    ).toMatchObject({ complete: true })
    await collector.dispose()
    collector = createFileRecordCollector({ directory })
    expect(await collector.accept([record(2), record(3)])).toMatchObject({
      complete: true
    })
    expect((await readFile(path, 'utf8')).trim().split('\n')).toHaveLength(
      count + 1
    )
  } finally {
    await collector.dispose()
    await rm(directory, { recursive: true, force: true })
  }
})

it('uses durable evidence only outside its bounded recent digest window', async () => {
  const persisted = new Map<number, unknown>()
  const readPersistedHashes = vi.fn(
    async (_id: string, from: number, count: number) =>
      Array.from({ length: count }, (_, index) =>
        createHash('sha256')
          .update(JSON.stringify(persisted.get(from + index)))
          .digest('hex')
      )
  )
  const collector = createRecordCollector({
    readPersistedHashes,
    createSink: () => ({
      write: (item) => {
        persisted.set(item.sequence, item)
      },
      checkpoint: async () => ({ status: 'saved', path: null }),
      flush: async () => ({ status: 'saved', path: null })
    })
  })
  try {
    for (let sequence = 0; sequence <= recordDigestWindowSize; sequence++)
      await collector.accept([
        record(sequence, sequence ? 'ai_request_trace' : 'ai_request_started')
      ])
    await collector.accept([record(recordDigestWindowSize)])
    expect(readPersistedHashes).not.toHaveBeenCalled()
    await collector.accept([record(0, 'ai_request_started')])
    expect(readPersistedHashes).toHaveBeenCalledExactlyOnceWith(
      'persisted-request',
      0,
      1
    )
    await expect(
      collector.accept([{ ...record(0, 'ai_request_started'), modified: true }])
    ).rejects.toThrow('retry')
    expect(persisted.size).toBe(recordDigestWindowSize + 1)
  } finally {
    await collector.dispose()
  }
})
