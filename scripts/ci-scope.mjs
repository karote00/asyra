import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const relationshipPolicy = JSON.parse(
  fs.readFileSync(path.join(scriptDirectory, 'ci-relationships.json'), 'utf8')
)
const workspaceNamePattern = /^(?:@[a-z0-9][a-z0-9-]*\/)?[a-z0-9][a-z0-9-]*$/
const workspaceBuildTaskCandidates = (name) => [
  `build:${name.split('/').pop()}`,
  'react:build',
  'build'
]

function workspaceEntry(group, slug, manifest) {
  if (
    typeof manifest.name !== 'string' ||
    !workspaceNamePattern.test(manifest.name)
  )
    throw new Error(
      `Workspace manifest has an invalid name: ${group}/${slug}/package.json`
    )
  const scripts = manifest.scripts ?? {}
  return {
    name: manifest.name,
    directory: `${group}/${slug}`,
    group,
    buildTask: workspaceBuildTaskCandidates(manifest.name).find(
      (task) => scripts[task]
    ),
    testTask: scripts['test:ci'] ? 'test:ci' : undefined,
    dependencies: new Set([
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}),
      ...Object.keys(manifest.optionalDependencies ?? {})
    ])
  }
}

function readWorkspaceManifests(root) {
  const manifests = new Map()
  for (const group of relationshipPolicy.workspaceRoots) {
    const directory = path.join(root, group)
    if (!fs.existsSync(directory)) continue
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const manifestPath = path.join(directory, entry.name, 'package.json')
      if (!fs.existsSync(manifestPath)) continue
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      const workspace = workspaceEntry(group, entry.name, manifest)
      if (manifests.has(workspace.name))
        throw new Error(`Duplicate workspace name: ${workspace.name}`)
      manifests.set(workspace.name, workspace)
    }
  }
  return manifests
}

function readWorkspaceManifestsAtCommit(commit, repositoryRoot) {
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) return new Map()
  const files = execFileSync(
    'git',
    [
      'ls-tree',
      '-r',
      '--name-only',
      '-z',
      commit,
      '--',
      ...relationshipPolicy.workspaceRoots
    ],
    { cwd: repositoryRoot, encoding: 'utf8' }
  )
    .split('\0')
    .filter((file) =>
      relationshipPolicy.workspaceRoots.some((group) =>
        new RegExp(`^${group}/[^/]+/package\\.json$`).test(file)
      )
    )
  const manifests = new Map()
  for (const file of files) {
    const [, group, slug] =
      file.match(/^([^/]+)\/([^/]+)\/package\.json$/) ?? []
    if (!group || relationshipPolicy.excludedRoots[group]) continue
    const manifest = JSON.parse(
      execFileSync('git', ['show', `${commit}:${file}`], {
        cwd: repositoryRoot,
        encoding: 'utf8'
      })
    )
    const workspace = workspaceEntry(group, slug, manifest)
    if (manifests.has(workspace.name))
      throw new Error(`Duplicate baseline workspace name: ${workspace.name}`)
    manifests.set(workspace.name, workspace)
  }
  return manifests
}

function readCreateAppManifests(root) {
  const group = Object.keys(relationshipPolicy.excludedRoots)[0]
  const directory = path.join(root, group)
  if (!fs.existsSync(directory)) return new Map()
  const manifests = new Map()
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const manifestPath = path.join(directory, entry.name, 'package.json')
    if (!fs.existsSync(manifestPath)) continue
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    if (typeof manifest.name === 'string')
      manifests.set(manifest.name, {
        name: manifest.name,
        directory: `${group}/${entry.name}`
      })
  }
  return manifests
}

function readCreateAppManifestsAtCommit(commit, repositoryRoot) {
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) return new Map()
  const group = Object.keys(relationshipPolicy.excludedRoots)[0]
  const files = execFileSync(
    'git',
    ['ls-tree', '-r', '--name-only', '-z', commit, '--', group],
    { cwd: repositoryRoot, encoding: 'utf8' }
  )
    .split('\0')
    .filter((file) => new RegExp(`^${group}/[^/]+/package\\.json$`).test(file))
  const manifests = new Map()
  for (const file of files) {
    const [, slug] =
      file.match(new RegExp(`^${group}/([^/]+)/package\\.json$`)) ?? []
    const manifest = JSON.parse(
      execFileSync('git', ['show', `${commit}:${file}`], {
        cwd: repositoryRoot,
        encoding: 'utf8'
      })
    )
    if (typeof manifest.name === 'string')
      manifests.set(manifest.name, {
        name: manifest.name,
        directory: `${group}/${slug}`
      })
  }
  return manifests
}

function readDocumentationDirectories(root) {
  const directory = path.join(root, 'docs')
  if (!fs.existsSync(directory)) return []
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `docs/${entry.name}`)
    .sort()
}

function readDocumentationDirectoriesAtCommit(commit, repositoryRoot) {
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) return []
  return execFileSync('git', ['ls-tree', '-z', commit, '--', 'docs/'], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  })
    .split('\0')
    .filter(Boolean)
    .filter((entry) => entry.startsWith('040000 tree '))
    .map((entry) => entry.slice(entry.indexOf('\t') + 1))
    .filter((entry) => /^docs\/[^/]+$/.test(entry))
    .sort()
}

function workspaceForPath(changedPath, manifests) {
  return [...manifests.values()]
    .filter(
      (workspace) =>
        changedPath === workspace.directory ||
        changedPath.startsWith(workspace.directory + '/')
    )
    .sort((left, right) => right.directory.length - left.directory.length)[0]
}

function matchesPattern(changedPath, pattern) {
  const expression = pattern
    .split(/(\*\*|\{slug\})/)
    .map((part) => {
      if (part === '**') return '.*'
      if (part === '{slug}') return '([a-z0-9]+(?:-[a-z0-9]+)*)'
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('')
  const match = changedPath.match(new RegExp(`^${expression}$`))
  return match ? { matched: true, slug: match[1] } : { matched: false }
}

function manifestGraph(headManifests, baseManifests) {
  const allNames = new Set([...headManifests.keys(), ...baseManifests.keys()])
  const edges = new Map()
  for (const source of ['base', 'head']) {
    const manifests = source === 'base' ? baseManifests : headManifests
    for (const workspace of manifests.values()) {
      for (const dependency of workspace.dependencies) {
        if (!allNames.has(dependency)) continue
        const key = `${dependency}\0${workspace.name}`
        const sources = edges.get(key) ?? new Set()
        sources.add(source)
        edges.set(key, sources)
      }
    }
  }
  return [...edges]
    .map(([key, sources]) => {
      const [dependency, consumer] = key.split('\0')
      return { dependency, consumer, sources: [...sources].sort() }
    })
    .sort((left, right) =>
      `${left.dependency}\0${left.consumer}`.localeCompare(
        `${right.dependency}\0${right.consumer}`
      )
    )
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function classifyChanges(
  changedPaths,
  headManifests,
  baseManifests = headManifests,
  createAppManifests = new Map(),
  baseCreateAppManifests = createAppManifests,
  documentationRoots = readDocumentationDirectories(process.cwd()),
  baseDocumentationRoots = documentationRoots
) {
  const unknownPaths = []
  const changedWorkspaceNames = new Set()
  const changedCreateAppDirectories = new Set()
  const releasePaths = new Set(
    relationshipPolicy.frameworkReleaseReadinessPaths
  )
  const allManifestViews = [headManifests, baseManifests]
  const createAppViews = [createAppManifests, baseCreateAppManifests]
  const recognizedDocumentationRoots = new Set([
    ...documentationRoots,
    ...baseDocumentationRoots
  ])
  const sharedInputs = new Set(relationshipPolicy.sharedInputPaths)
  let selectEveryWorkspace = changedPaths.length === 0
  let frameworkReleaseRequired = false

  for (const changedPath of changedPaths) {
    const workspace = allManifestViews
      .map((manifests) => workspaceForPath(changedPath, manifests))
      .find(Boolean)
    if (workspace) {
      changedWorkspaceNames.add(workspace.name)
      if (workspace.group === 'packages') frameworkReleaseRequired = true
      continue
    }

    const createApp = createAppViews
      .map((manifests) => workspaceForPath(changedPath, manifests))
      .find(Boolean)
    if (createApp) {
      changedCreateAppDirectories.add(createApp.directory)
      continue
    }

    if (sharedInputs.has(changedPath)) {
      selectEveryWorkspace = true
      continue
    }
    if (
      relationshipPolicy.sharedInputPatterns.some(
        (pattern) => matchesPattern(changedPath, pattern).matched
      )
    ) {
      selectEveryWorkspace = true
      continue
    }
    if (relationshipPolicy.rootDocumentationPaths.includes(changedPath))
      continue

    let matchedSharedContract = false
    for (const pattern of relationshipPolicy.sharedValidationPatterns) {
      if (matchesPattern(changedPath, pattern).matched) {
        matchedSharedContract = true
        break
      }
    }
    if (matchedSharedContract) {
      if (changedPath.startsWith('.changeset/')) {
        const tool = [...headManifests.values()].find(
          ({ directory }) => directory === 'tools/flow-inspector'
        )
        if (tool) changedWorkspaceNames.add(tool.name)
      }
      continue
    }

    const releasePath = [...releasePaths].some(
      (pattern) => matchesPattern(changedPath, pattern).matched
    )
    if (releasePath) frameworkReleaseRequired = true

    let matchedWorkspaceInput = false
    for (const rule of relationshipPolicy.workspaceInputRules) {
      const matched = matchesPattern(changedPath, rule.pattern)
      if (!matched.matched) continue
      const directory = rule.workspaceDirectory.replace('{slug}', matched.slug)
      const consumer = [...headManifests.values()].find(
        (entry) => entry.directory === directory
      )
      if (!consumer) {
        unknownPaths.push(
          `Unresolved CI input consumer: ${changedPath} -> ${directory}`
        )
      } else {
        changedWorkspaceNames.add(consumer.name)
      }
      matchedWorkspaceInput = true
      break
    }
    if (matchedWorkspaceInput) continue

    if (
      changedPath.startsWith('docs/') &&
      (recognizedDocumentationRoots.has(
        changedPath.split('/').slice(0, 2).join('/')
      ) ||
        /^docs\/[^/]+$/.test(changedPath))
    )
      continue

    if (releasePath) continue
    unknownPaths.push(changedPath)
  }

  const dependencyEdges = manifestGraph(headManifests, baseManifests)
  const affectedNames = new Set(changedWorkspaceNames)
  if (selectEveryWorkspace)
    for (const name of headManifests.keys()) affectedNames.add(name)

  let changed = true
  while (changed) {
    changed = false
    for (const { dependency, consumer } of dependencyEdges) {
      if (affectedNames.has(dependency) && !affectedNames.has(consumer)) {
        affectedNames.add(consumer)
        changed = true
      }
    }
  }
  if (unknownPaths.length)
    for (const name of headManifests.keys()) affectedNames.add(name)

  const affectedWorkspaces = [...headManifests.values()]
    .filter(({ name }) => affectedNames.has(name))
    .sort((left, right) => left.name.localeCompare(right.name))
  for (const workspace of affectedWorkspaces) {
    if (!workspace.buildTask)
      unknownPaths.push(
        `Workspace has no canonical build task: ${workspace.name}`
      )
    if (!workspace.testTask)
      unknownPaths.push(
        `Workspace has no canonical CI test task: ${workspace.name}`
      )
  }

  const workspaceMatrix = affectedWorkspaces
    .filter((workspace) => workspace.buildTask && workspace.testTask)
    .map(({ name, directory, buildTask, testTask }) => ({
      name,
      directory,
      buildTask,
      testTask,
      artifactId: crypto
        .createHash('sha256')
        .update(name)
        .digest('hex')
        .slice(0, 16)
    }))
  const changedNames = [...changedWorkspaceNames].sort()
  const affectedNamesInHead = affectedWorkspaces.map(({ name }) => name)
  const frameworkPackages = affectedWorkspaces
    .filter(({ group }) => group === 'packages')
    .map(({ name }) => name)
  if (frameworkPackages.length) frameworkReleaseRequired = true

  const createAppPackages = [...new Set(changedCreateAppDirectories)].sort()
  if (createAppPackages.length === 0) {
    const currentCreateAppPaths = [...createAppManifests.values()].map(
      ({ directory }) => directory
    )
    const baseCreateAppPaths = [...baseCreateAppManifests.values()].map(
      ({ directory }) => directory
    )
    for (const changedPath of changedPaths)
      for (const directory of [...currentCreateAppPaths, ...baseCreateAppPaths])
        if (changedPath.startsWith(directory + '/'))
          changedCreateAppDirectories.add(directory)
  }
  const resolvedCreateAppPackages = [
    ...new Set(changedCreateAppDirectories)
  ].sort()
  const workspaceGraph = [...headManifests.values()]
    .map(({ name, directory, group, buildTask, testTask, dependencies }) => ({
      name,
      directory,
      group,
      buildTask,
      testTask,
      dependencies: [...dependencies]
        .filter((dependency) => headManifests.has(dependency))
        .sort()
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
  const frameworkDeclarationTasks = workspaceGraph
    .filter(({ group }) => group === 'packages')
    .map(({ name, buildTask }) => ({ workspace: name, task: buildTask }))

  const relationshipMap = {
    version: 1,
    workspaceRoots: [...relationshipPolicy.workspaceRoots],
    documentationRoots: [...recognizedDocumentationRoots].sort(),
    excludedRoots: relationshipPolicy.excludedRoots,
    workspaceGraph,
    dependencyEdges,
    frameworkDeclarationTasks,
    changedWorkspaceNames: changedNames,
    affectedWorkspaceNames: affectedNamesInHead,
    workspaceMatrix,
    sharedValidationRequired: true,
    frameworkReleaseRequired,
    createAppPackages: resolvedCreateAppPackages,
    designE2EWorkspaceDirectory: relationshipPolicy.designE2EWorkspaceDirectory,
    designE2ERequired: workspaceMatrix.some(
      ({ directory }) =>
        directory === relationshipPolicy.designE2EWorkspaceDirectory
    ),
    flowInspectorValidationWorkspaceDirectory:
      relationshipPolicy.flowInspectorValidationWorkspaceDirectory,
    flowInspectorValidationRequired: workspaceMatrix.some(
      ({ directory }) =>
        directory ===
        relationshipPolicy.flowInspectorValidationWorkspaceDirectory
    ),
    unknownPaths: [...new Set(unknownPaths)].sort()
  }

  return {
    relationshipMap,
    relationshipMapDigest: digest(relationshipMap),
    affectedWorkspaces: affectedNamesInHead,
    workspaceMatrix,
    workspaceGroups: [
      ...new Set(affectedWorkspaces.map(({ group }) => group))
    ].sort(),
    frameworkPackages,
    createAppPackages: resolvedCreateAppPackages,
    frameworkReleaseRequired,
    designE2ERequired: relationshipMap.designE2ERequired,
    unknownPaths: relationshipMap.unknownPaths
  }
}

function loadChangedPaths(base, head) {
  if (/^0{40}$/.test(base ?? '')) return []
  if (!/^[a-f0-9]{40}$/.test(base ?? '') || !/^[a-f0-9]{40}$/.test(head ?? ''))
    throw new Error('CI scope requires full base and head commit identities')
  return execFileSync(
    'git',
    ['diff', '--no-renames', '--name-only', '-z', `${base}...${head}`],
    { encoding: 'utf8' }
  )
    .split('\0')
    .filter(Boolean)
}

function main() {
  const root = process.cwd()
  const base = process.env.CI_SCOPE_BASE
  const head = process.env.CI_SCOPE_HEAD
  const diffBase = process.env.CI_SCOPE_DIFF_BASE ?? base
  const changedPaths = loadChangedPaths(diffBase, head)
  const classification = classifyChanges(
    changedPaths,
    readWorkspaceManifests(root),
    readWorkspaceManifestsAtCommit(diffBase, root),
    readCreateAppManifests(root),
    readCreateAppManifestsAtCommit(diffBase, root),
    readDocumentationDirectories(root),
    readDocumentationDirectoriesAtCommit(diffBase, root)
  )
  const evidence = {
    version: 2,
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
    fs.appendFileSync(
      outputPath,
      `workspace_matrix=${JSON.stringify(classification.workspaceMatrix)}\n`
    )
    fs.appendFileSync(
      outputPath,
      `relationship_map_digest=${classification.relationshipMapDigest}\n`
    )
    fs.appendFileSync(
      outputPath,
      `framework_declaration_tasks=${classification.relationshipMap.frameworkDeclarationTasks
        .map(({ task }) => task)
        .join(' ')}\n`
    )
    fs.appendFileSync(
      outputPath,
      `framework_release_required=${classification.frameworkReleaseRequired}\n`
    )
    fs.appendFileSync(
      outputPath,
      `design_e2e_required=${classification.designE2ERequired}\n`
    )
    fs.appendFileSync(
      outputPath,
      `flow_inspector_validation_required=${classification.relationshipMap.flowInspectorValidationRequired}\n`
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

export {
  classifyChanges,
  readWorkspaceManifests,
  readWorkspaceManifestsAtCommit,
  readCreateAppManifests,
  readCreateAppManifestsAtCommit,
  readDocumentationDirectories,
  readDocumentationDirectoriesAtCommit,
  digest
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
)
  main()
