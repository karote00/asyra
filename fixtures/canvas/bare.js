import { createCanvas } from '@asyra/canvas'

const target = globalThis.document.querySelector('canvas')
const context = target.getContext('2d')

context.fillStyle = '#ff0000'
context.fillRect(0, 0, 20, 20)
// An empty binding must leave renderer and input ownership to its caller.
target.getContext = () => {
  throw new Error('Base acquired a drawing context')
}

target.addEventListener = () => {
  throw new Error('Base registered an input listener')
}

const surface = createCanvas(target)

globalThis.fixture = { surface, target, context, createCanvas }
