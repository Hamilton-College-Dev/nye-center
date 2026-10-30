import ContentPage from './ContentPage.jsx';
import { contentConfigs } from '../services/contentService.js';

export default function SpacesPage() {
  return <ContentPage config={contentConfigs.spaces} />;
}
