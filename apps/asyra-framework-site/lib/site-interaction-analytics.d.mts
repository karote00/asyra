export const SITE_EVENTS: Readonly<
  Record<
    | 'cta'
    | 'navigation'
    | 'search'
    | 'searchSelect'
    | 'ui'
    | 'atlas'
    | 'codeCopy',
    string
  >
>
type Action = Readonly<{ id: string; action: string; control_id?: string }>
export const SITE_ACTIONS: Readonly<
  Record<
    | 'navigationOpen'
    | 'docsOpen'
    | 'searchOpen'
    | 'errorRetry'
    | 'atlasSelect'
    | 'atlasRun'
    | 'atlasPause'
    | 'atlasStep'
    | 'atlasReplay'
    | 'atlasReset',
    Action
  >
>
export function installSiteAnalytics(
  browser: Window,
  config: { pagePaths: readonly string[]; caseIds: readonly string[] }
): { pageChanged(): void; dispose(): void }
