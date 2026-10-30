import ContentPage from './ContentPage.jsx';
import { contentConfigs } from '../services/contentService.js';

const headerLinks = [{ to: '/floor-maps', label: 'Floor maps' }];

export default function MapPinsPage() {
  return <ContentPage config={contentConfigs.map_pins} headerLinks={headerLinks} />;
}
