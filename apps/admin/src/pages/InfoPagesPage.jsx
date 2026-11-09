import ContentPage from './ContentPage.jsx';
import { contentConfigs } from '../services/contentService.js';

export default function InfoPagesPage() {
  return <ContentPage config={contentConfigs.info_pages} />;
}
