import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, URL } from 'node:url'
import test from 'node:test'

const require = createRequire(import.meta.url)
const {
  admitProject
} = require('../../tools/flow-inspector/flow-files/api.cjs')
const root = fileURLToPath(new URL('../../docs/ai/', import.meta.url))
const projects = new Map()

for (const file of fs.readdirSync(root, { recursive: true })) {
  if (!file.split(path.sep).includes('plans') || !file.endsWith('.flow.json')) {
    continue
  }
  const directory = path.dirname(file)
  if (!projects.has(directory)) {
    projects.set(directory, [])
  }
  projects.get(directory).push(file)
}

for (const [directory, files] of [...projects].sort()) {
  test(`plan Flow project admits current documents: ${directory}`, () => {
    const documents = files
      .sort()
      .map((file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')))
    assert.doesNotThrow(() => admitProject(documents))
  })
}
