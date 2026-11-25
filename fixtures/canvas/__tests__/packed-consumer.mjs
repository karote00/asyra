import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import { build, createServer, preview } from 'vite'
import { chromium } from 'playwright'

const fixture = fileURLToPath(new URL('../', import.meta.url))
export const root = path.resolve(fixture, '../..')

export async function withConsumer(
  packages,
  entry,
  assertions,
  { development = false } = {}
) {
  if (entry === 'common.js' || entry === 'tool-layout.js') {
    packages = [...packages, 'fixtures/canvas/extensions/alignment-tools']
  }

  const scratch = path.join(root, 'tmp/native-canvas')

  await mkdir(scratch, { recursive: true })
  const cwd = await mkdtemp(path.join(scratch, 'consumer-'))

  const npm = (args) =>
    execFileSync('npm', args, {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, npm_config_cache: path.join(scratch, 'npm-cache') }
    })

  const pack = (dir) => {
    const [{ filename, files }] = JSON.parse(
      npm([
        'pack',
        dir,
        ...(dir.endsWith('/alignment-tools') ? [] : ['--ignore-scripts']),
        '--json'
      ])
    )

    if (dir === path.join(root, 'sdk/design')) {
      const paths = new Set(files.map((file) => file.path))

      for (const entry of ['index', 'element', 'react']) {
        assert.ok(paths.has('dist/' + entry + '.js'))
        assert.ok(paths.has('dist/' + entry + '.d.ts'))
      }

      assert.ok(
        !paths.has('dist/vue.d.ts') && !paths.has('dist/design-board.vue')
      )
    }

    return './' + filename
  }

  await writeFile(
    path.join(cwd, 'package.json'),
    JSON.stringify({ private: true, type: 'module' })
  )
  const archives = packages.map((dir) => pack(path.join(root, dir)))

  npm([
    'install',
    '--offline',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    ...archives
  ])
  const { packages: installed } = JSON.parse(
    await readFile(path.join(cwd, 'package-lock.json'), 'utf8')
  )

  assert.deepEqual(
    Object.keys(installed).filter(Boolean).sort(),
    packages
      .map((dir) => {
        if (dir === 'fixtures/canvas/extensions/alignment-tools') {
          return 'node_modules/@example/alignment-tools'
        }

        return dir.startsWith('sdk/')
          ? 'node_modules/@asyra/' + path.basename(dir)
          : dir
      })
      .sort()
  )
  const headless = entry === 'headless.js'
  const layoutDemo = entry === 'tool-layout.js'

  await cp(
    path.join(
      fixture,
      headless || layoutDemo ? entry.replace('.js', '.html') : 'index.html'
    ),
    path.join(cwd, 'index.html')
  )
  if (headless) {
    await cp(path.join(fixture, 'headless.css'), path.join(cwd, 'headless.css'))
  }

  if (
    entry === 'react.js' ||
    entry === 'common.js' ||
    entry === 'workspace.js' ||
    layoutDemo
  ) {
    await cp(path.join(fixture, 'examples'), path.join(cwd, 'examples'), {
      recursive: true
    })
  }

  await cp(
    path.join(fixture, entry),
    path.join(cwd, headless ? entry : 'main.js')
  )

  await writeFile(
    path.join(cwd, 'consumer.ts'),
    [
      "import { createCanvas } from '@asyra/canvas'",
      "export const surface = createCanvas(document.createElement('canvas'))",
      ...(packages.includes('sdk/simulation')
        ? [
            "import { attachSimulationTools } from '@asyra/simulation'",
            'const tools = await attachSimulationTools(surface)',
            'tools.play(0, 1, seconds => seconds.toFixed(2), () => tools.pause())'
          ]
        : [])
    ].join('\n')
  )
  const designTypeTests = packages.includes('sdk/design') ? ['design.ts'] : []

  if (designTypeTests.length) {
    await cp(path.join(fixture, 'types/design.ts'), path.join(cwd, 'design.ts'))
  }

  if (packages.includes('fixtures/canvas/extensions/alignment-tools')) {
    await cp(
      path.join(fixture, 'types/extensions.ts'),
      path.join(cwd, 'extensions.ts')
    )
    designTypeTests.push('extensions.ts')
  }

  execFileSync(
    process.execPath,
    [
      path.join(root, 'node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--typeRoots',
      './node_modules/@types',
      '--target',
      'ES2022',
      '--module',
      'ESNext',
      '--moduleResolution',
      'bundler',
      'consumer.ts',
      ...designTypeTests,
      ...(entry === 'react.js'
        ? ['--jsx', 'react-jsx', 'examples/DesignBoard.tsx']
        : [])
    ],
    { cwd }
  )
  const result = await build({
    esbuild: { jsx: 'automatic' },
    root: cwd,
    configFile: false,
    logLevel: 'error'
  })

  for (const chunk of result.output.filter((entry) => entry.type === 'chunk')) {
    for (const id of chunk.moduleIds) {
      if (path.isAbsolute(id)) {
        assert.ok(
          id.startsWith(cwd + path.sep),
          'Module escaped the clean consumer: ' + id
        )
      }
    }
  }

  // Vite's programmatic build sets NODE_ENV to production for the process.
  // Run the dev server with the same conditions as a fresh Vite CLI.
  const previousEnv = process.env.NODE_ENV

  if (development) {
    process.env.NODE_ENV = 'development'
  }

  const server = development
    ? await createServer({
        root: cwd,
        configFile: false,
        logLevel: 'error',
        esbuild: { jsx: 'automatic' },
        server: { port: 0, host: '127.0.0.1' }
      })
    : await preview({
        root: cwd,
        configFile: false,
        preview: { port: 0, host: '127.0.0.1' }
      })
  let browser

  try {
    if (development) {
      await server.listen()
    }

    browser = await chromium.launch({
      channel:
        process.env.PLAYWRIGHT_CHANNEL ||
        (process.env.CI ? 'chrome' : undefined),
      args: ['--enable-unsafe-swiftshader']
    })
    const page = await browser.newPage({
      viewport: { width: 850, height: 1080 }
    })
    const errors = []

    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    await page.goto(server.resolvedUrls.local[0])
    await assertions(page, cwd)
    assert.deepEqual(errors, [])
  } finally {
    await browser?.close()
    if (development) {
      await server.close()
      if (previousEnv === undefined) {
        delete process.env.NODE_ENV
      } else {
        process.env.NODE_ENV = previousEnv
      }
    } else {
      await new Promise((resolve) => server.httpServer.close(resolve))
    }
  }
}
