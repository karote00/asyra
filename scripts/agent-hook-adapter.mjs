import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
  unlinkSync
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(scriptPath), '..')
const maximumInputBytes = 2 * 1024 * 1024

export function operationSucceeded(response) {
  if (!response || typeof response !== 'object') return false
  if (response.isError === true || response.success === false) return false
  return response.success === true || response.exit_code === 0
}

function inputIdentity(event) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        cwd: event.cwd,
        tool: event.tool_name,
        input: event.tool_input
      })
    )
    .digest('hex')
}

function receiptPath(event) {
  if (typeof event.tool_use_id !== 'string' || !event.tool_use_id)
    throw new Error('Missing native tool-use identity')
  const parent = path.join(repoRoot, 'tmp/agent-coordination')
  if (realpathSync(parent) !== parent)
    throw new Error('Coordination state directory must not be a symlink')
  const directory = path.join(parent, 'receipts')
  mkdirSync(directory, { recursive: true })
  if (realpathSync(directory) !== directory)
    throw new Error('Receipt directory must not be a symlink')
  return path.join(
    directory,
    `${createHash('sha256').update(event.tool_use_id).digest('hex')}.json`
  )
}

function invokeGuard(mode, request) {
  let output
  try {
    output = execFileSync(
      process.execPath,
      [path.join(repoRoot, 'scripts/agent-coordination/guard.cjs'), mode],
      {
        cwd: repoRoot,
        input: JSON.stringify({ ...request, repoRoot }),
        encoding: 'utf8',
        timeout: 2500,
        maxBuffer: maximumInputBytes,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    )
  } catch (error) {
    if (!error.stdout) throw error
    output = error.stdout.toString()
  }
  const result = JSON.parse(output)
  if (
    result.version !== 1 ||
    !['allow', 'deny', 'stop', 'continue'].includes(result.decision)
  )
    throw new Error('Invalid coordination guard response')
  return result
}

function canonicalDirectory(value) {
  if (typeof value !== 'string' || !path.isAbsolute(value)) return
  try {
    return realpathSync(value)
  } catch {
    // Selection does not grant authority. The core checks filesystem existence.
    return path.normalize(value)
  }
}

function patchText(event) {
  if (!['apply_patch', 'Edit', 'Write'].includes(event.tool_name)) return
  const input = event.tool_input
  return typeof input === 'string' ? input : input?.command
}

function absolutePatch(event) {
  const text = patchText(event)
  if (typeof text !== 'string' || !path.isAbsolute(event.cwd ?? '')) return
  const paths = []
  const command = text.replace(
    /^(\*\*\* (?:(?:Add|Update|Delete) File|Move to): )(.+)$/gm,
    (_line, prefix, file) => {
      if (file.split('/').includes('..'))
        throw new Error('Patch path traversal is not admitted')
      const target = path.resolve(event.cwd, file)
      paths.push(target)
      return prefix + target
    }
  )
  return { paths, command }
}

export function normalizeCoreEvent(event, registry) {
  const taskId = selectTask(event, registry)
  const patch = absolutePatch(event)
  let cwd = event.tool_input?.workdir ?? event.tool_input?.cwd ?? event.cwd
  if (patch && taskId) cwd = registry.tasks[taskId].worktree
  return {
    ...event,
    taskId,
    cwd,
    eventName: event.hook_event_name,
    agentId: event.agent_id,
    toolName: event.tool_name,
    toolInput: patch ? patch.command : event.tool_input
  }
}

export function selectTask(event, registry) {
  const entries = Object.entries(registry.tasks ?? {}).filter(
    ([, task]) => task.state !== 'retired'
  )
  let matches
  if (event.hook_event_name === 'SubagentStop') {
    if (!event.agent_id) return
    matches = entries.filter(([, task]) => task.agentId === event.agent_id)
  } else if (patchText(event) !== undefined) {
    const patch = absolutePatch(event)
    if (!patch?.paths.length) return
    const owners = patch.paths.map((target) => {
      const candidates = entries
        .filter(([, task]) => {
          const root = canonicalDirectory(task.worktree)
          if (!root) return false
          const relative = path.relative(root, target)
          return (
            relative !== '' &&
            !relative.startsWith('../') &&
            !path.isAbsolute(relative) &&
            !relative.startsWith('.worktrees/') &&
            !relative.startsWith('.git/')
          )
        })
        .sort((a, b) => b[1].worktree.length - a[1].worktree.length)
      if (!candidates.length) return
      if (candidates[1]?.[1].worktree === candidates[0][1].worktree) return
      return candidates[0][0]
    })
    if (owners[0] && owners.every((owner) => owner === owners[0]))
      return owners[0]
    return
  } else {
    const directory = canonicalDirectory(
      event.tool_input?.workdir ?? event.tool_input?.cwd ?? event.cwd
    )
    if (!directory) return
    matches = entries.filter(
      ([, task]) => canonicalDirectory(task.worktree) === directory
    )
  }
  if (matches.length === 1) return matches[0][0]
}

export function adaptHook(event, result) {
  const reason = [result.code, result.reason].filter(Boolean).join(': ')
  if (event.hook_event_name === 'PreToolUse') {
    if (result.decision === 'allow') return {}
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          reason || 'Coordination guard could not admit this operation.'
      }
    }
  }
  if (['Stop', 'SubagentStop'].includes(event.hook_event_name)) {
    if (
      result.decision === 'continue' &&
      !event.stop_hook_active &&
      !event.userStop
    ) {
      return { decision: 'block', reason }
    }
    if (result.decision === 'continue') {
      return {
        systemMessage: `Coordination handoff still needs attention; automatic continuation is exhausted. ${reason}`
      }
    }
    if (result.decision === 'deny') return { systemMessage: reason }
    return {}
  }
  if (result.decision === 'deny') return { systemMessage: reason }
  return {}
}

export function evaluateNativeHook(event) {
  const registry = JSON.parse(
    readFileSync(
      path.join(repoRoot, 'tmp/agent-coordination/state.json'),
      'utf8'
    )
  )
  const request = normalizeCoreEvent(event, registry)
  const { taskId } = request
  let mode = 'check'
  if (event.hook_event_name === 'PreToolUse') mode = 'pre-tool'
  if (['Stop', 'SubagentStop'].includes(event.hook_event_name)) {
    // A shared parent session/cwd is not an agent identity. Never continue a
    // different task because a subagent could not be matched.
    if (!taskId)
      return {
        systemMessage:
          'Coordination guard: no unique task binding; completion has not been certified.'
      }
    mode = 'stop'
  }
  if (mode === 'check' && !taskId) return {}
  if (mode === 'check') {
    if (!operationSucceeded(event.tool_response))
      return {
        systemMessage:
          'Coordination guard: write outcome is not explicitly successful; file expectations were not refreshed.'
      }
    const receipt = JSON.parse(readFileSync(receiptPath(event), 'utf8'))
    if (
      receipt.taskId !== taskId ||
      receipt.inputIdentity !== inputIdentity(event)
    )
      throw new Error('Post-tool preflight receipt mismatch')
    Object.assign(request, {
      operationSucceeded: true,
      preflight: receipt.preflight
    })
  }
  const result = invokeGuard(mode, request)
  if (
    mode === 'pre-tool' &&
    result.decision === 'allow' &&
    result.details?.approvedPaths?.length
  ) {
    writeFileSync(
      receiptPath(event),
      JSON.stringify({
        taskId,
        inputIdentity: inputIdentity(event),
        preflight: result.details
      }),
      { flag: 'wx' }
    )
  }
  if (
    mode === 'check' &&
    result.decision === 'allow' &&
    result.details?.digestUpdates?.length
  ) {
    const task = structuredClone(registry.tasks[taskId])
    for (const update of result.details.digestUpdates)
      task.expectedFileDigests[update.path] = update.digest
    const updated = invokeGuard('register', {
      expectedRevision: result.details.registryRevision,
      task: { ...task, id: taskId }
    })
    if (updated.decision !== 'allow') return adaptHook(event, updated)
    unlinkSync(receiptPath(event))
  }
  return adaptHook(event, result)
}

async function main() {
  let event = { hook_event_name: 'PreToolUse' }
  try {
    let input = ''
    for await (const chunk of process.stdin) {
      input += chunk
      if (Buffer.byteLength(input) > maximumInputBytes)
        throw new Error('Hook input exceeds 2 MiB')
    }
    event = JSON.parse(input)
    process.stdout.write(`${JSON.stringify(evaluateNativeHook(event))}\n`)
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify(
        adaptHook(event, {
          decision: 'deny',
          code: 'guard_unavailable',
          reason: error.message
        })
      )}\n`
    )
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath)
  await main()
