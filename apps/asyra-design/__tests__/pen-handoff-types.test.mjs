import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import test from 'node:test'
import ts from 'typescript'

const app = resolve(import.meta.dirname, '..')
const config = ts.readConfigFile(
  resolve(app, 'tsconfig.pen-handoff.json'),
  ts.sys.readFile
)
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, app)

test('Pen handoff compilation includes its property undo and redo consumer', () => {
  assert.ok(parsed.fileNames.includes(resolve(app, 'e2e/properties.spec.ts')))
})

test('handoff compilation includes the rectangle helper regression', () => {
  assert.ok(
    parsed.fileNames.includes(resolve(app, 'e2e/rectangle-handoff.spec.ts'))
  )
})

const checkDeclaration = (replacement) => {
  assert.equal(parsed.errors.length, 0)
  const file = resolve(app, 'src/types.d.ts')
  const options = {
    ...parsed.options,
    skipLibCheck: false
  }
  const host = ts.createCompilerHost(options)
  const readFile = host.readFile

  host.readFile = (name) => {
    const text = readFile(name)

    return name === file && replacement
      ? text.replace('typeof core', replacement)
      : text
  }

  const program = ts.createProgram([file], options, host)
  const source = program.getSourceFile(file)

  assert.ok(source)
  assert.deepEqual(
    program
      .getSemanticDiagnostics(source)
      .map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')
      ),
    []
  )
  const checker = program.getTypeChecker()
  const owner = source.statements.find(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      statement.importClause?.name?.text === 'core'
  )

  assert.ok(owner?.importClause?.name)
  assert.equal(owner.moduleSpecifier.text, './contexts')
  const symbol = checker.getSymbolAtLocation(owner.importClause.name)

  assert.ok(symbol)
  const expected = checker.getTypeOfSymbolAtLocation(
    checker.getAliasedSymbol(symbol),
    owner
  )

  assert.equal(expected.flags & ts.TypeFlags.Any, 0)
  const matches = []

  const visit = (node) => {
    if (
      ts.isPropertySignature(node) &&
      node.type &&
      ts.isTypeQueryNode(node.type) &&
      node.type.exprName.getText(source) === 'core'
    ) {
      matches.push(checker.getTypeFromTypeNode(node.type))
    }

    ts.forEachChild(node, visit)
  }

  visit(source)
  assert.equal(
    matches.length,
    1,
    'The declaration must reference the actual Core owner type'
  )
  assert.equal(matches[0], expected)
}

test('App browser declarations resolve against real owners without skipped declaration checking', () => {
  checkDeclaration()
})

for (const replacement of ['any', 'unknown', 'string']) {
  test(`declaration proof rejects a substituted ${replacement} owner type`, () => {
    assert.throws(() => checkDeclaration(replacement), /actual Core owner type/)
  })
}

test('handoff compilation includes all tool shortcut browser regressions', () => {
  assert.ok(
    parsed.fileNames.includes(resolve(app, 'e2e/tool-shortcut-handoff.spec.ts'))
  )
})
