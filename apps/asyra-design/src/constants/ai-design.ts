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

export const AiInspectionLimits = Object.freeze({
  maxEdge: 1024
} as const)

export const AiToolFailureCodes = Object.freeze({
  INPUT_INVALID: 'TOOL_INPUT_INVALID',
  EXECUTION_FAILED: 'TOOL_EXECUTION_FAILED',
  IDENTITY_UNRESOLVED: 'IDENTITY_UNRESOLVED',
  SOURCE_UNAVAILABLE: 'SOURCE_UNAVAILABLE'
} as const)
