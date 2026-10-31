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

test('early collector failure force-stops its producer and preserves a failure receipt', async () => {
  const f = fixture()
  const sibling = fixture()
  const timer = createLiveTestDeadline({
    deadlineAt: Date.now() + 1500,
    groups: [f.child.pid],
    evidencePath: f.evidencePath
  })
  try {
    await timer.ready
    const receipt = await timer.stop('collector-navigation')
    assert.equal(receipt.reason, 'collector-navigation')
    assert.equal(receipt.status, 'failed')
    assert.equal(
      JSON.parse(readFileSync(f.evidencePath)).reason,
      'collector-navigation'
    )
    assert.doesNotThrow(() => process.kill(sibling.child.pid, 0))
    assert.equal((await timer.finish()).status, 'failed')
  } finally {
    await timer.finish()
    f.close()
    sibling.close()
  }
})

test(
  'early stop includes detached descendants and preserves an unrelated sibling',
  { timeout: 10000 },
  async () => {
    const f = fixture(),
      sibling = fixture()
    const launcher = spawn(
      process.execPath,
      [
        '-e',
        `
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
    process.send(child.pid);
    setInterval(() => {}, 1000);
  `
      ],
      { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] }
    )
    let descendant
    let timer
    try {
      descendant = await new Promise((resolve, reject) => {
        launcher.once('message', resolve)
        launcher.once('error', reject)
      })
      timer = createLiveTestDeadline({
        deadlineAt: Date.now() + 3000,
        groups: [launcher.pid],
        evidencePath: f.evidencePath
      })
      await timer.ready
      const receipt = await timer.stop('capture-failed')
      assert.ok(receipt.stopped.some((entry) => entry.pid === descendant))
      assert.ok(receipt.stopped.some((entry) => entry.group === launcher.pid))
      assert.deepEqual(receipt.errors, [])
      assert.doesNotThrow(() => process.kill(sibling.child.pid, 0))
    } finally {
      if (timer) {
        await timer.stop()
      }
      launcher.kill('SIGKILL')
      if (descendant) {
        try {
          process.kill(descendant, 'SIGKILL')
        } catch (error) {
          assert.equal(error.code, 'ESRCH')
        }
      }
      f.close()
      sibling.close()
    }
  }
)

test('receipt write failure still stops the producer and is reported to the caller', async () => {
  const f = fixture()
  try {
    const timer = createLiveTestDeadline({
      deadlineAt: Date.now() + 1500,
      groups: [f.child.pid],
      evidencePath: path.join(f.folder, 'missing/deadline.json')
    })
    await timer.ready
    const receipt = await timer.stop()
    assert.ok(receipt.stopped.some((entry) => entry.group === f.child.pid))
    assert.ok(
      receipt.errors.some((message) =>
        message.includes('receipt persistence failed')
      )
    )
  } finally {
    f.close()
  }
})

test(
  'stops surviving owned group members after the producer leader exits',
  { timeout: 10000 },
  async () => {
    const f = fixture()
    const launcher = spawn(
      process.execPath,
      [
        '-e',
        `
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    process.send(child.pid);
    process.on('message', () => process.exit(0));
  `
      ],
      { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] }
    )
    let child, timer
    try {
      child = await new Promise((resolve, reject) => {
        launcher.once('message', resolve)
        launcher.once('error', reject)
      })
      timer = createLiveTestDeadline({
        deadlineAt: Date.now() + 3000,
        groups: [launcher.pid],
        evidencePath: f.evidencePath
      })
      await timer.ready
      const exited = new Promise((resolve) => launcher.once('exit', resolve))
      launcher.send('exit')
      await exited
      const receipt = await timer.stop('producer-exited')
      assert.ok(
        receipt.stopped.some((entry) => entry.group === launcher.pid),
        'surviving provider group must still stop'
      )
    } finally {
      if (timer) {
        await timer.stop()
      }
      launcher.kill('SIGKILL')
      if (child) {
        try {
          process.kill(child, 'SIGKILL')
        } catch (error) {
          assert.equal(error.code, 'ESRCH')
        }
      }
      f.close()
    }
  }
)
