import ContentPage from './ContentPage.jsx';
import { contentConfigs } from '../services/contentService.js';

export default function HomeFeaturedPage() {
  return <ContentPage config={contentConfigs.home_featured_items} />;
}
