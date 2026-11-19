/** Re-express an immutable recorded exact read with current per-identity scopes.
 * Only tests call this builder; public tools never accept retired selectors.
 * Purpose searches are authored separately and are never inferred here.
 */
export const contractReadFixture = (
  names: readonly string[],
  selection: {
    view?: unknown
    includeResultSchema?: unknown
    inputScope?: unknown
    schemaPaths?: unknown
    refresh?: unknown
    refreshReason?: unknown
  } = {}
) => ({
  names: [...names],
  ...(selection.view !== undefined ? { view: selection.view } : {}),
  ...(selection.includeResultSchema !== undefined
    ? { includeResultSchema: selection.includeResultSchema }
    : {}),
  ...(selection.refresh !== undefined ? { refresh: selection.refresh } : {}),
  ...(selection.refreshReason !== undefined
    ? { refreshReason: selection.refreshReason }
    : {}),
  ...(selection.inputScope !== undefined || selection.schemaPaths !== undefined
    ? {
        scopes: Object.fromEntries(
          names.map((name) => [
            name,
            {
              ...(selection.inputScope !== undefined
                ? { inputScope: selection.inputScope }
                : {}),
              ...(selection.schemaPaths !== undefined
                ? { schemaPaths: selection.schemaPaths }
                : {})
            }
          ])
        )
      }
    : {})
})
