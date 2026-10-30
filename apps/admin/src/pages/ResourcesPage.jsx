import ContentPage from './ContentPage.jsx';
import { contentConfigs } from '../services/contentService.js';

export default function ResourcesPage() {
  return <ContentPage config={contentConfigs.resources} />;
}
