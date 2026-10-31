import { useEffect, useMemo, useState } from 'react'
import { parseWorkspaceRoute, workspaceHash } from './routing'
import { ArchitectureView } from './architecture/ArchitectureView'
import type { ArchitectureData } from './architecture/types'
import { ContractDocument } from './ContractDocument'
import { ControlPlane } from './control-plane/ControlPlane'
import type { InspectorGroup, WorkspaceBundle, WorkspaceEntry } from './types'

const groups: InspectorGroup[] = ['Apps', 'Framework', 'Release', 'Tools']

interface WorkspaceAppProps {
  bundle: WorkspaceBundle
  initialHash?: string
  routingMode?: 'hash' | 'path'
}

const searchableText = (entry: WorkspaceEntry) =>
  [entry.title, entry.id, entry.subgroup, ...entry.labels]
    .join(' ')
    .toLocaleLowerCase()

const readBrowserLocation = () => ({
  hash: typeof window === 'undefined' ? '' : window.location.hash,
  pathname: typeof window === 'undefined' ? '/' : window.location.pathname
})

export function WorkspaceApp({
  bundle,
  initialHash,
  routingMode = 'hash'
}: WorkspaceAppProps) {
  const [browserLocation, setBrowserLocation] = useState(readBrowserLocation)
  const [query, setQuery] = useState('')
  const [catalogVisible, setCatalogVisible] = useState(
    () => window.innerWidth > 900
  )
  const [detailsVisible, setDetailsVisible] = useState(
    () => window.innerWidth > 900
  )
  const [headerVisible, setHeaderVisible] = useState(true)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<InspectorGroup>>(
    new Set()
  )
  const activeHash = initialHash ?? browserLocation.hash
  const route = useMemo(
    () =>
      parseWorkspaceRoute(
        activeHash,
        bundle,
        routingMode === 'path' ? browserLocation.pathname : undefined
      ),
    [activeHash, browserLocation.pathname, routingMode, bundle]
  )

  useEffect(() => {
    if (initialHash !== undefined) {
      return
    }
    const updateLocation = () => setBrowserLocation(readBrowserLocation())
    window.addEventListener('hashchange', updateLocation)
    window.addEventListener('popstate', updateLocation)
    return () => {
      window.removeEventListener('hashchange', updateLocation)
      window.removeEventListener('popstate', updateLocation)
    }
  }, [initialHash])

  useEffect(() => {
    if (routingMode !== 'path' || route.kind === 'error') {
      return
    }
    const href = route.kind === 'selected' ? `/${route.entry.slug}` : '/'
    if (window.location.pathname + window.location.hash !== href) {
      window.history.replaceState(null, '', href)
      setBrowserLocation(readBrowserLocation())
    }
  }, [route, routingMode])

  const navigate = (entry: WorkspaceEntry | null) => {
    if (window.innerWidth <= 900) {
      setCatalogVisible(false)
    }
    if (routingMode === 'path') {
      const href = entry ? `/${entry.slug}` : '/'
      if (window.location.pathname + window.location.hash !== href) {
        window.history.pushState(null, '', href)
      }
    } else {
      window.location.hash = entry ? workspaceHash(entry.id) : ''
    }
    setBrowserLocation(readBrowserLocation())
  }

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visibleEntries = bundle.entries.filter(
    (entry) =>
      !normalizedQuery || searchableText(entry).includes(normalizedQuery)
  )

  const toggleGroup = (group: InspectorGroup) => {
    setCollapsedGroups((current) => {
      const next = new Set(current)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }

  return (
    <div
      className={`workspace-shell${catalogVisible ? '' : ' is-catalog-collapsed'}`}
    >
      <aside
        className="sidebar"
        aria-label="Inspector catalog"
        hidden={!catalogVisible}
      >
        <button
          className="panel-close-button"
          type="button"
          aria-label="Close Inspector catalog"
          onClick={() => setCatalogVisible(false)}
        >
          ×
        </button>
        <div className="brand">
          <h1>Flow Inspector</h1>
        </div>
        <button
          className="overview-link"
          type="button"
          aria-current={route.kind === 'overview' ? 'page' : undefined}
          onClick={() => navigate(null)}
        >
          Overview
        </button>
        <label className="search-field">
          <span className="eyebrow">Search catalog</span>
          <input
            className="search"
            type="search"
            value={query}
            placeholder="Title, id, subgroup, label"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <nav className="catalog" aria-label="Available Inspectors">
          {groups.map((group) => {
            const entries = visibleEntries.filter(
              (entry) => entry.group === group
            )
            const collapsed = collapsedGroups.has(group)
            return (
              <section
                className="group"
                data-testid={`group-${group}`}
                key={group}
              >
                <div className="group-heading">
                  <button
                    className="group-toggle"
                    type="button"
                    aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${group}`}
                    title={`${collapsed ? 'Expand' : 'Collapse'} ${group}`}
                    aria-expanded={!collapsed}
                    aria-controls={`group-items-${group}`}
                    onClick={() => toggleGroup(group)}
                  >
                    <span aria-hidden="true">{collapsed ? '▸' : '▾'}</span>
                  </button>
                  <span>{group}</span>
                  <span className="group-count">{entries.length}</span>
                </div>
                {!collapsed && (
                  <div className="group-items" id={`group-items-${group}`}>
                    {entries.map((entry) => (
                      <button
                        className="inspector-link"
                        data-testid="inspector-entry"
                        type="button"
                        aria-current={
                          route.kind === 'selected' &&
                          route.entry.id === entry.id
                            ? 'page'
                            : undefined
                        }
                        key={entry.id}
                        onClick={() => navigate(entry)}
                      >
                        <span>{entry.title}</span>
                        <small>
                          {entry.subgroup} - {entry.kind}
                        </small>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </nav>
      </aside>
      <main className="workspace-main">
        {!catalogVisible && (
          <button
            className="panel-close-button"
            type="button"
            aria-label="Open Inspector catalog"
            onClick={() => setCatalogVisible(true)}
          >
            ☰
          </button>
        )}
        {route.kind === 'overview' && <Overview bundle={bundle} />}
        {route.kind === 'selected' && (
          <>
            <div
              className="inspector-panels"
              role="toolbar"
              aria-label="Inspector panels"
            >
              <button
                type="button"
                onClick={() => setHeaderVisible(!headerVisible)}
              >
                {headerVisible ? 'Hide header' : 'Show header'}
              </button>
              <button
                type="button"
                onClick={() => setDetailsVisible(!detailsVisible)}
              >
                {detailsVisible ? 'Hide details' : 'Show details'}
              </button>
            </div>
            <SelectedArchitecture
              key={route.entry.id}
              entry={route.entry}
              serviceEnabled={routingMode === 'path'}
              onCloseDetails={() => setDetailsVisible(false)}
              onShowDetails={() => setDetailsVisible(true)}
              detailsVisible={detailsVisible}
              headerVisible={headerVisible}
            />
          </>
        )}
        {route.kind === 'error' && (
          <section className="route-error">
            <p className="eyebrow">Route error</p>
            <h2>Inspector “{route.id}” is not available.</h2>
            <p>
              {route.excluded
                ? 'This Inspector is explicitly excluded from the current catalog.'
                : 'No fallback target was selected.'}
            </p>
          </section>
        )}
      </main>
    </div>
  )
}

function SelectedArchitecture({
  entry,
  serviceEnabled,
  onCloseDetails,
  onShowDetails,
  detailsVisible,
  headerVisible
}: {
  entry: WorkspaceEntry
  serviceEnabled: boolean
  onCloseDetails: () => void
  onShowDetails: () => void
  detailsVisible: boolean
  headerVisible: boolean
}) {
  if (
    entry.kind === 'contract-document' &&
    entry.data &&
    typeof entry.data === 'object' &&
    !Array.isArray(entry.data)
  ) {
    return (
      <ContractDocument
        title={entry.title}
        data={entry.data as Record<string, unknown>}
      />
    )
  }

  const data = entry.data as ArchitectureData

  if (
    data?.schema?.id !== 'flow-inspector' ||
    data.schema.version !== 2 ||
    !Array.isArray(data.steps) ||
    !Array.isArray(data.lanes)
  ) {
    return (
      <section role="alert">
        This Inspector has no admitted v2 architecture: {entry.id}.
      </section>
    )
  }

  const sourceBase = serviceEnabled ? '/' : '../../../'
  const sourceUrl = new URL(
    `${sourceBase}${entry.sourcePath}`,
    window.location.href
  )
  const resolved = {
    ...data,
    links: data.links.map((link) => ({
      ...link,
      href: new URL(link.href, sourceUrl).href
    }))
  }

  if (serviceEnabled) {
    return (
      <ControlPlane
        entry={entry}
        data={resolved}
        onCloseDetails={onCloseDetails}
        onShowDetails={onShowDetails}
        detailsVisible={detailsVisible}
        headerVisible={headerVisible}
      />
    )
  }

  return (
    <ArchitectureView
      data={resolved}
      onCloseDetails={onCloseDetails}
      onShowDetails={onShowDetails}
      detailsVisible={detailsVisible}
      headerVisible={headerVisible}
    />
  )
}

function Overview({ bundle }: { bundle: WorkspaceBundle }) {
  const metrics = [
    ['Inspectors', bundle.entries.length],
    [
      'Flow v2',
      bundle.entries.filter((entry) => entry.kind === 'flow-v2').length
    ],
    [
      'Contract documents',
      bundle.entries.filter((entry) => entry.kind !== 'flow-v2').length
    ],
    ['Explicit exclusions', bundle.exclusions.length]
  ] as const

  return (
    <section className="overview">
      <p className="eyebrow">Current project catalog</p>
      <h2>One place to read every current Inspector.</h2>
      <p className="lede">
        This is static documentation: it describes contracts and planned flow,
        but does not claim runtime status, execute commands, or decide CI
        acceptance.
      </p>
      <div className="metrics">
        {metrics.map(([label, value]) => (
          <article className="metric" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
