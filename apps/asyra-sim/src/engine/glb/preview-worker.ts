import { RestrictedGlbPreviewWorker as SharedPreviewWorker } from '@asyra/preset/spatial-assets'

/** The App supplies its bundled Worker; request and retirement semantics are shared. */
export class RestrictedGlbPreviewWorker extends SharedPreviewWorker {
  constructor(
    createWorker: () => Worker = () =>
      new Worker(new URL('./preview.worker.ts', import.meta.url), {
        type: 'module'
      })
  ) {
    super(createWorker)
  }
}
