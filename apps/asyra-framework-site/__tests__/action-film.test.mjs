import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { URL } from 'node:url'

const mediaRoot = new URL('../public/motion/', import.meta.url)

test('approved factory media keeps its source bytes and bounded download sizes', async () => {
  const provenance = JSON.parse(
    await readFile(new URL('provenance.json', mediaRoot), 'utf8')
  )
  for (const [kind, budget] of [
    ['video', 6 * 1024 * 1024],
    ['poster', 160 * 1024]
  ]) {
    const media = provenance[kind]
    const bytes = await readFile(new URL(media.file, mediaRoot))
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      media.sha256,
      `${kind} must match the approved media provenance`
    )
    assert.ok(bytes.length > 0 && bytes.length <= budget, `${kind} byte budget`)
    assert.equal(
      bytes.toString(
        'ascii',
        kind === 'video' ? 4 : 8,
        kind === 'video' ? 8 : 12
      ),
      kind === 'video' ? 'ftyp' : 'WEBP'
    )
  }
  assert.equal(provenance.durationSeconds, 16)
  assert.equal(provenance.width, 2560)
  assert.equal(provenance.height, 1600)
})
