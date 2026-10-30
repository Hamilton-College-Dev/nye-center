import { toCommaList, toLineList } from '@nye-center/shared';

import ColorPaletteField from './ColorPaletteField.jsx';
import ImageUploadField from './ImageUploadField.jsx';
import MapPinField from './MapPinField.jsx';
import MultiReferenceField from './MultiReferenceField.jsx';
import QuickActionsEditor from './QuickActionsEditor.jsx';

export default function FormField({
  field,
  value,
  onChange,
  onImageUploaded,
  error,
  options = {},
  record = {},
}) {
  const id = `field-${field.name}`;

  // A dynamicReference picks its target table from a sibling field's value.
  // When the current type has no table, it falls through to a text input.
  const resolvedRef =
    field.type === 'dynamicReference' ? field.refMap?.[record[field.typeField]] : field.ref;
  const isReferenceSelect =
    (field.type === 'reference' || field.type === 'dynamicReference') && Boolean(resolvedRef);

  // Rich pickers manage their own layout/labels.
  if (field.type === 'referenceArray') {
    return (
      <MultiReferenceField
        field={field}
        value={Array.isArray(value) ? value : []}
        options={options[field.ref.table] ?? []}
        onChange={(next) => onChange(field.name, next)}
        error={error}
      />
    );
  }

  if (field.type === 'actionList') {
    return (
      <QuickActionsEditor
        field={field}
        value={Array.isArray(value) ? value : []}
        options={options}
        onChange={(next) => onChange(field.name, next)}
        error={error}
      />
    );
  }

  if (field.type === 'mapPin') {
    return <MapPinField field={field} record={record} onChange={onChange} error={error} />;
  }

  if (field.type === 'imageUpload') {
    return (
      <ImageUploadField
        field={field}
        value={value}
        onChange={onChange}
        onUploaded={(url) => onImageUploaded?.(field.name, url)}
        error={error}
        record={record}
      />
    );
  }

  if (field.type === 'colorPalette') {
    return <ColorPaletteField field={field} value={value} onChange={onChange} error={error} />;
  }

  return (
    <label className="form-field" htmlFor={id}>
      <span>
        {field.label}
        {field.required ? <em>Required</em> : null}
      </span>

      {field.type === 'textarea' || field.type === 'lineList' || field.type === 'json' ? (
        <textarea
          id={id}
          name={field.name}
          rows={field.type === 'json' ? 5 : 4}
          value={formatValue(value, field)}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.name, event.target.value)}
        />
      ) : field.type === 'checkbox' ? (
        <input
          id={id}
          name={field.name}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(field.name, event.target.checked)}
        />
      ) : field.type === 'select' ? (
        <select
          id={id}
          name={field.name}
          value={value ?? ''}
          onChange={(event) => onChange(field.name, event.target.value)}
        >
          <option value="">— Select —</option>
          {retiredOption(value, field.options ?? [], (option) => option.value)}
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : isReferenceSelect ? (
        <select
          id={id}
          name={field.name}
          value={value ?? ''}
          onChange={(event) => onChange(field.name, event.target.value)}
        >
          <option value="">{field.required ? '— Select —' : '— None —'}</option>
          {retiredOption(
            value,
            options[resolvedRef.table] ?? [],
            (option) => option[resolvedRef.value],
          )}
          {(options[resolvedRef.table] ?? []).map((option) => (
            <option key={option.id} value={option[resolvedRef.value]}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={field.name}
          type={inputType(field.type)}
          value={field.type === 'array' ? toCommaList(value) : (value ?? '')}
          placeholder={field.placeholder}
          readOnly={Boolean(field.readOnly)}
          onChange={(event) => onChange(field.name, event.target.value)}
        />
      )}

      {field.previewImage && isPreviewableUrl(value) ? (
        <img className="field-image-preview" src={value} alt="" loading="lazy" />
      ) : null}

      {field.hint ? <small>{field.hint}</small> : null}
      {field.type === 'array' ? <small>Separate values with commas.</small> : null}
      {field.type === 'json' ? <small>Use valid JSON.</small> : null}
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

function isPreviewableUrl(value) {
  const text = String(value ?? '').trim();
  if (!text) return false;
  try {
    const url = new URL(text);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function formatValue(value, field) {
  if (field.type === 'json') return value ? JSON.stringify(value, null, 2) : '';
  if (field.type === 'lineList') return toLineList(value);
  return value ?? '';
}

// Map app-level field types to valid HTML input types.
function inputType(type) {
  if (type === 'youtube') return 'url';
  if (!type || type === 'array' || type === 'dynamicReference') return 'text';
  return type;
}

// A stored value with no matching <option> renders as a blank select, so an
// editor cannot see what the field points at — that is how a retired route name
// ("Tours") stayed invisible in the Home Screen editor for weeks. Surface it
// instead: shown, selected, and clearly not a valid choice any more.
function retiredOption(value, options, getValue) {
  const current = value ?? '';
  if (!current) return null;
  if (options.some((option) => getValue(option) === current)) return null;
  return (
    <option key={`retired-${current}`} value={current}>
      {current} — no longer available, pick a new target
    </option>
  );
}
