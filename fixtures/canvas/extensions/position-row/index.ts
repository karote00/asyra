import type { ToolPlacement, WorkspaceExtension } from '@asyra/design'

/** Mount the Design inspector's position controls in an editor slot or host toolbar. */
export function positionRow({
  placement = 'properties.top'
}: { placement?: ToolPlacement } = {}): WorkspaceExtension<'positionRow'> {
  return {
    id: 'positionRow',
    ui: [
      {
        id: 'positionRow',
        label: 'Position',
        placement,

        mount({ editor, container }) {
          const doc = container.ownerDocument
          const row = doc.createElement('fieldset')

          row.setAttribute('aria-label', 'Position')
          row.style.cssText =
            'display:inline-flex;gap:6px;border:0;padding:0;margin:0;min-width:0'
          const unsubscribe: (() => void)[] = []

          for (const axis of ['x', 'y'] as const) {
            const label = doc.createElement('label')

            label.textContent = axis.toUpperCase()
            const input = doc.createElement('input')

            input.type = 'text'
            input.inputMode = 'decimal'
            input.style.width = '6ch'
            label.append(input)
            row.append(label)
            let displayed = ''

            unsubscribe.push(
              editor.observe(axis, (value) => {
                displayed =
                  typeof value === 'number'
                    ? String(Number(value.toFixed(2)))
                    : ''
                input.placeholder = typeof value === 'string' ? value : ''
                if (input.value !== displayed) {
                  input.value = displayed
                }
              })
            )
            input.onchange = () => {
              const text = input.value.trim()
              const value = Number(text)

              if (
                text &&
                Number.isFinite(value) &&
                !row.disabled &&
                editor.isFeatureEnabled('positionRow')
              ) {
                editor.common.element.updateElementProperties(
                  editor.common.selection.getSelectedIds(),
                  { [axis]: value }
                )
              }

              input.value = displayed
            }

            input.onkeydown = (event) => {
              if (event.key === 'Escape') {
                input.value = displayed
              }

              if (event.key === 'Enter' || event.key === 'Escape') {
                event.preventDefault()
                input.blur()
              }
            }

            unsubscribe.push(() => {
              input.onchange = null
              input.onkeydown = null
            })
          }

          let hasSelection = false
          let geometryEnabled = false

          const refresh = () => {
            const disabled = !hasSelection || !geometryEnabled

            if (row.disabled !== disabled) {
              row.disabled = disabled
            }
          }

          unsubscribe.push(
            editor.observe('elementSelection', (ids) => {
              hasSelection = ids.size > 0
              refresh()
            }),
            editor.observe('disabledFeatures', (ids) => {
              geometryEnabled = !ids.includes('geometry')
              refresh()
            })
          )
          container.append(row)

          return () => {
            unsubscribe.forEach((stop) => stop())
            row.remove()
          }
        }
      }
    ]
  }
}
