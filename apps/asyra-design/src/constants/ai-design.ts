export const AiDesignToolIds = Object.freeze({
  DISCOVER_KNOWLEDGE: 'discover_knowledge',
  READ_KNOWLEDGE: 'read_knowledge',
  SUBMIT_TOOL: 'submit_tool',
  INVOKE_TOOL: 'invoke_tool',
  SAVE_TOOL: 'save_tool',
  MANAGE_TOOL: 'manage_tool',
  SEARCH_DESIGN_TOOLS: 'search_design_tools',
  READ_DESIGN_RESOURCES: 'read_design_resources',
  EXECUTE_DESIGN: 'execute_design',
  RETAIN_DESIGN_TARGETS: 'retain_design_targets',
  RELEASE_DESIGN_ARTIFACTS: 'release_design_artifacts',
  PREPARE_DESIGN: 'prepare_design',
  READ_DESIGN_TEMPLATES: 'read_design_templates',
  PREPARE_MATERIAL_REVISION: 'prepare_material_revision',
  PREPARE_AND_APPLY_DESIGN: 'prepare_and_apply_design',
  RECORD_DESIGN_FACTS: 'record_design_facts',
  RECORD_DESIGN_CALCULATIONS: 'record_design_calculations',
  SELECT_DESIGN_REFERENCES: 'select_design_references',
  REVIEW_PREPARED_DESIGN: 'review_prepared_design',
  CHECK_DRAWING_IMAGE: 'check_drawing_image',
  READ_DESIGN_CHECKS: 'read_design_checks',
  READ_DESIGN_INSPECTIONS: 'read_design_inspections',
  VERIFY_DESIGN_CHECKS: 'verify_design_checks',
  REPAIR_DESIGN_CHECKS: 'repair_design_checks'
} as const)

export const designKnowledgeNamespace = 'design_knowledge'

interface EntryDescription {
  purpose: string
  description: string
}
const entries = new Map<string, EntryDescription>([
  [
    designKnowledgeNamespace + '.' + AiDesignToolIds.DISCOVER_KNOWLEDGE,
    {
      purpose: 'Find relevant advice.',
      description:
        'Find visible knowledge topics by query, topic ID or context. Returns advice metadata.'
    }
  ],
  [
    designKnowledgeNamespace + '.' + AiDesignToolIds.READ_KNOWLEDGE,
    {
      purpose: 'Read known advice.',
      description:
        'Read known knowledge IDs directly. Use contexts for specialized advice; reuse returned context keys for selected text or recovery.'
    }
  ],
  [
    'design_operations.' + AiDesignToolIds.SEARCH_DESIGN_TOOLS,
    {
      purpose: 'Find a Design operation.',
      description:
        'Search by purpose, category or input fields. Choose by capability and route; compact matches include ordinary argument schemas. Follow next for more candidates.'
    }
  ],
  [
    'design_operations.' + AiDesignToolIds.READ_DESIGN_RESOURCES,
    {
      purpose: 'Read contracts, saved values or prior turns.',
      description:
        'Read saved conversation values with savedFields, or tool contracts by exact identity; scopes maps each selected identity to schema paths or an input scope. Request missing constraints, results or examples.'
    }
  ],
  [
    'design_operations.' + AiDesignToolIds.EXECUTE_DESIGN,
    {
      purpose: 'Run known operations together.',
      description:
        'Execute operations with name and arguments. Bind an earlier result with {kind:"step",step:"id",path:"/field"}. Read this host contract for stages, targets, saving and delivery.'
    }
  ]
])

export const designProviderEntry = (namespace: string, name: string) =>
  entries.get(namespace + '.' + name)

export const isDesignProviderEntry = (namespace: string, name: string) =>
  entries.has(namespace + '.' + name)

export const AiInspectionLimits = Object.freeze({
  maxEdge: 1024
} as const)

export const AiToolFailureCodes = Object.freeze({
  INPUT_INVALID: 'TOOL_INPUT_INVALID',
  EXECUTION_FAILED: 'TOOL_EXECUTION_FAILED',
  IDENTITY_UNRESOLVED: 'IDENTITY_UNRESOLVED',
  SOURCE_UNAVAILABLE: 'SOURCE_UNAVAILABLE'
} as const)
