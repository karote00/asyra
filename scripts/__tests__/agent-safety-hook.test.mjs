import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const hookPath = path.join(projectRoot, 'scripts/agent-safety-hook.mjs')
const temporaryRoot = path.join(projectRoot, 'tmp')

function makeRepository(branch) {
  mkdirSync(temporaryRoot, { recursive: true })
  const root = mkdtempSync(path.join(temporaryRoot, 'agent-safety-hook-'))
  const git = (...args) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  git('init', '-q', '-b', branch)
  git('config', 'user.name', 'Agent Safety Test')
  git('config', 'user.email', 'agent-safety@example.test')
  writeFileSync(path.join(root, 'tracked.txt'), 'base\n')
  git('add', 'tracked.txt')
  git('commit', '-qm', 'baseline')
  return { root, git }
}

function makeLinkedWorktree(t, branch) {
  const { root, git } = makeRepository('main')
  const container = mkdtempSync(path.join(temporaryRoot, 'agent-safety-link-'))
  const linkedRoot = path.join(container, 'feature')
  git('worktree', 'add', '-q', '-b', branch, linkedRoot, 'HEAD')
  t.after(() => {
    execFileSync('git', ['worktree', 'remove', '--force', linkedRoot], {
      cwd: root,
      stdio: 'ignore'
    })
    rmSync(container, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  })
  return { root, linkedRoot }
}

function invokeHook(root, event) {
  const result = spawnSync(process.execPath, [hookPath], {
    cwd: root,
    input: JSON.stringify({ cwd: root, ...event }),
    encoding: 'utf8',
    timeout: 5000
  })
  assert.equal(result.error, undefined, result.error?.message)
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

function preTool(root, toolName, toolInput) {
  return invokeHook(root, {
    hook_event_name: 'PreToolUse',
    tool_name: toolName,
    tool_input: toolInput
  })
}

function permissionDecision(result) {
  return result.hookSpecificOutput?.permissionDecision
}

test('normal writes and feature-branch commits need no task or shared registry state', (t) => {
  const { root, git } = makeRepository('codex/ordinary-work')
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const patch = {
    command:
      '*** Begin Patch\n*** Update File: tracked.txt\n@@\n-base\n+changed\n*** End Patch'
  }

  assert.deepEqual(preTool(root, 'apply_patch', patch), {})
  writeFileSync(path.join(root, 'tracked.txt'), 'changed\n')
  assert.deepEqual(
    preTool(root, 'Bash', { command: 'git add -- tracked.txt' }),
    {}
  )
  git('add', '--', 'tracked.txt')
  assert.deepEqual(
    preTool(root, 'Bash', { command: 'git commit -m "ordinary change"' }),
    {}
  )
  const firstCommit = git('rev-parse', 'HEAD')
  git('commit', '-qm', 'ordinary change')
  assert.notEqual(git('rev-parse', 'HEAD'), firstCommit)

  mkdirSync(path.join(root, 'tmp/agent-coordination'), { recursive: true })
  writeFileSync(path.join(root, 'tmp/agent-coordination/state.json'), '{broken')
  writeFileSync(path.join(root, 'tmp/agent-coordination/task.json'), '{broken')
  writeFileSync(path.join(root, 'tracked.txt'), 'changed again\n')
  git('add', '--', 'tracked.txt')
  assert.deepEqual(preTool(root, 'apply_patch', patch), {})
  assert.deepEqual(
    preTool(root, 'Bash', { command: 'git commit -m "ordinary change"' }),
    {}
  )
  const secondCommit = git('rev-parse', 'HEAD')
  git('commit', '-qm', 'ordinary change with obsolete state present')
  assert.notEqual(git('rev-parse', 'HEAD'), secondCommit)
})

test('main-branch writes and independently unsafe Git commands remain denied', (t) => {
  const { root } = makeRepository('main')
  t.after(() => rmSync(root, { recursive: true, force: true }))
  assert.deepEqual(preTool(root, 'Bash', { command: 'git status --short' }), {})
  const write = preTool(root, 'apply_patch', {
    command:
      '*** Begin Patch\n*** Update File: tracked.txt\n@@\n-base\n+changed\n*** End Patch'
  })
  assert.equal(permissionDecision(write), 'deny')

  const commit = preTool(root, 'Bash', {
    command: 'git commit -m "must stay off main"'
  })
  assert.equal(permissionDecision(commit), 'deny')
  assert.equal(
    permissionDecision(
      preTool(root, 'Bash', { command: 'git diff --output=tracked.txt' })
    ),
    'deny'
  )
  assert.equal(
    permissionDecision(
      preTool(root, 'Bash', {
        command: 'git branch --show-current --delete main'
      })
    ),
    'deny'
  )

  const { root: featureRoot } = makeRepository('codex/unsafe-command-proof')
  t.after(() => rmSync(featureRoot, { recursive: true, force: true }))
  const { root: otherRoot } = makeRepository('main')
  t.after(() => rmSync(otherRoot, { recursive: true, force: true }))
  assert.equal(
    permissionDecision(
      preTool(featureRoot, 'Write', {
        path: path.join(otherRoot, 'tracked.txt'),
        content: 'cross-worktree write\n'
      })
    ),
    'deny'
  )
  assert.equal(
    permissionDecision(
      preTool(featureRoot, 'Bash', {
        command: `git -C ${otherRoot} commit -m "cross-worktree commit"`
      })
    ),
    'deny'
  )
  assert.equal(
    permissionDecision(
      preTool(featureRoot, 'Bash', {
        workdir: otherRoot,
        command: 'git status'
      })
    ),
    'deny'
  )
  for (const command of [
    'git reset --hard HEAD~1',
    'git clean -fd',
    'git restore tracked.txt',
    'git push --force origin HEAD',
    'git push origin HEAD:main',
    'git status&&git reset --hard HEAD~1',
    'git branch --force main HEAD~1',
    'git switch -C main'
  ]) {
    assert.equal(
      permissionDecision(preTool(featureRoot, 'Bash', { command })),
      'deny',
      command
    )
  }
})

test('tool workdir and file targets resolve to a linked feature worktree', (t) => {
  const { root, linkedRoot } = makeLinkedWorktree(t, 'codex/linked-feature')

  assert.deepEqual(
    preTool(root, 'Bash', {
      workdir: linkedRoot,
      command: 'git status --short'
    }),
    {}
  )
  assert.deepEqual(
    preTool(root, 'Write', {
      path: path.join(linkedRoot, 'tracked.txt'),
      content: 'updated in the feature worktree\n'
    }),
    {}
  )
  assert.deepEqual(
    preTool(root, 'apply_patch', {
      command: `*** Begin Patch\n*** Update File: ${path.join(linkedRoot, 'tracked.txt')}\n@@\n-base\n+patched\n*** End Patch`
    }),
    {}
  )
})

test('mixed-worktree patches and targets in another repository are denied', (t) => {
  const { root, git } = makeRepository('main')
  const linkedContainer = mkdtempSync(
    path.join(temporaryRoot, 'agent-safety-mixed-')
  )
  const linkedRoot = path.join(linkedContainer, 'feature')
  const secondLinkedRoot = path.join(linkedContainer, 'second-feature')
  git('worktree', 'add', '-q', '-b', 'codex/mixed-targets', linkedRoot, 'HEAD')
  git(
    'worktree',
    'add',
    '-q',
    '-b',
    'codex/second-feature',
    secondLinkedRoot,
    'HEAD'
  )
  t.after(() => {
    execFileSync('git', ['worktree', 'remove', '--force', secondLinkedRoot], {
      cwd: root,
      stdio: 'ignore'
    })
    execFileSync('git', ['worktree', 'remove', '--force', linkedRoot], {
      cwd: root,
      stdio: 'ignore'
    })
    rmSync(linkedContainer, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  })
  const { root: otherRoot } = makeRepository('codex/different-repository')
  t.after(() => rmSync(otherRoot, { recursive: true, force: true }))

  assert.equal(
    permissionDecision(
      preTool(root, 'apply_patch', {
        command: `*** Begin Patch\n*** Update File: ${path.join(linkedRoot, 'tracked.txt')}\n@@\n-base\n+one\n*** Update File: ${path.join(secondLinkedRoot, 'tracked.txt')}\n@@\n-base\n+two\n*** End Patch`
      })
    ),
    'deny'
  )
  assert.equal(
    permissionDecision(
      preTool(root, 'Write', {
        path: path.join(otherRoot, 'tracked.txt'),
        content: 'outside repository\n'
      })
    ),
    'deny'
  )
})

test('merge source and destination branch determine main protection', (t) => {
  const { root, linkedRoot } = makeLinkedWorktree(t, 'codex/merge-destination')

  assert.deepEqual(
    preTool(root, 'Bash', {
      workdir: linkedRoot,
      command: 'git merge main'
    }),
    {}
  )
  assert.equal(
    permissionDecision(
      preTool(root, 'Bash', {
        workdir: root,
        command: 'git merge codex/merge-destination'
      })
    ),
    'deny'
  )
})

test('the project keeps native hooks for stateless write safety only', () => {
  const config = JSON.parse(
    readFileSync(path.join(projectRoot, '.codex/hooks.json'), 'utf8')
  )
  assert.deepEqual(Object.keys(config.hooks).sort(), ['PreToolUse'])
  assert.match(
    config.hooks.PreToolUse[0].hooks[0].command,
    /scripts\/agent-safety-hook\.mjs/
  )
  const packageJson = JSON.parse(
    readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
  )
  assert.equal(
    packageJson.scripts['test:agent-safety'],
    'node --test scripts/__tests__/agent-safety-hook.test.mjs'
  )
})
