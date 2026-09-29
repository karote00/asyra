import { readdir, readFile, readlink } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

export const RESOURCE_EVIDENCE_LIMITS = Object.freeze({
  inspectedPids: 96,
  processRows: 12,
  processName: 32,
  processCwd: 96,
  timelineMarks: 8,
  markName: 48,
  serializedBytes: 8192
})

const defaultIo = Object.freeze({
  readDirectory: readdir,
  readFile,
  readLink: readlink
})

const defaultSystem = Object.freeze({
  arch: os.arch,
  availableParallelism: os.availableParallelism,
  cpus: os.cpus,
  loadavg: os.loadavg,
  platform: os.platform,
  release: os.release
})

const truncate = (value, limit) => String(value ?? '').slice(0, limit)
const finite = (value) =>
  Number.isFinite(Number(value)) ? Number(value) : null

const unavailableCode = (error) => ({
  available: false,
  ...(typeof error?.code === 'string'
    ? { reason: truncate(error.code, 24) }
    : {})
})

async function optionalRead(io, file) {
  try {
    return await io.readFile(file, 'utf8')
  } catch {
    return null
  }
}

function parseProcCpu(value) {
  const line = value?.split('\n').find((entry) => /^cpu\s/u.test(entry))
  const ticks = line?.trim().split(/\s+/u).slice(1).map(Number)
  if (!ticks?.length || ticks.some((tick) => !Number.isFinite(tick)))
    return { available: false }
  return {
    available: true,
    totalTicks: ticks.reduce((total, tick) => total + tick, 0),
    idleTicks: (ticks[3] ?? 0) + (ticks[4] ?? 0),
    stealTicks: ticks[7] ?? 0
  }
}

function parseKeyValues(value) {
  const fields = new Map()
  for (const line of value?.trim().split('\n') ?? []) {
    const [name, raw, ...extra] = line.trim().split(/\s+/u)
    if (name && raw && extra.length === 0) fields.set(name, finite(raw))
  }
  return fields
}

const processCgroupRoot = (cgroupRoot, membership) => {
  const line = membership?.split('\n').find((value) => value.startsWith('0::/'))
  if (!line) return null
  const resolved = path.resolve(cgroupRoot, '.' + line.slice(3))
  const relative = path.relative(cgroupRoot, resolved)
  if (
    relative === '..' ||
    relative.startsWith('../') ||
    path.isAbsolute(relative)
  )
    return null
  return resolved
}

async function captureCgroup(io, cgroupRoot, procRoot) {
  const membership = await optionalRead(io, path.join(procRoot, 'self/cgroup'))
  const groupRoot = processCgroupRoot(cgroupRoot, membership)
  if (!groupRoot) return { available: false }
  const [cpuMax, cpuStat, memoryCurrent, memoryMax] = await Promise.all([
    optionalRead(io, path.join(groupRoot, 'cpu.max')),
    optionalRead(io, path.join(groupRoot, 'cpu.stat')),
    optionalRead(io, path.join(groupRoot, 'memory.current')),
    optionalRead(io, path.join(groupRoot, 'memory.max'))
  ])
  if (
    [cpuMax, cpuStat, memoryCurrent, memoryMax].every((value) => value === null)
  )
    return { available: false }
  const [quota, period] = cpuMax?.trim().split(/\s+/u) ?? []
  const cpu = parseKeyValues(cpuStat)
  return {
    available: true,
    cpuQuotaMicros: quota === 'max' ? 'max' : finite(quota),
    cpuPeriodMicros: finite(period),
    cpuUsageMicros: cpu.get('usage_usec') ?? null,
    cpuPeriods: cpu.get('nr_periods') ?? null,
    cpuThrottledPeriods: cpu.get('nr_throttled') ?? null,
    cpuThrottledMicros: cpu.get('throttled_usec') ?? null,
    memoryCurrentBytes: finite(memoryCurrent?.trim()),
    memoryMaxBytes:
      memoryMax?.trim() === 'max' ? 'max' : finite(memoryMax?.trim())
  }
}

const projectRelativeCwd = (repositoryRoot, cwd) => {
  const relative = path.relative(repositoryRoot, cwd)
  if (relative === '') return '.'
  if (
    relative === '..' ||
    relative.startsWith('../') ||
    path.isAbsolute(relative)
  )
    return null
  return relative
}

const parseProcessStat = (value) => {
  const close = value?.lastIndexOf(')') ?? -1
  if (close < 0) return null
  const fields = value
    .slice(close + 1)
    .trim()
    .split(/\s+/u)
  const ppid = finite(fields[1])
  return fields[0] && ppid !== null ? { state: fields[0], ppid } : null
}

async function captureProjectProcesses({
  repositoryRoot,
  procRoot,
  currentPid,
  io
}) {
  let entries
  try {
    entries = await io.readDirectory(procRoot, { withFileTypes: true })
  } catch (error) {
    return {
      ...unavailableCode(error),
      inspectedPids: 0,
      inspectionTruncated: false,
      matchingProcesses: 0,
      rows: []
    }
  }
  const availablePids = entries
    .filter((entry) => entry.isDirectory() && /^\d+$/u.test(entry.name))
    .map((entry) => Number(entry.name))
    .filter(Number.isSafeInteger)
    .sort((left, right) => right - left)
  const selected = [
    ...(availablePids.includes(currentPid) ? [currentPid] : []),
    ...availablePids.filter((pid) => pid !== currentPid)
  ].slice(0, RESOURCE_EVIDENCE_LIMITS.inspectedPids)
  const rows = []
  let matchingProcesses = 0
  for (const pid of selected) {
    try {
      const cwd = await io.readLink(path.join(procRoot, String(pid), 'cwd'))
      const relative = projectRelativeCwd(repositoryRoot, cwd)
      if (relative === null) continue
      const [stat, name] = await Promise.all([
        optionalRead(io, path.join(procRoot, String(pid), 'stat')),
        optionalRead(io, path.join(procRoot, String(pid), 'comm'))
      ])
      const identity = parseProcessStat(stat)
      if (!identity) continue
      matchingProcesses++
      if (rows.length < RESOURCE_EVIDENCE_LIMITS.processRows)
        rows.push({
          pid,
          ppid: identity.ppid,
          state: truncate(identity.state, 1),
          name: truncate(
            name?.trim() || 'unknown',
            RESOURCE_EVIDENCE_LIMITS.processName
          ),
          cwd: truncate(relative, RESOURCE_EVIDENCE_LIMITS.processCwd)
        })
    } catch {
      /* Process exited or denied inspection between fixed reads. */
    }
  }
  return {
    available: true,
    inspectedPids: selected.length,
    inspectionTruncated: availablePids.length > selected.length,
    matchingProcesses,
    rows
  }
}

const safeSystemValue = (read, fallback) => {
  try {
    return read()
  } catch {
    return fallback
  }
}

export async function collectArtifactResourceSnapshot({
  repositoryRoot,
  procRoot = '/proc',
  cgroupRoot = '/sys/fs/cgroup',
  currentPid = process.pid,
  io = defaultIo,
  system = defaultSystem,
  now = () => new Date().toISOString()
}) {
  const cpuList = safeSystemValue(system.cpus, [])
  const loadAverage = safeSystemValue(system.loadavg, [])
  const [procStat, cgroup, projectProcesses] = await Promise.all([
    optionalRead(io, path.join(procRoot, 'stat')),
    captureCgroup(io, cgroupRoot, procRoot),
    captureProjectProcesses({ repositoryRoot, procRoot, currentPid, io })
  ])
  return {
    capturedAt: now(),
    host: {
      platform: truncate(safeSystemValue(system.platform, 'unknown'), 16),
      arch: truncate(safeSystemValue(system.arch, 'unknown'), 16),
      release: truncate(safeSystemValue(system.release, 'unknown'), 48),
      node: process.version,
      availableParallelism: finite(
        safeSystemValue(system.availableParallelism, null)
      ),
      cpuCount: cpuList.length,
      cpuModel: truncate(cpuList[0]?.model ?? 'unknown', 64),
      loadAverage: [0, 1, 2].map((index) => finite(loadAverage[index]))
    },
    procCpu: parseProcCpu(procStat),
    cgroup,
    projectProcesses
  }
}

const delta = (before, after) =>
  before === null || after === null ? null : Math.max(0, after - before)
const signedDelta = (before, after) =>
  before === null || after === null ? null : after - before

function summarizeChange(before, after) {
  const totalTicks = delta(
    before?.procCpu?.totalTicks ?? null,
    after?.procCpu?.totalTicks ?? null
  )
  const idleTicks = delta(
    before?.procCpu?.idleTicks ?? null,
    after?.procCpu?.idleTicks ?? null
  )
  return {
    procCpu:
      totalTicks === null || idleTicks === null || totalTicks === 0
        ? { available: false }
        : {
            available: true,
            totalTicks,
            idleTicks,
            busyPercent: Number(
              (((totalTicks - idleTicks) / totalTicks) * 100).toFixed(2)
            ),
            stealTicks: delta(
              before.procCpu.stealTicks ?? null,
              after.procCpu.stealTicks ?? null
            )
          },
    cgroup: {
      cpuUsageMicros: delta(
        before?.cgroup?.cpuUsageMicros ?? null,
        after?.cgroup?.cpuUsageMicros ?? null
      ),
      cpuPeriods: delta(
        before?.cgroup?.cpuPeriods ?? null,
        after?.cgroup?.cpuPeriods ?? null
      ),
      cpuThrottledPeriods: delta(
        before?.cgroup?.cpuThrottledPeriods ?? null,
        after?.cgroup?.cpuThrottledPeriods ?? null
      ),
      cpuThrottledMicros: delta(
        before?.cgroup?.cpuThrottledMicros ?? null,
        after?.cgroup?.cpuThrottledMicros ?? null
      ),
      memoryCurrentBytes: signedDelta(
        before?.cgroup?.memoryCurrentBytes ?? null,
        after?.cgroup?.memoryCurrentBytes ?? null
      )
    }
  }
}

async function safeCapture(capture) {
  try {
    return await capture()
  } catch (error) {
    return unavailableCode(error)
  }
}

function boundedEvidence(packet) {
  const bounded = structuredClone(packet)
  let value = 'PRODUCTION_ARTIFACT_RESOURCE ' + JSON.stringify(bounded)
  while (
    Buffer.byteLength(value) > RESOURCE_EVIDENCE_LIMITS.serializedBytes &&
    (bounded.before?.projectProcesses?.rows?.length ||
      bounded.after?.projectProcesses?.rows?.length)
  ) {
    const beforeRows = bounded.before?.projectProcesses?.rows ?? []
    const afterRows = bounded.after?.projectProcesses?.rows ?? []
    ;(beforeRows.length >= afterRows.length ? beforeRows : afterRows).pop()
    value = 'PRODUCTION_ARTIFACT_RESOURCE ' + JSON.stringify(bounded)
  }
  if (Buffer.byteLength(value) <= RESOURCE_EVIDENCE_LIMITS.serializedBytes)
    return value
  return (
    'PRODUCTION_ARTIFACT_RESOURCE ' +
    JSON.stringify({
      format: packet.format,
      status: packet.status,
      evidenceTruncated: true,
      timeline: packet.timeline
    })
  )
}

export async function runWithArtifactResourceEvidence({
  capture,
  operation,
  report = () => undefined,
  clock = {
    iso: () => new Date().toISOString(),
    monotonic: () => performance.now()
  }
}) {
  const readMonotonic = () => {
    try {
      const value = clock.monotonic()
      return Number.isFinite(value) ? value : null
    } catch {
      return null
    }
  }
  const readIso = () => {
    try {
      return truncate(clock.iso(), 32)
    } catch {
      return null
    }
  }
  const started = readMonotonic()
  const timeline = []
  const mark = (name) => {
    try {
      if (timeline.length >= RESOURCE_EVIDENCE_LIMITS.timelineMarks) return
      const current = readMonotonic()
      timeline.push({
        name: truncate(name, RESOURCE_EVIDENCE_LIMITS.markName),
        observedAt: readIso(),
        elapsedMs:
          started === null || current === null
            ? null
            : Number(Math.max(0, current - started).toFixed(3))
      })
    } catch {
      /* Timeline evidence cannot affect the artifact operation. */
    }
  }
  let terminalInactive = false
  const observeTerminalInactive = (name) => {
    terminalInactive = true
    mark(name)
  }
  const before = await safeCapture(capture)
  let result
  let failure
  try {
    result = await operation({ mark, observeTerminalInactive })
  } catch (error) {
    failure = error
  }
  const after = terminalInactive
    ? await safeCapture(capture)
    : { available: false, reason: 'terminal-not-observed-ui' }
  const status = failure ? 'failed' : 'returned'
  let evidence
  try {
    evidence = boundedEvidence({
      format: 1,
      status,
      before,
      after,
      change: summarizeChange(before, after),
      timeline
    })
  } catch {
    evidence =
      'PRODUCTION_ARTIFACT_RESOURCE ' +
      JSON.stringify({
        format: 1,
        status,
        evidenceUnavailable: 'serialization-failed'
      })
  }
  try {
    report(evidence)
  } catch {
    /* Diagnostic reporting cannot affect the artifact operation. */
  }
  if (failure) throw failure
  return result
}
