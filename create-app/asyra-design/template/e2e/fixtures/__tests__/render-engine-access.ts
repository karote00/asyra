// Browser-test composition entry; production code uses the Core facade.
export { PixiRenderEngine } from '@asyra/render-engine-pixi'

import type { PixiRenderEngine } from '@asyra/render-engine-pixi'

export const requireEngineObject = (
  result: ReturnType<PixiRenderEngine['execute']>
) => {
  if (!result.object) throw new Error('Expected an engine object handle')
  return result.object
}
