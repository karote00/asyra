'use strict'

const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync, spawnSync } = require('node:child_process')
const { afterEach, test } = require('node:test')

const {
  checkTask,
  evaluateIntegration,
  evaluatePreCommit,
  evaluatePreTool,
  evaluateStop,
  registerTask
} = require('../guard-core.cjs')

const projectRoot = path.resolve(__dirname, '../../..')
const temporaryRoot = path.join(projectRoot, 'tmp')
const cleanupPaths = new Set()

function makeTemporaryDirectory() {
  fs.mkdirSync(temporaryRoot, { recursive: true })
  const directory = fs.mkdtempSync(
    path.join(temporaryRoot, 'agent-coordination-test-')
  )
  cleanupPaths.add(directory)
  return directory
}

afterEach(() => {
  for (const cleanupPath of cleanupPaths) {
    fs.rmSync(cleanupPath, { recursive: true, force: true })
  }
  cleanupPaths.clear()
})

function digest(content) {
  return crypto.createHash('sha256').update(content).digest('hex')
}

function registryPathFor(root) {
  return path.join(root, 'tmp', 'agent-coordination', 'state.json')
}

function makeTask(root, overrides = {}) {
  return {
    id: 'task-a',
    agentId: null,
    coordinator: false,
    kind: 'goal',
    integrationTargetTaskId: null,
    worktree: root,
    branch: 'codex/task-a',
    baselineHead: 'a'.repeat(40),
    allowedPathPrefixes: ['src/', 'scripts/agent-coordination/'],
    allowedExactFiles: [],
    protectedContractPaths: ['src/contracts/', 'src/budget.cjs'],
    allowedContractEdits: [],
    expectedFileDigests: {},
    approvedCommands: [],
    semanticOwners: ['coordination/runtime'],
    dependsOn: [],
    state: 'active',
    requiredGates: ['focused'],
    evidence: null,
    review: null,
    continuations: 0,
    ...overrides
  }
}

function register(registryPath, expectedRevision, task) {
  const result = registerTask({ registryPath, expectedRevision, task })
  assert.equal(result.decision, 'allow', result.reason)
  return result.details.registryRevision
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function initializeRepository(root, branch = 'codex/task-a') {
  fs.mkdirSync(root, { recursive: true })
  git(root, ['init', '-q', '-b', branch])
  git(root, ['config', 'user.name', 'Coordination Test'])
  git(root, ['config', 'user.email', 'coordination@example.test'])
  fs.mkdirSync(path.join(root, 'src'), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'src', 'owner.cjs'),
    "module.exports = 'base';\n"
  )
  git(root, ['add', 'src/owner.cjs'])
  git(root, ['commit', '-qm', 'baseline'])
  return git(root, ['rev-parse', 'HEAD'])
}

function initializeMinimalRepository(root, branch = 'codex/task-a') {
  fs.mkdirSync(root, { recursive: true })
  git(root, ['init', '-q', '-b', branch])
  git(root, ['config', 'user.name', 'Coordination Test'])
  git(root, ['config', 'user.email', 'coordination@example.test'])
  fs.writeFileSync(path.join(root, '.coordination-base'), 'base\n')
  git(root, ['add', '.coordination-base'])
  git(root, ['commit', '-qm', 'baseline'])
  return git(root, ['rev-parse', 'HEAD'])
}

test('register uses revision CAS and rejects active writer or semantic-owner overlap', () => {
  const root = makeTemporaryDirectory()
  const otherRoot = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)

  register(registryPath, 0, makeTask(root))

  const stale = registerTask({
    registryPath,
    expectedRevision: 0,
    task: makeTask(otherRoot, {
      id: 'task-stale',
      branch: 'codex/task-stale',
      semanticOwners: ['other']
    })
  })
  assert.equal(stale.decision, 'deny')
  assert.equal(stale.code, 'stale_registry_revision')

  const sameWorktree = registerTask({
    registryPath,
    expectedRevision: 1,
    task: makeTask(root, {
      id: 'task-b',
      branch: 'codex/task-b',
      semanticOwners: ['other']
    })
  })
  assert.equal(sameWorktree.code, 'active_writer_conflict')

  const sameOwner = registerTask({
    registryPath,
    expectedRevision: 1,
    task: makeTask(otherRoot, {
      id: 'task-c',
      branch: 'codex/task-c'
    })
  })
  assert.equal(sameOwner.code, 'semantic_owner_conflict')
})

test('registry storage rejects a symlink that escapes its repo root', () => {
  const root = makeTemporaryDirectory()
  const outside = makeTemporaryDirectory()
  fs.symlinkSync(outside, path.join(root, 'tmp'))
  const result = registerTask({
    registryPath: registryPathFor(root),
    expectedRevision: 0,
    task: makeTask(root)
  })
  assert.equal(result.decision, 'deny')
  assert.equal(result.code, 'invalid_registry_path')
})

test('read-only task check does not walk or hash worktree contents', () => {
  const root = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)
  register(registryPath, 0, makeTask(root))
  const originalReadFileSync = fs.readFileSync
  const originalReaddirSync = fs.readdirSync
  let worktreeContentReads = 0
  let directoryWalks = 0
  fs.readFileSync = (...arguments_) => {
    const candidate = arguments_[0]
    if (
      typeof candidate === 'string' &&
      path.resolve(candidate) !== path.resolve(registryPath)
    ) {
      worktreeContentReads += 1
    }
    return originalReadFileSync(...arguments_)
  }
  fs.readdirSync = (...arguments_) => {
    directoryWalks += 1
    return originalReaddirSync(...arguments_)
  }
  let result
  try {
    result = checkTask({ registryPath, event: { taskId: 'task-a' } })
  } finally {
    fs.readFileSync = originalReadFileSync
    fs.readdirSync = originalReaddirSync
  }
  assert.equal(result.decision, 'allow')
  assert.equal(directoryWalks, 0)
  assert.equal(worktreeContentReads, 0)
})

test('register permits parallel active worktrees with independent owners and serializes dependencies', () => {
  const root = makeTemporaryDirectory()
  const otherRoot = makeTemporaryDirectory()
  const thirdRoot = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)
  register(registryPath, 0, makeTask(root))
  register(
    registryPath,
    1,
    makeTask(otherRoot, {
      id: 'task-b',
      branch: 'codex/task-b',
      semanticOwners: ['coordination/adapter']
    })
  )

  const waiting = registerTask({
    registryPath,
    expectedRevision: 2,
    task: makeTask(thirdRoot, {
      id: 'task-c',
      branch: 'codex/task-c',
      dependsOn: ['task-a']
    })
  })
  assert.equal(waiting.code, 'semantic_owner_conflict')

  register(registryPath, 2, makeTask(root, { state: 'complete' }))
  const serialized = registerTask({
    registryPath,
    expectedRevision: 3,
    task: makeTask(thirdRoot, {
      id: 'task-c',
      branch: 'codex/task-c',
      dependsOn: ['task-a']
    })
  })
  assert.equal(serialized.decision, 'allow')
})

test('register updates lifecycle only and cannot expand an existing task authority', () => {
  const root = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)
  const task = makeTask(root, { state: 'paused' })
  register(registryPath, 0, task)
  register(registryPath, 1, { ...task, state: 'active' })

  const expanded = registerTask({
    registryPath,
    expectedRevision: 2,
    task: {
      ...task,
      state: 'active',
      allowedPathPrefixes: [...task.allowedPathPrefixes, 'docs/']
    }
  })
  assert.equal(expanded.code, 'task_authority_immutable')
})

test('register never grants write authority on main or master', () => {
  const root = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)
  for (const branch of ['main', 'master']) {
    const result = registerTask({
      registryPath,
      expectedRevision: 0,
      task: makeTask(root, { branch })
    })
    assert.equal(result.decision, 'deny')
    assert.equal(result.code, 'main_branch_denied')
  }
})

test('pre-tool denies destructive shell commands even for an active registered task', () => {
  const root = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)
  register(registryPath, 0, makeTask(root))
  const commands = [
    'git reset --hard HEAD~1',
    'git clean -fd',
    'git checkout -- src/owner.cjs',
    'git restore src/owner.cjs',
    'git stash clear',
    'git push --force origin HEAD',
    'git push -f origin HEAD',
    'git push origin +HEAD:refs/heads/task',
    'git push --delete origin old-task',
    'git push origin :refs/heads/old-task',
    'git branch -d old-task',
    'git branch -D old-task',
    "git commit --amend -m 'rewrite'",
    'rm -rf src',
    'find src -exec rm {} ;'
  ]

  for (const command of commands) {
    const result = evaluatePreTool({
      registryPath,
      event: {
        taskId: 'task-a',
        cwd: root,
        toolName: 'Bash',
        toolInput: { command }
      }
    })
    assert.equal(result.decision, 'deny', command)
    assert.equal(result.code, 'destructive_command', command)
  }
})

test('pre-tool requires the integration wrapper for direct merge commands', () => {
  const root = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)
  register(registryPath, 0, makeTask(root))
  for (const command of [
    'gh pr merge 123 --squash',
    'git merge codex/source'
  ]) {
    const result = evaluatePreTool({
      registryPath,
      event: {
        taskId: 'task-a',
        cwd: root,
        toolName: 'Bash',
        toolInput: { command }
      }
    })
    assert.equal(result.code, 'integration_required', command)
  }
})

test('pre-tool allows cheap reads but requires an exact approval for opaque execution', () => {
  const root = makeTemporaryDirectory()
  const baselineHead = initializeMinimalRepository(root)
  const registryPath = registryPathFor(root)
  const approvedCommand = 'node scripts/agent-coordination/probe.cjs'
  register(
    registryPath,
    0,
    makeTask(root, { approvedCommands: [approvedCommand], baselineHead })
  )

  for (const command of [
    'git status --short',
    'rg --files src',
    "rg 'ordinary & | quoted pattern' AGENTS.md",
    "sed -n '1,20p' src/owner.cjs",
    'find src -maxdepth 2 -type f'
  ]) {
    const result = evaluatePreTool({
      registryPath,
      event: {
        taskId: 'task-a',
        cwd: root,
        toolName: 'Bash',
        toolInput: { command }
      }
    })
    assert.equal(result.decision, 'allow', command)
  }

  const opaque = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'Bash',
      toolInput: { command: `python -c "open('src/x', 'w')"` }
    }
  })
  assert.equal(opaque.code, 'opaque_command_requires_approval')

  const approved = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'Bash',
      toolInput: { command: approvedCommand }
    }
  })
  assert.equal(approved.decision, 'allow')
})

test('read-only classification fails closed on shell and Git mutation bypasses', () => {
  const root = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)
  register(registryPath, 0, makeTask(root))
  const commands = [
    'cat src/owner.cjs > src/copied.cjs',
    'cat AGENTS.md & touch tmp/unapproved-file',
    'cat <(node mutate.cjs)',
    "sed -n 'w src/copied.cjs' src/owner.cjs",
    "sed -n '1p' -e 'w tmp/copied.txt' AGENTS.md",
    'git branch -f rewritten HEAD',
    'git -c diff.external=touch diff',
    'git diff --ext-diff',
    "git diff '--output=tmp/patch.txt'",
    'git diff "--output"=tmp/patch.txt',
    'git diff --outpu\\t=tmp/patch.txt',
    'git show --textconv HEAD',
    'PAGER=mutate rg owner src',
    "rg '--pre=some-program' x AGENTS.md",
    "rg --'pre'=some-program x AGENTS.md",
    "find . '-fprint' tmp/list.txt"
  ]

  for (const command of commands) {
    const result = evaluatePreTool({
      registryPath,
      event: {
        taskId: 'task-a',
        cwd: root,
        toolName: 'Bash',
        toolInput: { command }
      }
    })
    assert.notEqual(result.code, 'read_only', command)
    assert.equal(result.decision, 'deny', command)
  }
})

test('mixed quoted and escaped options cannot acquire anonymous read admission', () => {
  const root = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)
  const commands = [
    'git diff "--output"=tmp/patch.txt',
    "rg --'pre'=some-program x AGENTS.md",
    'git diff --outpu\\t=tmp/patch.txt'
  ]
  for (const command of commands) {
    const result = evaluatePreTool({
      registryPath,
      event: {
        cwd: root,
        toolName: 'Bash',
        toolInput: { command }
      }
    })
    assert.equal(result.decision, 'deny', command)
    assert.equal(result.code, 'missing_task', command)
  }
})

test('unknown identity can read but cannot patch or run opaque mutations', () => {
  const root = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)

  const read = evaluatePreTool({
    registryPath,
    event: {
      cwd: root,
      toolName: 'Bash',
      toolInput: { command: 'git status --short' }
    }
  })
  assert.equal(read.decision, 'allow')

  const patch = evaluatePreTool({
    registryPath,
    event: {
      cwd: root,
      toolName: 'apply_patch',
      toolInput: '*** Begin Patch\n*** Add File: src/new.cjs\n+x\n*** End Patch'
    }
  })
  assert.equal(patch.code, 'missing_task')

  const opaque = evaluatePreTool({
    registryPath,
    event: {
      cwd: root,
      toolName: 'Bash',
      toolInput: { command: 'node mutate.cjs' }
    }
  })
  assert.equal(opaque.code, 'missing_task')
})

test('patch scope protects existing tests and contracts while allowing a new in-scope regression', () => {
  const root = makeTemporaryDirectory()
  const baselineHead = initializeMinimalRepository(root)
  const registryPath = registryPathFor(root)
  fs.mkdirSync(path.join(root, 'src', '__tests__'), { recursive: true })
  fs.mkdirSync(path.join(root, 'src', 'contracts'), { recursive: true })
  fs.writeFileSync(path.join(root, 'src', 'owner.cjs'), 'old\n')
  fs.writeFileSync(
    path.join(root, 'src', '__tests__', 'owner.test.cjs'),
    'old test\n'
  )
  fs.writeFileSync(path.join(root, 'src', 'contracts', 'owner.json'), '{}\n')
  register(
    registryPath,
    0,
    makeTask(root, {
      baselineHead,
      expectedFileDigests: {
        'src/owner.cjs': digest('old\n'),
        'src/__tests__/owner.test.cjs': digest('old test\n'),
        'src/contracts/owner.json': digest('{}\n'),
        'src/__tests__/regression.test.cjs': 'absent'
      }
    })
  )

  const update = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'apply_patch',
      toolInput:
        '*** Begin Patch\n*** Update File: src/owner.cjs\n@@\n-old\n+new\n*** End Patch'
    }
  })
  assert.equal(update.decision, 'allow')

  const existingTest = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'apply_patch',
      toolInput:
        '*** Begin Patch\n*** Update File: src/__tests__/owner.test.cjs\n@@\n-old test\n+changed\n*** End Patch'
    }
  })
  assert.equal(existingTest.code, 'existing_test_requires_explicit_authority')

  const contract = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'apply_patch',
      toolInput:
        '*** Begin Patch\n*** Update File: src/contracts/owner.json\n@@\n-{}\n+{ }\n*** End Patch'
    }
  })
  assert.equal(contract.code, 'protected_contract_requires_explicit_authority')

  const newContract = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'apply_patch',
      toolInput:
        '*** Begin Patch\n*** Add File: src/contracts/new.json\n+{}\n*** End Patch'
    }
  })
  assert.equal(
    newContract.code,
    'protected_contract_requires_explicit_authority'
  )

  const regression = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'apply_patch',
      toolInput:
        '*** Begin Patch\n*** Add File: src/__tests__/regression.test.cjs\n+test\n*** End Patch'
    }
  })
  assert.equal(regression.decision, 'allow')

  const outside = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'apply_patch',
      toolInput:
        '*** Begin Patch\n*** Add File: docs/outside.md\n+x\n*** End Patch'
    }
  })
  assert.equal(outside.code, 'path_out_of_scope')
})

test('path resolution rejects traversal and symlink escape from the registered worktree', () => {
  const parent = makeTemporaryDirectory()
  const root = path.join(parent, 'worktree')
  const outside = path.join(parent, 'outside')
  fs.mkdirSync(path.join(root, 'src'), { recursive: true })
  const baselineHead = initializeMinimalRepository(root)
  fs.mkdirSync(outside, { recursive: true })
  fs.symlinkSync(outside, path.join(root, 'src', 'link'))
  const registryPath = registryPathFor(parent)
  register(
    registryPath,
    0,
    makeTask(root, {
      baselineHead,
      expectedFileDigests: {
        'src/link/escaped.cjs': 'absent'
      }
    })
  )

  for (const file of ['../outside/escaped.cjs', 'src/link/escaped.cjs']) {
    const result = evaluatePreTool({
      registryPath,
      event: {
        taskId: 'task-a',
        cwd: root,
        toolName: 'write',
        toolInput: { path: file }
      }
    })
    assert.equal(result.decision, 'deny')
    assert.match(result.code, /path_(?:traversal|escapes_worktree)/)
  }
})

test('pre-tool refuses a stale expected digest instead of overwriting current content', () => {
  const root = makeTemporaryDirectory()
  const baselineHead = initializeMinimalRepository(root)
  const registryPath = registryPathFor(root)
  fs.mkdirSync(path.join(root, 'src'), { recursive: true })
  fs.writeFileSync(path.join(root, 'src', 'owner.cjs'), 'user change\n')
  register(
    registryPath,
    0,
    makeTask(root, {
      baselineHead,
      expectedFileDigests: { 'src/owner.cjs': digest('old\n') }
    })
  )
  const result = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'write',
      toolInput: { path: 'src/owner.cjs' }
    }
  })
  assert.equal(result.code, 'unexpected_file_digest')
})

test('post-tool check reports only successful patch paths and never adopts another edit', () => {
  const root = makeTemporaryDirectory()
  const baselineHead = initializeMinimalRepository(root)
  const registryPath = registryPathFor(root)
  fs.mkdirSync(path.join(root, 'src'), { recursive: true })
  fs.writeFileSync(path.join(root, 'src', 'one.cjs'), 'one\n')
  fs.writeFileSync(path.join(root, 'src', 'two.cjs'), 'two\n')
  register(
    registryPath,
    0,
    makeTask(root, {
      baselineHead,
      expectedFileDigests: {
        'src/one.cjs': digest('one\n'),
        'src/two.cjs': digest('two\n')
      }
    })
  )
  const patch =
    '*** Begin Patch\n*** Update File: src/one.cjs\n@@\n-one\n+changed one\n*** End Patch'
  const preflight = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'apply_patch',
      toolInput: patch
    }
  })
  assert.equal(preflight.decision, 'allow')
  fs.writeFileSync(path.join(root, 'src', 'one.cjs'), 'changed one\n')
  fs.writeFileSync(path.join(root, 'src', 'two.cjs'), 'unexpected two\n')

  const checked = checkTask({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'apply_patch',
      toolInput: patch,
      operationSucceeded: true,
      preflight: preflight.details
    }
  })
  assert.equal(checked.decision, 'allow')
  assert.deepEqual(checked.details.digestUpdates, [
    { path: 'src/one.cjs', digest: digest('changed one\n') }
  ])

  const failed = checkTask({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'apply_patch',
      toolInput: patch,
      operationSucceeded: false
    }
  })
  assert.deepEqual(failed.details.digestUpdates, [])

  const otherWrite = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'write',
      toolInput: { path: 'src/two.cjs' }
    }
  })
  assert.equal(otherWrite.code, 'unexpected_file_digest')
})

test('post-tool check requires the exact preflight receipt', () => {
  const root = makeTemporaryDirectory()
  const baselineHead = initializeMinimalRepository(root)
  const registryPath = registryPathFor(root)
  fs.mkdirSync(path.join(root, 'src'), { recursive: true })
  fs.writeFileSync(path.join(root, 'src', 'one.cjs'), 'one\n')
  register(
    registryPath,
    0,
    makeTask(root, {
      baselineHead,
      expectedFileDigests: { 'src/one.cjs': digest('one\n') }
    })
  )
  const patch =
    '*** Begin Patch\n*** Update File: src/one.cjs\n@@\n-one\n+changed\n*** End Patch'
  fs.writeFileSync(path.join(root, 'src', 'one.cjs'), 'changed\n')
  const missing = checkTask({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'apply_patch',
      toolInput: patch,
      operationSucceeded: true
    }
  })
  assert.equal(missing.code, 'missing_preflight')
})

test('only the main-worktree coordinator can route a fixed register request command', () => {
  const root = makeTemporaryDirectory()
  const workerRoot = makeTemporaryDirectory()
  const baselineHead = initializeMinimalRepository(root)
  const workerBaselineHead = initializeMinimalRepository(
    workerRoot,
    'codex/worker'
  )
  const registryPath = registryPathFor(root)
  const requestDirectory = path.join(
    root,
    'tmp',
    'agent-coordination',
    'requests'
  )
  fs.mkdirSync(requestDirectory, { recursive: true })
  fs.writeFileSync(path.join(requestDirectory, 'next-task.json'), '{}\n')
  const command =
    'node scripts/agent-coordination/guard.cjs register < tmp/agent-coordination/requests/next-task.json'
  register(
    registryPath,
    0,
    makeTask(root, {
      coordinator: true,
      kind: 'local',
      baselineHead,
      allowedPathPrefixes: [
        'src/',
        'scripts/agent-coordination/',
        'tmp/agent-coordination/requests/'
      ],
      expectedFileDigests: {
        'tmp/agent-coordination/requests/control.json': 'absent'
      }
    })
  )

  const coordinator = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'Bash',
      toolInput: { command }
    }
  })
  assert.equal(coordinator.decision, 'allow', coordinator.reason)

  register(
    registryPath,
    1,
    makeTask(root, {
      coordinator: true,
      kind: 'local',
      baselineHead,
      state: 'paused',
      allowedPathPrefixes: [
        'src/',
        'scripts/agent-coordination/',
        'tmp/agent-coordination/requests/'
      ],
      expectedFileDigests: {
        'tmp/agent-coordination/requests/control.json': 'absent'
      }
    })
  )
  const pausedRequestPatch = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'apply_patch',
      toolInput:
        '*** Begin Patch\n*** Add File: tmp/agent-coordination/requests/control.json\n+{}\n*** End Patch'
    }
  })
  assert.equal(pausedRequestPatch.decision, 'allow', pausedRequestPatch.reason)

  const pausedOrdinaryPatch = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'apply_patch',
      toolInput:
        '*** Begin Patch\n*** Add File: src/paused-write.cjs\n+x\n*** End Patch'
    }
  })
  assert.equal(pausedOrdinaryPatch.code, 'task_not_active')

  const pausedCoordinator = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'Bash',
      toolInput: { command }
    }
  })
  assert.equal(pausedCoordinator.decision, 'allow', pausedCoordinator.reason)

  register(
    registryPath,
    2,
    makeTask(workerRoot, {
      id: 'worker',
      branch: 'codex/worker',
      baselineHead: workerBaselineHead,
      semanticOwners: ['worker']
    })
  )
  const worker = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'worker',
      cwd: workerRoot,
      toolName: 'Bash',
      toolInput: { command }
    }
  })
  assert.equal(worker.code, 'ambiguous_shell_control')
})

test('write authority remains valid after an authorized task commit advances HEAD', () => {
  const root = makeTemporaryDirectory()
  const baselineHead = initializeRepository(root)
  const registryPath = registryPathFor(root)
  fs.writeFileSync(
    path.join(root, 'src', 'owner.cjs'),
    "module.exports = 'first';\n"
  )
  git(root, ['add', 'src/owner.cjs'])
  git(root, ['commit', '-qm', 'first task commit'])
  register(
    registryPath,
    0,
    makeTask(root, {
      baselineHead,
      expectedFileDigests: {
        'src/owner.cjs': digest("module.exports = 'first';\n")
      }
    })
  )

  const result = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'write',
      toolInput: { path: 'src/owner.cjs' }
    }
  })
  assert.equal(result.decision, 'allow', result.reason)
})

test('paused tasks cannot write and exact optional agent identity gates SubagentStop', () => {
  const root = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)
  register(
    registryPath,
    0,
    makeTask(root, { agentId: 'agent-a', state: 'paused' })
  )
  const write = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'write',
      toolInput: { path: 'src/new.cjs' }
    }
  })
  assert.equal(write.code, 'task_not_active')

  const stop = evaluateStop({
    registryPath,
    event: { taskId: 'task-a', eventName: 'SubagentStop', agentId: 'agent-b' }
  })
  assert.equal(stop.decision, 'stop')
  assert.equal(stop.code, 'agent_mismatch')
})

test('stop grants at most one persisted continuation and never restarts an explicit user stop', () => {
  const root = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)
  register(registryPath, 0, makeTask(root, { state: 'awaiting_ci' }))

  const first = evaluateStop({
    registryPath,
    event: { taskId: 'task-a', eventName: 'Stop', pending: true }
  })
  assert.equal(first.decision, 'continue')
  assert.equal(first.details.registryRevision, 2)

  const second = evaluateStop({
    registryPath,
    event: { taskId: 'task-a', eventName: 'Stop', pending: true }
  })
  assert.equal(second.decision, 'stop')
  assert.equal(second.code, 'continuation_exhausted')

  const userStop = evaluateStop({
    registryPath,
    event: {
      taskId: 'task-a',
      eventName: 'Stop',
      pending: true,
      userStop: true
    }
  })
  assert.equal(userStop.decision, 'stop')
  assert.equal(userStop.code, 'explicit_user_stop')
})

test('stop gives pending complete state one diagnostic continuation', () => {
  const root = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)
  register(registryPath, 0, makeTask(root, { state: 'complete' }))
  const result = evaluateStop({
    registryPath,
    event: { taskId: 'task-a', eventName: 'Stop', pending: true }
  })
  assert.equal(result.decision, 'continue')
  assert.equal(result.code, 'pending_once')

  const repeated = evaluateStop({
    registryPath,
    event: { taskId: 'task-a', eventName: 'Stop', pending: true }
  })
  assert.equal(repeated.decision, 'stop')
  assert.equal(repeated.code, 'continuation_exhausted')
})

test('pending work cannot use ready evidence as completion', () => {
  const root = makeTemporaryDirectory()
  const head = initializeRepository(root)
  const tree = git(root, ['rev-parse', 'HEAD^{tree}'])
  const registryPath = registryPathFor(root)
  register(
    registryPath,
    0,
    makeTask(root, {
      baselineHead: head,
      state: 'ready',
      evidence: {
        head,
        tree,
        gates: { focused: { status: 'passed', head, tree } }
      },
      review: { status: 'passed', head, tree }
    })
  )
  const result = evaluateStop({
    registryPath,
    event: { taskId: 'task-a', eventName: 'Stop', pending: true }
  })
  assert.equal(result.decision, 'continue')
  assert.equal(result.code, 'pending_once')
})

test('pre-commit binds branch, head, staged tree, exact paths, gates, and review', () => {
  const root = makeTemporaryDirectory()
  const head = initializeRepository(root)
  const registryPath = registryPathFor(root)
  const original = fs.readFileSync(path.join(root, 'src', 'owner.cjs'))
  let task = makeTask(root, {
    baselineHead: head,
    expectedFileDigests: { 'src/owner.cjs': digest(original) }
  })
  register(registryPath, 0, task)
  fs.writeFileSync(
    path.join(root, 'src', 'owner.cjs'),
    "module.exports = 'next';\n"
  )
  git(root, ['add', 'src/owner.cjs'])
  const tree = git(root, ['write-tree'])
  task = {
    ...task,
    state: 'ready',
    expectedFileDigests: {
      'src/owner.cjs': digest("module.exports = 'next';\n")
    },
    evidence: {
      head,
      tree,
      gates: { focused: { status: 'passed', head, tree } }
    },
    review: { status: 'passed', head, tree }
  }
  register(registryPath, 1, task)

  const result = evaluatePreCommit({
    registryPath,
    event: { taskId: 'task-a', cwd: root }
  })
  assert.equal(result.decision, 'allow', result.reason)

  const directCommit = evaluatePreTool({
    registryPath,
    event: {
      taskId: 'task-a',
      cwd: root,
      toolName: 'Bash',
      toolInput: { command: "git commit -m 'validated change'" }
    }
  })
  assert.equal(directCommit.decision, 'allow', directCommit.reason)
  assert.equal(directCommit.code, 'commit_approved')

  const staleTask = {
    ...task,
    evidence: {
      ...task.evidence,
      gates: {
        focused: { status: 'passed', head: 'b'.repeat(40), tree }
      }
    }
  }
  register(registryPath, 2, staleTask)
  const stale = evaluatePreCommit({
    registryPath,
    event: { taskId: 'task-a', cwd: root }
  })
  assert.equal(stale.code, 'gate_evidence_mismatch')
})

test('integration allows only an exact reviewed sub-PR into its registered non-main goal', () => {
  const parent = makeTemporaryDirectory()
  const goalRoot = path.join(parent, 'goal')
  const sourceRoot = path.join(parent, 'source')
  const goalHead = initializeRepository(goalRoot, 'codex/goal')
  git(goalRoot, ['branch', 'codex/source'])
  git(goalRoot, ['worktree', 'add', '-q', sourceRoot, 'codex/source'])
  fs.writeFileSync(
    path.join(sourceRoot, 'src', 'owner.cjs'),
    "module.exports = 'source';\n"
  )
  git(sourceRoot, ['add', 'src/owner.cjs'])
  git(sourceRoot, ['commit', '-qm', 'source'])
  const sourceHead = git(sourceRoot, ['rev-parse', 'HEAD'])
  const sourceTree = git(sourceRoot, ['rev-parse', 'HEAD^{tree}'])
  const registryPath = registryPathFor(parent)
  register(
    registryPath,
    0,
    makeTask(goalRoot, {
      id: 'goal',
      branch: 'codex/goal',
      baselineHead: goalHead,
      semanticOwners: ['goal/integration']
    })
  )
  register(
    registryPath,
    1,
    makeTask(sourceRoot, {
      id: 'source',
      kind: 'subpr',
      integrationTargetTaskId: 'goal',
      branch: 'codex/source',
      baselineHead: goalHead,
      semanticOwners: ['source/owner'],
      state: 'ready',
      evidence: {
        head: sourceHead,
        tree: sourceTree,
        gates: {
          focused: { status: 'passed', head: sourceHead, tree: sourceTree }
        }
      },
      review: { status: 'passed', head: sourceHead, tree: sourceTree }
    })
  )

  const event = {
    sourceTaskId: 'source',
    goalTaskId: 'goal',
    cwd: goalRoot,
    sourcePr: {
      number: 123,
      baseBranch: 'codex/goal',
      headBranch: 'codex/source',
      headSha: sourceHead,
      headTree: sourceTree
    },
    goal: { branch: 'codex/goal', headSha: goalHead }
  }
  const allowed = evaluateIntegration({ registryPath, event })
  assert.equal(allowed.decision, 'allow', allowed.reason)

  const main = evaluateIntegration({
    registryPath,
    event: {
      ...event,
      sourcePr: { ...event.sourcePr, baseBranch: 'main' },
      goal: { ...event.goal, branch: 'main' }
    }
  })
  assert.equal(main.code, 'main_integration_denied')

  const stale = evaluateIntegration({
    registryPath,
    event: {
      ...event,
      sourcePr: { ...event.sourcePr, headSha: 'c'.repeat(40) }
    }
  })
  assert.equal(stale.code, 'source_evidence_mismatch')
})

test('integration rejects a goal that advanced beyond the reviewed source', () => {
  const parent = makeTemporaryDirectory()
  const goalRoot = path.join(parent, 'goal')
  const sourceRoot = path.join(parent, 'source')
  const initialGoalHead = initializeRepository(goalRoot, 'codex/goal')
  git(goalRoot, ['branch', 'codex/source'])
  git(goalRoot, ['worktree', 'add', '-q', sourceRoot, 'codex/source'])
  fs.writeFileSync(
    path.join(sourceRoot, 'src', 'owner.cjs'),
    "module.exports = 'source';\n"
  )
  git(sourceRoot, ['add', 'src/owner.cjs'])
  git(sourceRoot, ['commit', '-qm', 'source'])
  const sourceHead = git(sourceRoot, ['rev-parse', 'HEAD'])
  const sourceTree = git(sourceRoot, ['rev-parse', 'HEAD^{tree}'])

  fs.writeFileSync(
    path.join(goalRoot, 'src', 'goal-only.cjs'),
    'goal advanced\n'
  )
  git(goalRoot, ['add', 'src/goal-only.cjs'])
  git(goalRoot, ['commit', '-qm', 'advance goal'])
  const advancedGoalHead = git(goalRoot, ['rev-parse', 'HEAD'])

  const registryPath = registryPathFor(parent)
  register(
    registryPath,
    0,
    makeTask(goalRoot, {
      id: 'goal',
      branch: 'codex/goal',
      baselineHead: initialGoalHead,
      semanticOwners: ['goal/integration']
    })
  )
  register(
    registryPath,
    1,
    makeTask(sourceRoot, {
      id: 'source',
      kind: 'subpr',
      integrationTargetTaskId: 'goal',
      branch: 'codex/source',
      baselineHead: initialGoalHead,
      semanticOwners: ['source/owner'],
      state: 'ready',
      evidence: {
        head: sourceHead,
        tree: sourceTree,
        gates: {
          focused: { status: 'passed', head: sourceHead, tree: sourceTree }
        }
      },
      review: { status: 'passed', head: sourceHead, tree: sourceTree }
    })
  )

  const result = evaluateIntegration({
    registryPath,
    event: {
      sourceTaskId: 'source',
      goalTaskId: 'goal',
      cwd: goalRoot,
      sourcePr: {
        number: 124,
        baseBranch: 'codex/goal',
        headBranch: 'codex/source',
        headSha: sourceHead,
        headTree: sourceTree
      },
      goal: { branch: 'codex/goal', headSha: advancedGoalHead }
    }
  })
  assert.equal(result.decision, 'deny')
  assert.equal(result.code, 'goal_advanced_beyond_source')
})

test('a real combined-source invariant failure cannot become integration evidence', () => {
  const parent = makeTemporaryDirectory()
  const goalRoot = path.join(parent, 'goal')
  const sourceRoot = path.join(parent, 'source')
  const gateRoot = path.join(parent, 'gate')
  fs.mkdirSync(gateRoot, { recursive: true })
  const verifier = path.join(gateRoot, 'verify-owner.cjs')
  const firstCandidate = path.join(gateRoot, 'first.json')
  const secondCandidate = path.join(gateRoot, 'second.json')
  fs.writeFileSync(
    verifier,
    [
      "const assert = require('node:assert/strict');",
      "const fs = require('node:fs');",
      "const candidates = process.argv.slice(2).flatMap((file) => JSON.parse(fs.readFileSync(file, 'utf8')));",
      "assert.equal(new Set(candidates.map(({ owner }) => owner)).size, candidates.length, 'semantic owner must be unique');"
    ].join('\n')
  )
  fs.writeFileSync(
    firstCandidate,
    JSON.stringify([{ owner: 'shared-owner', source: 'first' }])
  )
  fs.writeFileSync(
    secondCandidate,
    JSON.stringify([{ owner: 'shared-owner', source: 'second' }])
  )
  assert.equal(
    spawnSync(process.execPath, [verifier, firstCandidate]).status,
    0
  )
  assert.equal(
    spawnSync(process.execPath, [verifier, secondCandidate]).status,
    0
  )
  const combinedGate = spawnSync(
    process.execPath,
    [verifier, firstCandidate, secondCandidate],
    { encoding: 'utf8' }
  )
  assert.notEqual(combinedGate.status, 0)
  assert.match(combinedGate.stderr, /semantic owner must be unique/)

  const goalHead = initializeRepository(goalRoot, 'codex/goal')
  git(goalRoot, ['branch', 'codex/source'])
  git(goalRoot, ['worktree', 'add', '-q', sourceRoot, 'codex/source'])
  const sourceHead = git(sourceRoot, ['rev-parse', 'HEAD'])
  const sourceTree = git(sourceRoot, ['rev-parse', 'HEAD^{tree}'])
  const registryPath = registryPathFor(parent)
  register(
    registryPath,
    0,
    makeTask(goalRoot, {
      id: 'goal',
      branch: 'codex/goal',
      baselineHead: goalHead,
      semanticOwners: ['goal/integration']
    })
  )
  const sourceTask = makeTask(sourceRoot, {
    id: 'source',
    kind: 'subpr',
    integrationTargetTaskId: 'goal',
    branch: 'codex/source',
    baselineHead: goalHead,
    semanticOwners: ['source/owner'],
    requiredGates: ['combined-owner']
  })
  register(registryPath, 1, sourceTask)
  const failedEvidence = registerTask({
    registryPath,
    expectedRevision: 2,
    task: {
      ...sourceTask,
      state: 'ready',
      evidence: {
        head: sourceHead,
        tree: sourceTree,
        gates: {
          'combined-owner': {
            status: combinedGate.status === 0 ? 'passed' : 'failed',
            head: sourceHead,
            tree: sourceTree
          }
        }
      },
      review: { status: 'passed', head: sourceHead, tree: sourceTree }
    }
  })
  assert.equal(failedEvidence.decision, 'deny')
  assert.equal(failedEvidence.code, 'invalid_registry')

  const integration = evaluateIntegration({
    registryPath,
    event: {
      sourceTaskId: 'source',
      goalTaskId: 'goal',
      cwd: goalRoot,
      sourcePr: {
        number: 456,
        baseBranch: 'codex/goal',
        headBranch: 'codex/source',
        headSha: sourceHead,
        headTree: sourceTree
      },
      goal: { branch: 'codex/goal', headSha: goalHead }
    }
  })
  assert.equal(integration.decision, 'deny')
  assert.equal(integration.code, 'source_not_ready')
})

test('CLI reads one JSON request and emits a machine-readable decision', () => {
  const root = makeTemporaryDirectory()
  const registryPath = registryPathFor(root)
  register(registryPath, 0, makeTask(root))
  const cli = path.resolve(__dirname, '..', 'guard.cjs')
  const result = spawnSync(process.execPath, [cli, 'check'], {
    cwd: projectRoot,
    encoding: 'utf8',
    input: JSON.stringify({ repoRoot: root, taskId: 'task-a' })
  })
  assert.equal(result.status, 0, result.stderr)
  const response = JSON.parse(result.stdout)
  assert.equal(response.version, 1)
  assert.equal(response.decision, 'allow')
})

test('CLI syntax failures return stable JSON without a stack dump', () => {
  const cli = path.resolve(__dirname, '..', 'guard.cjs')
  const result = spawnSync(process.execPath, [cli, 'check'], {
    cwd: projectRoot,
    encoding: 'utf8',
    input: '{'
  })
  assert.equal(result.status, 1)
  const response = JSON.parse(result.stdout)
  assert.equal(response.decision, 'deny')
  assert.equal(response.code, 'invalid_input')
  assert.equal(result.stderr, '')
})
