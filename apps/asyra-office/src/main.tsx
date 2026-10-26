import { createRoot } from 'react-dom/client'
import { AssetPreview } from './preview/AssetPreview'
import {
  REVIEW_ASSETS,
  type ReviewAsset
} from './preview/vegetation-controller'
import { OfficeScene } from './ui/OfficeScene'
import './styles.css'
import './ui/office.css'

const host = document.getElementById('root')
if (!host) throw new Error('Missing application root')
const review = new URLSearchParams(location.search).get('review')
let content = <OfficeScene />
if (review === 'wall') content = <AssetPreview />
else if (review && Object.hasOwn(REVIEW_ASSETS, review))
  content = <AssetPreview asset={review as ReviewAsset} />
createRoot(host).render(content)
