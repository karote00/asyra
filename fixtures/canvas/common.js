import { createDesign } from '@asyra/design'
import { positionRow } from '@asyra/design-ui'

function host() {
  const container = globalThis.document.createElement('div')

  container.style.cssText = 'width:360px;height:240px'
  globalThis.document.body.append(container)

  return container
}

globalThis.ready = (async () => {
  const options = { hideUI: true, ui: [positionRow] }
  const full = await createDesign(host(), options)
  const rect = full.drawRectangle({ x: 10, y: 10, width: 80, height: 40 })
  const restricted = await createDesign(host(), {
    ...options,
    document: await full.save(),
    disabledFeatures: [
      'rectangle',
      'pen',
      'fills',
      'undo',
      'moveLayerHierarchy',
      'moveElements'
    ]
  })

  Object.assign(globalThis, {
    full,
    restricted,
    rect,
    createDesign,
    positionRow
  })
})()
