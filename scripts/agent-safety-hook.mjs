import { spawnSync } from 'node:child_process'
import { realpathSync, statSync } from 'node:fs'
import path from 'node:path'

const maximumInputBytes = 2 * 1024 * 1024

function deny(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason
    }
  }
}

function gitBranch(cwd) {
  const result = spawnSync('git', ['branch', '--show-current'], {
    cwd,
    encoding: 'utf8',
    timeout: 1000,
    stdio: ['ignore', 'pipe', 'ignore']
  })
  if (result.status !== 0) return null
  return result.stdout.trim()
}

function gitWorktreeRoot(cwd) {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd,
    encoding: 'utf8',
    timeout: 1000,
    stdio: ['ignore', 'pipe', 'ignore']
  })
  if (result.status !== 0) return null
  try {
    return realpathSync(result.stdout.trim())
  } catch {
    return null
  }
}

function gitCommonDirectory(cwd) {
  const result = spawnSync(
    'git',
    ['rev-parse', '--path-format=absolute', '--git-common-dir'],
    {
      cwd,
      encoding: 'utf8',
      timeout: 1000,
      stdio: ['ignore', 'pipe', 'ignore']
    }
  )
  if (result.status !== 0) return null
  try {
    return realpathSync(result.stdout.trim())
  } catch {
    return null
  }
}

function gitCommandDirectory(command, cwd) {
  const tokens = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || []
  if (path.basename((tokens[0] || '').replace(/^['"]|['"]$/g, '')) !== 'git')
    return cwd
  let directory = cwd
  for (let index = 1; index < tokens.length; index += 1) {
    const argument = tokens[index].replace(/^['"]|['"]$/g, '')
    if (argument === '-C') {
      const target = tokens[index + 1]?.replace(/^['"]|['"]$/g, '')
      if (!target) return null
      directory = path.resolve(directory, target)
      index += 1
      continue
    }
    if (argument === '--no-pager') continue
    if (argument === '-c') {
      index += 1
      continue
    }
    if (argument === '--git-dir' || argument === '--work-tree') return null
    if (!argument.startsWith('-')) break
  }
  try {
    return realpathSync(directory)
  } catch {
    return null
  }
}

function writeTargets(event) {
  if (event.tool_name === 'apply_patch') {
    const patch =
      typeof event.tool_input === 'string'
        ? event.tool_input
        : event.tool_input?.command
    if (typeof patch !== 'string') return []
    return [
      ...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm),
      ...patch.matchAll(/^\*\*\* Move to: (.+)$/gm)
    ].map((match) => match[1])
  }
  if (event.tool_name === 'Edit' || event.tool_name === 'Write') {
    const target = event.tool_input?.path ?? event.tool_input?.file_path
    return typeof target === 'string' ? [target] : []
  }
  return []
}

function targetWorktreeRoot(target, cwd) {
  const absolute = path.resolve(cwd, target)
  let directory = absolute
  try {
    const realTarget = realpathSync(directory)
    directory = statSync(realTarget).isDirectory()
      ? realTarget
      : path.dirname(realTarget)
  } catch {
    directory = path.dirname(directory)
  }
  while (true) {
    try {
      directory = realpathSync(directory)
      return gitWorktreeRoot(directory)
    } catch {
      const parent = path.dirname(directory)
      if (parent === directory) return null
      directory = parent
    }
  }
}

function destructiveCommandReason(command) {
  if (
    typeof command !== 'string' ||
    command.length === 0 ||
    command.length > 100000
  )
    return 'Shell command is missing or exceeds the bounded input size.'
  const patterns = [
    [/\bgit\b[^\n;&|]*\breset\b[^\n;&|]*--hard\b/i, 'git reset --hard'],
    [/\bgit\b[^\n;&|]*\bclean\b/i, 'git clean'],
    [/\bgit\b[^\n;&|]*\bcheckout\b[^\n;&|]*\s--(?:\s|$)/i, 'git checkout --'],
    [/\bgit\b[^\n;&|]*\brestore\b/i, 'git restore'],
    [/\bgit\b[^\n;&|]*\bstash\s+(?:drop|clear)\b/i, 'git stash drop/clear'],
    [
      /\bgit\b[^\n;&|]*\bcommit\b[^\n;&|]*(?:--amend\b|--reuse-message\b|--reedit-message\b|(?:^|\s)-[cC](?:\s|$))/i,
      'commit history rewrite'
    ],
    [
      /\bgit\b[^\n;&|]*\bpush\b[^\n;&|]*(?:--force(?:-with-lease)?\b|(?:^|\s)-f(?:\s|$))/i,
      'forced git push'
    ],
    [
      /\bgit\b[^\n;&|]*\bpush\b[^\n;&|]*(?:--delete\b|(?:^|\s)\+\S+|(?:^|\s):(?:refs\/heads\/)?\S+)/i,
      'forced or deleting git push'
    ],
    [
      /\bgit\b[^\n;&|]*\bbranch\b[^\n;&|]*(?:^|\s)(?:-[dD]|--delete)(?:\s|$)/i,
      'branch deletion'
    ],
    [/\bgit\b[^\n;&|]*\bworktree\s+(?:remove|prune)\b/i, 'worktree deletion'],
    [
      /(?:^|[;&|]\s*|\s)(?:rm|rmdir|unlink|shred|truncate)(?:\s|$)/i,
      'filesystem deletion'
    ],
    [/\bfind\b[^\n;&|]*(?:-exec(?:dir)?\b|-delete\b)/i, 'mutating find'],
    [/\bsed\b[^\n;&|]*(?:\s-i(?:\s|$)|\s--in-place\b)/i, 'in-place sed'],
    [/\brg\b[^\n;&|]*\s--pre(?:=|\s)/i, 'rg preprocessor execution']
  ]
  for (const [pattern, reason] of patterns) {
    if (pattern.test(command)) return reason
  }
}

function targetsMain(command) {
  return (
    /\bgit\b[^\n;&|]*\bpush\b[^\n;&|]*(?::|\s)(?:main|master|refs\/heads\/(?:main|master))(?:\s|$)/i.test(
      command
    ) ||
    /\bgit\b[^\n;&|]*\bbranch\b[^\n;&|]*(?:--force|(?:^|\s)-f)(?:\s|$)[^\n;&|]*\b(?:main|master)\b/i.test(
      command
    ) ||
    /\bgit\b[^\n;&|]*\b(?:checkout|switch)\b[^\n;&|]*(?:-B|-b|-C|--force-create)(?:\s|$)[^\n;&|]*\b(?:main|master)\b/i.test(
      command
    ) ||
    /\bgh\s+pr\s+merge\b[^\n;&|]*--base\s+(?:main|master)\b/i.test(command)
  )
}

function isReadOnlyOnMain(command) {
  if (/[;&|<>`\n'"\\]/.test(command)) return false
  const tokens = command.trim().split(/\s+/)
  const executable = tokens[0]?.split('/').at(-1)
  const arguments_ = tokens.slice(1)
  if (
    [
      'pwd',
      'ls',
      'cat',
      'head',
      'tail',
      'wc',
      'stat',
      'true',
      'false'
    ].includes(executable)
  )
    return true
  if (executable === 'rg')
    return !arguments_.some(
      (argument) => argument === '--pre' || argument.startsWith('--pre=')
    )
  if (executable === 'sed') {
    if (arguments_[0] !== '-n' || arguments_.length < 3) return false
    if (!/^(?:\d+|\$)(?:,(?:\d+|\$))?p$/.test(arguments_[1])) return false
    return arguments_.slice(2).every((argument) => !argument.startsWith('-'))
  }
  if (executable !== 'git') return false
  let index = 1
  while (tokens[index] === '-C' && tokens[index + 1]) index += 2
  if (tokens[index] === '--no-pager') index += 1
  const subcommand = tokens[index]
  const gitArguments = tokens.slice(index + 1)
  if (['status', 'rev-parse', 'ls-files', 'merge-base'].includes(subcommand))
    return true
  if (['diff', 'show', 'log'].includes(subcommand)) {
    return !gitArguments.some(
      (argument) =>
        argument === '--ext-diff' ||
        argument === '--textconv' ||
        argument === '--output' ||
        argument.startsWith('--output=')
    )
  }
  if (subcommand === 'branch') {
    if (gitArguments.length === 0) return true
    if (gitArguments.length === 1 && gitArguments[0] === '--show-current')
      return true
    if (gitArguments[0] === '--list')
      return gitArguments
        .slice(1)
        .every((argument) => !argument.startsWith('-'))
  }
  return false
}

function evaluate(event) {
  if (event?.hook_event_name !== 'PreToolUse') return {}
  const command =
    event.tool_name === 'Bash'
      ? (event.tool_input?.command ?? event.tool_input?.cmd)
      : null
  if (typeof command === 'string') {
    const segments = command.split(/\s*&&\s*/)
    if (segments.some((segment) => /[;&|<>`\n]/.test(segment)))
      return deny('Shell control syntax is denied; run one command at a time.')
    for (const segment of segments) {
      if (/^\s*cd(?:\s|$)/.test(segment))
        return deny(
          'Use the tool workdir instead of changing directories in a shell command.'
        )
      const unsafeReason = destructiveCommandReason(segment)
      if (unsafeReason)
        return deny(`Denied destructive command: ${unsafeReason}.`)
      if (targetsMain(segment))
        return deny('Direct push or PR merge to main/master is denied.')
    }
  }

  let eventCwd
  try {
    eventCwd = realpathSync(event.cwd)
  } catch {
    return deny('Cannot verify the current Git worktree.')
  }
  const eventWorktree = gitWorktreeRoot(eventCwd)
  const repositoryDirectory = gitCommonDirectory(eventCwd)
  if (!eventWorktree || !repositoryDirectory)
    return deny('Cannot verify the current Git worktree.')

  let cwd
  try {
    cwd = realpathSync(
      event.tool_input?.workdir ?? event.tool_input?.cwd ?? event.cwd
    )
  } catch {
    return deny('Cannot verify the current Git worktree.')
  }
  const operationRepository = gitCommonDirectory(cwd)
  if (!operationRepository)
    return deny('Cannot verify the current Git worktree.')
  if (operationRepository !== repositoryDirectory)
    return deny('Tools must stay within the current Git repository.')
  const targets = writeTargets(event)
  if (
    ['apply_patch', 'Edit', 'Write'].includes(event.tool_name) &&
    targets.length === 0
  )
    return deny('Cannot verify the target path of this file operation.')
  const targetWorktrees = targets.map((target) =>
    targetWorktreeRoot(target, cwd)
  )
  for (const worktree of targetWorktrees) {
    if (!worktree || gitCommonDirectory(worktree) !== repositoryDirectory)
      return deny('File changes must stay within the current Git repository.')
  }
  if (new Set(targetWorktrees).size > 1)
    return deny('One file operation must stay within one Git worktree.')
  const operationWorktree = targetWorktrees[0] || gitWorktreeRoot(cwd)
  if (!operationWorktree)
    return deny('Cannot verify the operation Git worktree.')
  const branch = gitBranch(operationWorktree)
  if (!branch) return deny('Cannot verify the current Git branch.')
  if (typeof command === 'string') {
    for (const segment of command.split(/\s*&&\s*/)) {
      const commandDirectory = gitCommandDirectory(segment, cwd)
      if (!commandDirectory)
        return deny('Cannot verify the Git command worktree.')
      if (gitCommonDirectory(commandDirectory) !== repositoryDirectory)
        return deny('Git commands must stay within the current Git repository.')
      const commandBranch = gitBranch(commandDirectory)
      if (!commandBranch) return deny('Cannot verify the Git command branch.')
      if (
        ['main', 'master'].includes(commandBranch) &&
        !isReadOnlyOnMain(segment)
      )
        return deny(
          'Only recognized read-only commands are allowed on main/master.'
        )
    }
  }
  if (!['main', 'master'].includes(branch)) return {}

  if (event.tool_name !== 'Bash')
    return deny(
      'File changes are not allowed on main/master; use a feature branch.'
    )
  if (typeof command === 'string' && isReadOnlyOnMain(command)) return {}
  return deny('Only recognized read-only commands are allowed on main/master.')
}

async function main() {
  let input = ''
  for await (const chunk of process.stdin) {
    input += chunk
    if (Buffer.byteLength(input) > maximumInputBytes) {
      process.stdout.write(
        `${JSON.stringify(deny('Hook input exceeds 2 MiB.'))}\n`
      )
      return
    }
  }
  try {
    process.stdout.write(`${JSON.stringify(evaluate(JSON.parse(input)))}\n`)
  } catch {
    process.stdout.write(
      `${JSON.stringify(deny('Hook input could not be evaluated.'))}\n`
    )
  }
}

main()
