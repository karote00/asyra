#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateFrameworkReleasePlan } from './release-records.js'

const runCommand = (command, args, { cwd, encoding = 'utf8' } = {}) =>
  execFileSync(command, args, { cwd, encoding, stdio: 'pipe' })

export const createFrameworkPublishOrder = ({ repositoryRoot, record }) => {
  const byName = new Map(
    record.packages.map((release) => [release.name, release])
  )
  const ordered = []
  const visiting = new Set()
  const visited = new Set()
  const visit = (release) => {
    if (visited.has(release.name)) return
    if (visiting.has(release.name)) {
      throw new Error(`Framework release dependency cycle at ${release.name}`)
    }
    visiting.add(release.name)
    const directory = release.name.slice('@asyra/'.length)
    const manifest = JSON.parse(
      fs.readFileSync(
        path.join(repositoryRoot, 'packages', directory, 'package.json'),
        'utf8'
      )
    )
    if (manifest.version !== release.newVersion) {
      throw new Error(
        `${release.name} manifest ${manifest.version} does not match release record ${release.newVersion}`
      )
    }
    for (const dependencyName of Object.keys(manifest.dependencies ?? {})) {
      const dependencyRelease = byName.get(dependencyName)
      if (dependencyRelease) visit(dependencyRelease)
    }
    visiting.delete(release.name)
    visited.add(release.name)
    ordered.push({ ...release, directory })
  }
  record.packages.forEach(visit)
  return ordered
}

export const publishFrameworkRelease = ({
  repositoryRoot,
  recordPath,
  runCommand: run = runCommand
}) => {
  const resolvedRoot = path.resolve(repositoryRoot)
  const absoluteRecordPath = path.resolve(resolvedRoot, recordPath)
  const relativeRecordPath = path.relative(resolvedRoot, absoluteRecordPath)
  if (
    relativeRecordPath.startsWith('..') ||
    path.isAbsolute(relativeRecordPath)
  ) {
    throw new Error('Framework release record must be inside the repository')
  }
  const record = validateFrameworkReleasePlan({
    repositoryRoot: resolvedRoot,
    recordPath: relativeRecordPath
  })
  const ordered = createFrameworkPublishOrder({
    repositoryRoot: resolvedRoot,
    record
  })

  for (const release of ordered) {
    const spec = `${release.name}@${release.newVersion}`
    let publishedVersion
    try {
      publishedVersion = run('npm', ['view', spec, 'version'], {
        cwd: resolvedRoot
      }).trim()
    } catch (error) {
      const errorText = `${error.stderr ?? ''}${error.message ?? ''}`
      if (!/E404/u.test(errorText)) throw error
      publishedVersion = ''
    }
    if (publishedVersion && publishedVersion !== release.newVersion) {
      throw new Error(
        `Registry returned unexpected version ${publishedVersion} for ${spec}`
      )
    }
    if (!publishedVersion) {
      run(
        'npm',
        ['publish', `./packages/${release.directory}`, '--access', 'public'],
        { cwd: resolvedRoot }
      )
    }
    const tag = `${spec}`
    const existingTag = run('git', ['tag', '--list', tag], {
      cwd: resolvedRoot
    }).trim()
    if (!existingTag) {
      run('git', ['tag', tag, 'HEAD'], { cwd: resolvedRoot })
    }
  }
  return ordered.map(({ name, oldVersion, newVersion }) => ({
    name,
    oldVersion,
    newVersion
  }))
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  const args = process.argv.slice(2)
  const recordArgument = args.find((arg) => arg.startsWith('--record='))
  const recordPath = recordArgument?.slice('--record='.length)
  if (args.includes('--plan')) {
    process.stdout.write(`${JSON.stringify({ record: recordPath }, null, 2)}\n`)
    process.exit(0)
  }
  if (!recordPath || args.some((arg) => arg !== recordArgument)) {
    console.error(
      'Must specify --record=<version-controlled-framework-release-record>'
    )
    process.exit(1)
  }

  const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
  )
  publishFrameworkRelease({ repositoryRoot, recordPath })
}
