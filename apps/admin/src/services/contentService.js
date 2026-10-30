import { isPastDateKey, parseCommaList, parseLineList, slugify } from '@nye-center/shared';

import { ensureSupabase } from './supabaseService.js';

// An event has passed once its start date is behind us — the same rule the app
// uses to split its Events tab into upcoming and past. Source retirement archives
// an event regardless of date, so every row belongs to exactly one admin list.
export const isPastEventRow = (row) => isPastDateKey(row?.event_date);
export const isArchivedEventRow = (row) => row?.source_status === 'retired' || isPastEventRow(row);

const commonPublishedField = {
  name: 'is_published',
  label: 'Published',
  type: 'checkbox',
  group: 'Settings',
};

// Screens the mobile Home tab can navigate to. Used by hero CTA + quick-action
// "App screen" targets so editors pick from a list instead of typing route names.
export const MOBILE_ROUTE_OPTIONS = [
  { value: 'Home', label: 'Home' },
  { value: 'Map', label: 'Map' },
  { value: 'Resources', label: 'Resources' },
  { value: 'Events', label: 'Events' },
  { value: 'Contact', label: 'Contact' },
  { value: 'FAQ', label: 'FAQs' },
  { value: 'NewHere', label: 'New here' },
];

// Quick-action target kinds. Content targets store the entity slug (the mobile
// app resolves by id-or-slug); the "route" kind stores a screen name.
export const QUICK_ACTION_TYPES = [
  { value: 'space', label: 'Space', table: 'spaces', valueKey: 'slug' },
  { value: 'resource', label: 'Tool', table: 'resources', valueKey: 'slug' },
  { value: 'route', label: 'App screen', route: true },
];

// Human label column per option table.
const OPTION_LABEL_FIELD = {
  spaces: 'name',
  resources: 'name',
  events: 'title',
};

// Accent vocabulary the mobile app maps to theme colors (FEATURED_ACCENTS in
// HomeScreen). Blank falls back to the space's own accent color.
export const ACCENT_KEY_OPTIONS = [
  { value: 'primary', label: 'Primary (navy)' },
  { value: 'secondary', label: 'Secondary (gold)' },
  { value: 'continental', label: 'Continental blue' },
  { value: 'navy', label: 'Navy' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'gold', label: 'Gold' },
  { value: 'plum', label: 'Plum' },
  { value: 'copper', label: 'Copper' },
];

export const SPACE_ACCENT_OPTIONS = [
  { value: '#002F86', label: 'Hamilton Blue' },
  { value: '#A87C3D', label: 'Antique Gold' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#34D399', label: 'Emerald' },
  { value: '#F97316', label: 'Orange' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#0EA5E9', label: 'Sky' },
  { value: '#60A5FA', label: 'Light Blue' },
  { value: '#64748B', label: 'Slate' },
  { value: '#FBBF24', label: 'Amber' },
];

// Keyed by table name throughout, so a config, its dashboard path and its
// database table are always the same word. One exception, added below the
// literal: `events_archived` is a second view of the `events` table, split from
// it by `rowFilter`.
export const contentConfigs = {
  home_screen: {
    title: 'Home Screen',
    description:
      "Hero copy and quick actions on the app's Home screen. Featured spaces are managed on the Home Featured page.",
    table: 'home_screen',
    // The mobile app loads only the single "home" row, so edit it in place
    // instead of presenting a list with a "New record" button.
    singleton: true,
    labelField: 'hero_title',
    columns: ['hero_title', 'is_published', 'updated_at'],
    fields: [
      { name: 'hero_title', label: 'Hero title', required: true, group: 'Hero' },
      { name: 'hero_description', label: 'Hero description', type: 'textarea', group: 'Hero' },
      // The app's hero has exactly one button, so the dashboard offers exactly
      // one label and one target (20260729102000 dropped the unused second pair).
      {
        name: 'hero_primary_label',
        label: 'Hero button label',
        group: 'Hero',
        placeholder: 'Open map',
        hint: 'Text on the single button under the hero copy.',
      },
      {
        name: 'hero_primary_route',
        label: 'Hero button opens',
        type: 'select',
        options: MOBILE_ROUTE_OPTIONS,
        group: 'Hero',
        hint: 'Which app screen the button opens. Blank or unrecognised falls back to the Map.',
      },
      {
        name: 'show_quick_actions',
        label: 'Show quick actions',
        type: 'checkbox',
        group: 'Quick actions',
        hint: 'Unchecked hides the whole "I\'m looking for…" section on the app\'s Home screen. The cards below are kept either way.',
      },
      {
        name: 'quick_actions',
        label: 'Quick actions ("I\'m looking for…")',
        type: 'actionList',
        group: 'Quick actions',
        hint: 'Each card needs a title and target: a space, a tool, or an app screen.',
      },
      {
        name: 'slug',
        label: 'Slug',
        required: true,
        readOnly: true,
        defaultValue: 'home',
        group: 'Settings',
        hint: 'Fixed identifier — the mobile app only loads the "home" row.',
      },
      commonPublishedField,
    ],
  },
  home_featured_items: {
    title: 'Home Featured',
    description:
      "Controls which spaces appear in the Home screen's Featured spaces row, and in what order. Only space targets are supported. Rows pointing at unpublished or missing spaces are skipped silently.",
    table: 'home_featured_items',
    labelField: 'space_slug',
    columns: ['space_slug', 'sort_order', 'is_published', 'updated_at'],
    fields: [
      {
        name: 'sort_order',
        label: 'Sort order',
        type: 'number',
        required: true,
        defaultValue: '1',
        group: 'Placement',
        hint: 'Lower numbers appear first. Use 1, 2, 3, 4 for the four Home cards.',
      },
      {
        name: 'space_slug',
        label: 'Featured space',
        type: 'reference',
        ref: { table: 'spaces', value: 'slug' },
        required: true,
        group: 'Target',
      },
      {
        name: 'title_override',
        label: 'Title override',
        group: 'Display',
        hint: 'Optional. Replaces the card title; blank uses the content’s own name.',
      },
      {
        name: 'subtitle_override',
        label: 'Subtitle override',
        group: 'Display',
        hint: 'Optional. Replaces the card subtitle; blank uses the content’s own description.',
      },
      {
        name: 'accent_key',
        label: 'Accent color',
        type: 'select',
        options: ACCENT_KEY_OPTIONS,
        group: 'Display',
        hint: 'Optional. Blank uses the space’s own accent color.',
      },
      commonPublishedField,
    ],
  },
  map_pins: {
    title: 'Map Pins',
    description:
      'Every marker currently used by the building map, plus temporary markers added by editors. Click the plan to update a pin position.',
    table: 'map_pins',
    labelField: 'label',
    slugSourceFields: ['label'],
    columns: ['label', 'floor', 'kind', 'space_slug', 'is_published', 'updated_at'],
    fields: [
      {
        name: 'label',
        label: 'Label',
        required: true,
        hint: 'Shown on the pin and as the sheet title in the app.',
      },
      { name: 'slug', label: 'Slug', required: true },
      {
        name: 'kind',
        label: 'Pin type',
        readOnly: true,
        defaultValue: 'pin',
        group: 'Settings',
        hint: 'Built-in pin types are preserved. New dashboard pins use the standard pin marker.',
      },
      {
        name: 'nav_node_id',
        label: 'Source map pin ID',
        readOnly: true,
        group: 'Settings',
        hint: 'Present for pins imported from the current building map; blank for new pins.',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        hint: 'Optional. Shown under the label when someone taps the pin.',
      },
      {
        name: 'position',
        label: 'Position',
        type: 'mapPin',
        // UI-only control: it writes floor/x/y, and has no column of its own.
        virtual: true,
        floorField: 'floor',
        xField: 'x',
        yField: 'y',
        group: 'Placement',
        hint: 'Click the plan to place the pin; arrow keys nudge it (hold Shift for bigger steps).',
      },
      {
        name: 'floor',
        label: 'Floor',
        type: 'number',
        required: true,
        readOnly: true,
        group: 'Placement',
        hint: 'Set by the picker above.',
      },
      {
        name: 'x',
        label: 'X (%)',
        type: 'number',
        required: true,
        readOnly: true,
        group: 'Placement',
      },
      {
        name: 'y',
        label: 'Y (%)',
        type: 'number',
        required: true,
        readOnly: true,
        group: 'Placement',
      },
      {
        name: 'space_slug',
        label: 'Links to space',
        type: 'reference',
        ref: { table: 'spaces', value: 'slug' },
        group: 'Links',
        hint: 'Optional. When set, tapping the pin offers "Open full details" for that space.',
      },
      {
        name: 'sort_order',
        label: 'Sort order',
        type: 'number',
        group: 'Settings',
        hint: 'Lower numbers first.',
      },
      commonPublishedField,
    ],
  },
  spaces: {
    title: 'Spaces',
    description:
      'Physical rooms and map zones visitors tap on the indoor map. Content follows the Spaces (Draft) structure through Resources. Tool guides belong under Tools.',
    table: 'spaces',
    orderField: 'sort_order',
    colorField: 'accent_color',
    labelField: 'name',
    slugSourceFields: ['name'],
    columns: ['name', 'floor', 'sort_order', 'is_published', 'updated_at'],
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'slug', label: 'Slug', required: true },
      // Integer column (20260729096000), same as map_pins.floor — so a number
      // input, not free text. Blank posts null rather than ''.
      { name: 'floor', label: 'Floor', type: 'number' },
      {
        name: 'short_description',
        label: 'Tagline (short sentence)',
        type: 'textarea',
        group: 'Draft structure',
      },
      { name: 'long_description', label: 'Overview', type: 'textarea', group: 'Draft structure' },
      {
        name: 'image_url',
        label: 'Location photo',
        type: 'imageUpload',
        group: 'Media',
        hint: 'Shown on the space detail page and Resources → Spaces list. Saves automatically after upload. JPEG, PNG, WebP, or GIF up to 5 MB.',
      },
      {
        name: 'who_should_visit',
        label: 'Applications',
        type: 'lineList',
        group: 'Draft structure',
        hint: 'Put each application on its own line.',
      },
      {
        name: 'tips_before_visiting',
        label: 'Tips',
        type: 'lineList',
        group: 'Draft structure',
        hint: 'Put each tip on its own line.',
      },
      {
        name: 'resource_information',
        label: 'Resources',
        type: 'textarea',
        defaultValue: 'Related Resources Redirect',
        group: 'Draft structure',
        hint: 'Use the workbook placeholder “Related Resources Redirect” until the final resource destination is ready.',
      },
      {
        name: 'accent_color',
        label: 'Accent color',
        type: 'colorPalette',
        options: SPACE_ACCENT_OPTIONS,
        defaultValue: '#002F86',
        group: 'Display',
        hint: 'Choose the accent used on space cards, map markers, and the space detail page.',
      },
      {
        name: 'sort_order',
        label: 'Sort order',
        type: 'number',
        group: 'Settings',
        hint: 'Lower numbers list first on the Resources → Spaces list.',
      },
      commonPublishedField,
    ],
  },
  resources: {
    title: 'Tools',
    description:
      'Tool and equipment guides. Content follows the Tools (Draft) structure: Title, Model, Location, Tagline, Overview, Applications, then Resources.',
    table: 'resources',
    orderField: 'tools_tab_order',
    orderSyncFields: ['sort_order'],
    colorField: 'location_accent_color',
    colorSourceField: 'location',
    labelField: 'name',
    slugSourceFields: ['name', 'model'],
    columns: ['name', 'model', 'location', 'tools_tab_order', 'is_published', 'updated_at'],
    fields: [
      { name: 'name', label: 'Title', required: true, group: 'Draft structure' },
      {
        name: 'model',
        label: 'Model',
        required: true,
        group: 'Draft structure',
        hint: 'Manufacturer and model from the second line of the Tools (Draft) title.',
      },
      {
        name: 'location',
        label: 'Location',
        type: 'reference',
        ref: { table: 'spaces', value: 'name' },
        required: true,
        group: 'Draft structure',
        hint: 'Choose the Space where this tool is located.',
      },
      {
        name: 'description',
        label: 'Tagline',
        type: 'textarea',
        group: 'Draft structure',
      },
      {
        name: 'what_it_does',
        label: 'Overview',
        type: 'textarea',
        group: 'Draft structure',
      },
      {
        name: 'what_you_can_do',
        label: 'Applications',
        type: 'textarea',
        group: 'Draft structure',
        hint: 'Put each application on its own line.',
      },
      {
        name: 'resource_information',
        label: 'Resources',
        type: 'textarea',
        group: 'Draft structure',
        hint: 'Put each tip or resource link on its own line. For a link, use Label (https://…).',
      },
      { name: 'slug', label: 'Slug', required: true, group: 'Settings' },
      {
        name: 'tools_tab_order',
        label: 'Sort order',
        type: 'number',
        group: 'Settings',
        hint: 'Lower numbers list first in the Tools list.',
      },
      commonPublishedField,
    ],
  },
  events: {
    title: 'Events',
    description:
      "LITS events sync from Hamilton's 25Live-backed Burke RSS feed every morning at 6:00 AM Eastern. You can also import on demand. Active imports publish by default; removed and passed events appear in Archived Events.",
    table: 'events',
    // Upcoming, undated, and still present at the source. This is the exact
    // complement of Archived Events, so every row appears on one page only.
    rowFilter: (row) => !isArchivedEventRow(row),
    labelField: 'title',
    slugSourceFields: ['title'],
    columns: ['title', 'event_date', 'event_time', 'venue', 'is_published', 'updated_at'],
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'slug', label: 'Slug', required: true },
      { name: 'type', label: 'Type', hint: 'Shown as a tag on the event detail page.' },
      { name: 'event_date', label: 'Start date', type: 'date' },
      {
        name: 'end_date',
        label: 'End date',
        type: 'date',
        group: 'Schedule & location',
        hint: 'Optional — enables multi-day date ranges.',
      },
      { name: 'event_time', label: 'Time', group: 'Schedule & location' },
      { name: 'location', label: 'Location', group: 'Schedule & location' },
      {
        name: 'venue',
        label: 'Venue name',
        group: 'Schedule & location',
        hint: 'Display name on the location card. Falls back to location when blank.',
      },
      {
        name: 'address',
        label: 'Address / floor line',
        group: 'Schedule & location',
        hint: 'Secondary line under the venue on the location card.',
      },
      { name: 'short_description', label: 'Short description', type: 'textarea' },
      { name: 'audience', label: 'Audience' },
      {
        name: 'image_url',
        label: 'Banner image URL',
        type: 'url',
        group: 'Media',
        previewImage: true,
        hint: 'Optional hero image on event cards and the detail page. Without one, a themed gradient is used.',
      },
      {
        name: 'registration_url',
        label: 'Registration URL',
        type: 'url',
        group: 'Media',
        hint: 'Optional link opened by the Join event button.',
      },
      { name: 'tags', label: 'Tags', type: 'array' },
      {
        name: 'related_space_slugs',
        label: 'Related spaces',
        type: 'referenceArray',
        ref: { table: 'spaces', value: 'slug' },
      },
      {
        name: 'import_override',
        label: 'Protect dashboard edits from imports',
        type: 'checkbox',
        group: 'Import settings',
        hint: 'For a 25Live event, keep this dashboard content on future imports. Active imports are still published; if the source event disappears, it moves to Archived Events.',
      },
      commonPublishedField,
    ],
  },
  faqs: {
    title: 'FAQs',
    description: "Questions shown in the app's FAQ screen.",
    table: 'faqs',
    labelField: 'question',
    slugSourceFields: ['question'],
    columns: ['question', 'sort_order', 'is_published', 'updated_at'],
    fields: [
      { name: 'question', label: 'Question', required: true },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true },
      { name: 'tags', label: 'Tags', type: 'array' },
      {
        name: 'slug',
        label: 'Slug',
        required: true,
        group: 'Settings',
        hint: 'Stable key for this question, e.g. how-do-i-find-a-room. Leave it alone once set.',
      },
      {
        name: 'sort_order',
        label: 'Sort order',
        type: 'number',
        group: 'Settings',
        hint: 'Lower numbers appear first on the FAQ screen.',
      },
      commonPublishedField,
    ],
  },
  contact_settings: {
    title: 'Contact',
    description:
      'Contact details shown on the app Contact screen, plus app-wide section visibility.',
    table: 'contact_settings',
    singleton: true,
    labelField: 'title',
    columns: ['title', 'email', 'location', 'office_hours', 'is_published', 'updated_at'],
    fields: [
      {
        name: 'title',
        label: 'Heading',
        required: true,
        group: 'Contact',
        placeholder: 'Need help?',
      },
      { name: 'description', label: 'Description', type: 'textarea', group: 'Contact' },
      { name: 'email', label: 'Email', type: 'email', group: 'Contact' },
      { name: 'phone', label: 'Phone', group: 'Contact' },
      { name: 'location', label: 'Location', group: 'Contact' },
      { name: 'office_hours', label: 'Office hours', type: 'textarea', group: 'Contact' },
      { name: 'website_url', label: 'Website URL', type: 'url', group: 'Contact' },
      {
        name: 'show_faqs',
        label: 'Show FAQs',
        type: 'checkbox',
        group: 'App sections',
        hint: 'Unchecked hides FAQs everywhere in the app — the Profile menu row and search results. The questions themselves are kept.',
      },
      {
        name: 'slug',
        label: 'Slug',
        required: true,
        readOnly: true,
        defaultValue: 'primary-contact',
        group: 'Settings',
        hint: 'Fixed identifier — the mobile app uses the primary contact row.',
      },
      commonPublishedField,
    ],
  },
};

// The one config not named after its own table: it is the `events` table again,
// showing the half of the list the Events page filters out. Spread from that
// config rather than copied, so the columns and the edit form can never drift
// apart from the live page's. No "New record" — a new event defaults to no date,
// which makes it active, so it would vanish from this page the moment it saved.
contentConfigs.events_archived = {
  ...contentConfigs.events,
  title: 'Archived Events',
  description:
    'Passed events and events removed from 25Live. Nothing is deleted: removed source events are unpublished automatically, and every archived record remains available for review.',
  rowFilter: isArchivedEventRow,
  allowCreate: false,
  dashboardShowsDrafts: false,
};

// Lightweight {id, slug, label} options for a referenced table, used to power
// dropdowns / multi-selects instead of hand-typed slugs and UUIDs.
export async function listOptions(table) {
  try {
    const client = ensureSupabase();
    const labelField = OPTION_LABEL_FIELD[table] ?? 'name';
    const { data, error } = await client
      .from(table)
      .select(`id, slug, is_published, ${labelField}`)
      .order(labelField, { ascending: true });
    if (error) return { table, options: [], error };
    const options = (data ?? []).map((row) => {
      const rawLabel = row[labelField] ?? row.slug ?? row.id;
      return {
        id: row.id,
        slug: row.slug ?? null,
        [labelField]: rawLabel,
        // Flag unpublished records so editors know the mobile app cannot
        // resolve a pick until it is published.
        label: row.is_published === false ? `${rawLabel} (unpublished)` : rawLabel,
      };
    });
    return { table, options };
  } catch (error) {
    return { table, options: [], error };
  }
}

function collectOptionTables(config) {
  const tables = new Set();
  for (const field of config.fields) {
    if (field.ref?.table) tables.add(field.ref.table);
    if (field.refMap) {
      Object.values(field.refMap).forEach((ref) => ref.table && tables.add(ref.table));
    }
    if (field.type === 'actionList') {
      QUICK_ACTION_TYPES.forEach((type) => type.table && tables.add(type.table));
    }
  }
  // Reference columns rendered in the table also need their option labels.
  for (const table of Object.values(config.referenceColumns ?? {})) tables.add(table);
  return [...tables];
}

// Fetch every option list a config's pickers need, keyed by table name.
export async function loadConfigOptions(config) {
  const tables = collectOptionTables(config);
  const results = await Promise.all(tables.map(listOptions));
  const options = {};
  for (const result of results) {
    options[result.table] = result.options ?? [];
  }
  return options;
}

export async function listRecords(config) {
  try {
    const client = ensureSupabase();
    let query = client.from(config.table).select('*');
    if (config.orderField) {
      query = query.order(config.orderField, { ascending: true, nullsFirst: false });
      if (config.labelField) query = query.order(config.labelField, { ascending: true });
    } else {
      query = query.order('updated_at', { ascending: false });
    }
    const { data, error } = await query;
    return { data: data ?? [], error };
  } catch (error) {
    return { data: [], error };
  }
}

export async function reorderRecords(config, orderedRows) {
  if (!config.orderField || !['spaces', 'resources'].includes(config.table)) {
    return { data: null, error: new Error('This content type cannot be reordered.') };
  }

  const orderedIds = orderedRows.map((row) => row?.id).filter(Boolean);
  if (orderedIds.length !== orderedRows.length || new Set(orderedIds).size !== orderedIds.length) {
    return { data: null, error: new Error('Every reordered row needs a unique id.') };
  }

  try {
    const { error } = await ensureSupabase().rpc('reorder_resource_catalog', {
      target_table: config.table,
      ordered_ids: orderedIds,
    });
    if (error) return { data: null, error };

    const orderFields = [config.orderField, ...(config.orderSyncFields ?? [])];
    return {
      data: orderedRows.map((row, index) =>
        orderFields.reduce((next, field) => ({ ...next, [field]: index + 1 }), { ...row }),
      ),
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

export async function saveRecord(config, record) {
  try {
    const client = ensureSupabase();
    const payload = serializeRecord(config, record);
    return payload.id
      ? client.from(config.table).update(payload).eq('id', payload.id).select().single()
      : client.from(config.table).insert(payload).select().single();
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteRecord(config, id) {
  try {
    return ensureSupabase().from(config.table).delete().eq('id', id);
  } catch (error) {
    return { data: null, error };
  }
}

export async function togglePublished(config, record) {
  if (!Object.prototype.hasOwnProperty.call(record, 'is_published')) {
    return { error: new Error('This content type does not support publish status.') };
  }

  try {
    return ensureSupabase()
      .from(config.table)
      .update({ is_published: !record.is_published })
      .eq('id', record.id)
      .select()
      .single();
  } catch (error) {
    return { data: null, error };
  }
}

export async function getDashboardSummary() {
  const entries = await Promise.all(
    Object.entries(contentConfigs).map(async ([configKey, config]) => {
      const { data, error } = await listRecords(config);
      return buildDashboardSummaryEntry(configKey, config, data, error);
    }),
  );

  return entries;
}

export function buildDashboardSummaryEntry(configKey, config, data = [], error = null) {
  const visibleRows = config.rowFilter ? data.filter(config.rowFilter) : data;
  const showsDrafts = config.dashboardShowsDrafts !== false;

  return {
    // Usually the config key and table match. Archived Events deliberately uses
    // its config key because it is a separate dashboard view of `events`.
    key: configKey,
    title: config.title,
    count: visibleRows.length,
    unpublished: showsDrafts ? visibleRows.filter((item) => item.is_published === false).length : 0,
    showsDrafts,
    recentlyUpdated: [...visibleRows]
      .sort((a, b) => new Date(b.updated_at ?? 0) - new Date(a.updated_at ?? 0))
      .slice(0, 3),
    error,
  };
}

function serializeRecord(config, record) {
  const next = {};
  for (const field of config.fields) {
    // Virtual fields are editor controls that drive other fields (e.g. the map
    // pin picker sets floor/x/y). They have no column, so never post them.
    if (field.virtual) continue;
    const value = record[field.name];
    if (field.type === 'array' || field.type === 'referenceArray')
      next[field.name] = parseCommaList(value);
    else if (field.type === 'lineList') next[field.name] = parseLineList(value);
    else if (field.type === 'number')
      next[field.name] = value === '' || value === null ? null : Number(value);
    else if (field.type === 'checkbox') next[field.name] = Boolean(value);
    else if (field.type === 'json') next[field.name] = parseJson(value);
    else if (field.type === 'actionList') next[field.name] = sanitizeActions(value);
    else next[field.name] = value === '' ? null : value;
  }

  if (record.id) next.id = record.id;
  // Last-resort canonical slug for non-UI callers. The dashboard generates it
  // as editors type, but service-level normalization keeps imports and tests on
  // the same lowercase kebab-case contract.
  if (config.fields.some((field) => field.name === 'slug')) {
    const source = (config.slugSourceFields ?? ['title', 'name', 'question', 'label'])
      .map((field) => next[field])
      .filter(Boolean)
      .join(' ');
    next.slug = slugify(next.slug || source);
  }
  return next;
}

function parseJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// Normalize the visual Quick Actions builder into the JSON shape the mobile app
// expects, dropping incomplete rows.
function sanitizeActions(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((action) => {
      const targetType = action?.targetType || 'route';
      const base = {
        title: String(action?.title ?? '').trim(),
        subtitle: String(action?.subtitle ?? '').trim(),
        targetType,
      };
      if (targetType === 'route') base.routeName = action?.routeName || '';
      else base.targetId = action?.targetId || '';
      return base;
    })
    .filter((action) => action.title && (action.routeName || action.targetId));
}
