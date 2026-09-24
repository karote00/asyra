import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  validateMarkdownLinks,
  validatePublicDocumentation,
  validatePublicImportMentions,
  validateStarterEntry
} from '../public-documentation-validation.mjs'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
)

test('complete public documentation passes structural, link, and API gates', async () => {
  const summary = await validatePublicDocumentation({ repositoryRoot })

  assert.equal(summary.pageCount, 41)
  assert.equal(summary.packageGuideCount, 19)
  assert.equal(summary.conceptPageCount, 7)
  assert.equal(summary.implementationGuideCount, 11)
  assert.equal(summary.typescriptSnippetCount, 11)
  assert.ok(summary.localLinkCount > 100)
  assert.ok(summary.apiReferenceCount > 50)
  assert.equal(summary.unownedMarkdownCount, 0)
})

test('public guides do not retain malformed copy fragments', () => {
  const hierarchyGuide = fs.readFileSync(
    path.join(repositoryRoot, 'docs/public/build/hierarchy-groups.md'),
    'utf8'
  )

  assert.doesNotMatch(hierarchyGuide, /\bThe public\s+The\b/)
})

test('public overview routes Starter source, Design, and advanced composition without an unpublished command', () => {
  const overview = fs.readFileSync(
    path.join(repositoryRoot, 'docs/public/index.md'),
    'utf8'
  )
  const starter = overview.indexOf('### Generic Starter source')
  const design = overview.indexOf('### Complete Design product')
  const advanced = overview.indexOf('### Advanced composition')
  assert.ok(starter > 0 && starter < design && design < advanced)
  assert.match(overview, /apps\/starter-app\/docs\/ONBOARDING\.md/u)
  assert.match(overview, /not yet published to the public npm registry/u)
  assert.match(overview, /does not include an AI\s+runtime/u)
  assert.doesNotMatch(
    overview,
    /(?:npx|npm create|yarn create) create-asyra-app/u
  )
  assert.doesNotThrow(() => validateStarterEntry({ source: overview }))
  assert.throws(
    () =>
      validateStarterEntry({
        source: `${overview}\nnpx create-asyra-app my-app`
      }),
    /unpublished Starter command/u
  )
})

test('link validation rejects missing and escaping targets', () => {
  assert.throws(
    () =>
      validateMarkdownLinks({
        filePath: path.join(repositoryRoot, 'docs/public/index.md'),
        repositoryRoot,
        source: '[missing](missing-page.md)'
      }),
    /broken local link/
  )
  assert.throws(
    () =>
      validateMarkdownLinks({
        filePath: path.join(repositoryRoot, 'docs/public/index.md'),
        repositoryRoot,
        source: '[outside](../../../../outside.md)'
      }),
    /escapes the repository/
  )
})

test('public import validation rejects private and unsupported subpaths', () => {
  const apiIndex = {
    packages: [
      {
        name: '@asyra/core',
        publicEntries: ['.', './contracts']
      }
    ]
  }
  assert.throws(
    () =>
      validatePublicImportMentions({
        apiIndex,
        pageId: 'test/private',
        source: 'Use `@asyra/core/src/core`.'
      }),
    /private package path/
  )
  assert.throws(
    () =>
      validatePublicImportMentions({
        apiIndex,
        pageId: 'test/unsupported',
        source: 'Use `@asyra/core/unknown`.'
      }),
    /unsupported public subpath/
  )
})
