export const AiActionNames = Object.freeze({
  APPLY_PREPARED_DESIGN: 'apply_prepared_design',
  REVIEW_DESIGN: 'review_design',
  ARRANGE_DESIGN: 'arrange_design',
  ORGANIZE_DESIGN: 'organize_design',
  UPDATE_DESIGN_ELEMENT: 'update_design_element',
  READ_DESIGN_CONTEXT: 'read_design_context',
  INSPECT_DRAWING: 'inspect_drawing',
  REPORT_OUTCOME: 'report_outcome',
  REPLACE_VECTOR_COMPOSITION: 'replace_vector_composition',
  REQUEST_CLARIFICATION: 'request_clarification',
  INSERT_VECTOR_COMPOSITION: 'insert_vector_composition',
  REMOVE_AI_COMPOSITION: 'remove_ai_composition',
  REQUEST_DRAWING_DETAIL_CHOICE: 'request_drawing_detail_choice',
  SET_ELEMENT_VISIBILITY: 'set_element_visibility',
  SELECT_ELEMENTS: 'select_elements',
  UPDATE_COMPOSITION_ELEMENTS: 'update_composition_elements'
} as const)

export const AiDrawingDetailOptionIds = Object.freeze({
  BALANCED: 'balanced',
  MAXIMUM: 'maximum'
} as const)

export const AiDrawingDetailSelectionIntents = Object.freeze({
  BALANCED_EN: 'draw this image with balanced detail',
  BALANCED_REFERENCE: 'draw the reference image with balanced detail',
  MAXIMUM_EN: 'draw this image with maximum detail',
  MAXIMUM_REFERENCE: 'draw the reference image with maximum detail'
} as const)
