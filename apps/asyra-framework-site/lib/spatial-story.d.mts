export interface StoryFrame {
  chapter: number
  progress: number
  phase: number
  camera: number[]
  layers: Record<string, number[]>
  effects: Record<string, number>
}
export const storyChapters: readonly {
  id: string
  title: string
  eyebrow: string
  detail: string
  steps: string[]
  length: number
}[]
export const storyArtwork: Readonly<
  Record<string, { src: string; width: number; height: number }>
>
export const storyLayerIds: readonly string[]
export function clampProgress(value: number): number
export function getStoryFrame(
  chapter: number,
  value: number,
  reducedMotion?: boolean
): StoryFrame
export function layerTransform(values: number[]): string
export function cameraTransform(values: number[]): string
export function createScrollDriver(options: {
  requestFrame: (callback: () => void) => number
  cancelFrame: (handle: number) => void
  render: (frame: StoryFrame) => void
}): { update: (chapter: number, value: number) => void; dispose: () => void }
