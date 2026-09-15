import { SpatialStory } from '../components/spatial-story'
import { HomeResources } from '../components/home-resources'
import { SiteFooter } from '../components/site-footer'
import './styles/spatial-story.css'

export default function HomePage() {
  return (
    <SpatialStory footer={<SiteFooter />}>
      <HomeResources />
    </SpatialStory>
  )
}
