import { assertReleaseSummaryUnchanged } from './release-history.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const decisionRecordPath = (file) =>
  /^docs\/ai\/(?:framework\/|apps\/[^/]+\/|tools\/[^/]+\/)?decisions\/releases\/(?:unreleased|v\d+\.\d+\.\d+)\.md$/u.test(
    file
  )

function requireValue(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

export function recordLinks(content, file) {
  return [...content.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/gu)]
    .map(([, target]) => target.split('#')[0])
    .filter((target) => !/^[a-z][a-z\d+.-]*:/iu.test(target))
    .map((target) => (target.startsWith('/') ? target.slice(1) : target))
    .map((target) =>
      path.posix.normalize(
        target.startsWith('docs/')
          ? target
          : path.posix.join(path.posix.dirname(file), target)
      )
    )
}

// Project release updates read the owner decision stream without duplicating it.
export function readNotes(source = '', file = '') {
  const owner = file.split('/decisions/releases/')[0]

  return [
    ...source.matchAll(/^## (.+)\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)
  ].map(([content, title]) => ({
    owner,
    change: title.trim(),
    summary: title.trim(),
    content: content.trim(),
    guides: [
      ...new Set(
        recordLinks(content, file).filter(
          (target) =>
            target.startsWith('docs/public/updates/') && target.endsWith('.md')
        )
      )
    ],
    notePath: file
  }))
}

export function validateReleaseNote(note, { read }) {
  for (const guide of note.guides) {
    const content = read(guide)
    const manifest = JSON.parse(
      read('docs/public/content-manifest.json') ?? '{"pages":[]}'
    )

    requireValue(Boolean(content), `Missing guide: ${guide}`)
    requireValue(
      /^## Canonical sources\s*$/m.test(content),
      `Missing Canonical sources: ${guide}`
    )
    requireValue(
      manifest.pages.some((page) => `docs/public/${page.path}` === guide),
      `Guide is not registered: ${guide}`
    )
  }
}

export function validateUpdateGuidance({ changes, notePaths, read, readBase }) {
  const manifestPath = 'docs/public/content-manifest.json'

  if (
    changes.some(
      (file) =>
        file === manifestPath ||
        file.startsWith('docs/public/updates/releases/')
    )
  ) {
    const before = JSON.parse(readBase(manifestPath) ?? '{"pages":[]}').pages
    const after = JSON.parse(read(manifestPath) ?? '{"pages":[]}').pages

    for (const page of before.filter((page) =>
      page.path.startsWith('updates/releases/')
    )) {
      const file = `docs/public/${page.path}`

      assertReleaseSummaryUnchanged(readBase(file), read(file))
      requireValue(
        after.some((item) => item.path === page.path),
        `Release history removed from discovery: ${page.path}`
      )
    }
  }

  let count = 0

  for (const file of notePaths.filter(decisionRecordPath)) {
    for (const note of readNotes(read(file), file)) {
      if (
        note.guides.length &&
        (changes.includes(manifestPath) ||
          note.guides.some((guide) => changes.includes(guide)))
      ) {
        validateReleaseNote(note, { read })
      }
    }
  }

  for (const file of changes.filter(decisionRecordPath)) {
    const original = readBase(file)
    const before = original ?? ''
    const after = read(file)

    requireValue(
      typeof after === 'string',
      `Decision history must be preserved: ${file}`
    )
    if (!file.endsWith('/unreleased.md')) {
      requireValue(
        original === undefined || before === after,
        `Released decision history is immutable: ${file}`
      )
      continue
    }

    // Release cuts relocate the full prior stream into a versioned owner archive.
    const archive = notePaths.find(
      (candidate) =>
        candidate.startsWith(file.slice(0, -'unreleased.md'.length)) &&
        /\/v\d+\.\d+\.\d+\.md$/u.test(candidate) &&
        changes.includes(candidate) &&
        !readBase(candidate) &&
        before.length > 0 &&
        read(candidate)?.startsWith(before)
    )

    requireValue(
      after.startsWith(before) || Boolean(archive),
      `Decision history must be append-only: ${file}`
    )
    const added = after.startsWith(before)
      ? after.slice(before.length)
      : `${read(archive).slice(before.length)}\n${after}`

    requireValue(
      !added.trim() || /^## /u.test(added.trimStart()),
      `Append a new decision entry: ${file}`
    )

    for (const record of readNotes(added, file)) {
      validateReleaseNote(record, { read })

      count++
    }
  }

  return { mode: 'owner-release-history', notes: count }
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

  if (!target) {
    changes.push(
      ...git(['ls-files', '--others', '--exclude-standard', '-z'])
        .split('\0')
        .filter(Boolean)
    )
  }

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
      ) {
        return undefined
      }

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
      if (error.code === 'ENOENT') {
        return undefined
      }

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
    .filter(decisionRecordPath)

  return validateUpdateGuidance({
    changes: [...new Set(changes)],
    notePaths: [...new Set(notePaths)],
    read,
    readBase: snapshotReader(baseline),
    exists
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
