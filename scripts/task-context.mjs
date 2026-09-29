import { execFileSync } from 'node:child_process'
import { readFileSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const modes = ['standalone', 'plan-task', 'plan-closeout']
const shaPattern = /^[a-f0-9]{40}$/

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}

function text(value, field) {
  requireValue(
    typeof value === 'string' && value.trim().length > 0,
    `${field} is required`
  )
  return value
}

export function documentPath(value, field = 'plan.path') {
  text(value, field)
  requireValue(
    /^docs\/ai\/(framework|apps\/[a-z0-9-]+|tools\/[a-z0-9-]+)\//.test(value) &&
      value.endsWith('.md') &&
      !value.split('/').some((part) => ['', '.', '..'].includes(part)) &&
      !value.includes('\\') &&
      ![...value].some((character) => character.charCodeAt(0) < 32),
    `${field} must be a repository-relative owner document path`
  )
  return value
}

export function validateContext(input) {
  requireValue(
    input && typeof input === 'object' && !Array.isArray(input),
    'Task context must be an object'
  )
  requireValue(input.version === 1, 'Task context version must be 1')
  requireValue(
    modes.includes(input.mode),
    'Explicit mode required: standalone, plan-task or plan-closeout'
  )
  text(input.objective, 'objective')
  text(input.base?.ref, 'base.ref')
  requireValue(
    shaPattern.test(input.base?.sha ?? ''),
    'base.sha must be a full commit SHA'
  )
  requireValue(
    Array.isArray(input.prerequisites) &&
      input.prerequisites.every((sha) => shaPattern.test(sha)),
    'prerequisites must be an explicit array of full commit SHAs'
  )
  if (input.mode === 'standalone') {
    requireValue(
      input.plan === undefined,
      'Standalone tasks cannot carry or discard a plan association'
    )
  } else {
    documentPath(input.plan?.path)
    requireValue(
      /^docs\/ai\/(framework|apps\/[a-z0-9-]+|tools\/[a-z0-9-]+)\/plans\/(?!completed\/)/.test(
        input.plan.path
      ),
      'plan.path must identify the original active plan'
    )
    requireValue(
      /^#{1,6} \S[^\r\n]*$/.test(input.plan.section ?? ''),
      'plan.section must be an exact Markdown heading'
    )
    text(input.plan.closeoutOwner, 'plan.closeoutOwner')
  }
  return structuredClone(input)
}

export function parseContext(body) {
  const blocks = [
    ...(body ?? '').matchAll(/^```task-context\s*\n([\s\S]*?)^```\s*$/gm)
  ]
  requireValue(
    blocks.length === 1,
    'Exactly one task-context block is required'
  )
  return validateContext(JSON.parse(blocks[0][1]))
}

export function renderContext(context) {
  return `\`\`\`task-context\n${JSON.stringify(validateContext(context), null, 2)}\n\`\`\``
}

export function inheritContext(parentInput, selection) {
  const parent = validateContext(parentInput)
  requireValue(
    selection && typeof selection === 'object',
    'Child selection is required'
  )
  requireValue(
    selection.plan === undefined && selection.mode === undefined,
    'Child selection cannot override plan association or mode'
  )
  const child = {
    version: 1,
    mode: parent.mode === 'standalone' ? 'standalone' : 'plan-task',
    objective: selection.objective,
    base: selection.base ?? parent.base,
    prerequisites: [
      ...new Set([...parent.prerequisites, ...(selection.prerequisites ?? [])])
    ]
  }
  if (parent.plan)
    child.plan = {
      ...parent.plan,
      section: text(selection.section, 'child section')
    }
  return validateContext(child)
}

export function assertPlanSection(content, context) {
  const matches = content
    .split(/\r?\n/)
    .filter((line) => line === context.plan.section)
  requireValue(
    matches.length === 1,
    'Plan section must exist exactly once; read the selected task contract before editing'
  )
}

export function preflight(contextInput, root = process.cwd()) {
  const context = validateContext(contextInput)
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim()
  const branch = git('branch', '--show-current')
  requireValue(
    branch && !['main', 'master'].includes(branch),
    'A feature branch is required'
  )
  for (const sha of [context.base.sha, ...context.prerequisites]) {
    try {
      git('merge-base', '--is-ancestor', sha, 'HEAD')
      git('merge-base', '--is-ancestor', sha, context.base.sha)
    } catch {
      throw new Error(
        `Required base/prerequisite is not integrated in the selected base and HEAD: ${sha}`
      )
    }
  }
  if (context.plan) {
    let basePlan
    try {
      basePlan = git('show', `${context.base.sha}:${context.plan.path}`)
    } catch {
      throw new Error(
        'Plan must already exist in the selected base; do not import an unmerged plan'
      )
    }
    assertPlanSection(basePlan, context)
    const realRoot = realpathSync(root)
    const planFile = realpathSync(path.join(root, context.plan.path))
    requireValue(
      planFile.startsWith(`${realRoot}${path.sep}`),
      'Plan symlinks cannot escape the checkout'
    )
    assertPlanSection(readFileSync(planFile, 'utf8'), context)
  }
  return context
}

export function handoff(context) {
  validateContext(context)
  const selection = context.plan
    ? `Read ${context.plan.path}, section ${JSON.stringify(context.plan.section)}. Whole-plan closeout owner: ${context.plan.closeoutOwner}.`
    : 'This task is explicitly standalone.'
  return `${selection}\nFollow AGENTS.md. Run task-context preflight in the selected checkout before editing. Read the actual contract, prerequisites and acceptance criteria; metadata alone does not authorize work or remote operations. Preserve this context in the PR body.\n\n${renderContext(context)}\n`
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const [command, contextFile, selectionFile] = process.argv.slice(2)
    const input = JSON.parse(readFileSync(contextFile, 'utf8'))
    if (command === 'check') {
      preflight(input)
      process.stdout.write(
        'Task context preflight passed. Read the selected contract before editing.\n'
      )
    } else if (command === 'handoff') {
      process.stdout.write(handoff(preflight(input)))
    } else if (command === 'child') {
      const child = inheritContext(
        input,
        JSON.parse(readFileSync(selectionFile, 'utf8'))
      )
      process.stdout.write(handoff(preflight(child)))
    } else
      throw new Error(
        'Usage: node scripts/task-context.mjs check|handoff <context.json> OR child <parent.json> <selection.json>'
      )
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
