const alignments = [
  ['alignLeft', 'Align left', 'horizontal', 'start'],
  ['alignCenter', 'Align horizontal centers', 'horizontal', 'center'],
  ['alignRight', 'Align right', 'horizontal', 'end'],
  ['alignTop', 'Align top', 'vertical', 'start'],
  ['alignMiddle', 'Align vertical centers', 'vertical', 'center'],
  ['alignBottom', 'Align bottom', 'vertical', 'end']
]

const actions = Object.fromEntries(
  alignments.map(([id, label, axis, alignment]) => [
    id,
    {
      label,

      run(editor) {
        const elementIds = editor.common.selection.getSelectedIds()

        if (elementIds.length >= 2) {
          editor.common.design.arrangeDesign({
            elementIds,
            operation: 'align',
            axis,
            alignment
          })
        }
      }
    }
  ])
)

export function alignmentTools({ placement = 'properties.top' } = {}) {
  return {
    id: 'alignment',
    actions,
    ui: [
      {
        id: 'alignment',
        label: 'Alignment',
        placement,

        mount({ container, editor }) {
          const row = container.ownerDocument.createElement('div')

          row.style.cssText = 'display:flex;flex-wrap:wrap;gap:2px'
          const buttons = alignments.map(([id, label]) => {
            const button = container.ownerDocument.createElement('button')

            button.type = 'button'
            button.textContent = label
              .replace('Align ', '')
              .replace('horizontal centers', 'center')
              .replace('vertical centers', 'middle')
            button.title = label
            button.setAttribute('aria-label', label)
            button.style.cssText =
              'border:1px solid currentColor;border-radius:3px;padding:2px 4px'
            button.onclick = () => editor.runAction(id)
            row.append(button)

            return { id, button }
          })

          container.append(row)
          const unbind = bindAvailability(editor, buttons)

          return () => {
            unbind()
            row.remove()
          }
        }
      }
    ]
  }
}

export function mountAlignmentTools(container, editor) {
  return editor.toolGroups.mount('alignment', container)
}

function bindAvailability(editor, buttons) {
  let count = 0
  let disabled = new Set()

  function update() {
    for (const { id, button } of buttons) {
      const blocked =
        count < 2 ||
        disabled.has(id) ||
        disabled.has('moveElements') ||
        disabled.has('alignment')

      if (button.disabled !== blocked) {
        button.disabled = blocked
      }
    }
  }

  const features = editor.observe('disabledFeatures', (ids) => {
    disabled = new Set(ids)
    update()
  })
  const selection = editor.observe('elementSelection', (ids) => {
    count = ids.size
    update()
  })

  return () => {
    selection()
    features()
  }
}

export function bindAlignmentButton(editor, button) {
  const unbind = bindAvailability(editor, [{ id: 'alignLeft', button }])

  const align = () => editor.runAction('alignLeft')

  button.addEventListener('click', align)

  return () => {
    button.removeEventListener('click', align)
    unbind()
  }
}
