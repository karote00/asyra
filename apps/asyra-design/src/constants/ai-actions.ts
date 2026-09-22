export const AiActionNames = Object.freeze({
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
