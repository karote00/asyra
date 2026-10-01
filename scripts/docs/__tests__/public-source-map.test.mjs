import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { readPublicContentContract } from '../public-content-contract.mjs'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
)

test('public source map retains the current source bytes without API type analysis', async () => {
  const { pages } = await readPublicContentContract({ repositoryRoot })
  const sourceMap = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, 'docs/public/generated/source-map.json'),
      'utf8'
    )
  )
  const hashFile = (file) =>
    createHash('sha256')
      .update(fs.readFileSync(path.join(repositoryRoot, file), 'utf8'))
      .digest('hex')
  assert.deepEqual(
    sourceMap.pages.map((page) => page.id),
    pages.map((page) => page.id)
  )
  for (const page of pages) {
    const record = sourceMap.pages.find((record) => record.id === page.id)
    assert.equal(
      record.pageSha256,
      hashFile(`docs/public/${page.path}`),
      page.id
    )
    assert.deepEqual(
      record.sources.map((source) => source.path),
      page.sources,
      page.id
    )
    for (const source of record.sources)
      assert.equal(source.sha256, hashFile(source.path), source.path)
  }
})
