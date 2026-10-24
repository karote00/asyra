import process from 'node:process'

export const isProductionSite = (environment = process.env) =>
  environment.SITE_ENV === 'production'
