import { buildWorkspace } from '@asyra/asyra-design/sdk-build'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))
const scratch = path.resolve(root, '../../tmp/canvas')
const src = path.join(root, 'src')
const inputs = path.join(root, 'build-inputs')
const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc')

function compile(project) {
  execFileSync(process.execPath, [tsc, '-p', project], {
    cwd: root,
    stdio: 'inherit'
  })
}

await mkdir(scratch, { recursive: true })
const temp = await mkdtemp(path.join(scratch, 'design-build-'))
const output = path.join(temp, 'dist')

try {
  compile('tsconfig.workspace.json')
  await buildWorkspace(output, path.join(root, 'build-inputs/workspace.ts'))
  const project = path.join(temp, 'tsconfig.json')
  const compiled = path.join(temp, 'compiled')

  await writeFile(
    project,
    JSON.stringify({
      extends: path.join(root, 'tsconfig.json'),
      compilerOptions: { rootDirs: [src, inputs, output], outDir: compiled }
    })
  )
  compile(project)
  await cp(path.join(compiled, 'src'), output, { recursive: true })
  for (const name of ['runtime.d.ts', 'canvas-engine.d.ts']) {
    await cp(path.join(compiled, 'build-inputs', name), path.join(output, name))
  }

  // Each borrowed canvas needs its own framework module state. Evaluate the bundled
  // engine and factory inside createRuntime for each new canvas.
  const built = await build({
    root,
    configFile: false,
    publicDir: false,
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      write: false,
      target: 'es2022',
      reportCompressedSize: false,
      lib: {
        entry: path.join(inputs, 'runtime.ts'),
        name: 'canvasRuntime',
        formats: ['iife']
      },
      rollupOptions: { output: { inlineDynamicImports: true } }
    }
  })
  const script = built[0].output.find((entry) => entry.type === 'chunk').code

  await writeFile(
    path.join(output, 'runtime.js'),
    'export function createRuntime() {\n' +
      script +
      '\nreturn canvasRuntime.createRuntime()\n}\n'
  )
  const dist = path.join(root, 'dist')

  await rm(dist, { recursive: true, force: true })
  await rename(output, dist)
} finally {
  await rm(temp, { recursive: true, force: true })
}
