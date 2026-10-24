import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  artifactIntegrity,
  prepareOrReuseGuidance,
  registryPreparationBaseline,
  runReleaseCommand
} from './release-guidance.mjs'

export function createAppReleasePaths(root, product) {
  assert.match(
    product ?? '',
    /^[a-z0-9-]+$/,
    'Must specify a safe --prod=<app-name>'
  )
  const directory = path.join(root, 'create-app', product)
  const config = JSON.parse(
    fs.readFileSync(
      path.join(root, 'release-configs', `${product}.json`),
      'utf8'
    )
  )
  assert.equal(
    config.dest,
    `create-app/${product}/template`,
    'Unexpected template owner'
  )
  assert.match(config.src, /^apps\/[a-z0-9-]+$/, 'Invalid template source')
  return {
    directory,
    roots: [
      `create-app/${product}`,
      config.src,
      `release-configs/${product}.json`
    ],
    evidence: path.join(
      root,
      `tmp/create-app-release-evidence/${product}/guidance.json`
    ),
    artifactDirectory: path.join(
      root,
      `tmp/create-app-release-evidence/${product}/artifacts`
    )
  }
}

export function prepareCreateAppRelease({
  root,
  product,
  runCommand = runReleaseCommand
}) {
  const paths = createAppReleasePaths(root, product)
  const manifest = JSON.parse(
    fs.readFileSync(path.join(paths.directory, 'package.json'), 'utf8')
  )
  assert.ok(
    manifest.name?.startsWith('create-') && !manifest.private && manifest.bin,
    'Expected a public create-app CLI manifest'
  )
  fs.mkdirSync(paths.artifactDirectory, { recursive: true })
  const sourceSha = runCommand('git', ['rev-parse', 'HEAD'], {
    cwd: root
  }).trim()
  const [packed] = JSON.parse(
    runCommand(
      'npm',
      [
        'pack',
        paths.directory,
        '--ignore-scripts',
        '--json',
        '--pack-destination',
        paths.artifactDirectory,
        '--cache',
        path.join(root, 'tmp/npm-cache')
      ],
      { cwd: root }
    )
  )
  assert.equal(packed.name, manifest.name)
  assert.equal(packed.version, manifest.version)
  assert.equal(path.basename(packed.filename), packed.filename)
  const file = path.join(paths.artifactDirectory, packed.filename)
  const artifact = {
    id: manifest.name,
    version: manifest.version,
    integrity: artifactIntegrity(file),
    tarball: packed.filename
  }
  const { baseline, current } = registryPreparationBaseline(
    root,
    artifact,
    sourceSha,
    paths.evidence,
    runCommand
  )
  const guidance = prepareOrReuseGuidance(
    paths.evidence,
    {
      root,
      owner: `create-app/${product}`,
      sourceSha,
      generatedRoots: [`create-app/${product}/template`],
      deliveries: [
        { id: manifest.name, roots: paths.roots, baseline, artifact }
      ]
    },
    [current]
  )
  return guidance
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const product = process.argv
    .slice(2)
    .find((arg) => arg.startsWith('--prod='))
    ?.slice(7)
  prepareCreateAppRelease({
    root: path.resolve(import.meta.dirname, '..'),
    product
  })
}
