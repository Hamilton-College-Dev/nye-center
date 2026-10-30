import { useRef, useState } from 'react';

import { uploadResourceImage, uploadSpaceImage } from '../services/storageService.js';

export default function ImageUploadField({
  field,
  value,
  onChange,
  onUploaded,
  error,
  record = {},
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    const upload = field.uploadFolder === 'resources' ? uploadResourceImage : uploadSpaceImage;
    const { publicUrl, error: uploadErr } = await upload(record.slug, file);
    setUploading(false);

    if (uploadErr) {
      setUploadError(uploadErr.message ?? 'Upload failed.');
      return;
    }

    onChange(field.name, publicUrl);
    await onUploaded?.(publicUrl);
  }

  return (
    <label className="form-field" htmlFor={`field-${field.name}`}>
      <span>
        {field.label}
        {field.required ? <em>Required</em> : null}
      </span>

      {isPreviewableUrl(value) ? (
        <img className="field-image-preview" src={value} alt="" loading="lazy" />
      ) : (
        <div className="image-upload-placeholder">No image uploaded yet.</div>
      )}

      <div className="image-upload-actions">
        <button
          type="button"
          className="button button-secondary"
          disabled={uploading || !record.slug}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
        </button>
        {value ? (
          <button
            type="button"
            className="button button-ghost"
            onClick={() => onChange(field.name, '')}
          >
            Remove
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={`field-${field.name}`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={handleFileChange}
      />

      <input
        type="url"
        value={value ?? ''}
        placeholder="Or paste an image URL"
        onChange={(event) => onChange(field.name, event.target.value)}
      />

      {!record.slug ? (
        <small>Set the slug first — uploads are stored under that name.</small>
      ) : null}
      {field.hint ? <small>{field.hint}</small> : null}
      {uploadError ? <small className="field-error">{uploadError}</small> : null}
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
