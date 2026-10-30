import { useEffect, useRef } from 'react';

import { MOBILE_ROUTE_OPTIONS, QUICK_ACTION_TYPES } from '../services/contentService.js';

// Stable client-side row id. Stripped on save by sanitizeActions, so it never
// reaches the database — it exists only to give React a key that follows the
// card when the list is reordered or trimmed.
let uidCounter = 0;
function makeUid() {
  uidCounter += 1;
  return `qa-${Date.now().toString(36)}-${uidCounter}`;
}

// Visual builder for the Home screen's "I'm looking for…" cards. Replaces the
// raw JSON textarea: each card is a row with title, subtitle, a target kind, and
// a target picker. Output is the JSON array the mobile app already consumes.
export default function QuickActionsEditor({ field, value, options, onChange, error }) {
  const actions = value ?? [];

  // ContentPage recreates onChange on every render, so keep the latest in a ref
  // and depend only on `value` (the actual array reference). That keeps onChange
  // out of the dependency array and runs the backfill once per loaded list
  // instead of on every render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Backfill stable ids on actions loaded from the database (which only carry
  // the persisted shape). Guarded so it runs once per incomplete list.
  useEffect(() => {
    if (!Array.isArray(value)) return;
    if (value.some((action) => !action.__uid)) {
      onChangeRef.current(
        value.map((action) => (action.__uid ? action : { ...action, __uid: makeUid() })),
      );
    }
  }, [value]);

  function update(index, patch) {
    onChange(actions.map((action, i) => (i === index ? { ...action, ...patch } : action)));
  }

  function changeType(index, targetType) {
    update(index, { targetType, targetId: '', routeName: '' });
  }

  function add() {
    onChange([
      ...actions,
      {
        __uid: makeUid(),
        title: '',
        subtitle: '',
        targetType: 'space',
        targetId: '',
        routeName: '',
      },
    ]);
  }

  function remove(index) {
    onChange(actions.filter((_, i) => i !== index));
  }

  function move(index, delta) {
    const next = [...actions];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="form-field">
      <span>{field.label}</span>

      <div className="action-list">
        {actions.map((action, index) => {
          const typeMeta =
            QUICK_ACTION_TYPES.find((type) => type.value === action.targetType) ??
            QUICK_ACTION_TYPES[0];
          const targetOptions = typeMeta.route
            ? MOBILE_ROUTE_OPTIONS
            : (options[typeMeta.table] ?? []);

          return (
            <div className="action-card" key={action.__uid ?? `card-${index}`}>
              <div className="action-card-head">
                <strong>Card {index + 1}</strong>
                <div className="action-card-tools">
                  <button
                    type="button"
                    className="button button-secondary action-tool"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="button button-secondary action-tool"
                    disabled={index === actions.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="button button-danger action-tool"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="action-grid">
                <label className="form-field">
                  <span>Title</span>
                  <input
                    value={action.title ?? ''}
                    placeholder="Find a quiet study spot"
                    onChange={(event) => update(index, { title: event.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Subtitle</span>
                  <input
                    value={action.subtitle ?? ''}
                    placeholder="Optional supporting line"
                    onChange={(event) => update(index, { subtitle: event.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Links to</span>
                  <select
                    value={action.targetType ?? 'space'}
                    onChange={(event) => changeType(index, event.target.value)}
                  >
                    {QUICK_ACTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>{typeMeta.route ? 'Screen' : typeMeta.label}</span>
                  <select
                    value={typeMeta.route ? (action.routeName ?? '') : (action.targetId ?? '')}
                    onChange={(event) =>
                      update(
                        index,
                        typeMeta.route
                          ? { routeName: event.target.value }
                          : { targetId: event.target.value },
                      )
                    }
                  >
                    <option value="">— Select —</option>
                    {targetOptions.map((option) => (
                      <option
                        key={option.value ?? option.id}
                        value={option.value ?? option[typeMeta.valueKey]}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          );
        })}

        {actions.length === 0 ? (
          <p className="chip-empty">No quick actions yet. Add one to populate the Home screen.</p>
        ) : null}
      </div>

      <button type="button" className="button button-secondary action-add" onClick={add}>
        + Add quick action
      </button>

      {field.hint ? <small>{field.hint}</small> : null}
      {error ? <small className="field-error">{error}</small> : null}
    </div>
  );
}
