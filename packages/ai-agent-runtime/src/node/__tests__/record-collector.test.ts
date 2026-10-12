import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { expect, it } from 'vitest'
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
