// The consumer needs the app's exact signatures without installing its runtime
// or resolving type imports into the monorepo. Emit, then roll up local types.
import { execFileSync } from 'node:child_process'
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const app = fileURLToPath(new URL('.', import.meta.url))
const root = path.resolve(app, '../..')

export async function buildCommonTypes(outDir) {
  const scratch = path.join(root, 'tmp/canvas')

  await mkdir(outDir, { recursive: true })
  await mkdir(scratch, { recursive: true })
  const temp = await mkdtemp(path.join(scratch, 'declarations-'))

  try {
    const entry = path.join(temp, 'workspace/common.d.ts')
    const config = path.join(temp, 'emit.json')

    await writeFile(
      config,
      JSON.stringify({
        extends: path.join(app, 'tsconfig.json'),
        compilerOptions: {
          declaration: true,
          emitDeclarationOnly: true,
          noEmit: false,
          noCheck: true,
          rootDir: path.join(app, 'src'),
          outDir: temp
        },
        files: [path.join(app, 'src/workspace/common.ts')],
        include: []
      })
    )
    execFileSync(
      process.execPath,
      [require.resolve('typescript/bin/tsc'), '-p', config],
      { stdio: 'inherit' }
    )
    // Ship the same standalone catalog in the host SDK and embedded app.
    const registry = 'inspector-registry'
    const source = await readFile(
      path.join(app, 'src/properties', registry + '.ts'),
      'utf8'
    )
    const ts = require('typescript')
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext
      }
    })

    await writeFile(path.join(outDir, registry + '.js'), outputText)
    await copyFile(
      path.join(temp, 'properties', registry + '.d.ts'),
      path.join(outDir, registry + '.d.ts')
    )

    const tsconfigFilePath = path.join(temp, 'rollup.json')

    await writeFile(
      tsconfigFilePath,
      JSON.stringify({
        compilerOptions: {
          module: 'esnext',
          moduleResolution: 'bundler',
          target: 'es2022',
          strict: true,
          skipLibCheck: true
        },
        files: [entry]
      })
    )
    const extractor = require('@microsoft/api-extractor')
    const settings = extractor.ExtractorConfig.prepare({
      configObjectFullPath: path.join(temp, 'api-extractor.json'),
      packageJsonFullPath: path.join(app, 'package.json'),
      configObject: {
        projectFolder: root,
        mainEntryPointFilePath: entry,
        bundledPackages: [
          '@asyra/core',
          '@asyra/utils',
          '@asyra/preset',
          '@asyra/reactive-events',
          '@asyra/factory',
          '@asyra/render',
          '@asyra/render-engine',
          '@asyra/selection',
          '@asyra/system-context',
          '@asyra/scene-tree',
          '@asyra/props-manager',
          'rxjs'
        ],
        compiler: { tsconfigFilePath },
        apiReport: { enabled: false },
        docModel: { enabled: false },
        tsdocMetadata: { enabled: false },
        dtsRollup: {
          enabled: true,
          untrimmedFilePath: path.join(outDir, 'common.d.ts')
        },
        messages: {
          extractorMessageReporting: {
            'ae-forgotten-export': { logLevel: 'none' },
            'ae-missing-release-tag': { logLevel: 'none' }
          }
        }
      }
    })
    const result = extractor.Extractor.invoke(settings, { localBuild: true })

    if (!result.succeeded) {
      throw new Error('Design common API type rollup failed')
    }

    const declaration = await readFile(path.join(outDir, 'common.d.ts'), 'utf8')

    if (/from ['"]@asyra\/|import\(['"]@asyra\//.test(declaration)) {
      throw new Error('Design declaration references a workspace dependency')
    }
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}
