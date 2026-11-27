import { designTag } from '@asyra/design/element'

globalThis.board = globalThis.document.createElement(designTag)
globalThis.board.options = {
  toolbar: ['card', 'undo'],
  actions: {
    card: {
      label: 'Add card',

      run: (tools) =>
        tools.drawRectangle({ x: 10, y: 10, width: 90, height: 55 })
    }
  }
}
globalThis.document.body.append(globalThis.board)
