import { createContext, useContext } from 'react'
import type { AppSession } from '../init/init-app.js'

export const AppContext = createContext<AppSession | null>(null)
export const useApp = (): AppSession => {
  const app = useContext(AppContext)
  if (!app) throw new Error('App provider is missing.')
  return app
}
