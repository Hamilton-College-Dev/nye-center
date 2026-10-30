import { useEffect, useState } from 'react';

import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { contentConfigs, listRecords } from '../services/contentService.js';

// One page answering "what exists but visitors cannot see?", in three parts:
//
//   1. Archived features — content moved out of the live database schema. The
//      rows survive but nothing can read them, so the counts here are recorded by
//      hand at archive time rather than fetched.
//   2. Kept but unused — still in the live schema, nothing reads it.
//   3. Hidden right now — live content behind a switch or with nowhere to appear.
//      Read from the database on load, because these can change any day.

const ARCHIVED_FEATURES = [
  {
    name: 'Guided tours',
    archivedOn: '29 July 2026',
    migration: '20260729097000',
    summary:
      'Ordered walking tours of the building, with stops tied to spaces. Removed from the app and from this dashboard.',
    tables: [
      { table: 'tours', rows: 4, note: 'Tour definitions, none of them published' },
      { table: 'tour_stops', rows: 3, note: 'The stops belonging to those tours' },
    ],
  },
  {
    name: 'Discussion and accounts',
    archivedOn: '29 July 2026',
    migration: '20260729110000',
    summary:
      'Visitor posts, threaded replies, likes, group chats and notifications. The screens were removed from the app; the data was kept.',
    tables: [
      { table: 'discussion_posts', rows: 8, note: 'Top-level posts' },
      { table: 'discussion_replies', rows: 17, note: 'Replies, including threads' },
      { table: 'discussion_chat_messages', rows: 16, note: 'Group-chat messages' },
      { table: 'discussion_chat_members', rows: 13, note: 'Who was in which chat' },
      { table: 'discussion_notifications', rows: 13, note: 'Unread/read notification feed' },
      { table: 'discussion_likes', rows: 1, note: 'Likes on posts' },
      { table: 'discussion_reply_likes', rows: 0, note: 'Likes on replies' },
    ],
  },
  {
    name: 'Project ideas',
    archivedOn: '29 July 2026',
    migration: '20260729111000',
    summary:
      'Starter project ideas. They never had a screen of their own — a visitor could only reach one by searching — so the feature was retired rather than left half-visible.',
    tables: [
      {
        table: 'projects',
        rows: 3,
        note: 'Published project ideas, with their tool and space links',
      },
    ],
  },
  {
    name: 'Multi-tenant setup',
    archivedOn: '29 July 2026',
    migration: '20260729097000',
    summary:
      'An early attempt at running several centres from one database. Rolled back in June 2026; kept only so nothing is lost.',
    tables: [
      { table: 'tenants', rows: 1, note: 'The single Nye Center record' },
      { table: 'floors', rows: 4, note: 'Floor records, superseded by the app’s own floor plans' },
      { table: 'tenant_admins', rows: 0, note: 'Never used' },
    ],
  },
];

// Still in the live database, but nothing in the app reads it. Left in place
// because removing it would cost more than it saves.
const KEPT_BUT_UNUSED = [
  {
    table: 'nav_edges',
    rows: '1,214',
    note: 'Corridor links for turn-by-turn routing, which the app no longer does. Kept because it is the other half of the floor-plan graph.',
  },
  {
    table: 'nav_nodes',
    rows: '1,161 of 1,209',
    note: 'Only 48 nodes become map pins (rooms, entrances, stairs, lifts). The rest is survey geometry the app never draws.',
  },
  {
    table: 'feedback',
    rows: '0',
    note: 'Ready to collect visitor feedback — admins can read it — but no screen in the app submits to it yet.',
  },
  {
    table: 'profiles',
    rows: '4',
    note: 'Visitor accounts. Kept in the live schema because sign-up depends on it, but the app currently has no way to sign in.',
  },
  {
    table: 'event_registrations',
    rows: '0',
    note: '"I\'m interested" marks on events. Needs sign-in, which the app does not currently offer.',
  },
  {
    table: 'saved_items',
    rows: '0',
    note: 'Reserved for syncing a visitor’s saved plan across devices. Locked down until that is designed.',
  },
];

export default function ArchivedPage() {
  const [hidden, setHidden] = useState(null);
  const [error, setError] = useState('');

  // Section 3 reads the switches and counts that decide what a visitor sees, so
  // this page cannot quietly go out of date.
  useEffect(() => {
    let active = true;
    Promise.all([
      listRecords(contentConfigs.contact_settings),
      listRecords(contentConfigs.home_screen),
      listRecords(contentConfigs.map_pins),
      listRecords(contentConfigs.faqs),
    ])
      .then(([contact, home, pins, faqs]) => {
        if (!active) return;
        const firstError = [contact, home, pins, faqs].find((result) => result.error);
        if (firstError) {
          setError(firstError.error.message);
          return;
        }
        setHidden(
          buildHiddenList({
            contact: contact.data?.[0],
            home: home.data?.[0],
            pins: pins.data ?? [],
            faqs: faqs.data ?? [],
          }),
        );
      })
      .catch((nextError) => {
        if (active) setError(nextError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const archivedRows = ARCHIVED_FEATURES.reduce(
    (sum, feature) => sum + feature.tables.reduce((count, entry) => count + entry.rows, 0),
    0,
  );

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Archive</p>
          <h1>Not shown in the app</h1>
          <p>
            Everything that exists but visitors cannot see: features switched off with their content
            kept, data nothing reads any more, and content hidden behind a switch. Nothing on this
            page is editable — it is here so nobody assumes something was thrown away.
          </p>
        </div>
      </div>

      <h2 className="archive-section">1 · Archived features</h2>
      <p className="page-notice">
        {archivedRows} rows are preserved across {ARCHIVED_FEATURES.length} archived features. They
        sit in a separate part of the database that neither this dashboard nor the app can reach,
        which is why the rows are not listed individually. Restoring a feature is a developer task.
      </p>

      {ARCHIVED_FEATURES.map((feature) => (
        <section className="panel" key={feature.name}>
          <h2>{feature.name}</h2>
          <p>{feature.summary}</p>
          <p className="archive-meta">
            Archived {feature.archivedOn} · migration <code>{feature.migration}</code>
          </p>
          <div className="table-wrap">
            <table className="data-table archive-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Rows kept</th>
                  <th>What it holds</th>
                </tr>
              </thead>
              <tbody>
                {feature.tables.map((entry) => (
                  <tr key={entry.table}>
                    <td>
                      <code>{entry.table}</code>
                    </td>
                    <td>{entry.rows}</td>
                    <td>{entry.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <h2 className="archive-section">2 · Kept in the database, unused by the app</h2>
      <section className="panel">
        <p>
          These are still live tables — a developer can read them — but no screen in the app uses
          them today.
        </p>
        <div className="table-wrap">
          <table className="data-table archive-table">
            <thead>
              <tr>
                <th>Table</th>
                <th>Rows</th>
                <th>Why it is not used</th>
              </tr>
            </thead>
            <tbody>
              {KEPT_BUT_UNUSED.map((entry) => (
                <tr key={entry.table}>
                  <td>
                    <code>{entry.table}</code>
                  </td>
                  <td>{entry.rows}</td>
                  <td>{entry.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <h2 className="archive-section">3 · Hidden right now</h2>
      {error ? (
        <ErrorState
          message={error}
          actionLabel="Reload"
          onAction={() => window.location.reload()}
        />
      ) : hidden === null ? (
        <LoadingState message="Checking what is currently hidden..." />
      ) : (
        <section className="panel">
          <p>
            Live content a visitor cannot see at the moment. Unlike the two sections above, most of
            this you can change yourself.
          </p>
          {hidden.length === 0 ? (
            <p className="archive-meta">
              Nothing is hidden — every published item has somewhere to appear.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="data-table archive-table">
                <thead>
                  <tr>
                    <th>What</th>
                    <th>Why it is hidden</th>
                    <th>Where to change it</th>
                  </tr>
                </thead>
                <tbody>
                  {hidden.map((entry) => (
                    <tr key={entry.what}>
                      <td>{entry.what}</td>
                      <td>{entry.why}</td>
                      <td>{entry.fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function buildHiddenList({ contact, home, pins, faqs }) {
  const entries = [];
  const published = (rows) => rows.filter((row) => row.is_published !== false);

  if (contact?.show_faqs === false) {
    const count = published(faqs).length;
    entries.push({
      what: `FAQs (${count} published)`,
      why: 'The "Show FAQs" switch is off, which hides every FAQ entry point across the app.',
      fix: 'Contact page → Show FAQs',
    });
  }

  if (home?.show_quick_actions === false) {
    const count = Array.isArray(home.quick_actions) ? home.quick_actions.length : 0;
    entries.push({
      what: `Home quick actions (${count} configured)`,
      why: 'The "Show quick actions" switch is off, so the "I\'m looking for…" section is not drawn.',
      fix: 'Home page → Home Screen → Show quick actions',
    });
  }

  if (published(pins).length === 0) {
    entries.push({
      what: 'Map pins (none placed)',
      why: 'No pins have been placed yet, so the map shows only the built-in room, entrance and stair pins.',
      fix: 'Map page → Map Pins → New record',
    });
  }

  return entries;
}
