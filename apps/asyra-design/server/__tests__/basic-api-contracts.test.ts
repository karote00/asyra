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
import { operationInputIssue } from '../operation-input-schema'

it('admits only nonnegative hierarchy insertion indices and explains append semantics', () => {
  const move = basicApiContracts.find(
    (contract) => contract.name === 'api_hierarchy_moveElements'
  )
  if (!move) throw new Error('Missing hierarchy move contract')
  const request = { elementIds: ['detail'], targetParentId: 'drawing' }
  expect(
    operationInputIssue(
      { request: { ...request, targetIndex: -1 } },
      move.inputSchema
    )
  ).toContain('targetIndex')
  expect(
    operationInputIssue(
      { request: { ...request, targetIndex: 0 } },
      move.inputSchema
    )
  ).toBeUndefined()
  expect(move.description).toContain('getElementData')
  expect(move.description).toContain('excluding the moved elements')
  expect(move.description).toContain('append')
})

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

it('explains computed projections versus canonical value and record mutations', () => {
  const description = (name: string) =>
    basicApiContracts.find((contract) => contract.name === name)?.description
  expect(description('api_core_getElementComputedData')).toContain(
    'not a canonical write payload'
  )
  expect(description('api_core_updateElementProperties')).toContain(
    'reference IDs'
  )
  expect(description('api_core_updateElementProperties')).toContain(
    'patchElementProperties'
  )
  expect(description('api_core_patchElementProperties')).toContain('records')
  expect(description('api_core_patchElementProperties')).toContain('gradient')
  expect(description('api_core_updatePropertyComponents')).toContain(
    'propertyId'
  )
})

it('admits Fill updates with target IDs and new values without caller snapshots', () => {
  const cases = [
    {
      name: 'api_fill_updateFillFieldsBatch',
      parameters: ['updates'],
      input: {
        updates: [
          { elementId: 'rect', fillId: 'fill', patch: { opacity: 0.4 } }
        ]
      }
    }
  ]
  for (const { name, parameters, input } of cases) {
    const contract = basicApiContracts.find(
      (contract) => contract.name === name
    )
    if (!contract) throw new Error(`Missing ${name}`)
    expect(contract.parameters).toEqual(parameters)
    expect(operationInputIssue(input, contract.inputSchema)).toBeUndefined()
    expect(
      operationInputIssue({ ...input, currentFill: {} }, contract.inputSchema)
    ).toBeDefined()
  }
})

it('rejects flattened gradient fields and admits the canonical nested Fill patch', () => {
  const patch = {
    kind: 'gradient',
    gradient: {
      gradientType: 'linear',
      gradientHandles: [
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      ],
      gradientStops: [
        { position: 0, color: '#000000', opacity: 1 },
        { position: 1, color: '#ffffff', opacity: 1 }
      ]
    }
  }
  for (const name of ['api_fill_updateFillFieldsBatch']) {
    const contract = basicApiContracts.find((c) => c.name === name)
    if (!contract) throw new Error(name)
    const input = (patch: unknown) =>
      name.endsWith('Batch')
        ? { updates: [{ elementId: 'a', fillId: 'fa', patch }] }
        : { elementId: 'a', fillId: 'fa', patch }
    expect(
      operationInputIssue(input(patch), contract.inputSchema)
    ).toBeUndefined()
    expect(
      operationInputIssue(
        input({ color: '#123456', gradientType: 'linear' }),
        contract.inputSchema
      )
    ).toBeDefined()
  }
})

it('never asks callers for prior component snapshots in a public task API', () => {
  expect(
    basicApiContracts.flatMap((contract) =>
      contract.parameters
        .filter((name) =>
          ['currentStroke', 'currentFill', 'baseGradient'].includes(name)
        )
        .map((parameter) => `${contract.name}.${parameter}`)
    )
  ).toEqual([])
})

it('exposes one mutation route for scalar and plural property edits', () => {
  const names = basicApiContracts.map(({ name }) => name)
  for (const name of [
    'api_fill_updateFillField',
    'api_fill_updateFillFields',
    'api_fill_addFill',
    'api_fill_removeFill',
    'api_fill_updatePrimaryFillColor',
    'api_stroke_updateStrokeField',
    'api_stroke_updateStrokeFields',
    'api_stroke_updatePrimaryStrokeColor',
    'api_element_setVectorElementPosition',
    'api_element_createElement',
    'api_element_createVectorElement'
  ])
    expect(names).not.toContain(name)
  for (const name of [
    'api_fill_updateFillFieldsBatch',
    'api_fill_updateFillsAtIndex',
    'api_fill_shareFillAtIndex',
    'api_stroke_updateStrokeFieldsBatch',
    'api_element_setVectorElementPositions',
    'api_element_createElements'
  ])
    expect(names).toContain(name)
})

it('keeps every consolidated public method mapped to an executable replacement', () => {
  for (const disposition of basicApiDispositions) {
    if ('replacement' in disposition) {
      expect(
        basicApiContracts.some((api) => api.name === disposition.replacement)
      ).toBe(true)
      expect(disposition.reason.length).toBeGreaterThan(20)
    }
  }
})

it('provides a declared purpose and unique exact identity for every model operation', () => {
  expect(new Set(basicApiContracts.map((api) => api.operation)).size).toBe(
    basicApiContracts.length
  )
  for (const api of basicApiContracts) {
    expect(api.description).not.toContain('.  Uses the existing public API')
    expect(api.category.length).toBeGreaterThan(0)
  }
})

it('admits value-only canonical patches without requiring unused record data', () => {
  const api = basicApiContracts.find(
    (api) => api.name === 'api_core_patchElementProperties'
  )
  if (!api) throw new Error('Missing canonical patch operation')
  expect(
    operationInputIssue(
      { patches: [{ elementId: 'a', values: { width: 12 } }] },
      api.inputSchema
    )
  ).toBeUndefined()
})

it('rejects malformed Stroke field patches before dispatch without requesting old state', () => {
  const contract = basicApiContracts.find(
    (item) => item.name === 'api_stroke_updateStrokeFieldsBatch'
  )
  if (!contract) throw new Error('Missing Stroke batch contract')
  const input = (patch: unknown) => ({
    updates: [{ elementId: 'rect', strokeId: 'stroke', patch }]
  })
  expect(
    operationInputIssue(input({ width: 4 }), contract.inputSchema)
  ).toBeUndefined()
  expect(operationInputIssue(input({}), contract.inputSchema)).toBeUndefined()
  for (const patch of [
    { oldWidth: 2 },
    { width: '4' },
    { position: 'outside-ish' }
  ]) {
    expect(
      operationInputIssue(input(patch), contract.inputSchema)
    ).toBeDefined()
  }
})

it('exposes the complete structured point selection contract', () => {
  const contract = basicApiContracts.find(
    (c) => c.name === 'api_selection_selectVectorPoint'
  )
  if (!contract) throw new Error('Missing point selection contract')
  for (const target of ['anchor', 'inHandle', 'outHandle']) {
    expect(
      operationInputIssue(
        { point: { elementId: 'v', pointId: 'a', target } },
        contract.inputSchema
      )
    ).toBeUndefined()
  }
  expect(
    operationInputIssue(
      { point: { elementId: 'v', pointId: 'a' } },
      contract.inputSchema
    )
  ).toContain('target')
  expect(
    operationInputIssue(
      { point: { elementId: 'v', pointId: 'a', target: 'segment' } },
      contract.inputSchema
    )
  ).toContain('target')
})

it('keeps the host render-ready event out of model-readable operations', () => {
  expect(
    basicApiContracts.some(
      (c) => c.owner === 'core' && c.method === 'renderIsReady'
    )
  ).toBe(false)
  expect(
    basicApiDispositions.some(
      (c) =>
        c.owner === 'core' &&
        (c.methods as readonly string[]).includes('renderIsReady')
    )
  ).toBe(true)
})
