export const usesCpuSoftwareRenderer =
  process.env.WEBGL_RENDERER === 'swiftshader' ||
  (process.platform !== 'darwin' && !process.env.WEBGL_RENDERER)
