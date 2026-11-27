export function createToolbar(
  target: HTMLCanvasElement,
  items: readonly string[],
  actions: ReadonlyMap<string, { label: string }>,
  editor: {
    isFeatureEnabled(id: string): boolean
    getTool(): string | null
    runAction(id: string): Promise<void>
  },
  signal: AbortSignal
) {
  if (!target.parentNode) {
    throw new Error('Attach the canvas to a parent before creating its toolbar')
  }

  const group = target.ownerDocument.createElement('fieldset')

  group.dataset.editorPanel = 'toolbar'
  group.setAttribute('aria-label', 'Design tools')
  group.style.cssText =
    'display:flex;flex-wrap:wrap;gap:0.4em;border:0;margin:0;padding:0.4em 0;'
  const buttons = new Map<HTMLButtonElement, string>()

  const update = () => {
    for (const [button, tool] of buttons) {
      button.hidden = !editor.isFeatureEnabled(tool)
      if (tool !== 'select' && tool !== 'rectangle') {
        continue
      }

      button.setAttribute('aria-pressed', String(tool === editor.getTool()))
    }
  }

  for (const item of items) {
    const action = actions.get(item)

    if (!action) {
      throw new TypeError('Unknown Design action: ' + item)
    }

    const button = target.ownerDocument.createElement('button')

    button.dataset.toolbarAction = item
    button.type = 'button'
    button.textContent = action.label
    buttons.set(button, item)

    button.addEventListener(
      'click',
      async () => {
        group.disabled = true
        try {
          await editor.runAction(item)
        } finally {
          group.disabled = false
        }
      },
      { signal }
    )
    group.append(button)
  }

  update()
  target.before(group)

  return {
    update,

    remove: () => group.remove()
  }
}
