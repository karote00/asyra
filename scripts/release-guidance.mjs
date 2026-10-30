import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import {
  readNotes,
  validateUpdateGuidance
} from './docs/release-update-guidance.mjs'

export const runReleaseCommand = (command, args, options = {}) =>
  execFileSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 32 * 1024 * 1024,
    ...options
  })
export const guidanceHash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')
const sha = (value) =>
  assert.match(
    value ?? '',
    /^[a-f0-9]{40}$/,
    'Release guidance requires an exact source SHA'
  )
const notePath = (file) =>
  /(?:^|\/)(?:CHANGELOG|RELEASE_NOTES)\.md$|^docs\/public\/updates\/pending\.md$/.test(
    file
  )
const within = (file, root) => file === root || file.startsWith(`${root}/`)

export function artifactIntegrity(file) {
  const hash = createHash('sha512')
  const visit = (entry, relative) => {
    const stat = fs.lstatSync(entry)
    assert.ok(
      !stat.isSymbolicLink(),
      'Release artifacts cannot contain symlinks'
    )
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(entry).sort()) {
        visit(path.join(entry, name), `${relative}/${name}`)
      }
    } else {
      assert.ok(stat.isFile(), 'Expected a regular release artifact')
      if (relative) {
        hash.update(`${relative}\0${stat.size}\0`)
      }
      hash.update(fs.readFileSync(entry))
    }
  }
  visit(file, '')
  return `sha512-${hash.digest('base64')}`
}

export function readGuidance(file) {
  assert.ok(fs.existsSync(file), `Missing release guidance: ${file}`)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
export function writeGuidance(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

// Snapshots and dependency closures are shared only within this calculation.
export function prepareGuidance({
  root,
  owner,
  sourceSha,
  deliveries,
  generatedRoots = [],
  runCommand = runReleaseCommand
}) {
  sha(sourceSha)
  assert.ok(
    owner && deliveries?.length,
    'Release guidance requires an owner and deliveries'
  )
  const git = (args) => runCommand('git', args, { cwd: root })
  assert.equal(
    git(['rev-parse', 'HEAD']).trim(),
    sourceSha,
    'Release guidance source changed'
  )
  assert.deepEqual(
    git(['diff', '--name-only', '-z', sourceSha, '--'])
      .split('\0')
      .filter(Boolean)
      .filter(
        (file) => !generatedRoots.some((directory) => within(file, directory))
      ),
    [],
    'Release guidance requires clean tracked source'
  )
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z'])
    .split('\0')
    .filter(Boolean)
  const comparisons = new Map()
  const snapshots = new Map()
  const snapshot = (revision) => {
    sha(revision)
    if (!snapshots.has(revision)) {
      assert.equal(
        git(['rev-parse', `${revision}^{commit}`]).trim(),
        revision,
        'Missing release baseline source'
      )
      const files = git(['ls-tree', '-r', '--name-only', '-z', revision])
        .split('\0')
        .filter(Boolean)
      const present = new Set(files)
      const contents = new Map()
      const read = (file) => {
        if (!present.has(file)) {
          return undefined
        }
        if (!contents.has(file)) {
          contents.set(file, git(['show', `${revision}:${file}`]))
        }
        return contents.get(file)
      }
      const manifests = files
        .filter((file) =>
          /^(?:apps|packages|tools)\/[^/]+\/package\.json$/.test(file)
        )
        .map((file) => ({
          root: path.posix.dirname(file),
          manifest: JSON.parse(read(file))
        }))
      const closure = (roots) => {
        const included = new Set(roots)
        const visit = (directory) => {
          const entry = manifests.find((item) => item.root === directory)
          if (!entry) {
            return
          }
          for (const name of Object.keys({
            ...entry.manifest.dependencies,
            ...entry.manifest.devDependencies,
            ...entry.manifest.peerDependencies,
            ...entry.manifest.optionalDependencies
          })) {
            const dependency = manifests.find(
              (item) => item.manifest.name === name
            )
            if (dependency && !included.has(dependency.root)) {
              included.add(dependency.root)
              visit(dependency.root)
            }
          }
        }
        roots.forEach(visit)
        return [...included]
      }
      snapshots.set(revision, {
        files,
        read,
        exists: (file) => present.has(file),
        closure
      })
    }
    return snapshots.get(revision)
  }
  const target = snapshot(sourceSha)
  const notes = target.files.filter(notePath)
  const ids = new Set()
  const summaries = deliveries.map(({ id, roots, baseline, artifact }) => {
    assert.ok(
      id && !ids.has(id),
      'Duplicate or missing release delivery identity'
    )
    ids.add(id)
    assert.ok(
      roots?.length &&
        roots.every(
          (item) => !path.isAbsolute(item) && !item.split('/').includes('..')
        ),
      'Invalid release roots'
    )
    assert.ok(
      baseline?.sourceSha,
      `Release coverage gap for ${id}: previous successful source is required`
    )
    assert.ok(
      artifact?.integrity && artifact.id === id,
      'Missing candidate artifact identity'
    )
    const previous = snapshot(baseline.sourceSha)
    const rootsUnion = [
      ...new Set([...previous.closure(roots), ...target.closure(roots)])
    ]
    if (!comparisons.has(baseline.sourceSha)) {
      // Never silently replace a non-ancestor baseline with a merge base.
      git(['merge-base', '--is-ancestor', baseline.sourceSha, sourceSha])
      comparisons.set(
        baseline.sourceSha,
        git([
          'diff',
          '--name-only',
          '--no-renames',
          '-z',
          baseline.sourceSha,
          sourceSha,
          '--'
        ])
          .split('\0')
          .filter(Boolean)
      )
    }
    const allChanges = comparisons.get(baseline.sourceSha)
    const relevant = (file) =>
      rootsUnion.some((directory) => within(file, directory)) ||
      !file.includes('/') ||
      file.startsWith('scripts/') ||
      /^\.(?:yarn|github)\//.test(file)
    assert.deepEqual(
      untracked.filter(
        (file) =>
          relevant(file) &&
          !generatedRoots.some((directory) => within(file, directory))
      ),
      [],
      'Release guidance requires committed source inputs'
    )
    const changes = allChanges.filter(relevant)
    const changedNotes = allChanges.filter(notePath)
    validateUpdateGuidance({
      changes: [...new Set([...changes, ...changedNotes])],
      notePaths: notes,
      read: target.read,
      readBase: previous.read,
      exists: target.exists,
      existsBase: previous.exists
    })
    const declarations = notes.flatMap((file) => {
      const old = readNotes(previous.read(file)).map((note) =>
        JSON.stringify(note)
      )
      return readNotes(target.read(file))
        .filter(
          (note) =>
            (!old.includes(JSON.stringify(note)) &&
              note.sources.some((source) => changes.includes(source))) ||
            (note.guides.some((guide) => allChanges.includes(guide)) &&
              note.sources.some((source) =>
                rootsUnion.some((directory) => within(source, directory))
              ))
        )
        .map((note) => ({ ...note, notePath: file }))
    })
    const guidePaths = [
      ...new Set(declarations.flatMap((note) => note.guides))
    ].sort()
    const requirements = rootsUnion
      .map((directory) => target.read(`${directory}/package.json`))
      .filter(Boolean)
      .map((content) => {
        const manifest = JSON.parse(content)
        return {
          name: manifest.name,
          version: manifest.version,
          dependencies: manifest.dependencies ?? {},
          peerDependencies: manifest.peerDependencies ?? {}
        }
      })
    return {
      id,
      roots,
      baseline,
      artifact,
      changes,
      requirements,
      notes: declarations,
      guides: guidePaths.map((file) => ({
        path: file,
        hash: guidanceHash(target.read(file))
      })),
      disposition: declarations.length
        ? 'declared-impact'
        : 'No non-documentation source delta; artifact identity is recorded separately.'
    }
  })
  return {
    schemaVersion: 1,
    status: 'CANDIDATE',
    owner,
    sourceSha,
    generatedRoots,
    deliveries: summaries.sort((a, b) => a.id.localeCompare(b.id))
  }
}

export function admitGuidance({
  root,
  owner,
  sourceSha,
  deliveries,
  evidence,
  current,
  publication,
  generatedRoots = []
}) {
  assert.ok(
    evidence?.status === 'CANDIDATE',
    'Missing or invalid release guidance'
  )
  assert.equal(
    current.length,
    deliveries.length,
    'Release guidance baseline inventory changed'
  )
  if (publication) {
    assert.equal(
      publication.guidance,
      guidanceHash(evidence),
      'Publication belongs to another candidate'
    )
    assert.equal(publication.owner, evidence.owner, 'Publication owner changed')
    assert.equal(
      publication.sourceSha,
      evidence.sourceSha,
      'Publication source changed'
    )
  }
  for (const delivery of deliveries) {
    const live = current.find((item) => item.id === delivery.id)
    assert.ok(live, `Missing current baseline for ${delivery.id}`)
    const baseline = evidence.deliveries?.find(
      (item) => item.id === delivery.id
    )?.baseline
    assert.ok(baseline, 'Missing frozen release guidance baseline')
    // npm retries may encounter this exact immutable candidate after a partial publish.
    const matches =
      live.version !== undefined
        ? (live.version === baseline.version &&
            live.integrity === baseline.integrity &&
            live.sourceSha === baseline.sourceSha) ||
          (live.version === delivery.artifact.version &&
            live.integrity === delivery.artifact.integrity)
        : (live.sourceSha === baseline.sourceSha &&
            live.deploymentId === baseline.deploymentId) ||
          (live.sourceSha === sourceSha &&
            publication?.outcomes[delivery.id]?.published === true &&
            Boolean(publication.outcomes[delivery.id].deploymentId) &&
            live.deploymentId ===
              publication.outcomes[delivery.id].deploymentId)
    assert.ok(
      matches,
      `Online baseline changed for ${delivery.id}; prepare new release guidance`
    )
  }
  const rebuilt = prepareGuidance({
    root,
    owner,
    sourceSha,
    generatedRoots,
    deliveries: deliveries.map((delivery) => ({
      ...delivery,
      baseline: evidence.deliveries.find((item) => item.id === delivery.id)
        ?.baseline
    }))
  })
  assert.deepEqual(
    evidence,
    rebuilt,
    'Release guidance source, scope, summary, guide or artifacts changed'
  )
  return guidanceHash(evidence)
}

export function registryRecord(root, name, runCommand = runReleaseCommand) {
  const record = JSON.parse(
    runCommand(
      'npm',
      [
        'view',
        `${name}@latest`,
        'version',
        'dist.integrity',
        'gitHead',
        '--json',
        '--cache',
        path.join(root, 'tmp/npm-cache')
      ],
      { cwd: root }
    )
  )
  const integrity = record['dist.integrity'] ?? record.dist?.integrity
  assert.ok(
    record.version && integrity,
    `Release coverage gap: registry identity missing for ${name}`
  )
  return {
    id: name,
    version: record.version,
    integrity,
    ...(record.gitHead ? { sourceSha: record.gitHead } : {})
  }
}
export function registryBaseline(root, name, runCommand = runReleaseCommand) {
  const record = registryRecord(root, name, runCommand)
  return resolveRegistryBaseline(root, record, runCommand)
}
function resolveRegistryBaseline(root, record, runCommand) {
  const name = record.id
  let sourceSha = record.sourceSha
  if (!sourceSha) {
    try {
      sourceSha = runCommand(
        'git',
        [
          'rev-parse',
          '--verify',
          `refs/tags/${name}@${record.version}^{commit}`
        ],
        { cwd: root }
      ).trim()
    } catch {
      throw new Error(
        `Release coverage gap: fetch the verified ${name}@${record.version} release tag before preparation`
      )
    }
  }
  sha(sourceSha)
  return { ...record, sourceSha }
}

export function recordGuidanceResult(file, evidence, id, status, details = {}) {
  const reference = guidanceHash(evidence)
  file = `${file}.${reference}.json`
  const previous = fs.existsSync(file)
    ? readGuidance(file)
    : {
        guidance: reference,
        owner: evidence.owner,
        sourceSha: evidence.sourceSha,
        outcomes: {}
      }
  assert.equal(
    previous.guidance,
    reference,
    'Release result belongs to another candidate'
  )
  assert.ok(
    evidence.deliveries.some((entry) => entry.id === id),
    'Unknown release result owner'
  )
  assert.ok(
    ['published', 'verified', 'failed', 'skipped-existing'].includes(status),
    'Invalid release result status'
  )
  previous.outcomes[id] = { status, ...details }
  writeGuidance(file, previous)
  return previous
}

export function prepareOrReuseGuidance(file, inputs, current) {
  if (fs.existsSync(file)) {
    const prior = readGuidance(file)
    const identities = (deliveries) =>
      deliveries
        .map(({ id, roots, artifact }) => ({ id, roots, artifact }))
        .sort((a, b) => a.id.localeCompare(b.id))
    const resuming = current.some((item) =>
      inputs.deliveries.some(
        ({ artifact }) =>
          item.id === artifact.id &&
          item.version !== undefined &&
          item.version === artifact.version &&
          item.integrity === artifact.integrity
      )
    )
    if (
      resuming &&
      prior.owner === inputs.owner &&
      prior.sourceSha === inputs.sourceSha &&
      JSON.stringify(identities(prior.deliveries)) ===
        JSON.stringify(identities(inputs.deliveries))
    ) {
      admitGuidance({ ...inputs, evidence: prior, current })
      return prior
    }
  }
  const candidate = prepareGuidance(inputs)
  writeGuidance(file, candidate)
  return candidate
}

export function registryPreparationBaseline(
  root,
  artifact,
  sourceSha,
  file,
  runCommand = runReleaseCommand
) {
  const current = registryRecord(root, artifact.id, runCommand)
  if (current.version === artifact.version) {
    assert.equal(
      current.integrity,
      artifact.integrity,
      'Published candidate integrity differs'
    )
    if (fs.existsSync(file)) {
      const previous = readGuidance(file)
      if (previous.sourceSha === sourceSha) {
        const prior = previous.deliveries.find(
          (item) => item.id === artifact.id
        )
        assert.deepEqual(
          prior?.artifact,
          artifact,
          'Published candidate has no matching retained guidance'
        )
        return { baseline: prior.baseline, current }
      }
    }
    const published = resolveRegistryBaseline(root, current, runCommand)
    assert.notEqual(
      published.sourceSha,
      sourceSha,
      'Missing release guidance for this published candidate'
    )
    return { baseline: published, current: published }
  }
  const resolved = resolveRegistryBaseline(root, current, runCommand)
  return { baseline: resolved, current: resolved }
}

export function registryCurrent(
  root,
  artifact,
  runCommand = runReleaseCommand
) {
  const record = registryRecord(root, artifact.id, runCommand)
  if (
    record.version === artifact.version &&
    record.integrity === artifact.integrity
  ) {
    return record
  }
  return resolveRegistryBaseline(root, record, runCommand)
}
