/** Host resource budgets, independent of model effort or document geometry. */
export const LocalToolLibraryLimits = Object.freeze({
  entries: 256,
  receipts: 32,
  artifacts: 4096,
  recordBytes: 1024 * 1024,
  totalBytes: 32 * 1024 * 1024,
  recipe: Object.freeze({
    bytes: 256 * 1024,
    steps: 64,
    bindingDepth: 32,
    bindings: 4096,
    issues: 32
  })
})
