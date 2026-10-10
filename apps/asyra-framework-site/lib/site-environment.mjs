import process from 'node:process'

export const isProductionSite = (environment = process.env) =>
  (environment.VERCEL_ENV ?? environment.SITE_ENV) === 'production'
