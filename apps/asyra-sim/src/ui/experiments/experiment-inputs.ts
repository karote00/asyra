import type { ProjectSession } from '../../storage/project-session'
import type { Workcell } from '../../domain/workcell'
import type { SimRuntime } from '../../init/bootstrap'
import type { RunRecord } from '../../storage/run-record'
import type { VisualPreview } from '../imports/visual-preview'
import type { PlaybackView } from './playback-view'

export interface ExperimentInputs {
  session?: ProjectSession
  historicalReplay?: boolean
  runtime: SimRuntime
  candidateId: string
  candidateName?: string
  workcell: Workcell
  revision: number
  perform: (
    action: (assertCurrent: () => void) => Promise<unknown>,
    message: string
  ) => Promise<void>
  onPlayback: (value: PlaybackView | null) => void
  runs: readonly RunRecord[]
  retainedIds: ReadonlySet<string>
  onRun: (run: RunRecord) => void
  onOpenRuns: () => void
  onVisualPreview: (preview: VisualPreview | null) => void
  isCurrent: (runtime: SimRuntime) => boolean
  visualImportActive: boolean
  previewActive?: boolean
}
