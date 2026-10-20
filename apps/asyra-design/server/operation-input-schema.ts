import lodash from 'lodash'

const { isEqual } = lodash

// App-owned model-input admission. Canonical executors remain the authority for
// target permissions, current state and writes. Never validate prepared geometry
// again here: this consumes the advertised model-facing operation schema.
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
export { operationInputIssue } from '../src/ai/tool-schema'

// Native Code Mode renders union branches without their sibling constraints.
// Distribute object constraints into each alternative before registration; local
// admission still uses the original schema. Never alter the caller's registry.
const intersectSchemas = (left: unknown, right: unknown): unknown => {
  if (left === false || right === false) return false
  if (!record(left)) return right
  if (!record(right)) return left
  // Each closed object constrains its own property set. Merging sets would
  // accidentally admit fields that its sibling explicitly excludes.
  for (const [closed, other] of [
    [left, right],
    [right, left]
  ]) {
    if (closed.additionalProperties === false && record(other.properties)) {
      const allowed = record(closed.properties) ? closed.properties : {}
      if (
        Object.keys(other.properties).some(
          (name) => !Object.hasOwn(allowed, name)
        )
      )
        return { allOf: [left, right] }
    }
  }
  const result: Record<string, unknown> = { ...left }
  for (const [key, value] of Object.entries(right)) {
    if (!(key in result) || isEqual(result[key], value)) {
      result[key] = value
      continue
    }
    if (
      key === 'required' &&
      Array.isArray(result[key]) &&
      Array.isArray(value)
    ) {
      result[key] = [...new Set([...result[key], ...value])]
    } else if (key === 'properties' && record(result[key]) && record(value)) {
      const properties = { ...result[key] }
      for (const [name, property] of Object.entries(value))
        properties[name] =
          name in properties
            ? intersectSchemas(properties[name], property)
            : property
      result[key] = properties
    } else {
      // Preserve less common overlapping constraints exactly instead of choosing
      // either value and silently relaxing admission.
      return { allOf: [left, right] }
    }
  }
  return result
}
export const nativeToolInputSchema = (schema: unknown): unknown => {
  if (!record(schema)) return schema
  const result = { ...schema }
  for (const key of ['required', 'enum', 'type'] as const) {
    if (Array.isArray(result[key])) result[key] = [...new Set(result[key])]
  }
  // A compatible primitive const already expresses this enum. Keep incompatible
  // enums: their contradiction must not become an admitted value.
  if (
    'const' in result &&
    (result.const === null ||
      ['string', 'number', 'boolean'].includes(typeof result.const)) &&
    Array.isArray(result.enum) &&
    result.enum.includes(result.const)
  )
    delete result.enum
  for (const key of ['properties', '$defs', 'definitions'] as const) {
    if (record(result[key]))
      result[key] = Object.fromEntries(
        Object.entries(result[key]).map(([name, child]) => [
          name,
          nativeToolInputSchema(child)
        ])
      )
  }
  for (const key of ['items', 'additionalProperties'] as const)
    if (record(result[key])) result[key] = nativeToolInputSchema(result[key])
  if (Array.isArray(result.prefixItems))
    result.prefixItems = result.prefixItems.map(nativeToolInputSchema)
  for (const mode of ['oneOf', 'anyOf', 'allOf'] as const) {
    const branches = result[mode]
    if (!Array.isArray(branches)) continue
    if (mode !== 'allOf' && record(result.properties)) {
      const {
        [mode]: _branches,
        $defs,
        definitions,
        examples,
        ...common
      } = result
      return {
        ...($defs ? { $defs } : {}),
        ...(definitions ? { definitions } : {}),
        ...(examples !== undefined ? { examples } : {}),
        [mode]: compactNativeAlternatives(
          mode,
          branches.map((branch) =>
            nativeToolInputSchema(intersectSchemas(common, branch))
          )
        )
      }
    }
    result[mode] = compactNativeAlternatives(
      mode,
      branches.map(nativeToolInputSchema)
    )
  }
  // With a closed object, omission expresses a prohibited field correctly to
  // native declaration generators that otherwise render `false` as `string`.
  if (result.additionalProperties === false && record(result.properties)) {
    result.properties = Object.fromEntries(
      Object.entries(result.properties).filter(
        ([name, value]) =>
          value !== false ||
          (Array.isArray(result.required) && result.required.includes(name))
      )
    )
  }
  return result
}

const compactNativeAlternatives = (
  mode: string,
  branches: unknown[]
): unknown[] => {
  // oneOf counts matching alternatives; even byte-identical branches matter.
  if (mode === 'oneOf' || branches.some(hasReferenceValueConstraint))
    return branches
  return [
    ...new Map(
      branches.map((branch) => [JSON.stringify(branch), branch])
    ).values()
  ]
}

// Admission currently compares object-valued const/enum choices by identity.
// Keep those alternatives intact even when their JSON text is identical.
const hasReferenceValueConstraint = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(hasReferenceValueConstraint)
  if (!record(value)) return false
  if (value.const !== null && typeof value.const === 'object') return true
  if (
    Array.isArray(value.enum) &&
    value.enum.some((choice) => choice !== null && typeof choice === 'object')
  )
    return true
  return Object.values(value).some(hasReferenceValueConstraint)
}
