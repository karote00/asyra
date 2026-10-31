import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { withAdviceFixture } from './quality.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../..')
const [arm, id] = process.argv.slice(2)
if (!['quality-control', 'quality-knowledge'].includes(arm)) {
  throw new Error('Invalid quality arm')
}
const lock = path.join(root, 'tmp/knowledge-quality-writer.lock')
const fd = fs.openSync(lock, 'wx')
try {
  const files = fs
    .readdirSync(path.join(root, 'domain-knowledge'))
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .map((name) => path.join(root, 'domain-knowledge', name))
  files.push(path.join(root, 'apps/asyra-design/knowledge/design.docs-page.md'))
  const code = await withAdviceFixture(
    files,
    arm === 'quality-control',
    () =>
      new Promise((resolve, reject) => {
        const child = spawn(
          process.execPath,
          [path.join(here, 'run.mjs'), arm, id],
          { cwd: root, stdio: 'inherit' }
        )
        child.once('error', reject)
        child.once('exit', (code) => resolve(code ?? 1))
      })
  )
  process.exitCode = code
} finally {
  fs.closeSync(fd)
  fs.unlinkSync(lock)
}
