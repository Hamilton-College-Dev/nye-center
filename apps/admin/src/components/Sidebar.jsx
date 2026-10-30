import { NavLink } from 'react-router-dom';

import BrandLockup from './BrandLockup.jsx';

// Grouped by the app screen each editor feeds, in the order the tabs appear in
// the app — so finding an editor means asking "where does this show up?"
// rather than knowing which table it lives in.
const groups = [
  {
    label: 'Overview',
    links: [['/', 'Dashboard']],
  },
  {
    label: 'Home page',
    links: [
      ['/home', 'Home Screen'],
      ['/home-featured', 'Home Featured'],
    ],
  },
  {
    label: 'Map page',
    links: [['/map-pins', 'Map Pins']],
  },
  {
    label: 'Resources page',
    links: [
      ['/spaces', 'Spaces'],
      ['/resources', 'Tools'],
    ],
  },
  {
    label: 'Events page',
    links: [
      ['/events', 'Events'],
      // The same table as Events, split around today: passed events list here so
      // the active page stays a list of what is still to come.
      ['/events-archived', 'Archived Events'],
    ],
  },
  {
    // FAQs live behind the Contact screen's "Browse FAQs" button.
    label: 'Contact page',
    links: [
      ['/contact', 'Contact'],
      ['/faqs', 'FAQs'],
    ],
  },
  {
    // Last, and read-only: features that are switched off but whose content was
    // kept. Nothing to edit, but editors should be able to see it still exists.
    label: 'Archive',
    links: [['/archived', 'Archived features']],
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandLockup inverse />
      </div>
      <nav>
        {groups.map((group) => (
          <div className="sidebar-group" key={group.label}>
            <span className="sidebar-group-label">{group.label}</span>
            {group.links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
