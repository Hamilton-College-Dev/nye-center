import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import ErrorState from '../components/ErrorState.jsx';
import EventImportChangesPanel from '../components/EventImportChangesPanel.jsx';
import LoadingState from '../components/LoadingState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { getDashboardSummary } from '../services/contentService.js';

// Exported so a test can assert it stays in step with contentConfigs — a
// missing key silently links a stat card to '/' instead of its editor.
export const TABLE_PATHS = {
  home_screen: '/home',
  home_featured_items: '/home-featured',
  spaces: '/spaces',
  map_pins: '/map-pins',
  resources: '/resources',
  events: '/events',
  events_archived: '/events-archived',
  faqs: '/faqs',
  contact_settings: '/contact',
};

export default function DashboardPage() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getDashboardSummary()
      .then((data) => {
        if (mounted) setSummary(data);
      })
      .catch((nextError) => {
        if (mounted) setError(nextError.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error)
    return (
      <ErrorState message={error} actionLabel="Reload" onAction={() => window.location.reload()} />
    );

  const recent = summary
    .flatMap((item) => item.recentlyUpdated.map((record) => ({ ...record, type: item.title })))
    .sort((a, b) => new Date(b.updated_at ?? 0) - new Date(a.updated_at ?? 0))
    .slice(0, 8);
  // Which editors the drafts are actually sitting in — a bare total tells you
  // something is unpublished but not where to go fix it.
  const draftAreas = summary
    .filter((item) => item.unpublished > 0)
    .sort((a, b) => b.unpublished - a.unpublished);

  return (
    <div className="page-stack">
      <section className="panel dashboard-hero">
        <h1>Manage what users see in the app</h1>
        <div className="draft-breakdown">
          <span className="draft-breakdown-label">Unpublished drafts:</span>
          {draftAreas.length ? (
            draftAreas.map((item) => (
              <Link className="draft-chip" key={item.key} to={TABLE_PATHS[item.key] ?? '/'}>
                <strong>{item.unpublished}</strong>
                <span>
                  {item.unpublished === 1 ? 'draft in' : 'drafts in'} {item.title}
                </span>
              </Link>
            ))
          ) : (
            <span className="draft-chip draft-chip-empty">None — everything is live</span>
          )}
        </div>
      </section>

      <EventImportChangesPanel compact />

      <div className="stats-grid">
        {summary.map((item) => (
          <Link
            className="stat-card stat-card-link"
            key={item.key}
            to={TABLE_PATHS[item.key] ?? '/'}
          >
            <span>{item.title}</span>
            <strong>{item.count}</strong>
            <small className={item.unpublished > 0 ? 'stat-warning' : undefined}>
              {item.showsDrafts === false
                ? 'Archived records →'
                : item.unpublished > 0
                  ? `${item.unpublished} draft${item.unpublished === 1 ? '' : 's'} →`
                  : 'All published →'}
            </small>
          </Link>
        ))}
      </div>

      <section className="panel">
        <h2>Recently updated</h2>
        {recent.length ? (
          <div className="recent-list">
            {recent.map((record) => (
              <div className="recent-item" key={`${record.type}-${record.id}`}>
                <div>
                  <strong>
                    {record.name ??
                      record.title ??
                      record.question ??
                      record.space_slug ??
                      record.id}
                  </strong>
                  <span>
                    {record.type}
                    {record.updated_at
                      ? ` · ${new Date(record.updated_at).toLocaleDateString()}`
                      : ''}
                  </span>
                </div>
                {'is_published' in record ? <StatusBadge value={record.is_published} /> : null}
              </div>
            ))}
          </div>
        ) : (
          <p>No records yet.</p>
        )}
      </section>
    </div>
  );
}
