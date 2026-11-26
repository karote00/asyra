import { positionRow } from '@asyra/design-ui'
import { createDesign, type WorkspaceExtension } from '@asyra/design'

const approval = {
  id: 'approval',
  node: { name: 'Approval', shape: 'oval', fields: { reviewed: false } }
} satisfies WorkspaceExtension<'approval'>

export async function openBoard(container: HTMLDivElement) {
  const editor = await createDesign(container, {
    extensions: [approval],
    ui: [positionRow],
    storageKey: 'approvals'
  })

  const position = editor.getUI(positionRow.id)

  position.setItems(positionRow.fields)

  position.setItems([position.items.y, position.items.x])
  const dimension = editor.getUI('dimensionRow')

  dimension.setItems([dimension.items.height, dimension.items.width])
  // @ts-expect-error Width belongs to Dimension.
  position.setItems([dimension.items.width])
  // @ts-expect-error Unknown rows are not part of the template catalog.
  editor.getUI('missingRow')

  editor.isFeatureEnabled('positionRow')
  await editor.setDisabledFeatures(['positionRow', 'approval'])

  // @ts-expect-error An unregistered command is absent from the combined catalog.
  await editor.runAction('unknownExtensionCommand')

  return editor
}

import { numberField } from '@asyra/design'
const node = { id: 'marker', node: { fields: { depth: 0, title: '' } } }

numberField(node, 'depth', { label: 'Depth' })
// @ts-expect-error Numeric inspector inputs bind only declared numeric fields.
numberField(node, 'title', { label: 'Title' })
