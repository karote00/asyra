import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { withAdviceFixture } from './quality.mjs'
import { architectureFiles } from './architecture-protocol.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../..')
const [arm] = process.argv.slice(2)
if (arm !== 'quality-knowledge') {
  throw new Error('Invalid 101 arm')
}
const lock = path.join(root, 'tmp/knowledge-quality-writer.lock')
const fd = fs.openSync(lock, 'wx')
try {
  const files = architectureFiles.map((file) => path.join(root, file))
  const code = await withAdviceFixture(
    files,
    arm === 'quality-control',
    () =>
      new Promise((resolve, reject) => {
        const child = spawn(
          process.execPath,
          [path.join(here, 'run-101.mjs'), arm],
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
