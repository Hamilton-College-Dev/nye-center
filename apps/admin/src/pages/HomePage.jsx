import ContentPage from './ContentPage.jsx';
import { contentConfigs } from '../services/contentService.js';

export default function HomePage() {
  return <ContentPage config={contentConfigs.home_screen} />;
}
