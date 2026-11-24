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

export function createActions(custom = {}) {
  const actions = new Map(Object.entries(commands))

  for (const [id, action] of Object.entries(custom)) {
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

  return actions
}
