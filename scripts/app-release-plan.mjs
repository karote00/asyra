import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

// Public project identities are deliberately separate from release-state schema.
export const RELEASE_APPS = Object.freeze([
  { id: 'asyra-sim', root: 'apps/asyra-sim', host: 'asyra-sim.vercel.app' },
  {
    id: 'asyra-design',
    root: 'apps/asyra-design',
    host: 'asyra-design.vercel.app'
  },
  {
    id: 'asyra-framework',
    root: 'apps/asyra-framework-site',
    host: 'asyra-framework.vercel.app'
  }
])
export const RELEASE_SCHEMA = 1
export const RELEASE_RESERVE = 6
export const RELEASE_DAILY_LIMIT = 12

export function requireCommit(sha) {
  assert.match(sha, /^[a-f0-9]{40}$/, 'Expected a full Git commit SHA')
  return sha
}

export function git(args, cwd = process.cwd()) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024
  }).trimEnd()
}

export function readSnapshot(sha, cwd) {
  requireCommit(sha)
  const paths = git(['ls-tree', '-r', '--name-only', sha], cwd).split('\n')
  return paths
    .filter((file) =>
      /^(apps|packages|tools|create-app)\/[^/]+\/package.json$/.test(file)
    )
    .map((file) => ({
      root: file.slice(0, -'/package.json'.length),
      ...JSON.parse(git(['show', `${sha}:${file}`], cwd))
    }))
}

export function dependencyRoots(snapshot, appRoot) {
  const byName = new Map(snapshot.map((entry) => [entry.name, entry]))
  const app = snapshot.find((entry) => entry.root === appRoot)
  assert.ok(app, `Missing workspace ${appRoot}`)
  const roots = new Set()
  function visit(entry) {
    if (roots.has(entry.root)) return
    roots.add(entry.root)
    for (const name of Object.keys({
      ...entry.dependencies,
      ...entry.devDependencies,
      ...entry.peerDependencies,
      ...entry.optionalDependencies
    })) {
      if (byName.has(name)) visit(byName.get(name))
    }
  }
  visit(app)
  return roots
}

export function affectsApp(file, app, roots) {
  if (app.id === 'asyra-framework' && file.startsWith('docs/public/'))
    return true
  if (/^(docs\/ai\/|\.changeset\/|\.github\/)/.test(file)) return false
  if (
    /(^|\/)(__tests__|e2e|test-results)\//.test(file) ||
    /\.(test|spec)\.[^.]+$/.test(file)
  )
    return false
  for (const root of roots) {
    if (file.startsWith(`${root}/`)) {
      // Website MD/MDX can be rendered inputs; package READMEs are not runtime.
      return !/\.md$/.test(file) || root === 'apps/asyra-framework-site'
    }
  }
  if (/^(apps|packages|tools|create-app)\//.test(file)) return false
  if (
    /^docs\//.test(file) ||
    /^(README|LICENSE|AGENTS|SKILLS)(\.|$)/.test(file)
  )
    return false
  // Unknown root inputs fail conservatively: lockfile, toolchain, scripts, config.
  return true
}

export function createReleasePlan({
  sha,
  baselines,
  forceApp = '',
  reason = '',
  cwd,
  snapshot = readSnapshot,
  diff = (base, head) =>
    git(['diff', '--name-only', '--no-renames', base, head, '--'], cwd)
      .split('\n')
      .filter(Boolean),
  ancestor = (base, head) =>
    git(['merge-base', '--is-ancestor', base, head], cwd)
}) {
  requireCommit(sha)
  assert.ok(
    !forceApp || RELEASE_APPS.some((app) => app.id === forceApp),
    'Unknown forced App'
  )
  assert.ok(
    !forceApp ||
      (reason.trim().length >= 8 &&
        reason.length <= 200 &&
        !/[\r\n]/.test(reason)),
    'A forced release needs an 8-200 character single-line reason'
  )
  // Snapshot and diff products are owned by this invocation, once per distinct SHA.
  const snapshots = new Map()
  const changes = new Map()
  const read = (ref) => {
    if (!snapshots.has(ref)) snapshots.set(ref, snapshot(ref, cwd))
    return snapshots.get(ref)
  }
  const apps = RELEASE_APPS.map((app) => {
    const baseline = baselines[app.id]
    assert.ok(
      baseline,
      `Missing online baseline for ${app.id}; reconcile before release`
    )
    requireCommit(baseline.sha)
    ancestor(baseline.sha, sha)
    const roots = new Set([
      ...dependencyRoots(read(sha), app.root),
      ...dependencyRoots(read(baseline.sha), app.root)
    ])
    if (!changes.has(baseline.sha))
      changes.set(baseline.sha, diff(baseline.sha, sha))
    const inputs = changes
      .get(baseline.sha)
      .filter((file) => affectsApp(file, app, roots))
    return {
      ...app,
      baseline,
      inputs,
      release: inputs.length > 0 || forceApp === app.id,
      forced: forceApp === app.id
    }
  })
  return { schema: RELEASE_SCHEMA, sha, reason, apps }
}

export function assertBudget({ total, managed, requested }) {
  assert.ok(
    Number.isInteger(total) &&
      Number.isInteger(managed) &&
      total >= 0 &&
      managed >= 0,
    'Unknown deployment usage'
  )
  assert.ok(
    total + requested + RELEASE_RESERVE <= 100,
    'Owner daily limit would consume the repair reserve'
  )
  assert.ok(
    managed + requested <= RELEASE_DAILY_LIMIT,
    'Manual release daily budget exhausted'
  )
}
