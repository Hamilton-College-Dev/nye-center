import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { validateContentRecord, slugify, isYouTubeUrl } from '@nye-center/shared';

import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTable from '../components/DataTable.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import FormField from '../components/FormField.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Toast from '../components/Toast.jsx';
import {
  deleteRecord,
  listRecords,
  loadConfigOptions,
  reorderRecords,
  saveRecord,
  togglePublished,
} from '../services/contentService.js';

// `notice` is an optional line shown under the page description — used when a
// page's content is saved but not currently visible in the app (e.g. FAQs while
// the Contact page's "Show FAQs" switch is off). `headerLinks` are buttons that
// open another dashboard page, e.g. Map Pins → Floor maps.
export default function ContentPage({
  config,
  notice = null,
  headerActions = [],
  headerLinks = [],
  supplementalContent = null,
}) {
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [runningHeaderAction, setRunningHeaderAction] = useState(null);
  const [options, setOptions] = useState({});
  const [tableQuery, setTableQuery] = useState('');
  const [slugUnlocked, setSlugUnlocked] = useState(false);
  const formPanelRef = useRef(null);
  const slugManuallyEditedRef = useRef(false);
  const requiredFields = useMemo(
    () => config.fields.filter((field) => field.required).map((field) => field.name),
    [config.fields],
  );
  const fieldGroups = useMemo(() => groupFields(config.fields), [config.fields]);

  // `config.rowFilter` narrows a table to one page's share of it — Events and
  // Archived Events are the same table split by date and source lifecycle. Applied here
  // rather than in `listRecords` so that stays a plain fetch: other callers read
  // the same configs to count published rows and must keep seeing all of them.
  async function loadRows() {
    setLoading(true);
    setError('');
    const { data, error: nextError } = await listRecords(config);
    const fetched = data ?? [];
    const list = config.rowFilter ? fetched.filter(config.rowFilter) : fetched;
    setAllRows(fetched);
    setRows(list);
    setError(nextError?.message ?? '');
    setLoading(false);
    return list;
  }

  // Singleton configs (e.g. the Home screen) edit one fixed row in place: open
  // it on load — or a prefilled create form when it does not exist yet —
  // instead of showing a list with a "New record" button.
  function primeSingleton(list) {
    const row = pickSingletonRow(config, list);
    if (row) startEdit(row);
    else startCreate();
  }

  // One load per table. `config` is a module-level constant per page, and
  // loadRows/primeSingleton are recreated every render, so listing them as
  // dependencies would re-fetch forever — hence the deliberate table-only
  // dependency and the disable below.
  useEffect(() => {
    loadConfigOptions(config)
      .then(setOptions)
      .catch(() => setOptions({}));
    loadRows().then((list) => {
      if (config.singleton) {
        primeSingleton(list);
      } else {
        setForm({});
        setEditing(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.table]);

  function startCreate() {
    const initial = config.fields.reduce((next, field) => {
      if (field.type === 'checkbox') next[field.name] = field.name === 'is_published';
      else if (
        field.type === 'array' ||
        field.type === 'referenceArray' ||
        field.type === 'actionList'
      )
        next[field.name] = [];
      else next[field.name] = field.defaultValue ?? '';
      return next;
    }, {});
    setEditing(null);
    setForm(initial);
    setFormErrors({});
    setSlugUnlocked(true);
    slugManuallyEditedRef.current = false;
    scrollFormIntoView();
  }

  function startEdit(row) {
    setEditing(row);
    setForm({ ...row });
    setFormErrors({});
    setSlugUnlocked(false);
    slugManuallyEditedRef.current = true;
    scrollFormIntoView();
  }

  function closeForm() {
    setForm({});
    setEditing(null);
    setSlugUnlocked(false);
    slugManuallyEditedRef.current = false;
  }

  // The edit panel sits above the table; opening a record from a long table
  // should bring the form into view instead of appearing silently offscreen.
  function scrollFormIntoView() {
    requestAnimationFrame(() => {
      formPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function updateField(name, value) {
    setForm((current) => {
      const result = applySlugAwareChange({
        current,
        name,
        value,
        sourceFields: config.slugSourceFields,
        rows: allRows,
        slugManuallyEdited: slugManuallyEditedRef.current,
      });
      slugManuallyEditedRef.current = result.slugManuallyEdited;
      return result.record;
    });
  }

  async function handleImageUploaded(fieldName, url) {
    let nextRecord = null;
    setForm((current) => {
      nextRecord = { ...current, [fieldName]: url };
      return nextRecord;
    });

    if (!nextRecord?.id) {
      setToast({
        tone: 'info',
        message: 'Image uploaded. Click Save to attach it to this record.',
      });
      return;
    }

    setSubmitting(true);
    const { error: saveError } = await saveRecord(config, nextRecord);
    setSubmitting(false);

    if (saveError) {
      setToast({ tone: 'error', message: `Image uploaded but not saved: ${saveError.message}` });
      return;
    }

    setToast({ tone: 'success', message: 'Image saved.' });
    const list = await loadRows();
    const row = list.find((item) => item.id === nextRecord.id);
    if (row) {
      setEditing(row);
      setForm({ ...row });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const nextForm = normalizeRecordSlug(config, form);
    const errors = {
      ...validateContentRecord(nextForm, requiredFields),
      ...validateTypedFields(config, nextForm),
    };
    const slugError = validateUniqueSlug(nextForm, allRows);
    if (slugError) errors.slug = slugError;
    if (nextForm.slug !== form.slug) setForm(nextForm);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    const { error: saveError } = await saveRecord(config, nextForm);
    setSubmitting(false);
    if (saveError) {
      if (saveError.code === '23505' && /slug/i.test(`${saveError.message} ${saveError.details}`)) {
        setFormErrors((current) => ({
          ...current,
          slug: 'That slug was just taken by another record. Choose a different slug and save again.',
        }));
      }
      setToast({ tone: 'error', message: saveError.message });
      return;
    }

    setToast({ tone: 'success', message: `${config.title} saved.` });
    const list = await loadRows();
    if (config.singleton) {
      primeSingleton(list);
    } else {
      closeForm();
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (deleting) return;
    setDeleting(true);
    const { error: deleteError } = await deleteRecord(config, deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (deleteError) {
      setToast({ tone: 'error', message: deleteError.message });
      return;
    }
    setToast({ tone: 'success', message: 'Record deleted.' });
    await loadRows();
  }

  async function handleTogglePublished(row) {
    if (toggling) return;
    setToggling(true);
    const { error: publishError } = await togglePublished(config, row);
    setToggling(false);
    if (publishError) {
      setToast({ tone: 'error', message: publishError.message });
      return;
    }
    setToast({ tone: 'success', message: 'Publish status updated.' });
    await loadRows();
  }

  async function handleReorder(nextRows) {
    if (reordering || !config.orderField) return;
    const previousRows = rows;
    setRows(nextRows);
    setReordering(true);
    const { data, error: reorderError } = await reorderRecords(config, nextRows);
    setReordering(false);

    if (reorderError) {
      setRows(previousRows);
      setToast({ tone: 'error', message: `Order was not saved: ${reorderError.message}` });
      return;
    }

    setRows(data ?? nextRows);
    setToast({ tone: 'success', message: `${config.title} order saved.` });
  }

  async function handleHeaderAction(headerAction) {
    if (!headerAction || runningHeaderAction) return;
    setRunningHeaderAction(headerAction.key);
    const { data, error: actionError } = await headerAction.onAction();
    setRunningHeaderAction(null);

    if (actionError) {
      setToast({ tone: 'error', message: actionError.message ?? 'The action failed.' });
      return;
    }

    const message =
      typeof headerAction.successMessage === 'function'
        ? headerAction.successMessage(data)
        : headerAction.successMessage;
    setToast({ tone: 'success', message: message ?? 'Action completed.' });
    await loadRows();
  }

  const formOpen = Object.keys(form).length > 0;
  const actionBusy =
    submitting || deleting || toggling || reordering || Boolean(runningHeaderAction);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Manage</p>
          <h1>{config.title}</h1>
          <p>{config.description ?? 'Content shown in the mobile app.'}</p>
        </div>
        {config.singleton ? null : (
          <div className="page-header-actions">
            {headerLinks.map((headerLink) => (
              <Link className="button button-secondary" key={headerLink.to} to={headerLink.to}>
                {headerLink.label}
              </Link>
            ))}
            {headerActions.map((headerAction) => (
              <button
                className={`button ${headerAction.variant === 'primary' ? 'button-primary' : 'button-secondary'}`}
                disabled={actionBusy}
                key={headerAction.key}
                onClick={() => handleHeaderAction(headerAction)}
              >
                {runningHeaderAction === headerAction.key
                  ? (headerAction.pendingLabel ?? 'Working…')
                  : headerAction.label}
              </button>
            ))}
            {config.allowCreate === false ? null : (
              <button className="button button-primary" disabled={actionBusy} onClick={startCreate}>
                New record
              </button>
            )}
          </div>
        )}
      </div>

      {notice ? <p className="page-notice">{notice}</p> : null}

      {supplementalContent}

      {error ? <ErrorState message={error} actionLabel="Reload" onAction={loadRows} /> : null}

      {formOpen ? (
        <section
          className={config.singleton ? 'form-panel form-panel-singleton' : 'panel form-panel'}
          ref={formPanelRef}
        >
          {config.singleton ? null : (
            <div className="panel-header">
              <h2>{editing ? `Edit: ${editing[config.labelField] ?? 'record'}` : 'New record'}</h2>
              <button className="button button-secondary" disabled={submitting} onClick={closeForm}>
                Close
              </button>
            </div>
          )}
          {Object.keys(formErrors).length ? (
            <p className="inline-error form-error-summary">
              {Object.keys(formErrors).length === 1
                ? 'Fix the highlighted field before saving.'
                : `Fix the ${Object.keys(formErrors).length} highlighted fields before saving.`}
            </p>
          ) : null}
          <form className="content-form" onSubmit={handleSubmit}>
            {fieldGroups.map((group) => (
              <fieldset className="field-group" key={group.name}>
                {group.name !== DEFAULT_GROUP ? <legend>{group.name}</legend> : null}
                {group.fields.map((field) => {
                  const editableSlug = field.name === 'slug' && !field.readOnly;
                  const savedSlugLocked = editableSlug && Boolean(editing?.id) && !slugUnlocked;
                  const renderedField = (
                    <FormField
                      key={field.name}
                      field={{ ...field, readOnly: field.readOnly || savedSlugLocked }}
                      value={form[field.name]}
                      onChange={updateField}
                      onImageUploaded={handleImageUploaded}
                      error={formErrors[field.name]}
                      options={options}
                      record={form}
                    />
                  );

                  if (!editableSlug) return renderedField;

                  return (
                    <div className="slug-field-shell" key={field.name}>
                      {renderedField}
                      {savedSlugLocked ? (
                        <div className="slug-field-actions">
                          <small>Saved slugs stay locked to protect links and references.</small>
                          <button
                            className="button button-secondary slug-edit-button"
                            type="button"
                            onClick={() => setSlugUnlocked(true)}
                          >
                            Edit slug
                          </button>
                        </div>
                      ) : editing?.id ? (
                        <small className="slug-field-warning">
                          Changing a saved slug can affect bookmarks, shared links, and
                          integrations. Only change it when necessary.
                        </small>
                      ) : (
                        <small className="slug-field-note">
                          Generated from {slugSourceLabel(config)}. You can edit it before saving.
                        </small>
                      )}
                    </div>
                  );
                })}
              </fieldset>
            ))}
            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save'}
              </button>
              {config.singleton ? null : (
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={submitting}
                  onClick={closeForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      ) : null}

      {loading ? <LoadingState message={`Loading ${config.title.toLowerCase()}...`} /> : null}
      {!loading && !config.singleton && rows.length === 0 ? (
        <EmptyState title={`No ${config.title.toLowerCase()} yet`} />
      ) : null}
      {!loading && !config.singleton && rows.length > 0 ? (
        <DataTable
          columns={config.columns}
          rows={rows}
          labelField={config.labelField}
          referenceColumns={config.referenceColumns}
          colorField={config.colorField}
          colorSourceField={config.colorSourceField}
          options={options}
          searchQuery={tableQuery}
          onSearchChange={setTableQuery}
          onEdit={startEdit}
          onDelete={setDeleteTarget}
          onTogglePublished={handleTogglePublished}
          orderField={config.orderField}
          onReorder={config.orderField ? handleReorder : undefined}
          reordering={reordering}
          actionBusy={actionBusy}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete record?"
        message={`This permanently removes "${deleteTarget?.[config.labelField] ?? deleteTarget?.id}" from the app. There is no undo.`}
        confirmDisabled={deleting}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
    </div>
  );
}

const DEFAULT_GROUP = '__default__';

export function applySlugAwareChange({
  current,
  name,
  value,
  sourceFields = [],
  rows = [],
  slugManuallyEdited = false,
}) {
  const record = { ...current, [name]: value };
  const manuallyEdited = slugManuallyEdited || name === 'slug';

  if (!current.id && sourceFields.includes(name) && !manuallyEdited) {
    record.slug = generatedSlugForRecord(record, sourceFields, rows);
  }

  return { record, slugManuallyEdited: manuallyEdited };
}

export function generatedSlugForRecord(record, sourceFields = [], rows = []) {
  const source = sourceFields
    .map((field) => record[field])
    .filter(Boolean)
    .join(' ');
  return nextAvailableSlug(slugify(source), rows, record.id);
}

export function nextAvailableSlug(value, rows = [], currentId = null) {
  const base = slugify(value);
  if (!base) return '';

  const used = new Set(
    rows
      .filter((row) => currentId == null || String(row.id ?? '') !== String(currentId))
      .map((row) => row.slug)
      .filter(Boolean),
  );
  if (!used.has(base)) return base;

  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function normalizeRecordSlug(config, record) {
  if (!config.fields.some((field) => field.name === 'slug')) return record;
  return { ...record, slug: slugify(record.slug) };
}

function validateUniqueSlug(record, rows) {
  if (!record.slug) return null;
  const duplicate = rows.some(
    (row) => String(row.id ?? '') !== String(record.id ?? '') && row.slug === record.slug,
  );
  if (!duplicate) return null;
  return `That slug is already in use. Try "${nextAvailableSlug(record.slug, rows, record.id)}".`;
}

function slugSourceLabel(config) {
  const labels = (config.slugSourceFields ?? []).map(
    (name) => config.fields.find((field) => field.name === name)?.label ?? name,
  );
  if (labels.length < 2) return labels[0] ?? 'the record name';
  return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`;
}

function pickSingletonRow(config, list) {
  const slugField = config.fields.find((field) => field.name === 'slug' && field.defaultValue);
  if (slugField?.defaultValue) {
    const match = list.find((row) => row.slug === slugField.defaultValue);
    if (match) return match;
  }
  return list[0] ?? null;
}

function groupFields(fields) {
  const order = [];
  const byGroup = new Map();
  for (const field of fields) {
    const name = field.group ?? DEFAULT_GROUP;
    if (!byGroup.has(name)) {
      byGroup.set(name, []);
      order.push(name);
    }
    byGroup.get(name).push(field);
  }
  return order.map((name) => ({ name, fields: byGroup.get(name) }));
}

function validateTypedFields(config, form) {
  return config.fields.reduce((errors, field) => {
    if (field.type === 'actionList') {
      const message = validateActionList(form[field.name]);
      if (message) errors[field.name] = message;
      return errors;
    }

    const value = String(form[field.name] ?? '').trim();
    if (!value) return errors;

    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field.name] = 'Use a valid email address.';
    }

    if (field.type === 'url' && !isValidUrl(value)) {
      errors[field.name] = 'Use a full URL starting with https:// or http://.';
    }

    if (field.type === 'youtube' && !isYouTubeUrl(value)) {
      errors[field.name] = 'Use a full YouTube link (youtube.com/watch?v=… or youtu.be/…).';
    }

    return errors;
  }, {});
}

// Quick actions are dropped on save unless complete (title + target), so block
// the save with a clear message instead of letting cards silently disappear.
function validateActionList(actions) {
  if (!Array.isArray(actions)) return null;
  for (let i = 0; i < actions.length; i += 1) {
    const action = actions[i];
    const title = String(action?.title ?? '').trim();
    const isRoute = action?.targetType === 'route';
    const target = String((isRoute ? action?.routeName : action?.targetId) ?? '').trim();

    if (!title && !target) return `Card ${i + 1} is empty — add a title and target, or remove it.`;
    if (!title) return `Card ${i + 1} needs a title.`;
    if (!target) {
      return `Card ${i + 1} needs a ${isRoute ? 'screen' : 'target'}.`;
    }
  }
  return null;
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
