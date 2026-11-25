import { build } from 'vite'
import { buildCommonTypes } from './sdk-types.mjs'
import tailwindcss from '@tailwindcss/vite'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { URL, fileURLToPath } from 'node:url'

// Each editor has its own browser input host, React portals and Core instance.
// Emit portable asset references so the consumer bundler owns their final URLs.
export async function buildWorkspace(outDir, entry) {
  const root = fileURLToPath(new URL('.', import.meta.url))

  await buildCommonTypes(outDir)
  const [result] = await build({
    root,
    envFile: false,
    configFile: false,
    publicDir: false,
    plugins: [tailwindcss()],
    esbuild: { jsx: 'automatic' },
    define: { 'process.env.NODE_ENV': '"production"' },
    experimental: {
      renderBuiltUrl(name, { hostType }) {
        return hostType === 'js'
          ? { runtime: 'window.workspaceAssets[' + JSON.stringify(name) + ']' }
          : { relative: true }
      }
    },
    build: {
      write: false,
      reportCompressedSize: false,
      target: 'es2022',
      lib: { entry, formats: ['iife'], name: 'DesignWorkspaceRuntime' },
      rollupOptions: {
        output: { inlineDynamicImports: true, entryFileNames: 'workspace.js' }
      }
    }
  })
  const entryChunk = result.output.find(
    (asset) => asset.type === 'chunk' && asset.isEntry
  )

  for (const [id, module] of Object.entries(entryChunk.modules)) {
    if (
      module.renderedLength &&
      (id.includes('/ai-agent-runtime/') ||
        id.startsWith(path.join(root, 'src/ai/conversation')) ||
        id.includes('/app/ai-conversation-panel.'))
    ) {
      throw new Error(
        'Conversation module in the embedded Design workspace: ' + id
      )
    }
  }

  const urls = []

  for (const asset of result.output) {
    const filename = path.join(outDir, 'workspace', asset.fileName)

    await mkdir(path.dirname(filename), { recursive: true })
    await writeFile(
      filename,
      asset.type === 'chunk' ? asset.code : asset.source
    )
    urls.push(
      JSON.stringify(asset.fileName) +
        ': new URL(' +
        JSON.stringify('./workspace/' + asset.fileName) +
        ', import.meta.url).href'
    )
  }

  await writeFile(
    path.join(outDir, 'workspace-assets.js'),
    'export const assets = {\n' + urls.join(',\n') + '\n}\n'
  )
  await writeFile(
    path.join(outDir, 'workspace-assets.d.ts'),
    'export declare const assets: Readonly<Record<string, string>>\n'
  )
}
