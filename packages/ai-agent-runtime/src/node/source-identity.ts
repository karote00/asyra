import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstat, readFile, readlink } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { promisify } from 'node:util'

/** Explicit host-side snapshot. Paths are repository-relative source scopes. */
export const captureAiSourceIdentity = async (options: {
  directory: string
  paths: readonly string[]
}): Promise<{
  sourceRevision?: string
  sourceFingerprint?: string
  sourceIdentityStatus: 'captured' | 'unavailable'
}> => {
  try {
    const execute = promisify(execFile)
    if (
      !options.paths.length ||
      options.paths.some(
        (path) =>
          !path ||
          isAbsolute(path) ||
          path.startsWith(':') ||
          path.split(/[\\/]/).includes('..')
      )
    )
      return { sourceIdentityStatus: 'unavailable' }
    const git = async (directory: string, args: string[]) =>
      (
        await execute('git', args, {
          cwd: directory,
          timeout: 5000,
          maxBuffer: 8 * 1024 * 1024,
          encoding: 'utf8',
          env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' }
        })
      ).stdout
    const root = (
      await git(options.directory, ['rev-parse', '--show-toplevel'])
    ).trim()
    const sourceRevision = (await git(root, ['rev-parse', 'HEAD'])).trim()
    const names = await git(root, [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '-z',
      '--',
      ...options.paths
    ])
    const committed = await git(root, [
      'ls-tree',
      '-r',
      '--name-only',
      '-z',
      'HEAD',
      '--',
      ...options.paths
    ])
    const paths = [
      ...new Set((names + committed).split('\0').filter(Boolean))
    ].sort()
    if (!paths.length) return { sourceIdentityStatus: 'unavailable' }
    const hash = createHash('sha256').update(sourceRevision).update('\0')
    for (const path of paths) {
      hash.update(path).update('\0')
      try {
        const location = join(root, path)
        const stat = await lstat(location)
        // Hash links rather than following them outside the chosen source scope.
        const bytes = stat.isSymbolicLink()
          ? Buffer.from(await readlink(location))
          : await readFile(location)
        hash.update(stat.isSymbolicLink() ? 'link' : 'file').update('\0')
        hash
          .update(String(bytes.length))
          .update('\0')
          .update(bytes)
          .update('\0')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
        hash.update('missing\0')
      }
    }
    return {
      sourceRevision,
      sourceFingerprint: hash.digest('hex'),
      sourceIdentityStatus: 'captured'
    }
  } catch {
    // Source metadata is optional diagnostics, never an execution prerequisite.
    return { sourceIdentityStatus: 'unavailable' }
  }
}
