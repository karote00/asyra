import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

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

export function requiresTestParser(inputs, directories) {
  return inputs.some(
    (input) =>
      code.test(input) &&
      directories.some((directory) => input.startsWith(`${directory}/src/`))
  )
}

// One invocation-owned graph. It selects tests only; it never loads app modules.
export function selectTestImpact(root, directory, inputs, forceFull = false) {
  const app = path.resolve(root, directory)
  const files = discover(path.join(app, 'src')).filter((file) =>
    code.test(file)
  )
  const tests = files.filter(
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
        !input.startsWith(`${directory}/src/`) ||
        !code.test(input) ||
        !fs.existsSync(path.resolve(root, input))
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
  let parsedFiles = 0
  const uncertain = new Set()
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
  for (const file of files) {
    parsedFiles++
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true
    )
    if (source.parseDiagnostics.length) uncertain.add(file)
    const add = (specifier) => {
      if (!specifier.startsWith('.')) {
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
    }
    const visit = (node) => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier
      ) {
        if (ts.isStringLiteralLike(node.moduleSpecifier))
          add(node.moduleSpecifier.text)
        else uncertain.add(file)
      }
      if (ts.isImportEqualsDeclaration(node)) {
        const expression = node.moduleReference.expression
        if (expression && ts.isStringLiteralLike(expression))
          add(expression.text)
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
  const affected = new Set([
    ...relevant.map((input) => path.resolve(root, input)),
    ...uncertain
  ])
  const queue = [...affected]
  for (const file of queue)
    for (const consumer of dependents.get(file) ?? []) {
      if (!affected.has(consumer)) {
        affected.add(consumer)
        queue.push(consumer)
      }
    }
  return {
    ...result(
      tests.filter((file) => affected.has(file)),
      uncertain.size ? 'source-graph-with-conservative-edges' : 'source-graph'
    ),
    work: {
      parsedFiles,
      sourceFiles: files.length,
      traversedFiles: queue.length
    }
  }
}
