import { useEffect, useState } from 'react';

import {
  listUnreviewedEventImportChanges,
  reviewEventImportChanges,
} from '../services/eventsImportService.js';

const FIELD_LABELS = {
  address: 'address',
  audience: 'audience',
  end_date: 'end date',
  event_date: 'date',
  event_time: 'time',
  image_url: 'image',
  location: 'location',
  registration_url: 'registration link',
  related_space_slugs: 'related spaces',
  short_description: 'description',
  slug: 'slug',
  source_status: 'calendar status',
  source_url: 'source link',
  tags: 'tags',
  title: 'title',
  type: 'type',
  venue: 'venue',
};

export default function EventImportChangesPanel({ refreshKey = 0, compact = false }) {
  const [changes, setChanges] = useState([]);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    let mounted = true;
    listUnreviewedEventImportChanges().then(({ data, error: loadError }) => {
      if (!mounted) return;
      setChanges(data ?? []);
      setError(loadError?.message ?? '');
    });
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  if (error) {
    return <p className="inline-error">Event change notifications could not be loaded: {error}</p>;
  }
  if (!changes.length) return null;

  async function markReviewed() {
    setReviewing(true);
    const { error: reviewError } = await reviewEventImportChanges(
      changes.map((change) => change.id),
    );
    setReviewing(false);
    if (reviewError) {
      setError(reviewError.message);
      return;
    }
    setChanges([]);
  }

  const visibleChanges = compact ? changes.slice(0, 5) : changes;

  return (
    <section className="panel event-import-changes" aria-live="polite">
      <div className="panel-header">
        <div>
          <h2>
            {changes.length} calendar change{changes.length === 1 ? '' : 's'} to review
          </h2>
          <p>Detected by the latest automatic or manual 25Live import.</p>
        </div>
        <button
          className="button button-secondary"
          disabled={reviewing}
          onClick={markReviewed}
          type="button"
        >
          {reviewing ? 'Marking reviewed…' : 'Mark all reviewed'}
        </button>
      </div>
      <ul className="event-import-change-list">
        {visibleChanges.map((change) => (
          <li key={change.id}>
            <strong>{change.event_title}</strong>
            <span>{changeSummary(change)}</span>
            {change.was_overridden ? (
              <small>Your dashboard override was kept; only the source snapshot changed.</small>
            ) : null}
          </li>
        ))}
      </ul>
      {compact && changes.length > visibleChanges.length ? (
        <p className="event-import-change-more">
          Plus {changes.length - visibleChanges.length} more on the Events page.
        </p>
      ) : null}
    </section>
  );
}

export function changeSummary(change) {
  if (change.change_type === 'removed') {
    return 'Removed from 25Live and moved to Archived Events.';
  }
  if (change.change_type === 'restored') {
    return 'Restored in 25Live and returned to the active import.';
  }

  const labels = (change.changed_fields ?? [])
    .map((field) => FIELD_LABELS[field] ?? field.replaceAll('_', ' '))
    .filter((label) => !['source', 'source event id'].includes(label));
  return labels.length ? `Updated ${formatList(labels)}.` : 'Updated in 25Live.';
}

function formatList(values) {
  if (values.length < 2) return values[0] ?? '';
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}
