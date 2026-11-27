import { approvalNode } from './examples/approval-node.js'
import { createDesign, numberField } from '@asyra/design'
import { components } from '@asyra/design/ui'

const host = globalThis.document.createElement('main')

host.style.cssText = 'width:100%;height:720px'
globalThis.document.body.replaceChildren(host)
Object.assign(globalThis, {
  host,
  createDesign,
  numberField,
  approvalNode,
  components
})
globalThis.ready = createDesign(host).then((editor) => {
  globalThis.editor = editor
})
