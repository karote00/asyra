import assert from 'node:assert/strict'
import test from 'node:test'
import {
  readFileSync,
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  rmSync
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import path from 'node:path'
import { URL } from 'node:url'
import {
  adaptHook,
  normalizeCoreEvent,
  operationSucceeded,
  selectTask
} from '../agent-hook-adapter.mjs'

test('native envelope reaches real core admission and exact post-write receipt checks', (t) => {
  const require = createRequire(import.meta.url)
  const core = require('../agent-coordination/guard-core.cjs')
  const temporaryRoot = path.resolve('tmp')
  mkdirSync(temporaryRoot, { recursive: true })
  const root = mkdtempSync(path.join(temporaryRoot, 'native-hook-contract-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim()
  git('init', '-q', '-b', 'codex/adapter-proof')
  git('config', 'user.name', 'Hook Test')
  git('config', 'user.email', 'hook@example.test')
  writeFileSync(path.join(root, 'value.txt'), 'before\n')
  git('add', 'value.txt')
  git('commit', '-qm', 'baseline')
  const hash = (text) => createHash('sha256').update(text).digest('hex')
  const task = {
    id: 'adapter-proof',
    agentId: null,
    coordinator: false,
    kind: 'goal',
    integrationTargetTaskId: null,
    worktree: root,
    branch: 'codex/adapter-proof',
    baselineHead: git('rev-parse', 'HEAD'),
    allowedPathPrefixes: [],
    allowedExactFiles: ['value.txt'],
    protectedContractPaths: [],
    allowedContractEdits: [],
    expectedFileDigests: { 'value.txt': hash('before\n') },
    approvedCommands: [],
    semanticOwners: ['adapter/proof'],
    dependsOn: [],
    state: 'active',
    requiredGates: ['proof'],
    evidence: null,
    review: null,
    continuations: 0
  }
  const registryPath = path.join(root, 'tmp/agent-coordination/state.json')
  assert.equal(
    core.registerTask({ registryPath, expectedRevision: 0, task }).decision,
    'allow'
  )
  const registered = core.loadRegistry(registryPath)
  const event = {
    hook_event_name: 'PreToolUse',
    cwd: path.dirname(root),
    tool_name: 'apply_patch',
    tool_input: {
      command: `*** Begin Patch\n*** Update File: ${root}/value.txt\n@@\n-before\n+after\n*** End Patch`
    }
  }
  const request = normalizeCoreEvent(event, registered)
  const admission = core.evaluatePreTool({ registryPath, event: request })
  assert.equal(admission.decision, 'allow', admission.reason)
  writeFileSync(path.join(root, 'value.txt'), 'after\n')
  const checked = core.checkTask({
    registryPath,
    event: {
      ...request,
      operationSucceeded: true,
      preflight: admission.details
    }
  })
  assert.equal(checked.decision, 'allow', checked.reason)
  assert.deepEqual(checked.details.digestUpdates, [
    { path: 'value.txt', digest: hash('after\n') }
  ])
  const blocked = core.evaluatePreTool({
    registryPath,
    event: normalizeCoreEvent(
      {
        hook_event_name: 'PreToolUse',
        cwd: root,
        tool_name: 'Bash',
        tool_input: { command: 'git reset --hard' }
      },
      registered
    )
  })
  assert.equal(
    adaptHook({ hook_event_name: 'PreToolUse' }, blocked).hookSpecificOutput
      .permissionDecision,
    'deny'
  )
})

test('shared-cwd native patches route by one actual worktree and normalize the documented envelope', () => {
  const event = {
    hook_event_name: 'PreToolUse',
    tool_name: 'apply_patch',
    cwd: '/repo',
    tool_input: {
      command:
        '*** Begin Patch\n*** Update File: .worktrees/a/src/file.ts\n@@\n-old\n+new\n*** End Patch'
    }
  }
  const request = normalizeCoreEvent(event, registry)
  assert.equal(request.taskId, 'a')
  assert.equal(request.cwd, '/repo/.worktrees/a')
  assert.equal(request.toolName, 'apply_patch')
  assert.match(
    request.toolInput,
    /Update File: \/repo\/\.worktrees\/a\/src\/file.ts/
  )
  const mixed = {
    ...event,
    tool_input: {
      command: event.tool_input.command.replace(
        '*** End Patch',
        '*** Delete File: .worktrees/b/file.ts\n*** End Patch'
      )
    }
  }
  assert.equal(selectTask(mixed, registry), undefined)
  assert.throws(
    () =>
      normalizeCoreEvent(
        { ...event, tool_input: { command: '*** Delete File: ../outside.ts' } },
        registry
      ),
    /traversal/
  )
})

test('project hooks are synchronous, bounded and limited to supported boundaries', () => {
  const config = JSON.parse(
    readFileSync(new URL('../../.codex/hooks.json', import.meta.url), 'utf8')
  )
  assert.deepEqual(Object.keys(config.hooks).sort(), [
    'PostToolUse',
    'PreToolUse',
    'Stop',
    'SubagentStop'
  ])
  for (const groups of Object.values(config.hooks)) {
    assert.equal(groups.length, 1)
    assert.equal(groups[0].hooks.length, 1)
    const hook = groups[0].hooks[0]
    assert.equal(hook.type, 'command')
    assert.equal(hook.async, undefined)
    assert.equal(hook.timeout, 5)
    assert.match(
      hook.command,
      /git rev-parse --path-format=absolute --git-common-dir/
    )
    assert.match(hook.command, /scripts\/agent-hook-adapter\.mjs/)
  }
  assert.match('Bash', new RegExp(config.hooks.PreToolUse[0].matcher))
  assert.match('apply_patch', new RegExp(config.hooks.PreToolUse[0].matcher))
  assert.doesNotMatch(
    'WebSearch',
    new RegExp(config.hooks.PreToolUse[0].matcher)
  )
})

const registry = {
  version: 1,
  tasks: {
    a: { id: 'a', worktree: '/repo/.worktrees/a', agentId: 'agent-a' },
    b: { id: 'b', worktree: '/repo/.worktrees/b', agentId: 'agent-b' }
  }
}

test('native adapter selects explicit execution directory, never parent session identity', () => {
  assert.equal(
    selectTask(
      {
        cwd: '/repo',
        session_id: 'shared',
        tool_input: { workdir: '/repo/.worktrees/a' }
      },
      registry
    ),
    'a'
  )
  assert.equal(
    selectTask({ cwd: '/repo', session_id: 'a' }, registry),
    undefined
  )
  assert.equal(
    selectTask(
      {
        hook_event_name: 'SubagentStop',
        cwd: '/repo/.worktrees/a',
        agent_id: 'agent-b'
      },
      registry
    ),
    'b'
  )
  assert.equal(
    selectTask(
      { hook_event_name: 'SubagentStop', cwd: '/repo/.worktrees/a' },
      registry
    ),
    undefined
  )
})

test('ambiguous task bindings cannot grant a write scope', () => {
  const duplicate = {
    ...registry,
    tasks: { ...registry.tasks, c: { worktree: '/repo/.worktrees/a' } }
  }
  assert.equal(selectTask({ cwd: '/repo/.worktrees/a' }, duplicate), undefined)
})

test('supported pre-tool denies use native permissionDecision, not unsupported ask', () => {
  const output = adaptHook(
    { hook_event_name: 'PreToolUse' },
    { decision: 'deny', code: 'scope', reason: 'Outside task' }
  )
  assert.equal(output.hookSpecificOutput.permissionDecision, 'deny')
  assert.equal(
    output.hookSpecificOutput.permissionDecisionReason,
    'scope: Outside task'
  )
  assert.equal(output.continue, undefined)
})

test('allow results add no repeated context', () => {
  assert.deepEqual(
    adaptHook({ hook_event_name: 'PreToolUse' }, { decision: 'allow' }),
    {}
  )
})

test('stop continuation is bounded by native stop_hook_active and user pause', () => {
  const result = {
    decision: 'continue',
    reason: 'Missing integration evidence'
  }
  assert.equal(
    adaptHook({ hook_event_name: 'SubagentStop' }, result).decision,
    'block'
  )
  assert.equal(
    adaptHook(
      { hook_event_name: 'SubagentStop', stop_hook_active: true },
      result
    ).decision,
    undefined
  )
  assert.equal(
    adaptHook({ hook_event_name: 'Stop', userStop: true }, result).decision,
    undefined
  )
  assert.equal(
    adaptHook({ hook_event_name: 'Stop' }, { decision: 'stop' }).decision,
    undefined
  )
})

test('post-tool errors cannot claim rollback or repeatedly continue an agent', () => {
  const result = adaptHook(
    { hook_event_name: 'PostToolUse' },
    { decision: 'deny', code: 'unexpected_change', reason: 'Review ownership' }
  )
  assert.equal(result.decision, undefined)
  assert.match(result.systemMessage, /unexpected_change/)
})

test('unknown native result shapes never bless changed file expectations', () => {
  assert.equal(operationSucceeded('success'), false)
  assert.equal(operationSucceeded({ output: 'looks successful' }), false)
  assert.equal(operationSucceeded({ success: true, isError: true }), false)
  assert.equal(operationSucceeded({ success: false, exit_code: 0 }), false)
  assert.equal(operationSucceeded({ exit_code: 1 }), false)
  assert.equal(operationSucceeded({ exit_code: 0 }), true)
  assert.equal(operationSucceeded({ success: true }), true)
})
