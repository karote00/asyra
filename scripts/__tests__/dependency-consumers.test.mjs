import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)

test(
  'context-rag retains its read-only Git service with the security resolution',
  { timeout: 15000 },
  async () => {
    const ragRequire = createRequire(
      require.resolve('context-rag/package.json')
    )
    const { GitService } = ragRequire('./src/services/git.js')
    const service = new GitService({})
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8'
    }).trim()

    assert.equal(await service.getCurrentBranch(), branch)
    assert.equal(await service.git.diff(['HEAD...HEAD', '--name-only']), '')
    const history = await service.git.log({ file: 'package.json', maxCount: 1 })
    assert.equal(history.all.length, 1)
    assert.match(history.latest.hash, /^[a-f0-9]{40}$/)
  }
)

test('Tailwind source maps preserve mappings with the security resolution', () => {
  const tailwindRequire = createRequire(require.resolve('@tailwindcss/node'))
  const { SourceMapGenerator, SourceMapConsumer } =
    tailwindRequire('source-map-js')
  const generator = new SourceMapGenerator({ file: 'output.css' })
  generator.addMapping({
    generated: { line: 1, column: 0 },
    original: { line: 3, column: 2 },
    source: 'input.css'
  })
  generator.setSourceContent('input.css', '.panel { color: red; }')
  const consumer = new SourceMapConsumer(generator.toJSON())

  assert.deepEqual(consumer.originalPositionFor({ line: 1, column: 0 }), {
    source: 'input.css',
    line: 3,
    column: 2,
    name: null
  })
  assert.equal(consumer.sourceContentFor('input.css'), '.panel { color: red; }')
})

test('concurrently preserves additional arguments through its shell-quote consumer', async () => {
  const { default: concurrently } = await import('concurrently')
  const concurrentlyRequire = createRequire(require.resolve('concurrently'))
  const { quote } = concurrentlyRequire('shell-quote')
  const values = ['a b', "single'quote", '$literal', 'line\nbreak']
  const script = 'process.stdout.write(JSON.stringify(process.argv.slice(1)))'
  const { result, commands } = concurrently(
    [{ command: `${quote([process.execPath, '-e', script])} {@}` }],
    { additionalArguments: values, raw: false }
  )
  let output = ''
  commands[0].stdout.subscribe((chunk) => {
    output += chunk.toString()
  })
  const events = await result
  assert.equal(events[0].exitCode, 0)
  assert.deepEqual(JSON.parse(output), values)
})
