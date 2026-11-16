import lodash from 'lodash'

const { isEqual } = lodash

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const maps = new Set(['properties', 'patternProperties', 'dependentSchemas'])
const children = new Set([
  'items',
  'additionalProperties',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
  'contains',
  'unevaluatedProperties'
])

// Test-only structural proof, independent of production schema conversion.
// Resolve references lazily: compression changes graph locations, not meaning.
const schemaView = (root: unknown) => {
  const cache = new WeakMap<object, unknown>()
  const active = new WeakSet<object>()

  const view = (input: unknown): unknown => {
    if (!record(input)) {
      return input
    }

    if (cache.has(input)) {
      return cache.get(input)
    }

    if (active.has(input)) {
      throw new Error('Unguarded schema-reference cycle')
    }

    active.add(input)
    const {
      $ref,
      $defs: _defs,
      definitions: _definitions,
      examples: _examples,
      ...rest
    } = input

    if (rest.additionalProperties === true) {
      delete rest.additionalProperties
    }

    let result: unknown = rest

    if (typeof $ref === 'string') {
      if ($ref !== '#' && !$ref.startsWith('#/')) {
        throw new Error('Nonlocal schema reference')
      }

      let target = root

      for (const token of $ref === '#' ? [] : $ref.slice(2).split('/')) {
        const key = token.replace(/~1/g, '/').replace(/~0/g, '~')

        if (
          (!record(target) && !Array.isArray(target)) ||
          !Object.hasOwn(target, key)
        ) {
          throw new Error('Missing schema reference: ' + $ref)
        }

        target = Reflect.get(target, key)
      }

      result = view(
        Object.keys(rest).length ? { allOf: [target, rest] } : target
      )
    } else {
      for (const kind of ['anyOf', 'allOf']) {
        const branches = rest[kind]

        if (!Array.isArray(branches)) {
          continue
        }

        const { [kind]: _branches, ...common } = rest
        const flattened = branches.flatMap((branch) => {
          const child = view(branch)

          return record(child) &&
            Object.keys(child).length === 1 &&
            Array.isArray(child[kind])
            ? child[kind]
            : [child]
        })
        const selected =
          kind === 'anyOf'
            ? flattened.map((branch) =>
                Object.keys(common).length
                  ? view({ allOf: [common, branch] })
                  : branch
              )
            : [
                ...(Object.keys(common).length ? [view(common)] : []),
                ...flattened
              ]

        result = selected.length === 1 ? selected[0] : { [kind]: selected }
        break
      }
    }

    cache.set(input, result)
    if (record(result)) {
      cache.set(result, result)
    }

    active.delete(input)

    return result
  }

  return view
}

export const equivalentDeliveredSchema = (
  delivered: unknown,
  source: unknown
): boolean => {
  const leftView = schemaView(delivered)
  const rightView = schemaView(source)

  const equal = (
    left: unknown,
    right: unknown,
    pairs: readonly (readonly [object, object])[]
  ): boolean => {
    const a = leftView(left)
    const b = rightView(right)

    if (!record(a) || !record(b)) {
      return isEqual(a, b)
    }

    if (pairs.some(([x, y]) => x === a && y === b)) {
      return true
    }

    const next = [...pairs, [a, b] as const]

    // Inclusive duplicate alternatives are idempotent; exclusive ones are not.
    for (const kind of ['anyOf', 'allOf']) {
      const leftBranches: unknown[] =
        Object.keys(a).length === 1 && Array.isArray(a[kind]) ? a[kind] : [a]
      const rightBranches: unknown[] =
        Object.keys(b).length === 1 && Array.isArray(b[kind]) ? b[kind] : [b]

      if (leftBranches[0] !== a || rightBranches[0] !== b) {
        const covered = new Set<number>()

        for (const branch of leftBranches) {
          const index = rightBranches.findIndex((candidate) =>
            equal(branch, candidate, next)
          )

          if (index < 0) {
            return false
          }

          covered.add(index)
        }

        return rightBranches.every(
          (branch, index) =>
            covered.has(index) ||
            leftBranches.some((candidate) => equal(candidate, branch, next))
        )
      }
    }

    if (!isEqual(Object.keys(a).sort(), Object.keys(b).sort())) {
      return false
    }

    return Object.keys(a).every((key) => {
      const x = a[key]
      const y = b[key]

      if (maps.has(key) && record(x) && record(y)) {
        return (
          isEqual(Object.keys(x).sort(), Object.keys(y).sort()) &&
          Object.keys(x).every((name) => equal(x[name], y[name], next))
        )
      }

      if (children.has(key)) {
        return equal(x, y, next)
      }

      if (key === 'oneOf' && Array.isArray(x) && Array.isArray(y)) {
        const used = new Set<number>()

        return (
          x.length === y.length &&
          x.every((entry) => {
            const index = y.findIndex(
              (other, i) => !used.has(i) && equal(entry, other, next)
            )

            if (index < 0) {
              return false
            }

            used.add(index)

            return true
          })
        )
      }

      if (key === 'prefixItems' && Array.isArray(x) && Array.isArray(y)) {
        return (
          x.length === y.length &&
          x.every((entry, i) => equal(entry, y[i], next))
        )
      }

      if (
        ['required', 'type', 'enum'].includes(key) &&
        Array.isArray(x) &&
        Array.isArray(y)
      ) {
        return (
          x.every((entry) => y.some((other) => isEqual(entry, other))) &&
          y.every((entry) => x.some((other) => isEqual(entry, other)))
        )
      }

      return isEqual(x, y)
    })
  }

  return equal(delivered, source, [])
}
