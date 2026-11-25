import { alignmentTools } from '@example/alignment-tools'
import { createDesign, type WorkspaceExtension } from '@asyra/design'

const approval = {
  id: 'approval',
  node: { name: 'Approval', shape: 'oval', fields: { reviewed: false } }
} satisfies WorkspaceExtension<'approval'>

export async function openBoard(container: HTMLDivElement) {
  const editor = await createDesign(container, {
    extensions: [approval, alignmentTools()],
    storageKey: 'approvals'
  })

  await editor.runAction('alignLeft')
  await editor.setDisabledFeatures(['alignment', 'approval'])

  // @ts-expect-error An unregistered command is absent from the combined catalog.
  await editor.runAction('unknownExtensionCommand')

  return editor
}
