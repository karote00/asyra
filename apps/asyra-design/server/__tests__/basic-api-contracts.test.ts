import {
  defineBasicApi,
  apiString,
  apiNumber
} from '../../src/ai/basic-api-contracts'
import { basicApiDispositions } from '../../src/ai/basic-api-dispositions'
import { expect, it } from 'vitest'
import ts from 'typescript'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'

it('binds every action to the existing public method signature in argument order', () => {
  const root = path.resolve('../..')
  const config = ts.readConfigFile(
    path.resolve('tsconfig.typecheck.json'),
    ts.sys.readFile
  )
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    process.cwd()
  )
  const sources: Record<string, [string, string]> = {
    core: ['packages/core/src/core.ts', 'Core'],
    element: [
      'apps/asyra-design/src/common-apis/element/apis.ts',
      'elementApis'
    ],
    selection: [
      'apps/asyra-design/src/common-apis/selection.ts',
      'selectionApis'
    ],
    hierarchy: [
      'apps/asyra-design/src/common-apis/hierarchy.ts',
      'hierarchyApis'
    ],
    viewport: ['apps/asyra-design/src/common-apis/viewport.ts', 'viewportApis'],
    fill: ['apps/asyra-design/src/common-apis/fills.ts', 'fillApis'],
    stroke: ['apps/asyra-design/src/common-apis/strokes.ts', 'strokeApis'],
    transaction: [
      'apps/asyra-design/src/common-apis/transaction.ts',
      'transactionApis'
    ],
    history: ['apps/asyra-design/src/common-apis/history.ts', 'historyApis'],
    systemContext: [
      'apps/asyra-design/src/common-apis/system-context.ts',
      'systemContextApis'
    ],
    cursor: ['apps/asyra-design/src/common-apis/cursor.ts', 'cursorApis'],
    renderLayer: [
      'apps/asyra-design/src/common-apis/render-layer.ts',
      'renderLayerApis'
    ],
    inspection: [
      'apps/asyra-design/src/common-apis/inspection.ts',
      'inspectionApis'
    ],
    vectorGeometry: [
      'apps/asyra-design/src/common-apis/element/vector-consistency.ts',
      'vectorGeometry'
    ]
  }
  const program = ts.createProgram(
    [
      ...parsed.fileNames,
      ...Object.values(sources).map(([file]) => path.join(root, file))
    ],
    parsed.options
  )
  const checker = program.getTypeChecker()
  const issues: string[] = []
  const barrel = ts.createSourceFile(
    'index.ts',
    readFileSync('src/common-apis/index.ts', 'utf8'),
    ts.ScriptTarget.Latest,
    true
  )
  const inventoriedExports = new Set(
    Object.values(sources).map(([, exported]) => exported)
  )
  for (const statement of barrel.statements) {
    if (
      !ts.isExportDeclaration(statement) ||
      statement.isTypeOnly ||
      !statement.exportClause ||
      !ts.isNamedExports(statement.exportClause)
    )
      continue
    for (const entry of statement.exportClause.elements) {
      if (!entry.isTypeOnly && !inventoriedExports.has(entry.name.text))
        issues.push(
          `common-apis export ${entry.name.text}: missing owner inventory`
        )
    }
  }

  for (const [owner, [file, variable]] of Object.entries(sources)) {
    const source = program.getSourceFile(path.join(root, file))
    expect(source, file).toBeDefined()
    if (!source) continue
    let type: ts.Type | undefined
    const visit = (node: ts.Node) => {
      if (
        (ts.isVariableDeclaration(node) || ts.isClassDeclaration(node)) &&
        node.name?.getText(source) === variable
      )
        type = checker.getTypeAtLocation(node)
      ts.forEachChild(node, visit)
    }
    visit(source)
    expect(type, variable).toBeDefined()
    if (!type) continue
    const dispositions = basicApiDispositions
      .filter((entry) => entry.owner === owner)
      .flatMap((entry) => [...entry.methods])
    if (new Set(dispositions).size !== dispositions.length)
      issues.push(`${owner}: duplicate classification`)
    for (const method of dispositions)
      if (!type.getProperty(method))
        issues.push(`${owner}.${method}: stale classification`)
    for (const property of type.getProperties()) {
      const declaration = property.valueDeclaration
      if (
        declaration &&
        ts.canHaveModifiers(declaration) &&
        ts
          .getModifiers(declaration)
          ?.some(
            (modifier) =>
              modifier.kind === ts.SyntaxKind.PrivateKeyword ||
              modifier.kind === ts.SyntaxKind.ProtectedKeyword
          )
      )
        continue
      const action = basicApiContracts.some(
        (c) => c.owner === owner && c.method === property.name
      )
      const classified = basicApiDispositions.some(
        (entry) =>
          entry.owner === owner &&
          (entry.methods as readonly string[]).includes(property.name)
      )
      if (!action && !classified)
        issues.push(`${owner}.${property.name}: unclassified public API`)
      if (action && classified)
        issues.push(`${owner}.${property.name}: duplicate disposition`)
    }
    for (const entry of basicApiContracts.filter((c) => c.owner === owner)) {
      const property = type.getProperty(entry.method)
      const declaration = property?.valueDeclaration
      if (!property || !declaration) {
        issues.push(`${owner}.${entry.method}: missing`)
        continue
      }
      const signature = checker
        .getTypeOfSymbolAtLocation(property, declaration)
        .getCallSignatures()[0]
      if (!signature) {
        issues.push(`${owner}.${entry.method}: not callable`)
        continue
      }
      const params = signature.getParameters().map((p) => p.name)
      const supplied = entry.parameters
      if (
        JSON.stringify(params.slice(0, supplied.length)) !==
        JSON.stringify(supplied)
      )
        issues.push(
          `${owner}.${entry.method}: expected ${params.join(',')} received ${supplied.join(',')}`
        )
      for (const p of signature.getParameters().slice(supplied.length)) {
        const d = p.valueDeclaration
        if (d && ts.isParameter(d) && !d.questionToken && !d.initializer)
          issues.push(`${owner}.${entry.method}: omitted required ${p.name}`)
      }
    }
  }
  expect(issues).toEqual([])
})

it('admits typed vector batches and rejects malformed geometry and history suppression before execution', async () => {
  const { prepareOperationBatch } = await import('../local-operation-batch')
  const name = 'api_element_updateVectorAnchorPointPosition'
  const valid = { elementId: 'v', pointId: 'a', position: { x: 40, y: 20 } }
  const batch = prepareOperationBatch(
    [{ name, arguments: valid }],
    basicApiContracts
  )
  expect(batch[0].arguments).toBe(valid)
  expect(() =>
    prepareOperationBatch(
      [{ name, arguments: { ...valid, position: { x: '40', y: 20 } } }],
      basicApiContracts
    )
  ).toThrow()
  expect(() =>
    prepareOperationBatch(
      [{ name, arguments: { ...valid, options: { undoable: false } } }],
      basicApiContracts
    )
  ).toThrow()
  expect(() =>
    prepareOperationBatch(
      [{ name: 'api_core_resetRuntime', arguments: {} }],
      basicApiContracts
    )
  ).toThrow()
})

it('keeps declared parameter order while excluding optional fields from required inputs', () => {
  const contract = defineBasicApi({
    owner: 'core',
    method: 'getElementComputedData',
    effect: 'read',
    parameters: [
      { name: 'elementId', schema: apiString },
      {
        name: 'fields',
        schema: { type: 'array', items: apiString },
        optional: true
      }
    ],
    description: 'Read selected fields.'
  })
  expect(contract.parameters).toEqual(['elementId', 'fields'])
  expect(contract.inputSchema).toEqual({
    type: 'object',
    additionalProperties: false,
    properties: {
      elementId: apiString,
      fields: { type: 'array', items: apiString }
    },
    required: ['elementId']
  })
  expect(contract.name).toBe('api_core_getElementComputedData')
  // Numeric-looking names must also retain declaration order, not object-key ordering.
  expect(
    defineBasicApi({
      owner: 'core',
      method: 'ordered',
      effect: 'read',
      parameters: [
        { name: '2', schema: apiNumber },
        { name: '1', schema: apiNumber }
      ]
    }).parameters
  ).toEqual(['2', '1'])
})

it('supports parameterless APIs without allowing undeclared model arguments', () => {
  const contract = defineBasicApi({
    owner: 'core',
    method: 'getCurrentWorkspaceId',
    effect: 'read',
    parameters: []
  })
  expect(contract.parameters).toEqual([])
  expect(contract.inputSchema).toEqual({
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false
  })
})
