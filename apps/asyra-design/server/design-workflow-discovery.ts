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
const operation = (branch: Record<string, unknown>) =>
  Array.isArray(branch.required) &&
  branch.required.length === 1 &&
  typeof branch.required[0] === 'string'
    ? branch.required[0]
    : undefined
const structure = (schema: unknown) => {
  const declaration = record(schema)
    ? schema['x-design-input-scope']
    : undefined
  if (!record(declaration)) return undefined
  const operations = branches(schema, declaration.operations)
  const nodes = branches(schema, declaration.nodes)
  if (
    !operations ||
    !nodes ||
    operations.some((branch) => !operation(branch)) ||
    nodes.some((branch) => !nodeTypes(branch).length)
  )
    return undefined
  return { operations, nodes, declaration }
}

// Explicit owner opt-in, never a second capability/type registry.
export const workflowInputScopes = (schema: unknown) => {
  const source = structure(schema)
  return source
    ? {
        operations: source.operations.map(operation),
        nodeTypes: source.nodes.flatMap(nodeTypes),
        optionalInputs: source.declaration.optionalInputs ?? []
      }
    : undefined
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
    !Array.isArray(scope.nodeTypes) ||
    !scope.nodeTypes.length ||
    scope.nodeTypes.some((type) => !choices.nodeTypes.includes(type)) ||
    new Set(scope.nodeTypes).size !== scope.nodeTypes.length ||
    (scope.optionalInputs !== undefined &&
      (!Array.isArray(scope.optionalInputs) ||
        scope.optionalInputs.some(
          (field) =>
            !Array.isArray(choices.optionalInputs) ||
            !choices.optionalInputs.includes(field)
        ) ||
        new Set(scope.optionalInputs).size !== scope.optionalInputs.length))
  )
    throw new Error(
      'Unsupported inputScope. Use the exact tool usage/menu choices or the full contract.'
    )
  const selectedTypes = scope.nodeTypes
  const schema = structuredClone(input) as Record<string, unknown>
  const source = structure(schema)
  if (!source) throw new Error('Missing owner scope declaration')
  const selected = source.operations.filter(
    (branch) => operation(branch) === scope.operation
  )
  if (selected.length !== 1) throw new Error('Ambiguous inputScope operation')
  const replace = (path: unknown, value: unknown) => {
    if (typeof path !== 'string') throw new Error('Invalid owner scope path')
    const parent = at(schema, path.slice(0, path.lastIndexOf('/')))
    if (!record(parent)) throw new Error('Invalid owner scope parent')
    parent[path.slice(path.lastIndexOf('/') + 1)] = value
  }
  replace(source.declaration.operations, selected)
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
  for (const [key, constraint] of Object.entries(
    record(selected[0].properties) ? selected[0].properties : {}
  ))
    if (constraint === false) schema.properties[key] = false
  replace(
    source.declaration.nodes,
    source.nodes.flatMap((branch) => {
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
    })
  )
  delete schema['x-design-input-scope']
  if (Array.isArray(schema.examples))
    schema.examples = schema.examples.filter(
      (example) => !operationInputIssue(example, schema)
    )

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
            .map(([name, schema]) => `${name}: ${render(schema, name)}`)
            .join('; ') +
          '}'
      )
    if (value.items !== undefined)
      pieces.push('items: ' + render(value.items, label + 'Item'))
    if (value.additionalProperties !== undefined)
      pieces.push(
        'extra fields: ' + render(value.additionalProperties, label + 'Value')
      )
    if (value.propertyNames !== undefined)
      pieces.push('field names: ' + render(value.propertyNames, 'fieldName'))
    for (const [keyword, meaning] of [
      ['anyOf', 'at least one'],
      ['oneOf', 'exactly one'],
      ['allOf', 'all']
    ] as const)
      if (Array.isArray(value[keyword]))
        pieces.push(
          `${meaning} of (${value[keyword].map((entry) => render(entry, label + 'Case')).join(' | ')})`
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
    const text = pieces.join('; ')
    if (text.length < 100 || occurrences.get(key) === 1) return text
    const name = `${label}${++sequence}`
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
    'Parameter reference: fields are optional unless listed in required. All restrictions on a value apply together. "forbidden" rejects the field/value; "extra fields: forbidden" rejects unlisted fields. Named types and notes below are included in this guide, not further queries. Numbers and lengths use the canonical limits.',
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
      'Only selected optionalInputs are included. To define criteria in this call include plan in inputScope.optionalInputs in the same query; otherwise omit plan and define criteria before review. No preliminary read is required.',
    parameters: workflowUsageParameters(selected),
    results: usage.results,
    recovery: usage.recovery
  }
}
