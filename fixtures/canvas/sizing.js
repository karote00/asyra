import { designTag } from '@asyra/design/element'

const root = globalThis.document.createElement('main')
const board = globalThis.document.createElement(designTag)

root.append(board)
globalThis.document.body.replaceChildren(root)
