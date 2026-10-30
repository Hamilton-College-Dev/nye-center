import ContentPage from './ContentPage.jsx';
import { contentConfigs } from '../services/contentService.js';

// The archived half of the Events table: passed events and source events removed
// from 25Live, with no import or create controls.
export default function ArchivedEventsPage() {
  return (
    <ContentPage
      config={contentConfigs.events_archived}
      notice="An event appears here when its date passes or when it disappears from a valid 25Live import. Removed source events are unpublished automatically, including future and dashboard-overridden events."
    />
  );
}
