import { readdirSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

// Resolve actual TypeScript exports, including spread methods, aliases and
// re-exports, independently of the SDK's mounted catalog.
export function commonInventory(root) {
  const directory = path.join(root, 'apps/asyra-design/src/common-apis')
  const files = readdirSync(directory, { recursive: true })
    .filter((name) => name.endsWith('.ts') && !name.includes('__tests__'))
    .map((name) => path.join(directory, name))
  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    module: ts.ModuleKind.ESNext,
    skipLibCheck: true,
    strict: true
  })
  const checker = program.getTypeChecker()
  const grouped = new Set()
  const functions = new Set()
  const groups = {
    elementApis: 'element',
    vectorApis: 'element',
    vectorGeometry: 'vectorGeometry',
    selectionApis: 'selection',
    historyApis: 'history',
    viewportApis: 'viewport',
    systemContextApis: 'systemContext',
    renderLayerApis: 'renderLayer',
    cursorApis: 'cursor',
    hierarchyApis: 'hierarchy',
    inspectionApis: 'inspection',
    fillApis: 'fills',
    strokeApis: 'strokes',
    textCanvasApis: 'text',
    transactionApis: 'transaction'
  }

  for (const file of files) {
    const source = program.getSourceFile(file)
    const module = checker.getSymbolAtLocation(source)

    for (let symbol of checker.getExportsOfModule(module)) {
      const name = symbol.name

      if (symbol.flags & ts.SymbolFlags.Alias) {
        symbol = checker.getAliasedSymbol(symbol)
      }

      if (!symbol.valueDeclaration) {
        continue
      }

      const type = checker.getTypeOfSymbolAtLocation(
        symbol,
        symbol.valueDeclaration
      )

      if (type.getCallSignatures().length) {
        functions.add(name)
      }

      if (Object.hasOwn(groups, name)) {
        for (const member of type.getProperties()) {
          grouped.add(groups[name] + '.' + member.name)
        }
      }
    }
  }

  return { grouped: [...grouped].sort(), functions: [...functions].sort() }
}
