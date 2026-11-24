import { createCanvas } from '@asyra/canvas'
import { attachDesignTools } from '@asyra/design'

const targets = [...globalThis.document.querySelectorAll('canvas')]

globalThis.targets = targets
globalThis.createCanvas = createCanvas
globalThis.mountDesign = async (target, options) => {
  const surface = createCanvas(target)
  const tools = await attachDesignTools(surface, options)

  return { ...tools, destroy: surface.destroy }
}

Promise.all(targets.map((target) => globalThis.mountDesign(target))).then(
  (editors) => {
    globalThis.editors = editors
  }
)
