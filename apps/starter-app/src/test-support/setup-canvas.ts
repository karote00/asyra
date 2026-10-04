const createCanvasContext = (
  canvas: HTMLCanvasElement
): CanvasRenderingContext2D => {
  const state: Record<string, unknown> = {
    canvas,
    imageSmoothingEnabled: true,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1
  }

  return new Proxy(state, {
    get(target, key) {
      if (key in target) {
        return target[key as string]
      }
      if (key === 'measureText') {
        return (text: string) => ({ width: text.length * 8 })
      }
      if (key === 'getImageData') {
        return () => ({
          data: new Uint8ClampedArray(4),
          width: 1,
          height: 1
        })
      }
      if (key === 'createImageData') {
        return () => ({
          data: new Uint8ClampedArray(4),
          width: 1,
          height: 1
        })
      }
      if (key === 'getTransform') {
        return () => new DOMMatrix()
      }
      if (key === 'createLinearGradient' || key === 'createRadialGradient') {
        return () => ({ addColorStop: () => undefined })
      }
      if (key === 'createPattern') {
        return () => null
      }
      return () => undefined
    },
    set(target, key, value) {
      target[key as string] = value
      return true
    }
  }) as unknown as CanvasRenderingContext2D
}

HTMLCanvasElement.prototype.getContext = function getContext(
  this: HTMLCanvasElement,
  contextId: string
) {
  if (contextId === '2d') {
    return createCanvasContext(this)
  }
  return null
} as HTMLCanvasElement['getContext']
