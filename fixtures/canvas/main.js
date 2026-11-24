import { createCanvas } from '@asyra/canvas'

const targets = [...globalThis.document.querySelectorAll('canvas')]

globalThis.targets = targets
globalThis.createCanvas = createCanvas
Promise.all(targets.map((target) => createCanvas(target))).then((editors) => {
  globalThis.editors = editors
})
