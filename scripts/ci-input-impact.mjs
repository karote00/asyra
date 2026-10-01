import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const scalar = (value) => (value.startsWith('"') ? JSON.parse(value) : value)

// Read only Yarn's generated top-level records and dependency edges. No YAML
// evaluation, tags or external parser is needed in the pre-install scope job.
export function readLockGraph(text) {
  const entries = new Map()
  let record
  let dependencies = false
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    if (!line.startsWith(' ')) {
      if (!line.endsWith(':')) throw new Error('Malformed Yarn lock record')
      const key = scalar(line.slice(0, -1))
      record = { body: [], dependencies: [], keys: key.split(', ') }
      for (const descriptor of record.keys) entries.set(descriptor, record)
      dependencies = false
    } else {
      if (!record) throw new Error('Yarn lock entry without owner')
      record.body.push(line)
      if (/^ {2}\S/.test(line)) dependencies = line === '  dependencies:'
      else if (dependencies && /^ {4}\S/.test(line)) {
        const match = line.match(/^ {4}("(?:[^"\\]|\\.)+"|[^:]+): (.+)$/)
        if (!match) throw new Error('Malformed Yarn dependency')
        record.dependencies.push(`${scalar(match[1])}@${scalar(match[2])}`)
      }
    }
  }
  if (!entries.has('__metadata')) throw new Error('Missing Yarn lock metadata')
  return entries
}

function applyResolutions(graph, root) {
  for (const entry of [...new Set(graph.values())]) {
    for (const descriptor of entry.dependencies) {
      const separator = descriptor.lastIndexOf('@')
      const name = descriptor.slice(0, separator)
      const override =
        root.resolutions?.[descriptor] ?? root.resolutions?.[name]
      if (!override) continue
      const target = `${name}@${override.includes(':') ? override : `npm:${override}`}`
      if (!graph.has(target))
        throw new Error(`Unresolved Yarn resolution override: ${target}`)
      graph.set(descriptor, graph.get(target))
    }
  }
  return graph
}

function closure(graph, starts) {
  const result = new Set()
  const visit = (key) => {
    if (result.has(key)) return
    const entry = graph.get(key)
    if (!entry) throw new Error(`Unresolved Yarn dependency: ${key}`)
    result.add(key)
    for (const dependency of entry.dependencies) visit(dependency)
  }
  for (const start of starts) visit(start)
  return result
}

export function rootInputImpact(changedPaths, manifests, options = {}) {
  const result = {
    workspaces: new Set(),
    all: false,
    rootDependencies: [],
    reasons: []
  }
  if (
    !changedPaths.some(
      (file) =>
        ['package.json', 'yarn.lock', 'turbo.json', 'turbo.base.json'].includes(
          file
        ) || file.startsWith('.yarn/patches/')
    )
  )
    return result
  const root = options.repositoryRoot ?? process.cwd()
  const readBase = (file) =>
    options.baseRevision
      ? execFileSync('git', ['show', `${options.baseRevision}:${file}`], {
          cwd: root,
          encoding: 'utf8',
          maxBuffer: 16 * 1024 * 1024
        })
      : fs.readFileSync(path.join(root, file), 'utf8')
  const changes = options.inputChanges ?? {}
  const baseRoot = changes.baseRoot ?? JSON.parse(readBase('package.json'))
  const headRoot =
    changes.headRoot ??
    JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  for (const file of ['turbo.json', 'turbo.base.json']) {
    if (!changedPaths.includes(file)) continue
    const before = JSON.parse(readBase(file))
    const after = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
    for (const key of new Set([
      ...Object.keys(before),
      ...Object.keys(after)
    ])) {
      if (
        key === 'tasks' ||
        JSON.stringify(before[key]) === JSON.stringify(after[key])
      )
        continue
      result.all = true
      result.reasons.push(`${file}:${key}`)
    }
    for (const task of new Set([
      ...Object.keys(before.tasks ?? {}),
      ...Object.keys(after.tasks ?? {})
    ])) {
      if (
        JSON.stringify(before.tasks?.[task]) ===
        JSON.stringify(after.tasks?.[task])
      )
        continue
      const relevant = [...manifests.values()].filter(
        (workspace) =>
          task.startsWith(`${workspace.name}#`) ||
          [workspace.buildTask, workspace.testTask].includes(task)
      )
      for (const workspace of relevant) result.workspaces.add(workspace.name)
      result.reasons.push(`${file}:tasks.${task}`)
    }
  }
  if (changedPaths.includes('package.json')) {
    if (
      baseRoot.scripts?.['react:build'] !== headRoot.scripts?.['react:build']
    ) {
      result.all = true
      result.reasons.push('package.json:scripts.react:build')
    }

    for (const key of [
      'workspaces',
      'engines',
      'packageManager',
      'installConfig'
    ]) {
      if (JSON.stringify(baseRoot[key]) !== JSON.stringify(headRoot[key])) {
        result.all = true
        result.reasons.push(`package.json:${key}`)
      }
    }
    for (const key of [
      'dependencies',
      'devDependencies',
      'optionalDependencies'
    ]) {
      for (const name of new Set([
        ...Object.keys(baseRoot[key] ?? {}),
        ...Object.keys(headRoot[key] ?? {})
      ])) {
        if (baseRoot[key]?.[name] !== headRoot[key]?.[name])
          result.rootDependencies.push(name)
      }
    }
  }
  if (
    changedPaths.includes('yarn.lock') ||
    changedPaths.some((file) => file.startsWith('.yarn/patches/')) ||
    JSON.stringify(baseRoot.resolutions) !==
      JSON.stringify(headRoot.resolutions)
  ) {
    const base = applyResolutions(
      readLockGraph(changes.baseLock ?? readBase('yarn.lock')),
      baseRoot
    )
    const head = applyResolutions(
      readLockGraph(
        changes.headLock ??
          fs.readFileSync(path.join(root, 'yarn.lock'), 'utf8')
      ),
      headRoot
    )
    const changed = new Set(
      [...new Set([...base.keys(), ...head.keys()])].filter((key) => {
        if (key === '__metadata') return false
        if (
          changedPaths.some(
            (file) =>
              file.startsWith('.yarn/patches/') &&
              decodeURIComponent(key).includes(file)
          )
        )
          return true
        return (
          JSON.stringify(base.get(key)?.body) !==
          JSON.stringify(head.get(key)?.body)
        )
      })
    )
    for (const workspace of manifests.values()) {
      for (const graph of [base, head]) {
        const starts = [...graph.keys()].filter(
          (key) => key === `${workspace.name}@workspace:${workspace.directory}`
        )
        if (!starts.length) continue // Added/removed workspaces are visited in the other snapshot.
        const dependencies = closure(graph, starts)
        if ([...dependencies].some((key) => changed.has(key)))
          result.workspaces.add(workspace.name)
      }
    }
    for (const graph of [base, head]) {
      for (const name of Object.keys({
        ...baseRoot.dependencies,
        ...baseRoot.devDependencies,
        ...headRoot.dependencies,
        ...headRoot.devDependencies
      })) {
        const rootEntries = [...new Set(graph.values())].filter((entry) =>
          entry.keys.some((key) => key.endsWith('@workspace:.'))
        )
        const starts = rootEntries.flatMap((entry) =>
          entry.dependencies.filter((key) => key.startsWith(`${name}@`))
        )
        if (
          starts.length &&
          [...closure(graph, starts)].some((key) => changed.has(key))
        )
          result.rootDependencies.push(name)
      }
    }
    if (changed.size)
      result.reasons.push('yarn.lock:resolved-dependency-closure')
  }
  // Compiler/build runner changes really affect every workspace. Test/lint-only
  // root dependencies select repository contracts, not browser product suites.
  if (
    result.rootDependencies.some((name) =>
      ['typescript', 'turbo'].includes(name)
    )
  )
    result.all = true
  result.rootDependencies = [...new Set(result.rootDependencies)].sort()
  return result
}
