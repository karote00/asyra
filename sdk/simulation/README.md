# @asyra/simulation

Install @asyra/canvas and @asyra/simulation. The initial tool is wall-clock
playback in seconds. The application supplies the simulation model and presents
each sample. The callback receives the exact endpoint on completion.

```js
import { createCanvas } from '@asyra/canvas'
import { attachSimulationTools } from '@asyra/simulation'

const surface = createCanvas(document.querySelector('canvas'))
const simulation = await attachSimulationTools(surface)
simulation.play(0, 3, time => displaySample(surface.target, time), onFinished)
```

Pause playback with simulation.pause(). Destroying the binding cancels the
outstanding frame. The low-level PlaybackClock accepts a custom frame scheduler
and is also used by the simulation workbench.
