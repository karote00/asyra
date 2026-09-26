import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const appOwners = new Map([
  ['@asyra/asyra-design', 'design'],
  ['@asyra/asyra-sim', 'sim'],
  ['@asyra/asyra-framework-site', 'website']
])
const frameworkConsumers = new Set(['@asyra/fieldscope', '@asyra/starter-app'])
const categories = ['framework', 'design', 'sim', 'website', 'tools']
const sharedPaths = new Set([
  'package.json',
  'yarn.lock',
  '.yarnrc.yml',
  'turbo.base.json',
  'turbo.json',
  'eslint.config.js',
  'eslint.config.mjs',
  'tsconfig.json',
  'scripts/gen-turbo.js'
])
const rootDocumentationPaths = new Set([
  'README.md',
  'SUPPORT.md',
  'SECURITY.md',
  'LICENSE',
  'CHANGELOG.md',
  'RELEASE_NOTES.md',
  'AGENTS.md'
])
const frameworkReleaseInputs = new Set([
  'scripts/framework-release-artifacts.js',
  'scripts/framework-release-packages.js',
  'scripts/release-package-artifacts.js',
  'scripts/release-packages.mjs',
  'scripts/release-readiness.js',
  'scripts/release-records.js',
  'scripts/release-template-readiness.js',
  'scripts/release-validate.js',
  'scripts/release-validation-environment.js',
  'scripts/release-validation-workspace.js'
])

function readWorkspaceManifests(root) {
  const manifests = new Map()
  for (const group of ['packages', 'apps', 'tools', 'create-app']) {
    const directory = path.join(root, group)
    if (!fs.existsSync(directory)) continue
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const manifestPath = path.join(directory, entry.name, 'package.json')
      if (!fs.existsSync(manifestPath)) continue
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      if (
        typeof manifest.name !== 'string' ||
        !/^(?:@[a-z0-9][a-z0-9-]*\/)?[a-z0-9][a-z0-9-]*$/.test(manifest.name)
      )
        throw new Error(
          `Workspace manifest has an invalid name: ${manifestPath}`
        )
      manifests.set(manifest.name, {
        name: manifest.name,
        directory: `${group}/${entry.name}`,
        buildTask: [
          `build:${manifest.name.split('/').pop()}`,
          'react:build',
          'build'
        ].find((task) => manifest.scripts?.[task]),
        dependencies: new Set([
          ...Object.keys(manifest.dependencies ?? {}),
          ...Object.keys(manifest.devDependencies ?? {}),
          ...Object.keys(manifest.peerDependencies ?? {})
        ])
      })
    }
  }
  return manifests
}

function workspaceForPath(changedPath, manifests) {
  const matches = [...manifests.values()]
    .filter(
      (workspace) =>
        changedPath.startsWith(workspace.directory + '/') ||
        changedPath === workspace.directory
    )
    .sort((left, right) => right.directory.length - left.directory.length)
  return matches[0]
}

function downstreamWorkspaces(changedNames, manifests) {
  const affected = new Set(changedNames)
  let changed = true
  while (changed) {
    changed = false
    for (const workspace of manifests.values()) {
      if (
        !affected.has(workspace.name) &&
        [...workspace.dependencies].some((dependency) =>
          affected.has(dependency)
        )
      ) {
        affected.add(workspace.name)
        changed = true
      }
    }
  }
  return affected
}

function classifyChanges(changedPaths, manifests) {
  const selected = new Set()
  const changedWorkspaces = new Set()
  const documentationWorkspaces = new Set()
  const websiteDocumentationWorkspaces = new Set()
  const unknownPaths = []
  const releaseReadinessInputs = new Set()
  let allCategories = false

  for (const changedPath of changedPaths) {
    const workspace = workspaceForPath(changedPath, manifests)
    if (workspace) {
      changedWorkspaces.add(workspace.name)
      if (
        workspace.name.startsWith('@asyra/') &&
        workspace.directory.startsWith('packages/')
      )
        selected.add('framework')
      else if (appOwners.has(workspace.name))
        selected.add(appOwners.get(workspace.name))
      else if (frameworkConsumers.has(workspace.name)) selected.add('framework')
      else if (workspace.directory.startsWith('tools/')) selected.add('tools')
      else if (workspace.directory.startsWith('create-app/'))
        selected.add('framework')
      else unknownPaths.push(changedPath)
      continue
    }

    if (
      sharedPaths.has(changedPath) ||
      changedPath.startsWith('.github/workflows/')
    ) {
      allCategories = true
      continue
    }
    if (changedPath.startsWith('.changeset/')) {
      selected.add('framework')
      selected.add('tools')
      continue
    }
    if (rootDocumentationPaths.has(changedPath)) {
      selected.add('framework')
      continue
    }
    if (frameworkReleaseInputs.has(changedPath)) {
      releaseReadinessInputs.add(changedPath)
    }
    if (/^(scripts|\.github|\.yarn|docs\/ai\/tools)\//.test(changedPath)) {
      selected.add('tools')
      if (changedPath.startsWith('docs/ai/tools/flow-inspector/'))
        documentationWorkspaces.add('@asyra/flow-inspector')
      continue
    }
    if (changedPath.startsWith('docs/ai/framework/')) {
      selected.add('framework')
      continue
    }
    if (changedPath.startsWith('docs/ai/workflows/')) {
      selected.add('framework')
      continue
    }
    if (changedPath.startsWith('docs/ai/apps/asyra-design/')) {
      selected.add('design')
      continue
    }
    if (changedPath.startsWith('docs/ai/apps/asyra-sim/')) {
      selected.add('sim')
      continue
    }
    if (changedPath.startsWith('docs/ai/apps/fieldscope/')) {
      selected.add('framework')
      continue
    }
    if (/^(docs\/public|apps\/asyra-framework-site)\//.test(changedPath)) {
      selected.add('website')
      if (changedPath.startsWith('docs/public/'))
        websiteDocumentationWorkspaces.add('@asyra/asyra-framework-site')
      continue
    }
    unknownPaths.push(changedPath)
  }

  if (allCategories) for (const category of categories) selected.add(category)
  const affectedWorkspaces = downstreamWorkspaces(changedWorkspaces, manifests)
  for (const name of affectedWorkspaces) {
    const workspace = manifests.get(name)
    if (
      workspace?.directory.startsWith('apps/') &&
      !appOwners.has(name) &&
      !frameworkConsumers.has(name)
    )
      unknownPaths.push(`Unclassified app consumer: ${name}`)
  }
  if (allCategories || unknownPaths.length || changedPaths.length === 0)
    for (const name of manifests.keys()) affectedWorkspaces.add(name)
  for (const name of affectedWorkspaces) {
    const category = appOwners.get(name)
    if (category) selected.add(category)
  }
  if (unknownPaths.length)
    for (const category of categories) selected.add(category)
  if (changedPaths.length === 0)
    for (const category of categories) selected.add(category)

  const workspacesByCategory = Object.fromEntries(
    categories.map((category) => [
      category,
      [
        ...affectedWorkspaces,
        ...documentationWorkspaces,
        ...websiteDocumentationWorkspaces
      ]
        .filter((name, index, allNames) => allNames.indexOf(name) === index)
        .filter((name) => {
          const workspace = manifests.get(name)
          if (category === 'framework')
            return (
              workspace?.directory.startsWith('packages/') ||
              frameworkConsumers.has(name)
            )
          if (category === 'tools')
            return workspace?.directory.startsWith('tools/')
          return appOwners.get(name) === category
        })
        .sort()
    ])
  )
  for (const category of ['framework', 'design', 'sim', 'website'])
    for (const name of workspacesByCategory[category])
      if (!manifests.get(name)?.buildTask)
        unknownPaths.push(`Workspace has no canonical build task: ${name}`)
  const buildTasksByCategory = Object.fromEntries(
    categories.map((category) => [
      category,
      workspacesByCategory[category]
        .map((name) => manifests.get(name))
        .filter((workspace) => workspace?.buildTask)
        .map(({ name, buildTask }) => ({ workspace: name, task: buildTask }))
    ])
  )
  const frameworkPackages = [...affectedWorkspaces]
    .filter((name) => manifests.get(name)?.directory.startsWith('packages/'))
    .sort()
  const createAppPackages = [...affectedWorkspaces]
    .filter((name) => manifests.get(name)?.directory.startsWith('create-app/'))
    .map((name) => manifests.get(name).directory)
    .sort()
  const frameworkReleaseRequired =
    frameworkPackages.length > 0 || releaseReadinessInputs.size > 0

  return {
    categories: categories.filter((category) => selected.has(category)),
    changedWorkspaces: [...changedWorkspaces].sort(),
    affectedWorkspaces: [...affectedWorkspaces].sort(),
    workspacesByCategory,
    buildTasksByCategory,
    frameworkPackages,
    createAppPackages,
    frameworkReleaseRequired,
    unknownPaths: [...unknownPaths].sort()
  }
}

function loadChangedPaths(base, head) {
  if (/^0{40}$/.test(base ?? '')) return []
  if (!/^[a-f0-9]{40}$/.test(base ?? '') || !/^[a-f0-9]{40}$/.test(head ?? ''))
    throw new Error('CI scope requires full base and head commit identities')
  return execFileSync(
    'git',
    ['diff', '--no-renames', '--name-only', '-z', `${base}...${head}`],
    {
      encoding: 'utf8'
    }
  )
    .split('\0')
    .filter(Boolean)
}

function main() {
  const root = process.cwd()
  const base = process.env.CI_SCOPE_BASE
  const head = process.env.CI_SCOPE_HEAD
  const changedPaths = loadChangedPaths(
    process.env.CI_SCOPE_DIFF_BASE ?? base,
    head
  )
  const classification = classifyChanges(
    changedPaths,
    readWorkspaceManifests(root)
  )
  const evidence = {
    version: 1,
    identity: {
      repository: process.env.GITHUB_REPOSITORY ?? 'local',
      base,
      head,
      integration: execFileSync('git', ['rev-parse', 'HEAD'], {
        encoding: 'utf8'
      }).trim(),
      run: process.env.GITHUB_RUN_ID ?? 'local',
      attempt: process.env.GITHUB_RUN_ATTEMPT ?? 'local'
    },
    ...classification
  }
  const outputPath = process.env.GITHUB_OUTPUT
  if (outputPath) {
    fs.appendFileSync(outputPath, `evidence=${JSON.stringify(evidence)}\n`)
    for (const category of categories) {
      fs.appendFileSync(
        outputPath,
        `${category}=${classification.categories.includes(category)}\n`
      )
      fs.appendFileSync(
        outputPath,
        `${category}_workspaces=${classification.workspacesByCategory[category].join(' ')}\n`
      )
      fs.appendFileSync(
        outputPath,
        `${category}_build_tasks=${classification.buildTasksByCategory[category]
          .map(({ task }) => task)
          .join(' ')}\n`
      )
    }
    fs.appendFileSync(
      outputPath,
      `framework_packages=${classification.frameworkPackages.join(' ')}\n`
    )
    fs.appendFileSync(
      outputPath,
      `framework_release_required=${classification.frameworkReleaseRequired}\n`
    )
    fs.appendFileSync(
      outputPath,
      `create_app_packages=${classification.createAppPackages.join(' ')}\n`
    )
    fs.appendFileSync(
      outputPath,
      `unknown=${classification.unknownPaths.length > 0}\n`
    )
  }
  console.log(JSON.stringify(evidence))
  if (classification.unknownPaths.length) process.exitCode = 1
}

export { classifyChanges, readWorkspaceManifests }

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
)
  main()
