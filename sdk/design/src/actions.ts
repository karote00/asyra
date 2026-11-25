import { canvasFeatures } from './features.js'
import type { CanvasFeature } from './features.js'
import type { DesignTools, WorkspaceTools } from './index.js'

interface Action<T> {
  label: string
  run(tools: T): void | Promise<void>
}
type Actions<T> = Record<string, Action<T> | undefined>

const commands: Record<CanvasFeature, Action<DesignTools<string>>> = {
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

export function createActions<T extends DesignTools<string> = WorkspaceTools>(
  options: {
    actions?: Actions<T>
    extensions?: readonly { id?: string; actions?: Actions<T> }[]
    disabledFeatures?: readonly string[]
  } = {},
  extra: Record<string, Action<T>> = {},
  features: readonly string[] = canvasFeatures,
  defaults: Record<string, Action<T>> = {}
) {
  const { actions: custom = {}, extensions = [] } = options
  const actions = new Map<string, Action<T>>(
    Object.entries({ ...commands, ...extra })
  )

  const entries = [
    ...extensions.flatMap((extension) =>
      Object.entries(extension.actions ?? {})
    ),
    ...Object.entries(custom)
  ]

  const supported = new Set<string>(features)

  for (const [id] of entries) {
    supported.add(id)
  }

  const owners = new Map<string, string>()

  for (const extension of extensions) {
    if (extension.id === undefined) {
      continue
    }

    if (
      typeof extension.id !== 'string' ||
      !extension.id.trim() ||
      supported.has(extension.id)
    ) {
      throw new TypeError('Expected a unique extension ID')
    }

    supported.add(extension.id)
    for (const id of Object.keys(extension.actions ?? {})) {
      owners.set(id, extension.id)
    }
  }

  const featureIds = Object.freeze([...supported])

  const validateDisabled = (ids?: readonly string[]) =>
    disabledActions(ids, supported)

  const disabled = validateDisabled(options.disabledFeatures)

  const isEnabled = (id: string, mask = disabled) => {
    const owner = owners.get(id)

    return (
      supported.has(id) &&
      !mask.has(id) &&
      (owner === undefined || !mask.has(owner))
    )
  }

  function runtimePolicy(mask: Set<string>) {
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

  async function runAction(id: string, tools: T) {
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

    listFeatures: () => featureIds,

    disabled,
    runAction,
    validateDisabled,
    isEnabled,
    runtimePolicy
  }
}

function disabledActions(
  ids: readonly string[] = [],
  supported: ReadonlySet<string>
) {
  if (!Array.isArray(ids)) {
    throw new TypeError('Expected a disabledFeatures list')
  }

  for (const id of ids) {
    if (!supported.has(id)) {
      throw new TypeError('Unknown Design feature: ' + id)
    }
  }

  return new Set<string>(ids)
}
