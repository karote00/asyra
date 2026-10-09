import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

it('keeps the complete root import graph portable and free of Design dependencies', () => {
  const source = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const visited = new Set<string>()
  const visit = (file: string) => {
    if (visited.has(file)) return
    visited.add(file)
    const contents = readFileSync(file, 'utf8')
    for (const match of contents.matchAll(
      /(?:from\s+|import\s*\()['"]([^'"]+)['"]/g
    )) {
      const name = match[1]
      expect(name, file).not.toMatch(/^(?:node:|@asyra\/asyra-design)/)
      if (name.startsWith('.'))
        visit(resolve(dirname(file), name.replace(/\.js$/, '.ts')))
    }
  }
  visit(resolve(source, 'index.ts'))
  expect(
    [...visited].some((file) => file.endsWith('/profiler/recorder.ts'))
  ).toBe(true)
  expect([...visited].some((file) => file.includes('/node/'))).toBe(false)
})
