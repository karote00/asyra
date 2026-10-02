import { createRoot } from 'react-dom/client'
import { OfficeApp } from './ui/OfficeApp'
import './ui/styles.css'
const root = document.getElementById('root')
if (!root) throw new Error('Office root is missing')
createRoot(root).render(<OfficeApp />)
