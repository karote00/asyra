import { createDesign } from '@asyra/design'

const { document } = globalThis
const host = document.querySelector('main')
const features = document.querySelector('#features')
const hideUI = document.querySelector('#hide-ui')
const status = document.querySelector('#status')
let editor
let savedDocument

async function openEditor() {
  features.disabled = true
  hideUI.disabled = true
  const options = {
    disabledFeatures: JSON.parse(features.value),
    hideUI: hideUI.checked
  }

  try {
    if (editor) {
      savedDocument = await editor.save()
      await editor.destroy()
      editor = undefined
      globalThis.editor = undefined
    }

    editor = await createDesign(host, { ...options, document: savedDocument })
    globalThis.editor = editor
    status.textContent = JSON.stringify(options)
  } catch (error) {
    status.textContent = error.message
  } finally {
    features.disabled = false
    hideUI.disabled = false
  }
}

features.addEventListener('change', openEditor)
hideUI.addEventListener('change', openEditor)
void openEditor()
