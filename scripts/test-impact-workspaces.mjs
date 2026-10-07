import fs from 'node:fs'
import path from 'node:path'

// Resolve package entrypoints without requiring installed links or built dist files.
// Unknown mappings stay unknown; the caller retains the importing consumers.
export function createWorkspaceSourceResolver(root, workspaces, ts) {
  const entries = new Map()
  const within = (directory, file) => file.startsWith(`${directory}${path.sep}`)
  const prepare = (workspace) => {
    if (entries.has(workspace.name)) return entries.get(workspace.name)
    let entry = null
    try {
      const directory = path.resolve(root, workspace.directory)
      const manifest = JSON.parse(
        fs.readFileSync(path.join(directory, 'package.json'), 'utf8')
      )
      const configPath = path.join(directory, 'tsconfig.json')
      const config = ts.readConfigFile(configPath, ts.sys.readFile)
      const parsed = ts.parseJsonConfigFileContent(
        config.config,
        ts.sys,
        directory,
        undefined,
        configPath
      )
      if (
        config.error ||
        parsed.errors.length ||
        parsed.options.paths ||
        parsed.options.baseUrl
      )
        throw new Error('Unproven workspace source resolution')
      const sources = new Map()
      for (const source of parsed.fileNames) {
        if (!within(directory, source))
          throw new Error('Source outside workspace')
        sources.set(source, source)
        for (const output of ts.getOutputFileNames(parsed, source, false)) {
          if (sources.has(output) && sources.get(output) !== source)
            throw new Error('Ambiguous output owner')
          sources.set(output, source)
        }
      }
      entry = { directory, manifest, sources }
    } catch {
      // A classifier must not invent a source path when emission is unresolved.
    }
    entries.set(workspace.name, entry)
    return entry
  }
  const targets = (value) => {
    if (typeof value === 'string') return [value]
    if (value && typeof value === 'object') {
      const children = Object.values(value).map(targets)
      return children.every(Boolean) ? children.flat() : null
    }
    return null
  }
  return (specifier) => {
    const name = specifier
      .split('/')
      .slice(0, specifier.startsWith('@') ? 2 : 1)
      .join('/')
    const workspace = workspaces.get(name)
    if (!workspace) return { kind: 'external', files: [] }
    const entry = prepare(workspace)
    if (!entry) return { kind: 'unknown', files: [] }
    const key = specifier === name ? '.' : `.${specifier.slice(name.length)}`
    const exports = entry.manifest.exports
    let declaration
    if (
      exports &&
      typeof exports === 'object' &&
      Object.keys(exports).some((key) => key.startsWith('.'))
    ) {
      declaration = exports[key]
    } else if (key === '.') {
      declaration = exports ?? entry.manifest.main
    }
    const paths = targets(declaration)
    if (!paths?.length) return { kind: 'unknown', files: [] }
    const files = paths.map((target) => {
      const output = path.resolve(entry.directory, target)
      return within(entry.directory, output)
        ? entry.sources.get(output)
        : undefined
    })
    return files.every((file) => file && fs.existsSync(file))
      ? { kind: 'source', files: [...new Set(files)] }
      : { kind: 'unknown', files: [] }
  }
}
