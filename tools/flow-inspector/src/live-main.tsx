import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FlowDashboard } from './live/FlowDashboard'
import './architecture/styles.css'
import './workspace.css'
import './live/styles.css'

const root = document.getElementById('flow-dashboard-root')

if (!root) {
  throw new Error('Missing Flow Dashboard root.')
}

createRoot(root).render(
  <StrictMode>
    <FlowDashboard />
  </StrictMode>
)
