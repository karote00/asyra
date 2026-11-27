import assert from 'node:assert/strict'
import { execFile, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'

// Serve the actual packed manifests so npm resolves transitive dependencies
// exactly as it would after publication. The registry lives only for this install.
export async function installDesign(cwd, archives, cache) {
  const releases = new Map()

  for (const file of archives) {
    const archive = await readFile(path.join(cwd, file))
    const manifest = JSON.parse(
      execFileSync('tar', ['-xOf', file, 'package/package.json'], {
        cwd,
        encoding: 'utf8'
      })
    )

    releases.set(manifest.name, {
      archive,
      manifest,
      integrity:
        'sha512-' + createHash('sha512').update(archive).digest('base64')
    })
  }

  const server = createServer((req, res) => {
    const url = decodeURIComponent(req.url.slice(1))
    const [name, tar] = url.split('/-/')
    const release = releases.get(name)

    if (!release) {
      res.writeHead(404).end()

      return
    }

    if (tar) {
      res.end(release.archive)

      return
    }

    const { manifest, integrity } = release
    const version = manifest.version

    res.setHeader('content-type', 'application/json')
    res.end(
      JSON.stringify({
        name,
        'dist-tags': { latest: version },
        versions: {
          [version]: {
            ...manifest,
            dist: {
              integrity,
              tarball: `http://127.0.0.1:${server.address().port}/${name}/-/package.tgz`
            }
          }
        }
      })
    )
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  try {
    await promisify(execFile)(
      'npm',
      [
        'install',
        '@asyra/design',
        '--registry',
        `http://127.0.0.1:${server.address().port}`,
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--fetch-retries=0'
      ],
      { cwd, env: { ...process.env, npm_config_cache: cache } }
    )
    const { dependencies } = JSON.parse(
      await readFile(path.join(cwd, 'package.json'), 'utf8')
    )

    assert.deepEqual(
      Object.keys(dependencies).filter((name) => name.startsWith('@asyra/')),
      ['@asyra/design']
    )
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}
