import {
  Worker,
  isMainThread,
  parentPort,
  workerData
} from 'node:worker_threads'
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import process from 'node:process'
import { URL } from 'node:url'
import { setTimeout, clearTimeout } from 'node:timers'
export const LIVE_TEST_LIMIT_MS = 15 * 60 * 1000

if (!isMainThread && workerData?.owner === 'local-live-deadline') {
  const { deadlineAt, groups, processes, evidencePath } = workerData
  let settled = false
  const expire = () => {
    if (settled) return
    settled = true
    const receipt = {
      status: 'failed',
      reason: 'execution-deadline',
      deadlineAt,
      expiredAt: Date.now(),
      stopped: [],
      errors: []
    }
    // Process-group ownership is checked before arming; include future provider children.
    for (const pid of groups) {
      try {
        process.kill(-pid, 'SIGKILL')
        receipt.stopped.push({ group: pid, at: Date.now() })
      } catch (error) {
        if (error.code !== 'ESRCH') receipt.errors.push(String(error))
      }
    }
    const rows = execFileSync('ps', ['-axo', 'pid=,ppid='], {
      encoding: 'utf8'
    })
      .trim()
      .split('\n')
      .map((line) => line.trim().split(/\s+/).map(Number))
    const owned = new Set(processes)
    for (;;) {
      const before = owned.size
      for (const [pid, parent] of rows) if (owned.has(parent)) owned.add(pid)
      if (owned.size === before) break
    }
    for (const pid of [...owned].reverse()) {
      try {
        process.kill(pid, 'SIGKILL')
        receipt.stopped.push({ pid, at: Date.now() })
      } catch (error) {
        if (error.code !== 'ESRCH') receipt.errors.push(String(error))
      }
    }
    receipt.finishedAt = Date.now()
    writeFileSync(evidencePath, JSON.stringify(receipt, null, 2))
    parentPort.postMessage(receipt)
    parentPort.close()
  }
  const timer = setTimeout(expire, Math.max(0, deadlineAt - Date.now()))
  parentPort.on('message', (message) => {
    if (message.type !== 'finish' || settled) return
    if (message.at >= deadlineAt) {
      expire()
      return
    }
    settled = true
    clearTimeout(timer)
    parentPort.postMessage({ status: 'finished', at: message.at })
    parentPort.close()
  })
  parentPort.postMessage({ status: 'armed' })
}

export const createLiveTestDeadline = ({
  deadlineAt,
  groups = [],
  processes = [],
  evidencePath
}) => {
  if (
    !isMainThread ||
    !Number.isFinite(deadlineAt) ||
    !evidencePath ||
    [...groups, ...processes].some(
      (pid) => !Number.isInteger(pid) || pid < 2 || pid === process.pid
    )
  )
    throw new Error('Invalid owned deadline configuration')
  for (const pid of groups) {
    const group = Number(
      execFileSync('ps', ['-o', 'pgid=', '-p', String(pid)], {
        encoding: 'utf8'
      }).trim()
    )
    if (group !== pid)
      throw new Error('Deadline group must be an owned session leader')
  }
  const worker = new Worker(new URL(import.meta.url), {
    workerData: {
      owner: 'local-live-deadline',
      deadlineAt,
      groups,
      processes,
      evidencePath
    }
  })
  let resolveReady, resolveResult, rejectReady, rejectResult
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })
  const result = new Promise((resolve, reject) => {
    resolveResult = resolve
    rejectResult = reject
  })
  worker.on('message', (message) => {
    if (message.status === 'armed') resolveReady()
    else resolveResult(message)
  })
  worker.on('error', (error) => {
    rejectReady(error)
    rejectResult(error)
  })
  return {
    ready,
    result,
    finish: (at = Date.now()) => {
      worker.postMessage({ type: 'finish', at })
      return result
    }
  }
}
