# Feature: Viewport Navigation

## Sources

- `src/features/zoom/index.ts`
- `src/features/pan/index.ts`
- `src/features/zoom-fit/index.ts`
- `src/common-apis/viewport.ts`

## Zoom

- trigger: `input.wheel.scroll`
- priority: `5`
- exclusive: `true`
- active only when `meta` or `ctrl` is pressed
- updates `zoom` and `viewportPosition` via `viewportApis.zoomToCenter`

## Pan

- trigger: `input.wheel.scroll`
- priority: `4`
- exclusive: `false`
- active only when `meta` and `ctrl` are not pressed
- updates `viewportPosition` via wheel delta

## Zoom Fit

- trigger: `input.shortcut.zoomPreset`
- priority: `10`
- exclusive: `true`
- computes fit against `viewport-anchor` bounds and all element bounds
- preserves aspect ratio and padding, then centers the complete content bounds
  on both axes within that visible viewport; unused space is split equally

## State Contract

- viewport behavior is system-property-driven (`zoom`, `viewportPosition`)
- render/UI should consume resulting state updates

The App layout reserves the visible right sidebar width, including the Agent
conversation panel, in the viewport anchor. Opening or closing that panel does
not change the camera; the next explicit fit uses the current visible area.
