import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FRAMEWORK_RELEASE_PACKAGE_NAMES } from './framework-release-packages.js'

const EXCLUDED_RELEASE_OWNERS = Object.freeze({
  root: Object.freeze({ name: 'asyra', path: 'package.json' }),
  privateApp: Object.freeze({
    name: '@asyra/asyra-design',
    path: 'apps/asyra-design/package.json'
  }),
  createApp: Object.freeze({
    name: 'create-asyra-design-app',
    path: 'create-app/asyra-design/package.json'
  })
})

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const parseStableVersion = (name, version) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/u.exec(version)

  if (!match) {
    throw new Error(
      `${name} must use a stable semantic version, found ${version}`
    )
  }

  return {
    version,
    family: `${match[1]}.${match[2]}`,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  }
}

const compareVersions = (left, right) => {
  const leftParts = left.split('.').map(Number)
  const rightParts = right.split('.').map(Number)

  for (let index = 0; index < leftParts.length; index += 1) {
    const difference = leftParts[index] - rightParts[index]

    if (difference !== 0) {
      return difference
    }
  }

  return 0
}

const readPendingChangesets = (repositoryRoot) =>
  fs
    .readdirSync(path.join(repositoryRoot, '.changeset'))
    .filter((entry) => entry.endsWith('.md') && entry !== 'README.md')
    .sort()

export const validateFrameworkReleaseRecords = ({ repositoryRoot }) => {
  const resolvedRoot = path.resolve(repositoryRoot)

  const excludedVersions = Object.fromEntries(
    Object.entries(EXCLUDED_RELEASE_OWNERS).map(([owner, expected]) => {
      const manifest = readJson(path.join(resolvedRoot, expected.path))

      if (manifest.name !== expected.name) {
        throw new Error(
          `Excluded release owner ${expected.name} resolved to ${manifest.name}`
        )
      }

      parseStableVersion(manifest.name, manifest.version)

      return [owner, { name: manifest.name, version: manifest.version }]
    })
  )

  const packages = FRAMEWORK_RELEASE_PACKAGE_NAMES.map((name) => {
    const directory = name.slice('@asyra/'.length)
    const manifestPath = path.join(
      resolvedRoot,
      'packages',
      directory,
      'package.json'
    )
    const manifest = readJson(manifestPath)
    const parsedVersion = parseStableVersion(name, manifest.version)

    return {
      name,
      version: manifest.version,
      releaseFamily: parsedVersion.family,
      readme: `packages/${directory}/README.md`
    }
  })

  const releaseFamilies = new Set(
    packages.map(({ releaseFamily }) => releaseFamily)
  )

  if (releaseFamilies.size !== 1) {
    throw new Error(
      `Framework packages must remain in one release family, found ${[
        ...releaseFamilies
      ].join(', ')}`
    )
  }

  const [releaseFamily] = releaseFamilies
  const packageVersions = Object.fromEntries(
    packages.map(({ name, version }) => [name, version])
  )
  const releaseVersions = [...new Set(Object.values(packageVersions))].sort(
    compareVersions
  )

  const changesetConfig = readJson(
    path.join(resolvedRoot, '.changeset', 'config.json')
  )

  if (
    changesetConfig.access !== 'public' ||
    changesetConfig.baseBranch !== 'main'
  ) {
    throw new Error(
      'Changesets must retain public access with main as the release base'
    )
  }

  return {
    status: 'PASS',
    releaseFamily,
    releaseVersions,
    packageVersions,
    packages,
    excludedVersions,
    pendingChangesets: readPendingChangesets(resolvedRoot),
    releaseDecision: 'PENDING',
    publicationAuthorized: false
  }
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
  )
  const evidence = validateFrameworkReleaseRecords({ repositoryRoot })
  const evidenceDirectory = path.join(
    repositoryRoot,
    'tmp',
    'framework-release-evidence'
  )

  fs.mkdirSync(evidenceDirectory, { recursive: true })
  fs.writeFileSync(
    path.join(evidenceDirectory, 'release-records.json'),
    `${JSON.stringify(evidence, null, 2)}\n`
  )
  console.log(
    `Framework release records ${evidence.status}: ${evidence.packages.length} packages in release family ${evidence.releaseFamily}; publication not authorized`
  )
}
