import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  existsSync,
  rmSync
} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import {
  LIVE_TEST_LIMIT_MS,
  createLiveTestDeadline
} from '../live-test-deadline.mjs'
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../..'
)
const fixture = () => {
  const tmp = path.join(root, 'tmp')
  mkdirSync(tmp, { recursive: true })
  const folder = mkdtempSync(path.join(tmp, 'live-deadline-test-'))
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    detached: true,
    stdio: 'ignore'
  })
  return {
    child,
    folder,
    evidencePath: path.join(folder, 'deadline.json'),
    close() {
      child.kill('SIGKILL')
      rmSync(folder, { recursive: true, force: true })
    }
  }
}
test('live execution cap is exactly fifteen minutes', () =>
  assert.equal(LIVE_TEST_LIMIT_MS, 900000))
test('stops an owned producer while the driver event loop is blocked', async () => {
  const f = fixture()
  try {
    const deadlineAt = Date.now() + 300
    const timer = createLiveTestDeadline({
      deadlineAt,
      groups: [f.child.pid],
      evidencePath: f.evidencePath
    })
    await timer.ready
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 900)
    assert.ok(
      existsSync(f.evidencePath),
      'worker must stop execution before driver becomes responsive'
    )
    const receipt = JSON.parse(readFileSync(f.evidencePath, 'utf8'))
    assert.equal(receipt.status, 'failed')
    assert.equal(receipt.stopped[0].group, f.child.pid)
    assert.ok(receipt.finishedAt < deadlineAt + 500)
    assert.equal((await timer.finish()).status, 'failed')
  } finally {
    f.close()
  }
})
test('finishing before the limit disarms termination and leaves the producer alive', async () => {
  const f = fixture()
  try {
    const timer = createLiveTestDeadline({
      deadlineAt: Date.now() + 1000,
      groups: [f.child.pid],
      evidencePath: f.evidencePath
    })
    await timer.ready
    assert.equal((await timer.finish()).status, 'finished')
    assert.equal(existsSync(f.evidencePath), false)
    assert.doesNotThrow(() => process.kill(f.child.pid, 0))
  } finally {
    f.close()
  }
})
