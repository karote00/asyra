import { build } from 'vite'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

process.chdir(root)
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
      entry: 'build-inputs/editor.js',
      name: 'canvasRuntime',
      formats: ['iife']
    },
    rollupOptions: { output: { inlineDynamicImports: true } }
  }
})
const script = built[0].output.find((entry) => entry.type === 'chunk').code

// Initialize module-owned Framework state independently for each target.
await mkdir('dist', { recursive: true })
await writeFile(
  'dist/runtime.js',
  'export function createRuntime() {\n' + script + '\nreturn canvasRuntime\n}\n'
)
for (const name of ['index.js', 'index.d.ts', 'toolbar.js', 'actions.js']) {
  await copyFile('src/' + name, 'dist/' + name)
}
