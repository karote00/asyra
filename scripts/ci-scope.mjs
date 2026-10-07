import crypto from 'node:crypto'
import { selectTestImpact, requiresTestParser } from './test-impact.mjs'
import { rootInputImpact } from './ci-input-impact.mjs'
import { RELEASE_APPS } from './app-release-plan.mjs'
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
    lintTask: scripts.lint ? 'lint' : 'eslint',
    testTask: scripts['test:ci'] ? 'test:ci' : undefined,
    testCommand: scripts['test:ci'],
    hasTestTask: scripts['has:test'] ? 'has:test' : null,
    testRunner: vitestRunnerContract(scripts['test:ci']),
    e2eTask: scripts['test:e2e:ci'] ? 'test:e2e:ci' : null,
    dependencySpecs: {
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.peerDependencies,
      ...manifest.optionalDependencies
    },
    dependencies: new Set([
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}),
      ...Object.keys(manifest.optionalDependencies ?? {})
    ])
  }
}

function vitestRunnerContract(script) {
  if (typeof script !== 'string') return null
  const direct = script.match(/^vitest run((?:\s+--[a-z-]+(?:=[a-z0-9-]+)?)*)$/)
  const guarded = script.match(
    /^yarn has:test && vitest run((?:\s+--[a-z-]+(?:=[a-z0-9-]+)?)*)$/
  )
  const match = direct ?? guarded
  if (!match) return null
  return {
    command: 'vitest',
    args: match[1].trim().split(/\s+/).filter(Boolean),
    hasTestGuard: Boolean(guarded)
  }
}

const sourceExtensions = new Set([
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
  '.vue'
])
const testFilePattern =
  /(?:^|\/)(__tests__\/|[^/]+\.(?:test|spec)\.[cm]?[jt]sx?)$/

function isTestSupportInput(changedPath) {
  return (
    testFilePattern.test(changedPath) ||
    /(?:^|\/)(?:fixtures?|test-utils|__fixtures__|__mocks__)(?:\/|$)/.test(
      changedPath
    ) ||
    /(?:^|\/)(?:vitest|vite|playwright|jest)\.config\.[^/]+$/.test(
      changedPath
    ) ||
    /(?:^|\/)(?:dist|build|lib|coverage|test-results|\.artifacts)(?:\/|$)/.test(
      changedPath
    ) ||
    changedPath.endsWith('.d.ts') ||
    changedPath.endsWith('/package.json') ||
    changedPath.endsWith('/tsconfig.json')
  )
}

function isVitestRelatedInput(changedPath) {
  return (
    sourceExtensions.has(path.extname(changedPath)) &&
    (!isTestSupportInput(changedPath) || testFilePattern.test(changedPath))
  )
}

function selectedE2ESuites(changedPaths, options) {
  const suites = relationshipPolicy.e2eSuites
  if (options.fullValidation || options.selectEveryWorkspace)
    return suites.map((suite) => suite.id).sort()
  const selected = new Set()
  const design = options.runtimeWorkspaceDirectories.has('apps/asyra-design')
  if (design)
    for (const suite of suites)
      if (suite.id !== 'flow-inspector-board') selected.add(suite.id)
  for (const input of changedPaths.filter((file) => !file.endsWith('.md'))) {
    const exact = suites.filter((suite) =>
      suite.inputs.some(
        (pattern) => !pattern.includes('*') && pattern === input
      )
    )
    if (exact.length) {
      for (const suite of exact) selected.add(suite.id)
      continue
    }
    for (const suite of suites) {
      if (
        suite.inputs.some((pattern) => matchesPattern(input, pattern).matched)
      )
        selected.add(suite.id)
      if (
        !testFilePattern.test(input) &&
        suite.supportInputs?.some(
          (pattern) => matchesPattern(input, pattern).matched
        )
      )
        selected.add(suite.id)
    }
  }
  return [...selected].sort()
}

function e2eOwnerSelection(workspace, ownerPaths, sharedOwnerInput) {
  if (
    !workspace.e2eTask ||
    (!sharedOwnerInput && ownerPaths.length === 0) ||
    (!sharedOwnerInput &&
      ownerPaths.length > 0 &&
      ownerPaths.every(
        (changedPath) =>
          changedPath.endsWith('.md') ||
          (testFilePattern.test(changedPath) &&
            !changedPath.includes('/e2e/') &&
            !changedPath.includes('/__tests__/e2e/'))
      ))
  )
    return {
      mode: 'not-selected',
      inputs: [],
      reason: workspace.e2eTask ? 'documentation-only' : 'no-e2e-owner'
    }
  const relatedInputs = ownerPaths.filter(
    (changedPath) =>
      changedPath.startsWith(`${workspace.directory}/e2e/`) &&
      /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(changedPath) &&
      fs.existsSync(path.join(process.cwd(), changedPath))
  )
  if (
    !sharedOwnerInput &&
    relatedInputs.length > 0 &&
    relatedInputs.length === ownerPaths.length
  )
    return {
      mode: 'related',
      inputs: relatedInputs.sort(),
      reason: 'changed E2E specs owned by workspace',
      runner: { command: 'playwright' }
    }
  return {
    mode: 'full',
    inputs: [],
    reason: sharedOwnerInput ? 'shared-input' : 'affected-e2e-owner'
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
    .split(/(\*\*|\*|\{slug\})/)
    .map((part) => {
      if (part === '**') return '.*'
      if (part === '*') return '[^/]*'
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
  baseDocumentationRoots = documentationRoots,
  options = {}
) {
  const unknownPaths = []
  const changedWorkspaceNames = new Set()
  const runtimeNames = new Set()
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
  let selectEveryWorkspace = Boolean(options.fullValidation)
  let frameworkReleaseRequired = false
  let rootImpact = {
    workspaces: new Set(),
    rootDependencies: [],
    reasons: [],
    all: false
  }
  try {
    rootImpact = rootInputImpact(
      changedPaths,
      new Map([...baseManifests, ...headManifests]),
      options
    )
  } catch (error) {
    unknownPaths.push(error.message)
  }
  selectEveryWorkspace ||= rootImpact.all
  for (const name of rootImpact.workspaces) {
    changedWorkspaceNames.add(name)
    runtimeNames.add(name)
  }
  const isRuntime = (file) =>
    !relationshipPolicy.workspaceLocalInputPatterns.some(
      (pattern) => matchesPattern(file, pattern).matched
    ) &&
    !file.endsWith('.md') &&
    !testFilePattern.test(file) &&
    !/(?:^|\/)(?:__tests__|e2e|fixtures?|__fixtures__|__mocks__|test-utils)\//.test(
      file
    ) &&
    !/(?:playwright|vitest|jest)\.config\./.test(file)
  for (const changedPath of changedPaths) {
    if (
      ['package.json', 'yarn.lock', 'turbo.json', 'turbo.base.json'].includes(
        changedPath
      ) ||
      relationshipPolicy.contractOnlyInputs.includes(changedPath) ||
      changedPath.startsWith('.yarn/patches/')
    )
      continue
    if (relationshipPolicy.sharedInputPaths.includes(changedPath)) {
      selectEveryWorkspace = true
      continue
    }
    // Plans, source-map metadata and README prose are not runtime dependency changes.
    if (
      changedPath.endsWith('.md') &&
      !changedPath.startsWith('docs/public/') &&
      !changedPath.startsWith('apps/asyra-framework-site/') &&
      (allManifestViews.some((view) => workspaceForPath(changedPath, view)) ||
        createAppViews.some((view) => workspaceForPath(changedPath, view)) ||
        changedPath.startsWith('docs/ai/') ||
        changedPath.startsWith('.changeset/') ||
        relationshipPolicy.rootDocumentationPaths.includes(changedPath))
    )
      continue
    const workspace = allManifestViews
      .map((view) => workspaceForPath(changedPath, view))
      .find(Boolean)
    if (workspace) {
      changedWorkspaceNames.add(workspace.name)
      if (isRuntime(changedPath)) runtimeNames.add(workspace.name)
      continue
    }
    const createApp = createAppViews
      .map((view) => workspaceForPath(changedPath, view))
      .find(Boolean)
    if (createApp) {
      changedCreateAppDirectories.add(createApp.directory)
      continue
    }
    if (
      [...releasePaths].some(
        (pattern) => matchesPattern(changedPath, pattern).matched
      )
    )
      frameworkReleaseRequired = true
    let matched = false
    for (const rule of relationshipPolicy.workspaceInputRules) {
      const match = matchesPattern(changedPath, rule.pattern)
      if (!match.matched) continue
      const directory = rule.workspaceDirectory.replace('{slug}', match.slug)
      const owner = [...headManifests.values()].find(
        (entry) => entry.directory === directory
      )
      if (!owner)
        unknownPaths.push(
          `Unresolved CI input consumer: ${changedPath} -> ${directory}`
        )
      else {
        changedWorkspaceNames.add(owner.name)
        runtimeNames.add(owner.name)
      }
      matched = true
    }
    if (matched) continue
    if (
      Object.values(relationshipPolicy.repositoryScriptGroups).some(
        (group) =>
          group.ownsInputs &&
          group.patterns.some(
            (pattern) => matchesPattern(changedPath, pattern).matched
          )
      ) ||
      relationshipPolicy.internalDocumentationAssetPatterns.some(
        (pattern) => matchesPattern(changedPath, pattern).matched
      ) ||
      relationshipPolicy.rootDocumentationPaths.includes(changedPath) ||
      /^(?:scripts|\.github|\.changeset|agents|\.codex|\.antigravity|release-configs)\//.test(
        changedPath
      ) ||
      /^(?:eslint\.config\.[cm]?js|turbo(?:\.base)?\.json|\.gitignore|\.env\.example|vercel\.json)$/.test(
        changedPath
      )
    )
      continue
    if (
      changedPath.startsWith('docs/') &&
      (recognizedDocumentationRoots.has(
        changedPath.split('/').slice(0, 2).join('/')
      ) ||
        /^docs\/[^/]+$/.test(changedPath)) &&
      changedPath.endsWith('.md')
    )
      continue
    unknownPaths.push(changedPath)
  }

  const dependencyEdges = manifestGraph(headManifests, baseManifests)
  const propagatedNames = new Set(runtimeNames)
  const affectedNames = new Set(changedWorkspaceNames)
  if (selectEveryWorkspace)
    for (const name of headManifests.keys()) {
      affectedNames.add(name)
      propagatedNames.add(name)
    }

  let changed = true
  while (changed) {
    changed = false
    for (const { dependency, consumer } of dependencyEdges) {
      if (propagatedNames.has(dependency) && !propagatedNames.has(consumer)) {
        propagatedNames.add(consumer)
        affectedNames.add(consumer)
        changed = true
      }
    }
  }
  if (unknownPaths.length)
    for (const name of headManifests.keys()) {
      affectedNames.add(name)
      propagatedNames.add(name)
    }

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
    .map(
      ({
        name,
        directory,
        buildTask,
        lintTask,
        testTask,
        hasTestTask,
        e2eTask
      }) => {
        const dependencyOwners = new Set([name])
        let expanded = true
        while (expanded) {
          expanded = false
          for (const { dependency, consumer } of dependencyEdges)
            if (
              dependencyOwners.has(consumer) &&
              !dependencyOwners.has(dependency)
            ) {
              dependencyOwners.add(dependency)
              expanded = true
            }
        }
        const ownerPaths = changedPaths.filter((changedPath) => {
          const pathOwner = allManifestViews
            .map((manifests) => workspaceForPath(changedPath, manifests))
            .find(Boolean)
          if (pathOwner)
            return (
              pathOwner.name === name ||
              (dependencyOwners.has(pathOwner.name) && isRuntime(changedPath))
            )
          return relationshipPolicy.workspaceInputRules.some((rule) => {
            const matched = matchesPattern(changedPath, rule.pattern)
            return (
              matched.matched &&
              rule.workspaceDirectory.replace('{slug}', matched.slug) ===
                directory
            )
          })
        })
        const relatedInputs = ownerPaths.filter(
          (changedPath) =>
            isVitestRelatedInput(changedPath) &&
            fs.existsSync(path.join(process.cwd(), changedPath))
        )
        const relatedInputsAreConsumerOwned = ownerPaths.every(
          (changedPath) => {
            const pathOwner = allManifestViews
              .map((manifests) => workspaceForPath(changedPath, manifests))
              .find(Boolean)
            return pathOwner?.name === name
          }
        )
        const e2eOnlyInputs =
          ownerPaths.length > 0 &&
          ownerPaths.every(
            (changedPath) =>
              changedPath.startsWith(`${directory}/e2e/`) ||
              changedPath.startsWith(`${directory}/playwright.`) ||
              changedPath.startsWith(`${directory}/e2e.`)
          )
        const onlyDocumentation =
          ownerPaths.length > 0 &&
          ownerPaths.every((changedPath) => /\.(?:md|mdx)$/.test(changedPath))
        const sharedOwnerInput =
          rootImpact.workspaces.has(name) ||
          selectEveryWorkspace ||
          options.fullValidation ||
          unknownPaths.length > 0
        const testRunner = headManifests.get(name)?.testRunner
        const lintSelection =
          !sharedOwnerInput &&
          ownerPaths.length > 0 &&
          ownerPaths.every((changedPath) => /\.(?:md|mdx)$/.test(changedPath))
            ? {
                mode: 'not-selected',
                inputs: [],
                reason: 'documentation-only'
              }
            : {
                mode: 'full',
                inputs: [],
                reason: sharedOwnerInput
                  ? 'shared-input'
                  : 'affected-workspace-owner'
              }
        let testSelection
        if (sharedOwnerInput)
          testSelection = { mode: 'full', inputs: [], reason: 'shared-input' }
        else if (e2eOnlyInputs)
          testSelection = {
            mode: 'not-selected',
            inputs: [],
            reason: 'separate-e2e-owner'
          }
        else if (onlyDocumentation)
          testSelection = {
            mode: 'not-selected',
            inputs: [],
            reason: 'documentation-only'
          }
        else if (
          relatedInputs.length > 0 &&
          relatedInputs.length === ownerPaths.length &&
          testRunner &&
          relatedInputsAreConsumerOwned
        )
          testSelection = {
            mode: 'related',
            inputs: relatedInputs.sort(),
            reason: 'Vitest related-file graph',
            runner: testRunner
          }
        else
          testSelection = {
            mode: 'full',
            inputs: [],
            reason: 'owner-input-or-runner-unresolved'
          }
        const supervised = relationshipPolicy.supervisedTestOwners?.[directory]
        let profileSelection
        if (supervised) {
          const upstreamSourcePaths = new Set(
            ownerPaths.filter((input) => {
              const owner = workspaceForPath(input, headManifests)
              return (
                owner &&
                owner.name !== name &&
                input.startsWith(`${owner.directory}/src/`) &&
                isVitestRelatedInput(input) &&
                isRuntime(input)
              )
            })
          )
          const impact = selectTestImpact(
            options.repositoryRoot ?? process.cwd(),
            directory,
            !sharedOwnerInput && (e2eOnlyInputs || onlyDocumentation)
              ? []
              : ownerPaths,
            sharedOwnerInput,
            {
              sourcePaths: upstreamSourcePaths,
              workspaces: headManifests
            }
          )
          profileSelection = {
            files: impact.profiles,
            reason: impact.reason,
            command: supervised.profileCommand
          }
          if (impact.reason !== 'full-owner-input')
            testSelection = {
              mode: impact.ordinary.length ? 'files' : 'not-selected',
              inputs: impact.ordinary,
              reason: impact.reason,
              ...(impact.ordinary.length
                ? { runner: { command: supervised.task } }
                : {})
            }
        }
        const e2eSelection = e2eOwnerSelection(
          { directory, e2eTask },
          ownerPaths,
          sharedOwnerInput
        )
        return {
          name,
          directory,
          inputPaths: [
            ...new Set([
              ...ownerPaths,
              ...(rootImpact.workspaces.has(name)
                ? changedPaths.filter(
                    (file) =>
                      file === 'yarn.lock' ||
                      file === 'package.json' ||
                      file.startsWith('.yarn/patches/') ||
                      file.startsWith('turbo')
                  )
                : []),
              ...(selectEveryWorkspace
                ? changedPaths.filter(
                    (file) =>
                      relationshipPolicy.sharedInputPaths.includes(file) ||
                      file === 'package.json' ||
                      file.startsWith('turbo')
                  )
                : [])
            ])
          ].sort(),
          buildTask,
          lintTask,
          lintSelection,
          testTask,
          hasTestTask,
          testSelection,
          ...(profileSelection ? { profileSelection } : {}),
          e2eTask,
          e2eSelection,
          artifactId: crypto
            .createHash('sha256')
            .update(name)
            .digest('hex')
            .slice(0, 16)
        }
      }
    )
  // A workflow-only change must exercise the profile runner even without an app matrix owner.
  const profileDirectory =
    relationshipPolicy.fieldscopeProfilesWorkspaceDirectory
  const fieldscopeProfileCommand =
    relationshipPolicy.supervisedTestOwners[profileDirectory].profileCommand
  const fieldscopeProfileFiles = changedPaths.includes(
    '.github/workflows/fieldscope-profile.yml'
  )
    ? selectTestImpact(
        options.repositoryRoot ?? process.cwd(),
        profileDirectory,
        [],
        true
      ).profiles
    : (workspaceMatrix.find((w) => w.directory === profileDirectory)
        ?.profileSelection?.files ?? [])
  const fieldscopeProfileGroups = { heavy: [], source: [], remaining: [] }
  if (fieldscopeProfileFiles.length) {
    const inventory = JSON.parse(
      execFileSync(
        fieldscopeProfileCommand[0],
        [...fieldscopeProfileCommand.slice(1), '--list'],
        { cwd: options.repositoryRoot ?? process.cwd(), encoding: 'utf8' }
      )
    )
    for (const group of Object.keys(fieldscopeProfileGroups))
      fieldscopeProfileGroups[group] = inventory[group].filter((file) =>
        fieldscopeProfileFiles.includes(file)
      )
    const assigned = Object.values(fieldscopeProfileGroups).flat().sort()
    if (
      JSON.stringify(assigned) !==
      JSON.stringify([...fieldscopeProfileFiles].sort())
    )
      throw new Error('Profile selection is not exactly partitioned')
  }
  const changedNames = [...changedWorkspaceNames].sort()
  const affectedNamesInHead = affectedWorkspaces.map(({ name }) => name)
  const frameworkPackages = affectedWorkspaces
    .filter(({ group }) => group === 'packages')
    .map(({ name }) => name)
  if (
    affectedWorkspaces.some(
      (workspace) =>
        workspace.group === 'packages' && propagatedNames.has(workspace.name)
    )
  )
    frameworkReleaseRequired = true

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
    .map(
      ({
        name,
        directory,
        group,
        buildTask,
        lintTask,
        testTask,
        hasTestTask,
        e2eTask,
        dependencies
      }) => ({
        name,
        directory,
        group,
        buildTask,
        lintTask,
        testTask,
        hasTestTask,
        e2eTask,
        dependencies: [...dependencies]
          .filter((dependency) => headManifests.has(dependency))
          .sort()
      })
    )
    .sort((left, right) => left.name.localeCompare(right.name))
  const e2eSuites = selectedE2ESuites(changedPaths, {
    ...options,
    selectEveryWorkspace,
    runtimeWorkspaceDirectories: new Set(
      affectedWorkspaces
        .filter((workspace) => propagatedNames.has(workspace.name))
        .map((workspace) => workspace.directory)
    )
  })
  const lintInputs = [...new Set(changedPaths)]
    .filter((changedPath) =>
      fs.existsSync(path.join(process.cwd(), changedPath))
    )
    .filter((changedPath) => sourceExtensions.has(path.extname(changedPath)))
    .sort()
  const lintFull =
    options.fullValidation ||
    changedPaths.some(
      (changedPath) =>
        relationshipPolicy.lintFullInputPaths.includes(changedPath) ||
        /(^|\/)tsconfig(?:\.[^/]+)?\.json$/.test(changedPath)
    )
  const scriptGroups = relationshipPolicy.repositoryScriptGroups
  const selectedGroups = new Set()
  const directTests = new Set()
  const publicSources = new Set(
    JSON.parse(
      fs.readFileSync(
        path.join(scriptDirectory, '../docs/public/content-manifest.json'),
        'utf8'
      )
    ).pages.flatMap((page) => page.sources)
  )
  for (const file of changedPaths) {
    if (relationshipPolicy.registeredScriptTests.includes(file)) {
      directTests.add(file)
      continue
    }
    if (publicSources.has(file)) selectedGroups.add('publicSources')
    for (const [id, group] of Object.entries(scriptGroups)) {
      if (
        !group.patterns.some((pattern) => matchesPattern(file, pattern).matched)
      )
        continue
      if (id === 'publicApiInputs' && testFilePattern.test(file)) continue
      selectedGroups.add(id)
      if (
        (file.endsWith('.md') &&
          !relationshipPolicy.contractOnlyInputs.includes(file)) ||
        file === 'docs/public/generated/source-map.json'
      )
        break
    }
  }
  const repositoryScriptsInputs = [...new Set(changedPaths)].sort()
  const repositoryScriptsRequired = Boolean(
    options.fullValidation ||
    unknownPaths.length ||
    rootImpact.rootDependencies.some(
      (name) =>
        !['eslint', 'prettier'].includes(name) &&
        !name.startsWith('@eslint/') &&
        !name.startsWith('eslint-')
    )
  )
  const repositoryScriptTests = [
    ...new Set([
      ...directTests,
      ...[...selectedGroups].flatMap((id) => scriptGroups[id].tests)
    ])
  ].sort()
  let repositoryScriptsMode = 'not-selected'
  let repositoryScriptsReason = 'no-script-owner-inputs'
  if (repositoryScriptTests.length) {
    repositoryScriptsMode = 'files'
    repositoryScriptsReason = 'registered-input-contracts'
  }
  if (repositoryScriptsRequired) {
    repositoryScriptsMode = 'full'
    repositoryScriptsReason = 'full-validation-or-root-test-runtime'
  }
  const frameworkDeclarationsRequired =
    repositoryScriptsRequired ||
    [...selectedGroups].some(
      (id) => scriptGroups[id].requiresFrameworkDeclarations
    )
  const frameworkDeclarationTasks = workspaceGraph
    .filter(
      ({ group }) => frameworkDeclarationsRequired && group === 'packages'
    )
    .map(({ name, buildTask }) => ({ workspace: name, task: buildTask }))
  const namingInputs = [...new Set(changedPaths)]
    .filter(
      (changedPath) =>
        sourceExtensions.has(path.extname(changedPath)) ||
        /^(?:apps|packages|tools|create-app)\/[^/]+\/package\.json$/.test(
          changedPath
        )
    )
    .sort()
  let lintMode = 'not-selected'
  let lintReason = 'no-applicable-source-files'
  if (lintFull) {
    lintMode = 'full'
    lintReason = 'full-validation-entry-or-shared-lint-configuration'
  } else if (lintInputs.length) {
    lintMode = 'files'
    lintReason = 'changed-files'
  }
  const manifestInputs = changedPaths.filter((file) =>
    /^(?:apps|packages|tools|create-app)\/[^/]+\/package\.json$/.test(file)
  )
  const dependencyManifestInputs = manifestInputs.filter((file) => {
    const before =
      workspaceForPath(file, baseManifests) ??
      workspaceForPath(file, baseCreateAppManifests)
    const after =
      workspaceForPath(file, headManifests) ??
      workspaceForPath(file, createAppManifests)
    return (
      JSON.stringify(before?.dependencySpecs) !==
      JSON.stringify(after?.dependencySpecs)
    )
  })
  const securityInputs = changedPaths
    .filter(
      (file) =>
        file === 'yarn.lock' ||
        file === '.yarnrc.yml' ||
        file.startsWith('.yarn/patches/')
    )
    .concat(dependencyManifestInputs)
  if (rootImpact.rootDependencies.length) securityInputs.push('package.json')
  const dependencyInputs = changedPaths.filter(
    (file) =>
      (/^(?:apps|packages|tools|create-app)\//.test(file) &&
        (sourceExtensions.has(path.extname(file)) ||
          file.endsWith('/package.json'))) ||
      file === 'scripts/deps-validate.js'
  )
  const turboInputs = changedPaths
    .filter((file) =>
      [
        'package.json',
        'turbo.json',
        'turbo.base.json',
        'scripts/gen-turbo.js'
      ].includes(file)
    )
    .concat(manifestInputs)
  const guard = (inputs) => ({
    mode: options.fullValidation || inputs.length ? 'full' : 'not-selected',
    inputs: [...new Set(inputs)].sort()
  })
  const executionPlan = {
    version: 1,
    mode: options.fullValidation ? 'full' : 'incremental',
    changedPaths: [...changedPaths].sort(),
    unknownRelations: [...new Set(unknownPaths)].sort(),
    checks: {
      securityAudit: guard(securityInputs),
      dependencyValidation: guard(dependencyInputs),
      turboValidation: guard(turboInputs),
      lint: {
        mode: lintMode,
        inputs: lintFull ? [] : lintInputs,
        reason: lintReason
      },
      repositoryScripts: {
        mode: repositoryScriptsMode,
        command: 'test:scripts',
        ...(repositoryScriptsMode === 'files'
          ? { tests: repositoryScriptTests }
          : {}),
        inputs: unknownPaths.length
          ? [...new Set([...repositoryScriptsInputs, ...changedPaths])].sort()
          : [
              ...new Set([
                ...repositoryScriptsInputs,
                ...changedPaths.filter(
                  (file) =>
                    /\.(?:md|mdx)$/.test(file) || file.startsWith('docs/')
                )
              ])
            ].sort(),
        reason: repositoryScriptsReason
      },
      naming: {
        mode:
          options.fullValidation || namingInputs.length
            ? 'full'
            : 'not-selected',
        command: 'lint:naming',
        inputs: namingInputs,
        reason: namingInputs.length
          ? 'cross-file-name-and-persisted-identity-contract'
          : 'full-validation-entry-or-no-identifier-source-inputs'
      },
      frameworkDeclarations: {
        mode: frameworkDeclarationsRequired ? 'full' : 'not-selected',
        tasks: frameworkDeclarationTasks,
        reason: frameworkDeclarationsRequired
          ? 'selected-tests-require-framework-declarations'
          : 'no-declaration-owner-inputs'
      },
      workspaces: workspaceMatrix.map(
        ({
          name,
          directory,
          buildTask,
          lintTask,
          lintSelection,
          testTask,
          hasTestTask,
          testSelection,
          e2eTask,
          e2eSelection
        }) => ({
          workspace: name,
          directory,
          lintTask,
          lint: lintSelection,
          buildTask,
          testTask,
          hasTestTask,
          reason: changedWorkspaceNames.has(name)
            ? 'direct-owner-input'
            : 'shared-or-transitive-consumer',
          tests: testSelection,
          e2eTask: e2eTask ?? null,
          e2e: e2eSelection
        })
      ),
      e2e: {
        selected: e2eSuites,
        notSelected: relationshipPolicy.e2eSuites
          .map(({ id }) => id)
          .filter((id) => !e2eSuites.includes(id)),
        workspaces: workspaceMatrix
          .filter(({ e2eSelection }) => e2eSelection.mode !== 'not-selected')
          .map(({ name, directory, e2eTask, e2eSelection }) => ({
            workspace: name,
            directory,
            task: e2eTask,
            selection: e2eSelection
          })),
        reason: e2eSuites.length ? 'declared-suite-inputs' : 'no-suite-inputs'
      }
    }
  }

  const controlPlaneInputs = changedPaths.filter(
    (file) =>
      file.startsWith('tools/flow-inspector/control-plane/') &&
      !relationshipPolicy.contractOnlyInputs.includes(file) &&
      !file.endsWith('.md')
  )
  executionPlan.checks.controlPlane = {
    mode:
      selectEveryWorkspace || controlPlaneInputs.length
        ? 'full'
        : 'not-selected',
    inputs: controlPlaneInputs
  }
  const productionApps = RELEASE_APPS.filter(
    (app) =>
      selectEveryWorkspace ||
      affectedWorkspaces.some(
        (workspace) =>
          workspace.directory === app.root &&
          propagatedNames.has(workspace.name)
      ) ||
      changedPaths.some((file) =>
        relationshipPolicy.productionArtifactInputs.some(
          (pattern) => matchesPattern(file, pattern).matched
        )
      )
  ).map((app) => app.id)
  executionPlan.checks.productionArtifacts = {
    apps: productionApps,
    inputs: changedPaths.filter(
      (file) => !file.endsWith('.md') || file.startsWith('docs/public/')
    )
  }
  const relationshipMap = {
    version: 1,
    workspaceRoots: [...relationshipPolicy.workspaceRoots],
    documentationRoots: [...recognizedDocumentationRoots].sort(),
    excludedRoots: relationshipPolicy.excludedRoots,
    workspaceGraph,
    dependencyEdges,
    rootInputReasons: rootImpact.reasons,
    productionApps,
    frameworkDeclarationTasks,
    changedWorkspaceNames: changedNames,
    affectedWorkspaceNames: affectedNamesInHead,
    workspaceMatrix,
    executionPlan,
    fieldscopeProfileFiles,
    fieldscopeProfileCommand,
    fieldscopeProfileGroups,
    fieldscopeProfilesRequired: fieldscopeProfileFiles.length > 0,
    sharedValidationRequired: true,
    frameworkReleaseRequired,
    createAppPackages: resolvedCreateAppPackages,
    designE2ERequired: e2eSuites.some((id) => id !== 'flow-inspector-board'),
    flowInspectorValidationWorkspaceDirectory:
      relationshipPolicy.flowInspectorValidationWorkspaceDirectory,
    flowInspectorValidationRequired:
      executionPlan.checks.controlPlane.mode === 'full',
    unknownPaths: [...new Set(unknownPaths)].sort()
  }

  return {
    relationshipMap,
    relationshipMapDigest: digest(relationshipMap),
    affectedWorkspaces: affectedNamesInHead,
    workspaceMatrix,
    executionPlan,
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
  if (process.argv.includes('--needs-parser')) {
    process.stdout.write(
      String(
        process.env.CI_SCOPE_FULL_VALIDATION !== 'true' &&
          requiresTestParser(
            changedPaths,
            Object.keys(relationshipPolicy.supervisedTestOwners),
            [...readWorkspaceManifests(root).values()].map(
              (owner) => owner.directory
            )
          )
      )
    )
    return
  }
  const classification = classifyChanges(
    changedPaths,
    readWorkspaceManifests(root),
    readWorkspaceManifestsAtCommit(diffBase, root),
    readCreateAppManifests(root),
    readCreateAppManifestsAtCommit(diffBase, root),
    readDocumentationDirectories(root),
    readDocumentationDirectoriesAtCommit(diffBase, root),
    {
      fullValidation: process.env.CI_SCOPE_FULL_VALIDATION === 'true',
      baseRevision: diffBase,
      repositoryRoot: root
    }
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
    fs.writeFileSync(
      path.join(root, 'ci-scope-evidence.json'),
      `${JSON.stringify(evidence)}\n`
    )
    fs.appendFileSync(
      outputPath,
      `production_apps=${JSON.stringify(classification.relationshipMap.productionApps)}\nworkspace_matrix=${JSON.stringify(classification.workspaceMatrix)}\n`
    )
    fs.appendFileSync(
      outputPath,
      `fieldscope_profiles_required=${classification.relationshipMap.fieldscopeProfilesRequired}\n` +
        `fieldscope_profile_groups=${JSON.stringify(classification.relationshipMap.fieldscopeProfileGroups)}\n`
    )
    fs.appendFileSync(
      outputPath,
      `execution_plan=${JSON.stringify(classification.executionPlan)}\n`
    )
    fs.appendFileSync(
      outputPath,
      `e2e_suites=${JSON.stringify(classification.executionPlan.checks.e2e.selected)}\n`
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
