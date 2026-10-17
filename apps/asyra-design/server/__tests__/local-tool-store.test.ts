import { afterEach, expect, it, vi } from 'vitest'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { spawnSync } from 'node:child_process'
import {
  createLocalToolStore,
  createLocalToolStoreSession
} from '../local-tool-store'

const directories: string[] = []
const stores: Awaited<ReturnType<typeof createLocalToolStore>>[] = []
const limits = { capacity: 4, recordBytes: 1024, totalBytes: 4096 }
const create = async (directory?: string, overrides = {}) => {
  if (!directory) {
    const parent = resolve('tmp/tool-store-tests')
    await mkdir(parent, { recursive: true })
    directory = await mkdtemp(resolve(parent, 'case-'))
    directories.push(directory)
  }
  const store = await createLocalToolStore({
    directory,
    ...limits,
    ...overrides
  })
  stores.push(store)
  return { store, directory }
}
afterEach(async () => {
  stores.splice(0).forEach((store) => store.close())
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

it('acknowledges exact durable bytes and reloads through a fresh host connection', async () => {
  const { store, directory } = await create()
  const record = { name: 'reusable-operation', fields: ['fresh-input'] }
  const entry = await store.write({ key: '["operation",1]', record })
  record.fields.push('not-persisted')
  expect(entry.record).toEqual({
    name: 'reusable-operation',
    fields: ['fresh-input']
  })
  store.close()
  store.close()
  const reopened = (await create(directory)).store
  expect(await reopened.read(entry.key)).toEqual(entry)
  expect(await reopened.list(1)).toEqual([entry])
  expect(await reopened.read('missing')).toBeUndefined()
  await expect(store.read(entry.key)).rejects.toThrow('closed')
})

it('compares versions atomically across independent connections', async () => {
  const { store, directory } = await create()
  const other = (await create(directory)).store
  const first = await store.write({ key: 'same', record: { count: 1 } })
  await expect(
    other.write({ key: 'same', record: { count: 2 } })
  ).rejects.toThrow('version')
  const results = await Promise.allSettled([
    store.write({
      key: 'same',
      expectedVersion: first.version,
      record: { count: 2 }
    }),
    other.write({
      key: 'same',
      expectedVersion: first.version,
      record: { count: 3 }
    })
  ])
  expect(
    results.filter((result) => result.status === 'fulfilled')
  ).toHaveLength(1)
  expect(results.filter((result) => result.status === 'rejected')).toHaveLength(
    1
  )
  expect((await other.read('same'))?.record).toEqual({ count: 2 })
  await expect(
    store.write({
      key: 'missing',
      expectedVersion: first.version,
      record: null
    })
  ).rejects.toThrow('version')
})

it('returns lock contention without overwriting and allows a save-only retry', async () => {
  const { store, directory } = await create()
  const blocker = new DatabaseSync(resolve(directory, 'library.sqlite'))
  try {
    blocker.exec('BEGIN IMMEDIATE')
    await expect(
      store.write({ key: 'new', record: { value: 1 } })
    ).rejects.toThrow(/locked|busy/iu)
    blocker.exec('ROLLBACK')
    const saved = await store.write({ key: 'new', record: { value: 1 } })
    expect(await store.read('new')).toEqual(saved)
  } finally {
    blocker.close()
  }
})

it('recovers an interrupted transaction without losing the last acknowledged record', async () => {
  const { store, directory } = await create()
  const entry = await store.write({ key: 'keep', record: { value: 'durable' } })
  store.close()
  const crash = spawnSync(
    process.execPath,
    [
      '-e',
      `
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(process.argv[1]);
    db.exec('BEGIN IMMEDIATE');
    db.prepare('DELETE FROM tool_library WHERE key = ?').run('keep');
    process.exit(0);
  `,
      resolve(directory, 'library.sqlite')
    ],
    { encoding: 'utf8', timeout: 10000 }
  )
  expect(crash.status, crash.stderr).toBe(0)
  expect(await (await create(directory)).store.read('keep')).toEqual(entry)
})

it('bounds record count and bytes without losing an existing entry', async () => {
  const { store } = await create(undefined, {
    capacity: 1,
    recordBytes: 64,
    totalBytes: 64
  })
  const first = await store.write({ key: 'keep', record: 'ok' })
  await expect(store.write({ key: 'extra', record: 'ok' })).rejects.toThrow(
    'capacity'
  )
  await expect(
    store.write({
      key: 'keep',
      expectedVersion: first.version,
      record: 'x'.repeat(100)
    })
  ).rejects.toThrow(/byte/u)
  expect(await store.read('keep')).toEqual(first)
  expect(
    (
      await store.write({
        key: 'keep',
        expectedVersion: first.version,
        record: 'changed'
      })
    ).version
  ).not.toBe(first.version)
})

it('checks total bytes and validates inventory limits', async () => {
  const { store } = await create(undefined, { recordBytes: 64, totalBytes: 64 })
  await store.write({ key: 'first', record: 'a'.repeat(40) })
  await expect(
    store.write({ key: 'second', record: 'b'.repeat(40) })
  ).rejects.toThrow(/byte/u)
  expect(await store.list(1)).toHaveLength(1)
  await expect(store.list(0)).rejects.toThrow('limit')
  await expect(store.list(Infinity)).rejects.toThrow('limit')
})

it('refuses unknown storage versions without resetting the database', async () => {
  const { store, directory } = await create()
  const entry = await store.write({ key: 'keep', record: 1 })
  store.close()
  const db = new DatabaseSync(resolve(directory, 'library.sqlite'))
  db.exec('PRAGMA user_version=99')
  db.close()
  await expect(create(directory)).rejects.toThrow('version')
  const inspect = new DatabaseSync(resolve(directory, 'library.sqlite'))
  expect(
    inspect.prepare('SELECT version FROM tool_library WHERE key=?').get('keep')
      ?.version
  ).toBe(entry.version)
  inspect.close()
})

it('does not reset unreadable bytes or silently skip a malformed inventory row', async () => {
  const { store, directory } = await create()
  store.close()
  const db = new DatabaseSync(resolve(directory, 'library.sqlite'))
  db.prepare(
    'INSERT INTO tool_library (key,version,record,bytes) VALUES (?,?,?,?)'
  ).run('broken', '', '{}', 2)
  db.close()
  const reopened = (await create(directory)).store
  await expect(reopened.list(5)).rejects.toThrow('record')
  reopened.close()
  await writeFile(resolve(directory, 'library.sqlite'), 'not a database')
  await expect(create(directory)).rejects.toThrow()
})

it('uses bound keys and rejects non-JSON values before saving', async () => {
  const { store } = await create()
  const key = "../' OR 1=1; --"
  const saved = await store.write({ key, record: { literal: 'value' } })
  expect(await store.read(key)).toEqual(saved)
  await expect(
    store.write({ key: 'bad', record: { value: undefined } as never })
  ).rejects.toThrow('JSON')
  await expect(store.write({ key: 'bad', record: NaN })).rejects.toThrow('JSON')
  await expect(store.write({ key: '', record: null })).rejects.toThrow('key')
})

it('retries a failed lazy connection without resetting persistent entries', async () => {
  const { store } = await create()
  await store.write({ key: 'preserved', record: { version: 1 } })
  const connect = vi
    .fn(async () => store)
    .mockRejectedValueOnce(new Error('Unavailable'))
  const session = createLocalToolStoreSession(connect)
  await expect(session.list(2)).rejects.toThrow('Unavailable')
  expect((await session.read('preserved'))?.record).toEqual({ version: 1 })
  await Promise.all([session.list(2), session.read('preserved')])
  expect(connect).toHaveBeenCalledTimes(2)
  await session.close()
  await expect(session.read('preserved')).rejects.toThrow('closed')
})

it('closes a pending lazy connection without reopening after shutdown', async () => {
  const { store } = await create()
  let resolveConnection!: (value: typeof store) => void
  const connect = vi.fn(
    () =>
      new Promise<typeof store>((resolve) => {
        resolveConnection = resolve
      })
  )
  const session = createLocalToolStoreSession(connect)
  const read = session.read('missing')
  const close = session.close()
  await Promise.resolve()
  resolveConnection(store)
  await Promise.all([read, close])
  await expect(session.list(2)).rejects.toThrow('closed')
  expect(connect).toHaveBeenCalledOnce()
})
