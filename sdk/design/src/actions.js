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

export function createActions(options = {}, extra = {}, features = []) {
  const { actions: custom = {}, extensions = [] } = options
  const actions = new Map(Object.entries({ ...commands, ...extra }))

  const entries = [
    ...extensions.flatMap((extension) => Object.entries(extension.actions)),
    ...Object.entries(custom)
  ]

  const disabled = disabledActions(options.disabledFeatures, [
    ...actions.keys(),
    ...entries.map(([id]) => id),
    ...features
  ])

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

    if (disabled.has(id)) {
      actions.set(id, {
        label: action.label,

        run() {
          throw new Error('Disabled Design feature: ' + id)
        }
      })
    } else {
      actions.set(id, action)
    }
  }

  async function runAction(id, tools) {
    const action = actions.get(id)

    if (!action) {
      throw new TypeError('Unknown Design action: ' + id)
    }

    await action.run(tools)
  }

  return { actions, disabled, runAction }
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
