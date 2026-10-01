function validRepositoryScriptSelection(selection, registeredTests) {
  if (
    !selection ||
    selection.command !== 'test:scripts' ||
    !Array.isArray(selection.inputs)
  )
    return false
  if (selection.mode === 'files') {
    return (
      Array.isArray(selection.tests) &&
      selection.tests.length > 0 &&
      new Set(selection.tests).size === selection.tests.length &&
      selection.tests.every(
        (file) =>
          typeof file === 'string' &&
          /^(?:scripts|apps|tools)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.test\.(?:mjs|cjs)$/.test(
            file
          ) &&
          (!registeredTests || registeredTests.has(file))
      )
    )
  }
  return (
    ['full', 'not-selected'].includes(selection.mode) &&
    selection.tests === undefined
  )
}

module.exports = { validRepositoryScriptSelection }
