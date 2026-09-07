import type { PartHighlight } from '../../render-app/workcell-frame'
import type { PlaybackView } from './playback-view'

export function playbackHighlight(
  view: PlaybackView | null
): PartHighlight | undefined {
  const feedback = view?.feedback

  if (
    view &&
    feedback &&
    feedback.checkedTime !== null &&
    feedback.checkedTime <= view.time
  ) {
    return feedback.highlight
  }

  if (view?.historical) return view.historicalHighlight

  return undefined
}
