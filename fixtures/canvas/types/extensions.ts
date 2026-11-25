import { positionRow } from '@example/position-row'
import { createDesign, type WorkspaceExtension } from '@asyra/design'

const approval = {
  id: 'approval',
  node: { name: 'Approval', shape: 'oval', fields: { reviewed: false } }
} satisfies WorkspaceExtension<'approval'>

export async function openBoard(container: HTMLDivElement) {
  const editor = await createDesign(container, {
    extensions: [approval, positionRow()],
    storageKey: 'approvals'
  })

  editor.isFeatureEnabled('positionRow')
  await editor.setDisabledFeatures(['positionRow', 'approval'])

  // @ts-expect-error An unregistered command is absent from the combined catalog.
  await editor.runAction('unknownExtensionCommand')

  return editor
}
