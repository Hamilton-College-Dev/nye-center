import ContentPage from './ContentPage.jsx';
import { contentConfigs } from '../services/contentService.js';

export default function ContactPage() {
  return <ContentPage config={contentConfigs.contact_settings} />;
}
