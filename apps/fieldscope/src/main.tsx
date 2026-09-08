import { createRoot } from 'react-dom/client'
import { Workbench } from './ui/workbench'
import './ui/styles.css'

const host = document.getElementById('root')
if (!host) throw new Error('Missing app root')
createRoot(host).render(<Workbench />)
