import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { captureAiSourceIdentity } from '../source-identity.js'

it('captures clean, dirty and untracked source without including unrelated files', async () => {
  const parent = join(process.cwd(), 'tmp')
  await mkdir(parent, { recursive: true })
  const directory = await mkdtemp(join(parent, 'source-identity-'))
  try {
    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim()
    git('init', '-q')
    await mkdir(join(directory, 'src'))
    await writeFile(join(directory, 'src/input.ts'), 'export const value = 1\n')
    git('add', '.')
    git(
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.invalid',
      'commit',
      '-qm',
      'Fixture'
    )
    const read = () => captureAiSourceIdentity({ directory, paths: ['src'] })
    const clean = await read()
    expect(clean).toMatchObject({
      sourceRevision: git('rev-parse', 'HEAD'),
      sourceIdentityStatus: 'captured'
    })
    expect(clean.sourceFingerprint).toMatch(/^[a-f0-9]{64}$/)
    expect(await read()).toEqual(clean)
    await writeFile(join(directory, 'unrelated.txt'), 'unrelated')
    expect(await read()).toEqual(clean)
    await writeFile(join(directory, 'src/input.ts'), 'export const value = 2\n')
    const dirty = await read()
    expect(dirty.sourceRevision).toBe(clean.sourceRevision)
    expect(dirty.sourceFingerprint).not.toBe(clean.sourceFingerprint)
    await writeFile(
      join(directory, 'src/new.ts'),
      'export const added = true\n'
    )
    expect((await read()).sourceFingerprint).not.toBe(dirty.sourceFingerprint)
    git('add', 'src')
    // Staging the same bytes must not change source identity.
    const staged = await read()
    git('reset', '-q', 'HEAD', '--', 'src/new.ts')
    expect((await read()).sourceFingerprint).toBe(staged.sourceFingerprint)
    await rm(join(directory, 'src/input.ts'))
    const deleted = await read()
    git('add', '-u')
    expect(await read()).toEqual(deleted)
    expect(
      await captureAiSourceIdentity({ directory, paths: ['../outside'] })
    ).toMatchObject({ sourceIdentityStatus: 'unavailable' })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

it('reports unavailable source access without failing the host request', async () => {
  expect(
    await captureAiSourceIdentity({
      directory: join(process.cwd(), 'missing-source-root'),
      paths: ['src']
    })
  ).toEqual({ sourceIdentityStatus: 'unavailable' })
})
