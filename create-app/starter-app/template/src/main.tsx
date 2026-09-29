import { createRoot } from 'react-dom/client'
import { StarterApp } from './ui/StarterApp.js'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Starter App root element was not found.')
}

createRoot(root).render(<StarterApp />)
