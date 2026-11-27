import { createDesign } from '@asyra/design'

const target = globalThis.document.querySelector('#first')

target.removeAttribute('tabindex')
globalThis.createDesign = createDesign
globalThis.ready = createDesign(target).then((editor) => {
  globalThis.editor = editor
})
