export {}

declare global {
  var DOMRect: new (
    x?: number,
    y?: number,
    width?: number,
    height?: number
  ) => DOMRect
}
