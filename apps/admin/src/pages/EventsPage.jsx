import { useState } from 'react';

import EventImportChangesPanel from '../components/EventImportChangesPanel.jsx';
import ContentPage from './ContentPage.jsx';
import { contentConfigs } from '../services/contentService.js';
import { importLatestLitsEvents } from '../services/eventsImportService.js';

export default function EventsPage() {
  const [changeRefreshKey, setChangeRefreshKey] = useState(0);
  const headerActions = [
    {
      key: 'import-lits',
      label: 'Import from 25Live now',
      pendingLabel: 'Importing 25Live events…',
      onAction: async () => {
        const result = await importLatestLitsEvents();
        if (!result.error) setChangeRefreshKey((value) => value + 1);
        return result;
      },
      successMessage: (result) => {
        const created = `${result?.created ?? 0} new`;
        const updated = `${result?.updated ?? 0} refreshed`;
        const archived = `${result?.archived ?? result?.retired ?? 0} archived`;
        const changes = result?.changed
          ? ` ${result.changed} change notification${result.changed === 1 ? '' : 's'} added.`
          : '';
        return `25Live import complete: ${created}, ${updated}, ${archived}. Active imports are published by default.${changes}`;
      },
    },
  ];

  return (
    <ContentPage
      config={contentConfigs.events}
      headerActions={headerActions}
      notice="Events import automatically every day at 6:00 AM Eastern. Every matching event returned by 25Live is imported and published, with no 20-event app limit. A refresh replaces imported content unless Protect dashboard edits from imports is enabled. Events missing from 25Live move to Archived Events even if their date has not passed."
      supplementalContent={<EventImportChangesPanel refreshKey={changeRefreshKey} />}
    />
  );
}
