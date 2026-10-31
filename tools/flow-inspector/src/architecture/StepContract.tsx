import type { ArchitectureData, ArchitectureStep, ReferenceLink } from './types'

function Reference({
  value,
  authority
}: {
  value: string | ReferenceLink
  authority?: string
}) {
  if (typeof value !== 'string') {
    return (
      <a href={value.href} target="_blank" rel="noopener noreferrer">
        {value.label}
      </a>
    )
  }

  if (value.startsWith('#') && authority) {
    return (
      <a
        href={`${authority}${value}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <code>{value}</code>
      </a>
    )
  }

  return (
    <>
      {value
        .split(/(`[^`]+`)/g)
        .map((part, index) =>
          part.startsWith('`') ? (
            <code key={index}>{part.slice(1, -1)}</code>
          ) : (
            part
          )
        )}
    </>
  )
}

function Section({
  title,
  values,
  authority
}: {
  title: string
  values: (string | ReferenceLink)[]
  authority?: string
}) {
  return (
    <section className="detail-section" data-detail-section={title}>
      <h3>{title}</h3>
      <ul>
        {(values.length ? values : ['None']).map((value, index) => (
          <li key={index}>
            <Reference value={value} authority={authority} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function StepContract({
  data,
  step,
  showHeading = true
}: {
  data: ArchitectureData
  step: ArchitectureStep
  showHeading?: boolean
}) {
  const authority = data.links.find((link) => link.kind === 'authority')?.href
  const incoming = data.routes.filter((route) => route.to === step.id)
  const outgoing = data.routes.filter((route) => route.from === step.id)
  const sections = {
    Conditions: step.conditions,
    Bypasses: step.bypasses,
    'Cache dimensions': step.cacheDimensions,
    'Implementation boundary': step.implementationBoundary,
    'Allowed contributors': step.allowedContributors,
    'Forbidden contributors': step.forbiddenContributors,
    'Incoming routes': incoming.map(
      (route) =>
        `${route.id} [${route.kind}]: ${route.predicate}; ${route.from} -> ${route.to ?? 'terminal'}; artifacts ${route.producedArtifacts.join(', ')}`
    ),
    'Outgoing routes': outgoing.map(
      (route) =>
        `${route.id} [${route.kind}]: ${route.predicate}; ${route.from} -> ${route.to ?? 'terminal'}; artifacts ${route.producedArtifacts.join(', ')}`
    ),
    'Owned artifacts': data.artifacts
      .filter((artifact) => artifact.ownerStepId === step.id)
      .map(
        (artifact) =>
          `${artifact.id}: ${artifact.channel}; consumers ${artifact.consumerStepIds.join(', ') || 'terminal'}`
      ),
    'Consumed artifacts': data.artifacts
      .filter((artifact) => artifact.consumerStepIds.includes(step.id))
      .map(
        (artifact) =>
          `${artifact.id}: owner ${artifact.ownerStepId}; ${artifact.channel}`
      ),
    Invariants: data.invariants
      .filter((item) => item.stepIds.includes(step.id))
      .map((item) =>
        [
          item.id,
          item.title,
          item.statement,
          item.assertion,
          item.artifactIds && `Artifacts: ${item.artifactIds.join(', ')}`,
          item.specRefs && `References: ${item.specRefs.join(', ')}`
        ]
          .filter(Boolean)
          .join('; ')
      ),
    'Acceptance contracts': data.acceptanceContracts
      .filter((item) => item.stepIds.includes(step.id))
      .map(
        (item) =>
          `${item.id}: ${item.assertions.join('; ')}; refs ${item.specRefs.join(', ')}`
      )
  }

  return (
    <div className="detail-content">
      <div className="detail-group">
        {data.lanes.find((lane) => lane.id === step.laneId)?.title}
      </div>
      {showHeading && (
        <div className="detail-heading">
          <span className="step-number">Step {step.order}</span>
          <h2>{step.title}</h2>
        </div>
      )}
      <p className="detail-summary">{step.purpose}</p>
      <section className="detail-category detail-at-a-glance">
        <h3>At a glance</h3>
        <Section title="Owner package" values={[step.ownerPackage]} />
        <Section title="Inputs" values={step.inputs} />
        <Section title="Outputs" values={step.outputs} />
        <Section
          title="Failure owner step"
          values={[step.failureOwnerStepId]}
        />
        <Section
          title="Spec references"
          values={step.specRefs}
          authority={authority}
        />
        <Section title="Target links" values={data.links} />
      </section>
      <details className="full-contract" data-full-contract>
        <summary>Full contract</summary>
        {Object.entries(sections).map(([title, values]) => (
          <Section
            key={title}
            title={title}
            values={values}
            authority={authority}
          />
        ))}
      </details>
    </div>
  )
}
