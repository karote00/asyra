const commands = {
  rectangle: {
    label: 'Rectangle',

    run: (tools) => tools.setTool('rectangle')
  },
  select: {
    label: 'Select',

    run: (tools) => tools.setTool('select')
  },
  undo: {
    label: 'Undo',

    run: (tools) => tools.undo()
  },
  redo: {
    label: 'Redo',

    run: (tools) => tools.redo()
  }
}

export function createActions(
  options = {},
  extra = {},
  features = [],
  defaults = {}
) {
  const { actions: custom = {}, extensions = [] } = options
  const actions = new Map(Object.entries({ ...commands, ...extra }))

  const entries = [
    ...extensions.flatMap((extension) =>
      Object.entries(extension.actions ?? {})
    ),
    ...Object.entries(custom)
  ]

  const supported = [
    ...actions.keys(),
    ...entries.map(([id]) => id),
    ...features,
    ...Object.keys(defaults)
  ]

  const owners = new Map()

  for (const extension of extensions) {
    if (extension.id === undefined) {
      continue
    }

    if (
      typeof extension.id !== 'string' ||
      !extension.id.trim() ||
      supported.includes(extension.id)
    ) {
      throw new TypeError('Expected a unique extension ID')
    }

    supported.push(extension.id)
    for (const id of Object.keys(extension.actions ?? {})) {
      owners.set(id, extension.id)
    }
  }

  const validateDisabled = (ids) => disabledActions(ids, supported)

  const disabled = validateDisabled(options.disabledFeatures)

  const isEnabled = (id, mask = disabled) =>
    !mask.has(id) && !mask.has(owners.get(id))

  function runtimePolicy(mask) {
    return [
      ...new Set([
        ...mask,
        ...[...owners.keys()].filter((id) => !isEnabled(id, mask))
      ])
    ]
  }

  for (const [id, action] of entries) {
    if (
      !id.trim() ||
      actions.has(id) ||
      !action ||
      typeof action.label !== 'string' ||
      !action.label.trim() ||
      typeof action.run !== 'function'
    ) {
      throw new TypeError(
        'Expected a unique Design action with a label and run function'
      )
    }

    actions.set(id, action)
  }

  for (const [id, action] of Object.entries(defaults)) {
    if (!actions.has(id)) {
      actions.set(id, action)
    }
  }

  async function runAction(id, tools) {
    const action = actions.get(id)

    if (!action) {
      throw new TypeError('Unknown Design action: ' + id)
    }

    if (!isEnabled(id)) {
      throw new Error('Disabled Design feature: ' + id)
    }

    await action.run(tools)
  }

  return {
    actions,
    disabled,
    runAction,
    validateDisabled,
    isEnabled,
    runtimePolicy
  }
}

function disabledActions(ids = [], supported) {
  if (!Array.isArray(ids)) {
    throw new TypeError('Expected a disabledFeatures list')
  }

  const available = new Set(supported)

  for (const id of ids) {
    if (!available.has(id)) {
      throw new TypeError('Unknown Design feature: ' + id)
    }
  }

  return new Set(ids)
}
