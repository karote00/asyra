const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Upgrade the original typography-color document shape before canonical load. */
export const migrateTextFills = (
  input: unknown
): { version: string } & Record<string, unknown> => {
  if (!record(input) || typeof input.version !== 'string')
    throw new Error('Text fill migration requires a versioned document.')
  if (
    input.version !== '1.0.0' ||
    !record(input.sceneTree) ||
    !record(input.sceneTree.elements) ||
    !record(input.props)
  )
    return input as { version: string }

  const candidates = Object.values(input.sceneTree.elements).filter(
    (element) =>
      record(element) &&
      element.type === 'text' &&
      typeof element.id === 'string' &&
      record(element.props) &&
      element.props.fills === undefined &&
      typeof element.props.typography === 'string'
  ) as (Record<string, unknown> & {
    id: string
    props: Record<string, string>
  })[]
  if (!candidates.length) return input as { version: string }
  const props = { ...input.props }
  const elements = { ...input.sceneTree.elements }
  const allocateId = (base: string) => {
    let id = base
    let suffix = 1
    while (Object.hasOwn(props, id)) id = `${base}-${suffix++}`
    return id
  }
  for (const element of candidates) {
    const typography = input.props[element.props.typography]
    if (!record(typography) || typography.type !== 'typography')
      throw new Error('Text fill migration requires the typography property.')
    const color =
      typeof typography.textColor === 'string' &&
      /^#[0-9a-f]{6}$/i.test(typography.textColor)
        ? typography.textColor
        : '#000000'
    const fillsId = allocateId(`${element.id}-fills`)
    props[fillsId] = { id: fillsId, type: 'fills', fills: [] }
    const fillId = allocateId(`${element.id}-fill`)
    props[fillId] = {
      kind: 'solid',
      defaultColorFormat: 'hex',
      colorFormat: 'hex',
      color,
      opacity: 1,
      visible: true,
      gradient: null,
      id: fillId,
      type: 'fill'
    }
    props[fillsId] = { id: fillsId, type: 'fills', fills: [fillId] }
    elements[element.id] = {
      ...element,
      props: { ...element.props, fills: fillsId }
    }
    const { textColor: _textColor, ...fields } = typography
    props[element.props.typography] = fields
  }
  return {
    ...input,
    version: input.version,
    sceneTree: { ...input.sceneTree, elements },
    props
  }
}
