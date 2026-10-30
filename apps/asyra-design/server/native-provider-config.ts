import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

/** Native-adapter configuration only. Public App tools do not depend on this adapter. */
export const createNativeProviderConfig = async (options: {
  executable: string
  model: string
  directory: string
  signal?: AbortSignal
}) => {
  options.signal?.throwIfAborted()
  const raw = await new Promise<string>((accept, reject) => {
    execFile(
      options.executable,
      ['debug', 'models', '--bundled'],
      {
        encoding: 'utf8',
        timeout: 5000,
        maxBuffer: 16 * 1024 * 1024,
        signal: options.signal
      },
      (error, stdout) => (error ? reject(error) : accept(stdout))
    )
  })
  options.signal?.throwIfAborted()
  const catalog: unknown = JSON.parse(raw)
  const models =
    typeof catalog === 'object' &&
    catalog !== null &&
    'models' in catalog &&
    Array.isArray(catalog.models)
      ? catalog.models
      : []
  const matches = models.filter(
    (entry: unknown) =>
      typeof entry === 'object' &&
      entry !== null &&
      'slug' in entry &&
      entry.slug === options.model
  )
  if (matches.length !== 1)
    throw new Error('Selected native model metadata is missing or ambiguous')
  const selected = {
    ...matches[0],
    tool_mode: 'direct',
    use_responses_lite: false,
    multi_agent_version: null
  }
  const root = resolve(options.directory)
  await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'native-model-'))
  const dispose = () => rm(directory, { recursive: true, force: true })
  try {
    options.signal?.throwIfAborted()
    const path = join(directory, 'model.json')
    await writeFile(path, JSON.stringify({ models: [selected] }), {
      mode: 0o600
    })
    options.signal?.throwIfAborted()
    return {
      path,
      arguments: ['-c', `model_catalog_json=${JSON.stringify(path)}`],
      dispose
    }
  } catch (error) {
    await dispose()
    throw error
  }
}
