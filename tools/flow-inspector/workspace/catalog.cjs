module.exports = Object.freeze({
  discoveryRoots: Object.freeze(['tools/flow-inspector/inspectors']),
  exclusions: Object.freeze([
    Object.freeze({
      path: 'tools/flow-inspector/inspectors/asyra-executable-examples-flow-inspector.data.cjs',
      reason: 'superseded-and-removed-current-surface'
    }),
    Object.freeze({
      path: 'tools/flow-inspector/inspectors/asyra-website-visual-reimagine-flow-inspector.data.cjs',
      reason: 'replaced-historical-visual-direction'
    })
  ]),
  routeSlugs: Object.freeze({
    'asyra-design-ai-conversational-drawing-performance':
      'ai-drawing-performance',
    'asyra-design-group-context-menu': 'group-context-menu',
    'asyra-design-group-interaction-mvp': 'group-interaction',
    'asyra-design-layer-tree-reparent-reorder': 'layer-tree-reorder',
    'asyra-design-socket-authoritative-document-persistence':
      'document-persistence',
    'canonical-projection-and-collaboration-contract-realignment':
      'projection-and-collaboration',
    'vector-render-geometry-cache-transform': 'vector-render-cache',
    'group-component-and-hierarchy': 'group-hierarchy',
    'input-system-environment-neutrality': 'input-environments',
    'network-collaboration-transport': 'collaboration-transport',
    'preset-profile-selectable-defaults': 'preset-profiles',
    'stroke-engine': 'stroke',
    'create-asyra-design-app-release': 'app-release',
    'asyra-public-package-documentation': 'public-docs',
    'asyra-public-readme-and-entrypoint-alignment': 'public-entrypoints',
    'asyra-runtime-atlas': 'runtime-atlas',
    'asyra-website-landing': 'website-landing',
    'asyra-website-launch-and-operations': 'website-operations',
    'asyra-website-platform': 'website-platform',
    'flow-inspector-core-proof': 'core-proof',
    'flow-inspector-static-workspace': 'static-workspace'
  }),
  groupOverrides: Object.freeze({
    'flow-inspector-core-proof': Object.freeze({
      group: 'Tools',
      subgroup: 'Flow Inspector'
    }),
    'asyra-design-ai-conversational-drawing-performance': Object.freeze({
      group: 'Apps',
      subgroup: 'Asyra Design'
    }),
    'asyra-design-group-context-menu': Object.freeze({
      group: 'Apps',
      subgroup: 'Asyra Design'
    }),
    'asyra-design-group-interaction-mvp': Object.freeze({
      group: 'Apps',
      subgroup: 'Asyra Design'
    }),
    'asyra-design-layer-tree-reparent-reorder': Object.freeze({
      group: 'Apps',
      subgroup: 'Asyra Design'
    }),
    'asyra-design-socket-authoritative-document-persistence': Object.freeze({
      group: 'Apps',
      subgroup: 'Asyra Design'
    }),
    'create-asyra-design-app-release': Object.freeze({
      group: 'Release',
      subgroup: 'CLI and Generated App'
    }),
    'framework-package-release': Object.freeze({
      group: 'Release',
      subgroup: 'Framework Packages'
    }),
    'framework-release-readiness': Object.freeze({
      group: 'Release',
      subgroup: 'Framework Readiness'
    }),
    'flow-inspector-static-workspace': Object.freeze({
      group: 'Tools',
      subgroup: 'Flow Inspector'
    }),
    'node-24-runtime-upgrade': Object.freeze({
      group: 'Release',
      subgroup: 'Runtime Prerequisite'
    }),
    'remote-subtree-restore-snapshot': Object.freeze({
      group: 'Apps',
      subgroup: 'Asyra Design'
    }),
    stroke: Object.freeze({
      group: 'Apps',
      subgroup: 'Asyra Design'
    }),
    'vector-render-geometry-cache-transform': Object.freeze({
      group: 'Apps',
      subgroup: 'Asyra Design'
    })
  })
})
