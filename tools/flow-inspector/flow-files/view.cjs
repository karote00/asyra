function architectureFor(doc) {
  if (doc.definition.architecture) return doc.definition.architecture
  const steps = doc.definition.nodes.map((node, index) => ({
    id: node.id,
    order: index + 1,
    laneId: 'tasks',
    title: node.title,
    purpose: node.objective,
    ownerPackage: node.owner,
    inputs: node.dependsOn.map((r) => r.flowId + '/' + r.nodeId),
    outputs: node.criteria.map((c) => 'artifact:' + node.id + ':' + c.id),
    conditions: [],
    bypasses: [],
    allowedContributors: [node.owner],
    forbiddenContributors: [],
    cacheDimensions: [],
    implementationBoundary: node.implementationRefs,
    specRefs: node.specRefs,
    failureOwnerStepId: node.id
  }))
  const routes = doc.definition.nodes.flatMap((n) =>
    n.dependsOn
      .filter((d) => d.flowId === doc.flowId)
      .map((d) => ({
        id: d.nodeId + '-to-' + n.id,
        from: d.nodeId,
        to: n.id,
        kind: 'dependency',
        predicate: 'Prerequisite accepted',
        producedArtifacts: []
      }))
  )
  return {
    schema: { id: 'flow-inspector', version: 2 },
    target: {
      id: doc.flowId,
      kind: 'feature',
      title: doc.definition.title,
      subtitle: doc.definition.purpose
    },
    authority: {
      specPath: 'Flow document definition',
      inspectorPath: doc.flowId + '.flow.json',
      semanticOwner: doc.projectId,
      inspectorOwner: 'Project author'
    },
    links: [],
    lanes: [{ id: 'tasks', title: 'Tasks', order: 1 }],
    steps,
    routes,
    artifacts: doc.definition.nodes.flatMap((node) =>
      node.criteria.map((criterion) => ({
        id: 'artifact:' + node.id + ':' + criterion.id,
        title: criterion.title,
        ownerStepId: node.id,
        channel: 'Current acceptance',
        consumerStepIds: [],
        terminal: true
      }))
    ),
    invariants: [],
    acceptanceContracts: []
  }
}
module.exports = { architectureFor }
