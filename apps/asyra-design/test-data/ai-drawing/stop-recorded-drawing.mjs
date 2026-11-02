/** Stop through the same accessible control used by a person. */
export const stopRecordedDrawing = (page) =>
  page
    .getByRole('button', { name: 'Cancel request', exact: true })
    .click({ timeout: 2000 })
