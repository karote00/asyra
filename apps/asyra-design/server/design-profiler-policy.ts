import type { ExecutionReportPolicy } from '@asyra/ai-agent-runtime'
import { AiActionNames } from '../src/constants/ai-actions'
import { AiDesignToolIds } from '../src/constants/ai-design'

export const designReportPolicy: ExecutionReportPolicy = {
  readTools: [
    AiActionNames.READ_DESIGN_CONTEXT,
    AiDesignToolIds.READ_DESIGN_CONTRACTS,
    AiDesignToolIds.SEARCH_DESIGN_TOOLS
  ],
  validateEvidenceTool: AiActionNames.VALIDATE_INSPECTION_EVIDENCE
}
