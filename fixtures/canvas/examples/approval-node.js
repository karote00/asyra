// Use the extension ID as the document type across every host that opens this board.
export const approvalNode = {
  id: 'approval',
  node: {
    name: 'Approval',
    shape: 'oval',
    fillColor: '#e24989',
    fields: { status: 'pending', reviewed: false }
  },
  actions: {
    insertApproval: {
      label: 'Add approval',

      run(editor) {
        editor.common.element.createElement({
          type: 'approval',
          workspacePosition: { x: 140, y: 100 },
          width: 100,
          height: 60,
          fields: { reviewed: true }
        })
      }
    }
  }
}
