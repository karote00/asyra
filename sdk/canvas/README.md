# @asyra/canvas

Bind a caller-owned HTML canvas without drawing or registering input handlers.
The host controls the DOM, layout and choice of tools.

```js
import { createCanvas } from '@asyra/canvas'

const surface = createCanvas(document.querySelector('canvas'))
// The element and its contents are unchanged.
await surface.destroy()
```

A product SDK calls surface.mount(setup). The callback receives the original
element and returns a session with tools and a destroy function. Mount resolves
to the tools. Each binding admits one product session. Destroy waits for startup
and product cleanup before releasing the element. After a failed setup the
binding may retry; the setup owner cleans up partially acquired resources.

Install @asyra/design for rectangle editing or @asyra/simulation for simulation
playback. Each is an independent optional package.
