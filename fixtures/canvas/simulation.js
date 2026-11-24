import { createCanvas } from '@asyra/canvas'
import { attachSimulationTools } from '@asyra/simulation'

const surface = createCanvas(globalThis.document.querySelector('canvas'))

attachSimulationTools(surface).then((tools) => {
  globalThis.fixture = { tools, surface }
})
