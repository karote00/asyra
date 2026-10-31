import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  checkUpdateGuidance,
  readNotes,
  validateUpdateGuidance
} from '../release-update-guidance.mjs'

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
)
const guide = 'docs/public/updates/text-official-fields-example-1-r3.md'
const source = 'packages/preset/src/text.ts'
const notePath = 'RELEASE_NOTES.md'

test('one owner entry supplies release update information without a sources list', () => {
  const file = 'docs/ai/framework/decisions/releases/unreleased.md'
  const content =
    '## 2026-11-01 - Preserve extensions\n\n' +
    '- Decision: Keep consumer extensions.\n' +
    '- Guide: [Integration](/docs/public/updates/integration.md).\n' +
    '- Completed record: [Plan](../../plans/completed/extensions.md).\n'
  const [record] = readNotes(content, file)

  assert.equal(record.owner, 'docs/ai/framework')
  assert.equal(record.summary, '2026-11-01 - Preserve extensions')
  assert.deepEqual(record.guides, ['docs/public/updates/integration.md'])
  assert.equal(record.sources, undefined)
})

test('unfinished implementation does not require a parallel release declaration', () => {
  assert.doesNotThrow(() => check({ notes: [], changes: [source] }))
})

test('historical alternative notes do not participate in current admission', () => {
  assert.doesNotThrow(() =>
    check({
      notes: [],
      changes: [source],
      files: {
        [notePath]: '```update-note\nnot current structured data\n```\n'
      }
    })
  )
})

test('owner closeout records cannot rewrite existing decision history', () => {
  const record = 'docs/ai/framework/decisions/releases/unreleased.md'

  assert.throws(
    () =>
      check({
        notes: [],
        changes: [record],
        before: { [record]: '## Existing decision\n\nPreserved outcome.\n' },
        files: { [record]: '## Existing decision\n\nRewritten outcome.\n' }
      }),
    /history|append|preserv/i
  )
})

const note = (overrides = {}) => ({
  change: 'text-fields',
  owner: 'Framework packages',
  summary: 'Official Text adds two fields previously owned by consumers.',
  sources: [source],
  impact: 'integration',
  guides: [guide],
  reason: 'Consumers must compare local field meaning and retain extensions.',
  ...overrides
})

const block = (value) =>
  `\n\`\`\`update-note\n${JSON.stringify(value)}\n\`\`\`\n`

function check({
  notes = [note()],
  changes = [source, notePath],
  before = {},
  files = {}
} = {}) {
  const contents = {
    [source]: 'export const text = {}',
    [notePath]: notes.map(block).join(''),
    [guide]: '# Text\n\n## Canonical sources\n\nReviewed source references.\n',
    'docs/public/content-manifest.json': JSON.stringify({
      pages: [{ path: guide.slice('docs/public/'.length) }]
    }),
    ...files
  }

  return validateUpdateGuidance({
    changes,
    notePaths: Object.keys(contents),

    read: (file) => contents[file],

    readBase: (file) => before[file],

    exists: (file) => contents[file] !== undefined,

    existsBase: (file) => before[file] !== undefined
  })
}

test('published summaries cannot be edited, deleted or removed from discovery; ordinary Markdown stays exempt', () => {
  const file = 'docs/public/updates/releases/retained.md'
  const manifest = 'docs/public/content-manifest.json'
  const original =
    '# Retained\n```release-summary\n{"id":"retained","status":"verified"}\n```\n'
  const inventory = JSON.stringify({
    pages: [{ path: 'updates/releases/retained.md' }]
  })
  const before = { [file]: original, [manifest]: inventory }

  assert.throws(
    () =>
      check({
        notes: [],
        changes: [file],
        before,
        files: { [file]: original + 'Edited', [manifest]: inventory }
      }),
    /immutable/
  )
  assert.throws(
    () =>
      check({
        notes: [],
        changes: [file],
        before,
        files: { [manifest]: inventory }
      }),
    /immutable/
  )
  assert.throws(
    () =>
      check({
        notes: [
          note({
            sources: [manifest],
            impact: 'no-action',
            guides: [],
            reason: 'Metadata'
          })
        ],
        changes: [manifest, notePath],
        before,
        files: { [file]: original, [manifest]: '{"pages":[]}' }
      }),
    /discovery/
  )
  assert.equal(
    check({
      notes: [],
      changes: ['README.md'],
      before,
      files: {
        [file]: original,
        [manifest]: inventory,
        'README.md': '# Wording'
      }
    }).notes,
    0
  )
})

const decision = 'docs/ai/framework/decisions/releases/unreleased.md'
const completed = 'docs/ai/framework/plans/completed/example.md'
const entry =
  '## 2026-11-01 - Completed work\n\nOutcome preserved. [Plan](../../plans/completed/example.md)\n'

test('appending to an existing decision is not a new closeout entry', () => {
  assert.throws(
    () =>
      check({
        changes: [decision],
        before: { [decision]: entry },
        files: {
          [decision]: entry + 'Changed the old outcome.\n',
          [completed]: '# Done'
        }
      }),
    /new decision entry/
  )
})

test('retained owner integration guides cannot disappear from public discovery', () => {
  const record =
    entry +
    `- Release impact: integration\n- Release reason: Preserve extensions.\n- Guide: [Guide](/${guide})\n`

  assert.throws(
    () =>
      check({
        changes: ['docs/public/content-manifest.json'],
        files: {
          [decision]: record,
          [completed]: '# Completed',
          'docs/public/content-manifest.json': '{"pages":[]}'
        }
      }),
    /not registered/
  )
})

test('closeout appends a linked owner plan without a source inventory', () => {
  assert.equal(
    check({
      changes: [decision],
      before: { [decision]: 'Existing history\n' },
      files: {
        [decision]: 'Existing history\n' + entry,
        [completed]: '# Completed plan'
      }
    }).notes,
    1
  )
})

test('release updates accept owner decisions without revalidating plan closeout', () => {
  assert.equal(
    check({
      changes: [decision],
      files: {
        [decision]: '## Completed behavior change\n\nConsumer-facing outcome.\n'
      }
    }).notes,
    1
  )
})

test('a release cut preserves the exact prior stream in its immutable owner archive', () => {
  const archive = decision.replace('unreleased.md', 'v1.0.0.md')

  assert.throws(
    () =>
      check({
        changes: [archive],
        before: { [archive]: '' },
        files: { [archive]: entry }
      }),
    /immutable/
  )

  assert.doesNotThrow(() =>
    check({
      changes: [decision, archive],
      before: { [decision]: entry },
      files: { [decision]: '', [archive]: entry }
    })
  )
  assert.throws(
    () =>
      check({
        changes: [decision, archive],
        before: { [decision]: entry },
        files: { [decision]: '', [archive]: entry + 'Altered' }
      }),
    /Append a new decision entry/
  )
  assert.throws(
    () =>
      check({
        changes: [archive],
        before: { [archive]: entry },
        files: { [archive]: entry + 'Altered' }
      }),
    /immutable/
  )
})

test('a comparison spanning a release cut and later closeout preserves both generations', () => {
  const archive = decision.replace('unreleased.md', 'v1.0.0.md')
  const intermediate = entry.replace('Completed work', 'Intermediate closeout')
  const later = entry.replace('Completed work', 'Later closeout')

  assert.equal(
    check({
      changes: [decision, archive],
      before: { [decision]: entry },
      files: {
        [decision]: later,
        [archive]: entry + intermediate,
        [completed]: '# Completed plan'
      }
    }).notes,
    2
  )
})

test('PR snapshot validation is independent of local closeout files', (t) => {
  const parent = path.join(root, 'tmp')

  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'closeout-history-'))

  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))

  const git = (...args) =>
    execFileSync('git', args, {
      cwd: directory,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim()

  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true })
    fs.writeFileSync(path.join(directory, file), content)
  }

  git('init', '-q')
  git('config', 'user.name', 'Fixture')
  git('config', 'user.email', 'fixture@example.test')
  write('source.js', 'before')
  git('add', '.')
  git('commit', '-qm', 'Baseline')
  const base = git('rev-parse', 'HEAD')

  write('source.js', 'after')
  git('add', '.')
  git('commit', '-qm', 'Implementation without closeout')
  const head = git('rev-parse', 'HEAD')

  write(decision, entry)
  assert.equal(
    checkUpdateGuidance({ repositoryRoot: directory, base, head }).notes,
    0
  )
  assert.equal(
    checkUpdateGuidance({ repositoryRoot: directory, base }).notes,
    1
  )
})
