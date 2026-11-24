import { createDesign } from '@asyra/design'

function host() {
  const container = globalThis.document.createElement('div')

  container.style.cssText = 'width:360px;height:240px'
  globalThis.document.body.append(container)

  return container
}

globalThis.ready = (async () => {
  const full = await createDesign(host(), { hideUI: true })
  const rect = full.drawRectangle({ x: 10, y: 10, width: 80, height: 40 })
  const restricted = await createDesign(host(), {
    hideUI: true,
    document: await full.save(),
    disabledFeatures: [
      'rectangle',
      'pen',
      'fills',
      'undo',
      'moveLayerHierarchy'
    ]
  })

  Object.assign(globalThis, { full, restricted, rect })
})()
