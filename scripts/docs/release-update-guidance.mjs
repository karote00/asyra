import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const noteFile =
  /(?:^|\/)(?:CHANGELOG|RELEASE_NOTES)\.md$|^docs\/public\/updates\/pending\.md$/u
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0
const repositoryPath = (value) =>
  nonempty(value) &&
  !value.includes('\\') &&
  !value.includes(':') &&
  ![...value].some((character) => character.charCodeAt(0) < 32) &&
  !value.split('/').some((part) => ['', '.', '..'].includes(part))

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}

function readNotes(source = '') {
  const notes = []
  for (const match of source.matchAll(
    /^```update-note\s*\n([\s\S]*?)^```\s*$/gm
  )) {
    try {
      notes.push(JSON.parse(match[1]))
    } catch {
      throw new Error('Invalid update-note JSON')
    }
  }
  requireValue(
    notes.length === [...source.matchAll(/^```update-note\b/gm)].length,
    'Invalid update-note fence'
  )
  return notes
}

// Readers bind all inputs to one checkout or Git snapshot for this invocation.
export function validateUpdateGuidance({
  changes,
  notePaths,
  read,
  readBase,
  exists,
  existsBase
}) {
  const required = changes.filter((file) => !file.endsWith('.md'))
  const covered = new Set()
  const identities = new Set()
  const guides = new Set()
  let count = 0
  for (const file of notePaths.filter((entry) => noteFile.test(entry))) {
    const previous = changes.includes(file)
      ? readNotes(readBase(file)).map((note) => JSON.stringify(note))
      : []
    for (const note of readNotes(read(file))) {
      const changed =
        changes.includes(file) && !previous.includes(JSON.stringify(note))
      requireValue(
        note && typeof note === 'object',
        `${file}: Invalid update-note`
      )
      for (const field of ['change', 'owner', 'summary', 'reason']) {
        requireValue(nonempty(note[field]), `${file}: ${field} is required`)
      }
      const identity = `${note.owner}:${note.change}`
      requireValue(
        !identities.has(identity),
        `Duplicate update-note: ${identity}`
      )
      identities.add(identity)
      requireValue(
        ['integration', 'no-action'].includes(note.impact),
        `${identity}: impact must be integration or no-action`
      )
      requireValue(
        Array.isArray(note.sources) && note.sources.length > 0,
        `${identity}: sources are required`
      )
      for (const source of note.sources) {
        requireValue(repositoryPath(source), `${identity}: invalid source path`)
        requireValue(
          !changed || exists(source) || existsBase(source),
          `${identity}: missing source ${source}`
        )
        if (changed) covered.add(source)
      }
      requireValue(
        Array.isArray(note.guides),
        `${identity}: guides must be an array`
      )
      requireValue(
        note.impact !== 'integration' || note.guides.length > 0,
        `${identity}: integration requires a guide`
      )
      for (const guide of note.guides) {
        requireValue(
          repositoryPath(guide) &&
            guide.startsWith('docs/public/updates/') &&
            guide.endsWith('.md') &&
            ![
              'docs/public/updates/index.md',
              'docs/public/updates/pending.md'
            ].includes(guide),
          `${identity}: invalid guide path`
        )
        guides.add(guide)
      }
      if (changed) count++
    }
  }
  if (guides.size) {
    const manifest = JSON.parse(
      read('docs/public/content-manifest.json') ?? '{}'
    )
    for (const guide of guides) {
      const content = read(guide)
      requireValue(nonempty(content), `Missing guide: ${guide}`)
      requireValue(
        /^## Canonical sources\s*$/m.test(content),
        `${guide}: missing Canonical sources`
      )
      requireValue(
        manifest.pages?.some((page) => `docs/public/${page.path}` === guide),
        `${guide}: guide is not registered in the public content manifest`
      )
    }
  }
  const missing = required.filter((file) => !covered.has(file))
  requireValue(
    missing.length === 0,
    `Missing update note for: ${missing.join(', ')}`
  )
  return {
    mode: required.length ? 'declared-impact' : 'documentation-only',
    notes: count
  }
}

export function checkUpdateGuidance({
  repositoryRoot,
  base = 'HEAD',
  head
} = {}) {
  const git = (args) =>
    execFileSync('git', args, {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
  const resolve = (ref) =>
    git(['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim()
  const target = head ? resolve(head) : undefined
  const baseline = target
    ? git(['merge-base', resolve(base), target]).trim()
    : resolve(base)
  const changes = git([
    'diff',
    '--name-only',
    '--no-renames',
    '-z',
    baseline,
    ...(target ? [target] : []),
    '--'
  ])
    .split('\0')
    .filter(Boolean)
  if (!target)
    changes.push(
      ...git(['ls-files', '--others', '--exclude-standard', '-z'])
        .split('\0')
        .filter(Boolean)
    )
  const snapshotReader = (sha) => (file) => {
    try {
      return git(['show', `${sha}:${file}`])
    } catch (error) {
      // A deletion or newly added file is absent on one side of the comparison.
      if (
        error.status === 128 &&
        /does not exist|exists on disk, but not in/.test(
          error.stderr?.toString() ?? ''
        )
      )
        return undefined
      throw error
    }
  }
  // Source references need metadata only, including when the source is deleted.
  const snapshotExists = (sha) => (file) =>
    git(['ls-tree', '-z', sha, '--', file])
      .split('\0')
      .some(
        (entry) => entry.split('\t')[1] === file && /^[0-7]+ blob /.test(entry)
      )
  const localPath = (file) => {
    try {
      const resolved = fs.realpathSync(path.resolve(repositoryRoot, file))
      requireValue(
        !path.relative(repositoryRoot, resolved).startsWith('..'),
        `Source escapes repository: ${file}`
      )
      return resolved
    } catch (error) {
      if (error.code === 'ENOENT') return undefined
      throw error
    }
  }
  const read = target
    ? snapshotReader(target)
    : (file) => {
        const resolved = localPath(file)
        return resolved ? fs.readFileSync(resolved, 'utf8') : undefined
      }
  const exists = target
    ? snapshotExists(target)
    : (file) => {
        const resolved = localPath(file)
        return resolved ? fs.statSync(resolved).isFile() : false
      }
  // Retained notes participate in integrity checks even when only a guide changes.
  const notePaths = git(
    target
      ? ['ls-tree', '-r', '--name-only', '-z', target]
      : ['ls-files', '--cached', '--others', '--exclude-standard', '-z']
  )
    .split('\0')
    .filter((file) => noteFile.test(file))
  return validateUpdateGuidance({
    changes: [...new Set(changes)],
    notePaths: [...new Set(notePaths)],
    read,
    readBase: snapshotReader(baseline),
    exists,
    existsBase: snapshotExists(baseline)
  })
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    requireValue(
      process.argv.length === 2,
      'Use UPDATE_GUIDANCE_BASE_SHA and UPDATE_GUIDANCE_HEAD_SHA; no positional arguments'
    )
    const { UPDATE_GUIDANCE_BASE_SHA: base, UPDATE_GUIDANCE_HEAD_SHA: head } =
      process.env
    requireValue(
      Boolean(base) === Boolean(head),
      'Provide both update guidance base and head, or neither for the working tree'
    )
    const result = checkUpdateGuidance({
      repositoryRoot: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../..'
      ),
      base,
      head
    })
    console.log(
      `Update guidance check passed (${result.mode}; ${result.notes} changed notes). Semantic completeness requires review.`
    )
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
