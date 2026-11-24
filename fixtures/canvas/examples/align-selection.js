export const alignmentTools = {
  actions: {
    alignLeft: {
      label: 'Align left',

      run(editor) {
        const elementIds = editor.common.selection.getSelectedIds()

        if (elementIds.length >= 2) {
          editor.common.design.arrangeDesign({
            elementIds,
            operation: 'align',
            axis: 'horizontal',
            alignment: 'start'
          })
        }
      }
    }
  }
}

export function bindAlignmentButton(editor, button, disabledFeatures = []) {
  if (
    disabledFeatures.includes('alignLeft') ||
    disabledFeatures.includes('moveElements')
  ) {
    button.disabled = true

    return () => {
      // A disabled control has no registered listeners to release.
    }
  }

  const unsubscribe = editor.observe('elementSelection', (ids) => {
    const disabled = ids.size < 2

    if (button.disabled !== disabled) {
      button.disabled = disabled
    }
  })

  const align = () => editor.runAction('alignLeft')

  button.addEventListener('click', align)

  return () => {
    button.removeEventListener('click', align)
    unsubscribe()
  }
}
