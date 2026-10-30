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
export const processIdentity = (pid) => {
  try {
    return execFileSync('ps', ['-o', 'lstart=', '-p', String(pid)], {
      encoding: 'utf8',
      timeout: 2000
    }).trim()
  } catch {
    return undefined
  }
}

export const LIVE_TEST_LIMIT_MS = 15 * 60 * 1000

if (!isMainThread && workerData?.owner === 'local-live-deadline') {
  const { deadlineAt, groups, processes, identities, evidencePath } = workerData
  let settled = false
  const expire = (reason = 'execution-deadline') => {
    if (settled) return
    settled = true
    const receipt = {
      status: 'failed',
      reason,
      deadlineAt,
      expiredAt: Date.now(),
      stopped: [],
      errors: []
    }
    // A process group survives its leader. A live replacement leader is never
    // accepted; a leaderless existing group cannot reuse an occupied group ID.
    let rows = []
    try {
      rows = execFileSync('ps', ['-axo', 'pid=,ppid=,pgid='], {
        encoding: 'utf8',
        timeout: 2000
      })
        .trim()
        .split('\n')
        .map((line) => line.trim().split(/\s+/).map(Number))
    } catch (error) {
      receipt.errors.push(String(error))
    }
    const roots = [...groups, ...processes].filter((pid) => {
      const current = processIdentity(pid)
      if (current === identities[pid]) return true
      if (current) receipt.errors.push(`Process identity changed: ${pid}`)
      return (
        !current &&
        groups.includes(pid) &&
        !rows.some(([candidate]) => candidate === pid) &&
        rows.some(([, , group]) => group === pid)
      )
    })
    const owned = new Set(roots)
    // Include surviving group members even after their parent was reaped.
    for (const [pid, , group] of rows) {
      if (groups.includes(group) && roots.includes(group)) owned.add(pid)
    }
    for (;;) {
      const before = owned.size
      for (const [pid, parent] of rows) if (owned.has(parent)) owned.add(pid)
      if (owned.size === before) break
    }
    const tokens = new Map([...owned].map((pid) => [pid, processIdentity(pid)]))
    for (const pid of groups.filter((pid) => roots.includes(pid))) {
      try {
        process.kill(-pid, 'SIGKILL')
        receipt.stopped.push({ group: pid, at: Date.now() })
      } catch (error) {
        if (error.code !== 'ESRCH') receipt.errors.push(String(error))
      }
    }
    for (const pid of [...owned].reverse()) {
      if (!tokens.get(pid) || tokens.get(pid) !== processIdentity(pid)) continue
      try {
        process.kill(pid, 'SIGKILL')
        receipt.stopped.push({ pid, at: Date.now() })
      } catch (error) {
        if (error.code !== 'ESRCH') receipt.errors.push(String(error))
      }
    }
    receipt.finishedAt = Date.now()
    try {
      writeFileSync(evidencePath, JSON.stringify(receipt, null, 2))
    } catch (error) {
      receipt.errors.push(
        `Deadline receipt persistence failed: ${error.message}`
      )
    }
    parentPort.postMessage(receipt)
    parentPort.close()
  }
  const timer = setTimeout(() => expire(), Math.max(0, deadlineAt - Date.now()))
  parentPort.on('message', (message) => {
    if (settled) return
    if (message.type === 'stop') {
      clearTimeout(timer)
      expire(message.reason)
      return
    }
    if (message.type !== 'finish') return
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
  const identities = Object.fromEntries(
    [...groups, ...processes].map((pid) => {
      const identity = processIdentity(pid)
      if (!identity) throw new Error(`Owned process unavailable: ${pid}`)
      return [pid, identity]
    })
  )
  const worker = new Worker(new URL(import.meta.url), {
    workerData: {
      owner: 'local-live-deadline',
      deadlineAt,
      groups,
      processes,
      identities,
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
  // Both promises remain rejectable to callers; observe failures during readiness.
  ready.catch(() => undefined)
  result.catch(() => undefined)
  let received = false
  worker.on('exit', () => {
    if (!received) {
      const error = new Error('Deadline worker exited without a receipt')
      rejectReady(error)
      rejectResult(error)
    }
  })
  worker.on('message', (message) => {
    if (message.status === 'armed') resolveReady()
    else {
      received = true
      resolveResult(message)
    }
  })
  worker.on('error', (error) => {
    rejectReady(error)
    rejectResult(error)
  })
  return {
    ready,
    result,
    stop: (reason = 'collector-failure') => {
      worker.postMessage({ type: 'stop', reason })
      return result
    },
    finish: (at = Date.now()) => {
      worker.postMessage({ type: 'finish', at })
      return result
    }
  }
}
