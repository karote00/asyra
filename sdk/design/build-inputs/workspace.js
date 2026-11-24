import { mount as mountApp } from '@asyra/asyra-design/workspace'
import { createCanvas } from '@asyra/canvas'

export function mount(options) {
  let binding
  const surface = {
    async start(container, start, resize, dispose) {
      const canvas = container.ownerDocument.createElement('canvas')

      canvas.style.cssText = 'width:100%;height:100%;display:block'
      binding = createCanvas(canvas)
      container.append(canvas)
      await binding.mount(async (target) => {
        const observer = new globalThis.ResizeObserver(() => {
          if (target.clientWidth && target.clientHeight) {
            resize(target.clientWidth, target.clientHeight)
          }
        })

        try {
          await start(target)
          observer.observe(target)
        } catch (error) {
          await dispose()
          throw error
        }

        return {
          tools: undefined,

          async destroy() {
            observer.disconnect()
            await dispose()
          }
        }
      })
    },

    async destroy() {
      await binding?.destroy()
    }
  }

  return mountApp({ ...options, surface })
}
