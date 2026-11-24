import { createDesign } from '@asyra/design'

const host = globalThis.document.createElement('div')

host.id = 'design-host'
host.style.cssText = 'width:360px;height:240px'
const original = host.appendChild(
  globalThis.document.createComment('host content')
)

globalThis.document.body.append(host)
Object.assign(globalThis, { host, original, createDesign })
globalThis.ready = createDesign(host).then((editor) => {
  globalThis.editor = editor
})
globalThis.duplicate = createDesign(host).then(
  () => false,
  () => true
)
