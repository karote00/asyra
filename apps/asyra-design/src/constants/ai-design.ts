export const AiDesignToolIds = Object.freeze({
  DISCOVER_KNOWLEDGE: 'discover_knowledge',
  READ_KNOWLEDGE: 'read_knowledge',
  SUBMIT_TOOL: 'submit_tool',
  INVOKE_TOOL: 'invoke_tool',
  SAVE_TOOL: 'save_tool',
  MANAGE_TOOL: 'manage_tool',
  SEARCH_DESIGN_TOOLS: 'search_design_tools',
  READ_DESIGN_CONTRACTS: 'read_design_contracts',
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

const entryDescriptions = new Map<string, string>([
  [
    AiDesignToolIds.SEARCH_DESIGN_TOOLS,
    'Search by purpose, category or input fields. Choose by capability and route; compact matches include ordinary argument schemas. Follow next for more candidates.'
  ],
  [
    AiDesignToolIds.READ_DESIGN_CONTRACTS,
    'Read selected contracts by exact identity; scopes maps each selected identity to schema paths or an input scope. Request missing constraints, results or examples.'
  ],
  [
    AiDesignToolIds.EXECUTE_DESIGN,
    'Execute known operations directly. Supply operations with name and arguments; use stages for dependent work. Omitted delivery returns the last result and its images whether or not retain is present. Use invocation alone for standalone routes. Read the host contract for advanced bindings, iteration and result selection.'
  ]
])

export const designProviderEntryDescription = (
  namespace: string,
  name: string
) =>
  namespace === 'design_operations' ? entryDescriptions.get(name) : undefined

export const isDesignProviderEntry = (namespace: string, name: string) =>
  designProviderEntryDescription(namespace, name) !== undefined

export const AiInspectionLimits = Object.freeze({
  maxEdge: 1024
} as const)

export const AiToolFailureCodes = Object.freeze({
  INPUT_INVALID: 'TOOL_INPUT_INVALID',
  EXECUTION_FAILED: 'TOOL_EXECUTION_FAILED',
  IDENTITY_UNRESOLVED: 'IDENTITY_UNRESOLVED',
  SOURCE_UNAVAILABLE: 'SOURCE_UNAVAILABLE'
} as const)
