import assert from 'node:assert/strict'
import test from 'node:test'

import {
  RESOURCE_EVIDENCE_LIMITS,
  collectArtifactResourceSnapshot,
  runWithArtifactResourceEvidence
} from '../production-artifact-resource-evidence.mjs'

const root = '/workspace/project'
const system = {
  arch: () => 'arm64',
  availableParallelism: () => 8,
  cpus: () => [{ model: 'Test CPU' }, { model: 'Test CPU' }],
  loadavg: () => [0.25, 0.5, 0.75],
  platform: () => 'darwin',
  release: () => 'test-release'
}

test('resource snapshots safely degrade when proc and cgroup fields are absent', async () => {
  const unavailable = Object.assign(new Error('absent'), { code: 'ENOENT' })
  const io = {
    readDirectory: async () => {
      throw unavailable
    },
    readFile: async () => {
      throw unavailable
    },
    readLink: async () => {
      throw unavailable
    }
  }
  const snapshot = await collectArtifactResourceSnapshot({
    repositoryRoot: root,
    io,
    system,
    now: () => '2026-09-13T00:00:00.000Z'
  })

  assert.equal(snapshot.capturedAt, '2026-09-13T00:00:00.000Z')
  assert.equal(snapshot.host.platform, 'darwin')
  assert.deepEqual(snapshot.procCpu, { available: false })
  assert.deepEqual(snapshot.cgroup, { available: false })
  assert.deepEqual(snapshot.projectProcesses, {
    available: false,
    reason: 'ENOENT',
    inspectedPids: 0,
    inspectionTruncated: false,
    matchingProcesses: 0,
    rows: []
  })
})

test('resource evidence bounds inspected processes, output rows and serialized bytes', async () => {
  const processCount = RESOURCE_EVIDENCE_LIMITS.inspectedPids + 40
  const entries = Array.from({ length: processCount }, (_, index) => ({
    isDirectory: () => true,
    name: String(1000 + index)
  }))
  const io = {
    readDirectory: async () => entries,
    readLink: async () => root + '/a-very-long-project-directory/'.repeat(8),
    readFile: async (file) => {
      if (file === '/proc/stat') return 'cpu  10 1 5 80 2 1 1 3 0 0\n'
      if (file === '/proc/self/cgroup') return '0::/actions-job\n'
      if (file.endsWith('/stat')) return '1000 (node) S 999 0 0 0 0\n'
      if (file.endsWith('/comm')) return 'node-with-a-very-long-process-name\n'
      if (file.endsWith('/cpu.max')) return '200000 100000\n'
      if (file.endsWith('/cpu.stat'))
        return 'usage_usec 5000\nnr_periods 10\nnr_throttled 2\nthrottled_usec 700\n'
      if (file.endsWith('/memory.current')) return '1048576\n'
      if (file.endsWith('/memory.max')) return '2097152\n'
      throw Object.assign(new Error('absent'), { code: 'ENOENT' })
    }
  }
  const snapshot = await collectArtifactResourceSnapshot({
    repositoryRoot: root,
    procRoot: '/proc',
    cgroupRoot: '/sys/fs/cgroup',
    currentPid: 1039,
    io,
    system,
    now: () => '2026-09-13T00:00:00.000Z'
  })

  assert.equal(
    snapshot.projectProcesses.inspectedPids,
    RESOURCE_EVIDENCE_LIMITS.inspectedPids
  )
  assert.deepEqual(snapshot.procCpu, {
    available: true,
    totalTicks: 103,
    idleTicks: 82,
    stealTicks: 3
  })
  assert.deepEqual(snapshot.cgroup, {
    available: true,
    cpuQuotaMicros: 200000,
    cpuPeriodMicros: 100000,
    cpuUsageMicros: 5000,
    cpuPeriods: 10,
    cpuThrottledPeriods: 2,
    cpuThrottledMicros: 700,
    memoryCurrentBytes: 1048576,
    memoryMaxBytes: 2097152
  })
  assert.equal(snapshot.projectProcesses.inspectionTruncated, true)
  assert.equal(
    snapshot.projectProcesses.rows.length,
    RESOURCE_EVIDENCE_LIMITS.processRows
  )
  for (const row of snapshot.projectProcesses.rows) {
    assert.ok(row.name.length <= RESOURCE_EVIDENCE_LIMITS.processName)
    assert.ok(row.cwd.length <= RESOURCE_EVIDENCE_LIMITS.processCwd)
    assert.deepEqual(Object.keys(row), ['pid', 'ppid', 'state', 'name', 'cwd'])
  }
  assert.ok(
    Buffer.byteLength(JSON.stringify(snapshot)) <=
      RESOURCE_EVIDENCE_LIMITS.serializedBytes
  )
})

test('evidence wrapping preserves exact execution result and failure identity', async () => {
  let captures = 0
  let successfulExecutions = 0
  const reports = []
  const events = []
  const exact = { budgetMs: 30000, verdict: 'Issue found' }
  const result = await runWithArtifactResourceEvidence({
    capture: async () => {
      events.push('capture')
      captures++
      return {
        procCpu: {
          totalTicks: 100 + (captures - 1) * 20,
          idleTicks: 60 + (captures - 1) * 10,
          stealTicks: 2 + captures
        },
        cgroup: {
          cpuUsageMicros: 1000 + (captures - 1) * 100,
          cpuPeriods: 5 + captures,
          cpuThrottledPeriods: captures,
          cpuThrottledMicros: 200 + (captures - 1) * 50,
          memoryCurrentBytes: 2000 - (captures - 1) * 100
        }
      }
    },
    operation: async ({ mark, observeTerminalInactive }) => {
      events.push('operation')
      successfulExecutions++
      mark('run-clicked')
      observeTerminalInactive('result-button-visible-ui')
      return exact
    },
    report: (value) => {
      events.push('report')
      reports.push(value)
    },
    clock: {
      iso: () => '2026-09-13T00:00:00.000Z',
      monotonic: (() => {
        let value = 0
        return () => value++
      })()
    }
  })

  assert.strictEqual(result, exact)
  assert.deepEqual(exact, { budgetMs: 30000, verdict: 'Issue found' })
  assert.equal(successfulExecutions, 1)
  assert.equal(captures, 2)
  assert.deepEqual(events, ['capture', 'operation', 'capture', 'report'])
  assert.equal(reports.length, 1)
  assert.match(reports[0], /^PRODUCTION_ARTIFACT_RESOURCE /)
  assert.ok(
    Buffer.byteLength(reports[0]) <= RESOURCE_EVIDENCE_LIMITS.serializedBytes
  )
  const packet = JSON.parse(
    reports[0].slice('PRODUCTION_ARTIFACT_RESOURCE '.length)
  )
  assert.deepEqual(packet.change, {
    procCpu: {
      available: true,
      totalTicks: 20,
      idleTicks: 10,
      busyPercent: 50,
      stealTicks: 1
    },
    cgroup: {
      cpuUsageMicros: 100,
      cpuPeriods: 1,
      cpuThrottledPeriods: 1,
      cpuThrottledMicros: 50,
      memoryCurrentBytes: -100
    }
  })

  const failure = new Error('exact product result failed')
  let failedExecutions = 0
  let failedCaptures = 0
  await assert.rejects(
    runWithArtifactResourceEvidence({
      capture: async () => {
        failedCaptures++
        throw new Error('diagnostic unavailable')
      },
      operation: async () => {
        failedExecutions++
        throw failure
      },
      report: () => {
        throw new Error('diagnostic reporter unavailable')
      }
    }),
    (error) => error === failure
  )
  assert.equal(failedExecutions, 1)
  assert.equal(failedCaptures, 1)
})

test('diagnostic clock and serialization failures preserve the exact operation result', async () => {
  let executions = 0
  const exact = { budgetMs: 30000, verdict: 'Issue found' }
  const reports = []
  const result = await runWithArtifactResourceEvidence({
    capture: async () => ({ unsupported: 1n }),
    operation: async ({ mark, observeTerminalInactive }) => {
      executions++
      mark('clock-failure-is-diagnostic-only')
      observeTerminalInactive('result-button-observed-actionable-ui')
      return exact
    },
    report: (value) => reports.push(value),
    clock: {
      iso: () => {
        throw new Error('clock unavailable')
      },
      monotonic: () => {
        throw new Error('clock unavailable')
      }
    }
  })

  assert.strictEqual(result, exact)
  assert.equal(executions, 1)
  assert.equal(reports.length, 1)
  assert.match(reports[0], /"evidenceUnavailable":"serialization-failed"/)
})

test('post capture requires observed terminal inactivity and diagnostics retain exact failure identity', async () => {
  const beforeTerminalFailure = new Error('failed before terminal UI')
  let captures = 0
  const reports = []
  await assert.rejects(
    runWithArtifactResourceEvidence({
      capture: async () => ({ sequence: ++captures }),
      operation: async () => {
        throw beforeTerminalFailure
      },
      report: (value) => reports.push(value)
    }),
    (error) => error === beforeTerminalFailure
  )
  assert.equal(captures, 1)
  assert.equal(reports.length, 1)
  assert.match(reports[0], /"reason":"terminal-not-observed-ui"/)

  const terminalFailure = new Error('exact terminal result failed')
  captures = 0
  await assert.rejects(
    runWithArtifactResourceEvidence({
      capture: async () => {
        captures++
        const circular = {}
        circular.self = circular
        return circular
      },
      operation: async ({ observeTerminalInactive }) => {
        observeTerminalInactive('result-button-observed-actionable-ui')
        throw terminalFailure
      },
      report: () => undefined
    }),
    (error) => error === terminalFailure
  )
  assert.equal(captures, 2)
})
