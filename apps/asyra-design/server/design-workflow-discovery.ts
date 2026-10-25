import { AiDesignToolIds } from '../src/constants/ai-design'
import { operationInputIssue } from './operation-input-schema'

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const at = (schema: unknown, path: string): unknown =>
  path
    .split('/')
    .slice(1)
    .reduce<unknown>(
      (value, key) => (record(value) ? value[key] : undefined),
      schema
    )
const branches = (schema: unknown, path: unknown) => {
  const value = typeof path === 'string' ? at(schema, path) : undefined
  return Array.isArray(value) && value.every(record) ? value : undefined
}
const nodeTypes = (branch: Record<string, unknown>): string[] => {
  const type = record(branch.properties) ? branch.properties.type : undefined
  if (!record(type)) return []
  if (
    Array.isArray(type.enum) &&
    type.enum.every((value) => typeof value === 'string')
  )
    return type.enum
  return typeof type.const === 'string' ? [type.const] : []
}
const operation = (branch: Record<string, unknown>) => {
  if (typeof branch['x-design-operation'] === 'string')
    return branch['x-design-operation']
  if (
    Array.isArray(branch.required) &&
    branch.required.length === 1 &&
    typeof branch.required[0] === 'string'
  )
    return branch.required[0]
}
const structure = (schema: unknown) => {
  const declaration = record(schema)
    ? schema['x-design-input-scope']
    : undefined
  if (!record(schema) || !record(declaration)) return
  const variants =
    declaration.operationGroups === undefined
      ? [schema]
      : branches(schema, declaration.operationGroups)
  if (!variants?.length) return
  const groups = variants.map((variant) => ({
    schema: variant,
    operations: branches(variant, declaration.operations)
  }))
  const nodes =
    declaration.nodes === undefined ? [] : branches(schema, declaration.nodes)
  if (
    !nodes ||
    nodes.some((branch) => !nodeTypes(branch).length) ||
    groups.some(
      (group) =>
        !group.operations?.length ||
        group.operations.some((branch) => !operation(branch)) ||
        new Set(group.operations.map(operation)).size !==
          group.operations.length
    )
  )
    return
  return {
    operations: groups.flatMap((group) => group.operations ?? []),
    nodes,
    declaration,
    groups
  }
}

// Explicit owner opt-in, never a second capability/type registry.
export const workflowInputScopes = (schema: unknown) => {
  const source = structure(schema)
  return source
    ? {
        operations: [
          ...new Set(
            source.operations
              .map(operation)
              .filter((key): key is string => key !== undefined)
          )
        ],
        nodeTypes: source.nodes.flatMap(nodeTypes),
        optionalInputs: source.declaration.optionalInputs ?? [],
        ...(typeof source.declaration.selection === 'string'
          ? { selection: source.declaration.selection }
          : {})
      }
    : undefined
}

// The owner identifies the repeating node; its canonical member union owns
// compatibility. This is a read projection, never inference or input rewriting.
const projectRepetition = (
  source: NonNullable<ReturnType<typeof structure>>,
  selectedTypes: string[]
) => {
  const declaration = source.declaration.repetition
  if (declaration === undefined) return
  if (
    !record(declaration) ||
    typeof declaration.type !== 'string' ||
    typeof declaration.memberField !== 'string'
  )
    throw new Error('Invalid owner repetition declaration')
  const repeatingType = declaration.type
  const candidates = source.nodes.filter((node) =>
    nodeTypes(node).includes(repeatingType)
  )
  const node = candidates[0]
  const properties = record(node?.properties) ? node.properties : undefined
  const members = properties?.[declaration.memberField]
  const items = record(members) ? members.items : undefined
  const alternatives = branches(node, '/oneOf')?.filter(
    (branch) => operation(branch) === declaration.memberField
  )
  if (
    candidates.length !== 1 ||
    !properties ||
    !record(members) ||
    !record(items) ||
    !Array.isArray(items.anyOf) ||
    !items.anyOf.every(
      (member) => record(member) && nodeTypes(member).length
    ) ||
    alternatives?.length !== 1
  )
    throw new Error('Invalid canonical repetition member contract')
  // Explicit wrapper selection retains every canonical mode and member kind.
  if (selectedTypes.includes(declaration.type)) return
  const retained = items.anyOf.filter((member) =>
    nodeTypes(member).some((type) => selectedTypes.includes(type))
  )
  if (!retained.length) return
  return {
    ...node,
    oneOf: alternatives,
    properties: {
      ...properties,
      ...(record(alternatives[0].properties) ? alternatives[0].properties : {}),
      [declaration.memberField]: {
        ...members,
        items: { ...items, anyOf: retained }
      }
    }
  }
}

export const projectWorkflowInput = (input: unknown, scope: unknown) => {
  const choices = workflowInputScopes(input)
  if (
    !choices ||
    !record(scope) ||
    Object.keys(scope).some(
      (key) => !['operation', 'nodeTypes', 'optionalInputs'].includes(key)
    ) ||
    typeof scope.operation !== 'string' ||
    !choices.operations.includes(scope.operation) ||
    (choices.nodeTypes.length > 0
      ? !Array.isArray(scope.nodeTypes) ||
        !scope.nodeTypes.length ||
        scope.nodeTypes.some((type) => !choices.nodeTypes.includes(type)) ||
        new Set(scope.nodeTypes).size !== scope.nodeTypes.length
      : scope.nodeTypes !== undefined) ||
    (scope.optionalInputs !== undefined &&
      (!Array.isArray(scope.optionalInputs) ||
        scope.optionalInputs.some(
          (field) =>
            !Array.isArray(choices.optionalInputs) ||
            !choices.optionalInputs.includes(field)
        ) ||
        new Set(scope.optionalInputs).size !== scope.optionalInputs.length))
  ) {
    const invalid = ['operation', 'nodeTypes', 'optionalInputs'].filter(
      (field) => {
        if (!record(scope) || !choices) return true
        if (field === 'operation')
          return !choices.operations.includes(String(scope.operation))
        const values = scope[field]
        if (field === 'optionalInputs' && values === undefined) return false
        if (field === 'nodeTypes' && !choices.nodeTypes.length)
          return values !== undefined
        const allowed =
          field === 'nodeTypes' ? choices.nodeTypes : choices.optionalInputs
        return (
          !Array.isArray(values) ||
          (field === 'nodeTypes' && values.length === 0) ||
          new Set(values).size !== values.length ||
          values.some(
            (value) => !Array.isArray(allowed) || !allowed.includes(value)
          )
        )
      }
    )
    throw new Error(
      `Unsupported inputScope: ${invalid.length ? invalid.join(', ') : 'extra fields'}. Select exact owner choices; do not infer aliases.`
    )
  }
  const selectedTypes: string[] = Array.isArray(scope.nodeTypes)
    ? scope.nodeTypes
    : []
  const schema = structuredClone(input) as Record<string, unknown>
  const source = structure(schema)
  if (!source) throw new Error('Missing owner scope declaration')
  const selected = source.operations.filter(
    (branch) => operation(branch) === scope.operation
  )
  if (!selected.length) throw new Error('Missing inputScope operation')
  const replace = (path: unknown, value: unknown, root: unknown = schema) => {
    if (typeof path !== 'string') throw new Error('Invalid owner scope path')
    const parent = at(root, path.slice(0, path.lastIndexOf('/')))
    if (!record(parent)) throw new Error('Invalid owner scope parent')
    parent[path.slice(path.lastIndexOf('/') + 1)] = value
  }
  if (source.declaration.operationGroups === undefined) {
    replace(source.declaration.operations, selected)
  } else {
    const variants = source.groups.flatMap((group) => {
      const matching = (group.operations ?? []).filter(
        (branch) => operation(branch) === scope.operation
      )
      if (!matching.length) return []
      replace(source.declaration.operations, matching, group.schema)
      return [group.schema]
    })
    replace(source.declaration.operationGroups, variants)
  }
  if (!record(schema.properties))
    throw new Error('Missing owner operation properties')
  const optionalInputs = source.declaration.optionalInputs ?? []
  if (!Array.isArray(optionalInputs))
    throw new Error('Invalid optional input declaration')
  for (const field of optionalInputs) {
    if (
      typeof field !== 'string' ||
      !Object.hasOwn(schema.properties, field) ||
      (Array.isArray(schema.required) && schema.required.includes(field)) ||
      source.operations.some(
        (branch) =>
          Array.isArray(branch.required) && branch.required.includes(field)
      )
    )
      throw new Error('Only optional canonical root inputs may be selected')
    if (
      !Array.isArray(scope.optionalInputs) ||
      !scope.optionalInputs.includes(field)
    )
      schema.properties[field] = false
  }
  const projectedProperties = schema.properties
  // Excluding a required member makes this negative alternative unreachable.
  // Keep selected and unrelated cross-field restrictions exactly as authored.
  if (
    record(schema.not) &&
    Array.isArray(schema.not.required) &&
    schema.not.required.some(
      (key) => typeof key === 'string' && projectedProperties[key] === false
    )
  )
    delete schema.not
  for (const [key, constraint] of Object.entries(
    record(selected[0].properties) ? selected[0].properties : {}
  ))
    if (
      constraint === false &&
      selected.every(
        (branch) =>
          record(branch.properties) && branch.properties[key] === false
      )
    )
      schema.properties[key] = false
  const repetition = projectRepetition(source, selectedTypes)
  if (source.declaration.nodes !== undefined)
    replace(source.declaration.nodes, [
      ...source.nodes.flatMap((branch) => {
        const retained = nodeTypes(branch).filter((type) =>
          selectedTypes.includes(type)
        )
        if (!retained.length) return []
        const properties = branch.properties as Record<string, unknown>
        const type = properties.type as Record<string, unknown>
        return [
          {
            ...branch,
            properties: {
              ...properties,
              type: { ...type, ...(type.enum ? { enum: retained } : {}) }
            }
          }
        ]
      }),
      ...(repetition ? [repetition] : [])
    ])
  delete schema['x-design-input-scope']
  if (Array.isArray(schema.examples))
    schema.examples = schema.examples
      .filter((example) => !operationInputIssue(example, schema))
      .sort((left, right) => {
        const selected = Array.isArray(scope.optionalInputs)
          ? scope.optionalInputs
          : []
        const present = (example: unknown) =>
          selected.filter(
            (key) =>
              typeof key === 'string' &&
              record(example) &&
              Object.hasOwn(example, key)
          ).length
        return present(right) - present(left)
      })

  // Retain exact recursive reference closure. This changes only the read projection;
  // execution continues to validate the complete canonical schema.
  const definitions = record(schema.$defs) ? schema.$defs : {}
  delete schema.$defs
  const used = new Set<string>()
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (!record(value)) return
    if (typeof value.$ref === 'string' && value.$ref.startsWith('#/$defs/')) {
      const key = value.$ref
        .slice(8)
        .split('/')[0]
        .replace(/~1/g, '/')
        .replace(/~0/g, '~')
      if (!used.has(key)) {
        used.add(key)
        visit(definitions[key])
      }
    }
    Object.values(value).forEach(visit)
  }
  visit(schema)
  schema.$defs = Object.fromEntries(
    [...used].map((key) => [key, definitions[key]])
  )
  return schema
}

/** Readable documentation of the canonical schema, never an execution validator. */
export const workflowUsageParameters = (input: unknown) => {
  const notes: string[] = []
  const reusable = new Map<string, { name: string; text: string }>()
  let sequence = 0
  const occurrences = new Map<string, number>()
  const count = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(count)
      return
    }
    if (!record(value)) return
    const key = JSON.stringify(value)
    occurrences.set(key, (occurrences.get(key) ?? 0) + 1)
    for (const [name, child] of Object.entries(value))
      if (name !== 'examples') count(child)
  }
  count(input)
  const render = (value: unknown, label: string): string => {
    if (value === false) return 'forbidden'
    if (value === true) return 'any value'
    if (!record(value)) throw new Error('Invalid canonical parameter schema')
    const key = JSON.stringify(value)
    const previous = reusable.get(key)
    if (previous) return previous.name
    const pieces: string[] = []
    if (typeof value.$ref === 'string')
      pieces.push(value.$ref.replace('#/$defs/', ''))
    if (value.type) pieces.push(String(value.type))
    if (record(value.properties))
      pieces.push(
        '{' +
          Object.entries(value.properties)
            .map(([name, schema]) => `${name}:${render(schema, name)}`)
            .join(';') +
          '}'
      )
    if (value.items !== undefined)
      pieces.push('items: ' + render(value.items, label + 'Item'))
    if (value.additionalProperties !== undefined)
      pieces.push(
        'additional=' + render(value.additionalProperties, label + 'Value')
      )
    if (value.propertyNames !== undefined)
      pieces.push('field names: ' + render(value.propertyNames, 'fieldName'))
    for (const [keyword, meaning] of [
      ['anyOf', 'anyOf'],
      ['oneOf', 'oneOf'],
      ['allOf', 'allOf']
    ] as const)
      if (Array.isArray(value[keyword]))
        pieces.push(
          `${meaning}(${value[keyword].map((entry) => render(entry, label + 'Case')).join(' | ')})`
        )
    if (typeof value.description === 'string') {
      let index = notes.indexOf(value.description)
      if (index < 0) index = notes.push(value.description) - 1
      pieces.push(`note ${index + 1}`)
    }
    // Keep all other canonical restrictions verbatim, including vocabulary added
    // by the owner later. Documentation must not silently weaken admission.
    const handled = new Set([
      '$ref',
      '$defs',
      'type',
      'properties',
      'items',
      'additionalProperties',
      'propertyNames',
      'anyOf',
      'oneOf',
      'allOf',
      'description',
      'examples'
    ])
    for (const [name, constraint] of Object.entries(value))
      if (!handled.has(name))
        pieces.push(`${name}=${JSON.stringify(constraint)}`)
    const text = pieces.join(';')
    if (text.length < 40 || occurrences.get(key) === 1) return text
    const name = `T${++sequence}`
    reusable.set(key, { name, text })
    return name
  }
  if (!record(input)) throw new Error('Missing canonical input')
  const definitions = record(input.$defs) ? input.$defs : {}
  const root = render(input, 'arguments')
  const aliases = Object.entries(definitions).map(
    ([name, schema]) => `${name} = ${render(schema, name)}`
  )
  return [
    'Optional unless required; constraints combine. forbidden rejects; additional=forbidden rejects unlisted fields. anyOf >=1; oneOf exactly one; allOf every branch. Types/notes included.',
    `arguments = ${root}`,
    ...aliases,
    ...[...reusable.values()].map(({ name, text }) => `${name} = ${text}`),
    ...notes.map((note, index) => `note ${index + 1}: ${note}`)
  ].join('\n')
}

export const workflowUsageGuide = (
  input: unknown,
  scope: unknown,
  selected: unknown
) => {
  const source = structure(input)
  const usage = source?.declaration.usage
  if (
    !record(scope) ||
    !record(usage) ||
    !record(usage.operations) ||
    typeof scope.operation !== 'string' ||
    typeof usage.operations[scope.operation] !== 'string' ||
    !['instructions', 'results', 'recovery'].every(
      (key) => typeof usage[key] === 'string' && usage[key].length > 0
    )
  )
    throw new Error(
      'The owner does not publish a selected usage guide; request the full contract.'
    )
  return {
    instructions: `${usage.instructions} ${usage.operations[scope.operation]}`,
    optionalInputs: source?.declaration.optionalInputs ?? [],
    selection:
      typeof usage.selection === 'string'
        ? usage.selection
        : 'inputScope.optionalInputs selects full contracts; selection does not require sending them. Omit plan without rereading.',
    parameters: workflowUsageParameters(selected),
    results: usage.results,
    recovery: usage.recovery
  }
}

/** Project one selected owner's query contract; never enumerate the catalog. */
export const workflowQueryGuidance = (name: string, input: unknown) => {
  const choices = workflowInputScopes(input)
  const source = structure(input)
  if (!choices || !source) return
  const example = source.declaration.queryExample
  // Authored examples cannot bypass the same scope admission used by discovery.
  projectWorkflowInput(input, example)
  const usage = source.declaration.usage
  const meanings =
    record(usage) && record(usage.operations) ? usage.operations : {}
  return {
    inputScopes: {
      operations: choices.operations,
      nodeTypes: choices.nodeTypes,
      optionalInputs: choices.optionalInputs,
      ...(choices.selection !== undefined
        ? { selection: choices.selection }
        : {})
    },
    operationUsage: Object.fromEntries(
      choices.operations.map((key) => [key, meanings[key]])
    ),
    example: {
      tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
      arguments: { names: [name], view: 'usage', inputScope: example }
    }
  }
}
