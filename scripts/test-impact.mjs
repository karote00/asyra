import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { createWorkspaceSourceResolver } from './test-impact-workspaces.mjs'

const require = createRequire(import.meta.url)
const code = /\.[cm]?[jt]sx?$/
const testFile = /\.test\.[jt]sx?$/
const profileFile = /\.profile\.test\.ts$/

function discover(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? discover(file) : [file]
  })
}

export function requiresTestParser(
  inputs,
  directories,
  upstreamDirectories = []
) {
  return inputs.some(
    (input) =>
      code.test(input) &&
      [...directories, ...upstreamDirectories].some((directory) =>
        input.startsWith(`${directory}/src/`)
      )
  )
}

// One invocation-owned graph. It selects tests only; it never loads app modules.
export function selectTestImpact(
  root,
  directory,
  inputs,
  forceFull = false,
  upstream = {}
) {
  const sourcePaths = upstream.sourcePaths ?? new Set()
  const workspaces = upstream.workspaces ?? new Map()
  const removedSourceOwners = new Set(
    [...sourcePaths]
      .filter((input) => !fs.existsSync(path.resolve(root, input)))
      .flatMap((input) =>
        [...workspaces.values()]
          .filter((owner) => input.startsWith(`${owner.directory}/src/`))
          .map((owner) => owner.name)
      )
  )
  const app = path.resolve(root, directory)
  const targetFiles = new Set(
    (upstream.targets ?? []).map(({ file }) => path.resolve(app, file))
  )
  const files = discover(path.join(app, 'src')).filter(
    (file) => code.test(file) && !targetFiles.has(file)
  )
  const tests =
    upstream.targets?.map(({ file }) => path.resolve(app, file)) ??
    files.filter(
      (file) =>
        file.includes(`${path.sep}__tests__${path.sep}`) && testFile.test(file)
    )
  const relative = (file) => path.relative(app, file).split(path.sep).join('/')
  const result = (selected, reason) => ({
    ordinary: selected
      .filter((file) => !profileFile.test(file))
      .map(relative)
      .sort(),
    profiles: selected
      .filter((file) => profileFile.test(file))
      .map(relative)
      .sort(),
    reason
  })
  const relevant = inputs.filter((input) => !input.endsWith('.md'))
  if (
    forceFull ||
    relevant.some(
      (input) =>
        (!input.startsWith(`${directory}/src/`) &&
          !(sourcePaths.has(input) && workspaces.size > 0)) ||
        !code.test(input) ||
        (!fs.existsSync(path.resolve(root, input)) &&
          !(
            sourcePaths.has(input) &&
            [...workspaces.values()].some(
              (owner) =>
                removedSourceOwners.has(owner.name) &&
                input.startsWith(`${owner.directory}/src/`)
            )
          ))
    )
  )
    return result(tests, 'full-owner-input')
  if (!relevant.length) return result([], 'no-source-input')
  const ts = require('typescript')
  const configPath = path.join(app, 'tsconfig.json')
  if (fs.existsSync(configPath)) {
    const config = ts.readConfigFile(configPath, ts.sys.readFile)
    if (
      config.error ||
      config.config.extends ||
      config.config.compilerOptions?.paths ||
      config.config.compilerOptions?.baseUrl
    )
      return result(tests, 'full-owner-input')
  }
  const dependents = new Map()
  const runtimeDependents = new Map()
  let parsedFiles = 0
  const uncertain = new Set()
  for (const target of upstream.targets ?? []) {
    const test = path.resolve(app, target.file)
    for (const input of target.inputs) {
      const source = path.resolve(app, input)
      if (!fs.existsSync(source)) uncertain.add(test)
      for (const edges of [dependents, runtimeDependents]) {
        if (!edges.has(source)) edges.set(source, new Set())
        edges.get(source).add(test)
      }
    }
    if (!target.inputs.length) uncertain.add(test)
  }
  const pendingFiles = [
    ...new Set([
      ...files,
      ...(upstream.targets ?? []).flatMap(({ inputs }) =>
        inputs
          .map((input) => path.resolve(app, input))
          .filter((file) => fs.existsSync(file))
      )
    ])
  ]
  const discovered = new Set(pendingFiles)
  const resolveWorkspace = createWorkspaceSourceResolver(root, workspaces, ts)
  const resolve = (from, specifier) => {
    const base = path.resolve(path.dirname(from), specifier)
    const withoutJs = base.replace(/\.[cm]?jsx?$/, '')
    const candidates = [
      base,
      ...[
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '/index.ts',
        '/index.tsx',
        '/index.js'
      ].flatMap((ext) => [base + ext, withoutJs + ext])
    ]
    return candidates.find(
      (file) => fs.existsSync(file) && fs.statSync(file).isFile()
    )
  }
  const erasedTypeImports = new Map()
  const erasesNamedTypes = (file) => {
    const configPath = ts.findConfigFile(path.dirname(file), ts.sys.fileExists)
    if (!configPath) return true
    if (!erasedTypeImports.has(configPath)) {
      const config = ts.readConfigFile(configPath, ts.sys.readFile)
      const options = config.config?.compilerOptions ?? {}
      erasedTypeImports.set(
        configPath,
        !config.error &&
          !config.config?.extends &&
          !options.verbatimModuleSyntax &&
          !options.preserveValueImports &&
          !options.importsNotUsedAsValues
      )
    }
    return erasedTypeImports.get(configPath)
  }
  for (const file of pendingFiles) {
    parsedFiles++
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true
    )
    if (source.parseDiagnostics.length) uncertain.add(file)
    const add = (specifier, typeOnly = false) => {
      if (!specifier.startsWith('.')) {
        if (sourcePaths.size && !typeOnly) {
          if (
            [...removedSourceOwners].some(
              (name) => specifier === name || specifier.startsWith(`${name}/`)
            )
          )
            uncertain.add(file)
          const resolved = resolveWorkspace(specifier)
          if (resolved.kind === 'unknown') uncertain.add(file)
          for (const target of resolved.files) {
            if (!dependents.has(target)) dependents.set(target, new Set())
            dependents.get(target).add(file)
            if (!runtimeDependents.has(target))
              runtimeDependents.set(target, new Set())
            runtimeDependents.get(target).add(file)
            if (!discovered.has(target)) {
              discovered.add(target)
              pendingFiles.push(target)
            }
          }
        }
        if (
          !specifier.startsWith('@asyra/') &&
          !specifier.startsWith('node:') &&
          specifier.startsWith('/')
        )
          uncertain.add(file)
        return
      }
      const target = resolve(file, specifier)
      if (!target) {
        uncertain.add(file)
        return
      }
      if (!dependents.has(target)) dependents.set(target, new Set())
      dependents.get(target).add(file)
      if (!typeOnly) {
        if (!runtimeDependents.has(target))
          runtimeDependents.set(target, new Set())
        runtimeDependents.get(target).add(file)
        if (sourcePaths.size && code.test(target) && !discovered.has(target)) {
          discovered.add(target)
          pendingFiles.push(target)
        }
      }
    }
    const visit = (node) => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier
      ) {
        if (ts.isStringLiteralLike(node.moduleSpecifier))
          add(
            node.moduleSpecifier.text,
            ts.isImportDeclaration(node)
              ? node.importClause?.isTypeOnly ||
                  (erasesNamedTypes(file) &&
                    !node.importClause?.name &&
                    node.importClause?.namedBindings &&
                    ts.isNamedImports(node.importClause.namedBindings) &&
                    node.importClause.namedBindings.elements.length > 0 &&
                    node.importClause.namedBindings.elements.every(
                      (entry) => entry.isTypeOnly
                    ))
              : node.isTypeOnly ||
                  (erasesNamedTypes(file) &&
                    node.exportClause &&
                    ts.isNamedExports(node.exportClause) &&
                    node.exportClause.elements.length > 0 &&
                    node.exportClause.elements.every(
                      (entry) => entry.isTypeOnly
                    ))
          )
        else uncertain.add(file)
      }
      if (ts.isImportEqualsDeclaration(node)) {
        const expression = node.moduleReference.expression
        if (expression && ts.isStringLiteralLike(expression))
          add(expression.text, node.isTypeOnly)
        else uncertain.add(file)
      }
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          node.expression.getText(source) === 'require')
      ) {
        if (
          node.arguments.length === 1 &&
          ts.isStringLiteralLike(node.arguments[0])
        )
          add(node.arguments[0].text)
        else uncertain.add(file)
      }
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(source).startsWith('import.meta.glob')
      )
        uncertain.add(file)
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  const closure = (roots, edges) => {
    const reached = new Set(roots)
    const queue = [...reached]
    for (const file of queue)
      for (const consumer of edges.get(file) ?? []) {
        if (!reached.has(consumer)) {
          reached.add(consumer)
          queue.push(consumer)
        }
      }
    return reached
  }
  const affected = new Set([
    ...closure(
      [
        ...relevant
          .filter((input) => !sourcePaths.has(input))
          .map((input) => path.resolve(root, input)),
        ...uncertain
      ],
      dependents
    ),
    ...closure(
      [...sourcePaths].map((input) => path.resolve(root, input)),
      runtimeDependents
    )
  ])
  return {
    ...result(
      tests.filter((file) => affected.has(file)),
      uncertain.size ? 'source-graph-with-conservative-edges' : 'source-graph'
    ),
    work: {
      parsedFiles,
      sourceFiles: pendingFiles.length,
      traversedFiles: affected.size
    }
  }
}
