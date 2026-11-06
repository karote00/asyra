/** Resolve immutable authoring variants; canonical sharing belongs to Core. */
export const resolveMotifReference = (
  reference: Record<string, unknown>,
  definitions: Record<string, unknown>
): unknown[] => {
  const fail = (reason: string): never => {
    throw new Error(`Invalid design construction: ${reason}`)
  }

  if (
    Object.keys(reference).some(
      (key) => !['template', 'overrides'].includes(key)
    )
  ) {
    return fail('surface grid motif reference field')
  }

  const name = reference.template
  const source =
    typeof name === 'string' && Object.hasOwn(definitions, name)
      ? definitions[name]
      : undefined

  if (!Array.isArray(source)) {
    return fail(`unknown motif template ${String(name)}`)
  }

  if (reference.overrides === undefined) {
    return source
  }

  const patches = reference.overrides

  if (!patches || typeof patches !== 'object' || Array.isArray(patches)) {
    return fail('motif overrides must be a keyed map')
  }

  const keys = new Set(source.map((item) => item?.key))

  for (const [key, patch] of Object.entries(patches)) {
    if (!keys.has(key)) {
      return fail(`unknown motif override ${key}`)
    }

    if (
      !patch ||
      typeof patch !== 'object' ||
      Array.isArray(patch) ||
      Object.keys(patch).some(
        (field) =>
          ![
            'name',
            'vertices',
            'offset',
            'fill',
            'fills',
            'materialField'
          ].includes(field)
      )
    ) {
      return fail(`motif override field ${key}`)
    }
  }

  return source.map((item) => {
    const patch = Object.hasOwn(patches, item.key)
      ? (patches as Record<string, Record<string, unknown>>)[item.key]
      : undefined

    if (!patch) {
      return item
    }

    return {
      ...item,
      ...(Object.hasOwn(patch, 'materialField')
        ? { fill: undefined, fills: undefined }
        : {}),
      ...(Object.hasOwn(patch, 'fill') || Object.hasOwn(patch, 'fills')
        ? { materialField: undefined }
        : {}),
      ...patch,
      ...(Object.hasOwn(patch, 'fill') && !Object.hasOwn(patch, 'fills')
        ? { fills: undefined }
        : {})
    }
  })
}
