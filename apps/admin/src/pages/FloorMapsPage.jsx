import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { aspectRatioDifference } from '@nye-center/shared';

import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Toast from '../components/Toast.jsx';
import {
  deleteFloor,
  getFloorUsage,
  listFloorMaps,
  readImageSize,
  uploadFloorMap,
  validateFloorMapFile,
} from '../services/floorMapsService.js';

// Pins are stored as percentages of the plan, so a plan whose shape differs by
// more than this would visibly move them.
const ASPECT_WARNING_THRESHOLD = 0.02;

const STATUS_BADGES = {
  bundled: { label: 'Original plan', className: 'status-published' },
  custom: { label: 'Uploaded plan', className: 'status-published' },
  deleted: { label: 'Deleted', className: 'status-draft' },
};

export default function FloorMapsPage() {
  const [floors, setFloors] = useState([]);
  const [usage, setUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyFloor, setBusyFloor] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingUpload, setPendingUpload] = useState(null);

  async function load() {
    setError('');
    const [plans, counts] = await Promise.all([listFloorMaps(), getFloorUsage()]);
    if (plans.error || counts.error) {
      setError((plans.error ?? counts.error).message ?? 'Floor maps could not be loaded.');
    } else {
      setFloors(plans.data);
      setUsage(counts.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFileChosen(floor, file) {
    const problem = validateFloorMapFile(file);
    if (problem) {
      setToast({ tone: 'error', message: problem });
      return;
    }

    let imageSize;
    try {
      imageSize = await readImageSize(file);
    } catch (readError) {
      setToast({ tone: 'error', message: readError.message });
      return;
    }

    const pins = usage[floor.floor]?.pins ?? 0;
    const shapeChange = floor.deleted ? 0 : aspectRatioDifference(imageSize, floor.imageSize);
    if (pins > 0 && shapeChange > ASPECT_WARNING_THRESHOLD) {
      setPendingUpload({ floor, file, imageSize, shapeChange, pins });
      return;
    }
    await runUpload(floor, file, imageSize);
  }

  async function runUpload(floor, file, imageSize) {
    setPendingUpload(null);
    setBusyFloor(floor.floor);
    const { error: uploadError } = await uploadFloorMap(
      floor.floor,
      file,
      imageSize,
      floor.imagePath,
    );
    setBusyFloor(null);

    if (uploadError) {
      setToast({ tone: 'error', message: uploadError.message ?? 'The upload failed.' });
      return;
    }
    setToast({
      tone: 'success',
      message: floor.deleted
        ? `${floor.label} is back with the new plan. Add its pins from Map Pins → New record.`
        : `${floor.label} now uses the new plan.`,
    });
    await load();
  }

  async function confirmDelete() {
    const floor = deleteTarget;
    setDeleteTarget(null);
    setBusyFloor(floor.floor);
    const { data, error: deleteError } = await deleteFloor(floor.floor);
    setBusyFloor(null);

    if (deleteError) {
      setToast({
        tone: 'error',
        message: deleteError.message ?? 'The floor could not be deleted.',
      });
      return;
    }
    setToast({
      tone: 'success',
      message: `${floor.label} deleted with ${plural(data.pins, 'pin')} and ${plural(data.routePoints, 'route point')}.`,
    });
    await load();
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Map page</p>
          <h1>Floor maps</h1>
          <p>The plan drawn for each of the building&apos;s four floors in the app.</p>
        </div>
        <div className="page-header-actions">
          <Link className="button button-secondary" to="/map-pins">
            Back to Map Pins
          </Link>
        </div>
      </div>

      <p className="page-notice">
        Replacing a plan keeps the floor&apos;s pins where they are, so use a JPG of the same shape.
        Deleting a floor also deletes its pins and route points, and hides the floor in the app
        until a new plan is uploaded.
      </p>

      {loading ? <LoadingState message="Loading floor maps…" /> : null}
      {error ? <ErrorState message={error} actionLabel="Reload" onAction={load} /> : null}

      {!loading && !error ? (
        <div className="floor-map-grid">
          {floors.map((floor) => (
            <FloorMapCard
              key={floor.id}
              floor={floor}
              usage={usage[floor.floor]}
              busy={busyFloor === floor.floor}
              disabled={busyFloor !== null}
              onFileChosen={(file) => handleFileChosen(floor, file)}
              onDelete={() => setDeleteTarget(floor)}
            />
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.label ?? 'floor'}?`}
        message={deleteTarget ? deleteMessage(deleteTarget, usage[deleteTarget.floor]) : ''}
        confirmLabel="Delete floor"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingUpload)}
        title="This plan is a different shape"
        message={
          pendingUpload
            ? `The new plan is ${Math.round(pendingUpload.shapeChange * 100)}% wider or taller than the current one, so the ${plural(pendingUpload.pins, 'pin')} on ${pendingUpload.floor.label} will no longer line up with their rooms. Upload it anyway and re-place them, or delete the floor first to start with no pins.`
            : ''
        }
        confirmLabel="Upload anyway"
        onConfirm={() =>
          runUpload(pendingUpload.floor, pendingUpload.file, pendingUpload.imageSize)
        }
        onCancel={() => setPendingUpload(null)}
      />

      <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
    </div>
  );
}

function FloorMapCard({ floor, usage, busy, disabled, onFileChosen, onDelete }) {
  const inputRef = useRef(null);
  const badge = STATUS_BADGES[floor.status] ?? STATUS_BADGES.bundled;
  const src = floor.imageUrl ?? `/maps/${floor.imageFile}`;

  return (
    <section className="panel floor-map-card" aria-labelledby={`${floor.id}-heading`}>
      <div className="floor-map-card-head">
        <h2 id={`${floor.id}-heading`}>{floor.label}</h2>
        <span className={`status-badge ${badge.className}`}>{badge.label}</span>
      </div>
      <p className="floor-map-title">{floor.title}</p>

      {floor.deleted ? (
        <div className="floor-map-empty">
          <strong>No floor plan</strong>
          <span>This floor is hidden in the app until a plan is uploaded.</span>
        </div>
      ) : (
        <img
          className="floor-map-preview"
          src={src}
          alt={`${floor.label} plan`}
          style={{ aspectRatio: `${floor.imageSize.width} / ${floor.imageSize.height}` }}
        />
      )}

      <dl className="floor-map-meta">
        {floor.deleted ? null : (
          <div>
            <dt>Size</dt>
            <dd>
              {floor.imageSize.width} × {floor.imageSize.height} px
            </dd>
          </div>
        )}
        <div>
          <dt>Pins</dt>
          <dd>{usage?.pins ?? 0}</dd>
        </div>
        <div>
          <dt>Route points</dt>
          <dd>{usage?.routePoints ?? 0}</dd>
        </div>
      </dl>

      <div className="floor-map-actions">
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept=".jpg,.jpeg,image/jpeg"
          aria-label={`Upload a JPG plan for ${floor.label}`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) onFileChosen(file);
          }}
        />
        <button
          type="button"
          className="button button-primary"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Working…' : floor.deleted ? 'Upload plan' : 'Replace plan'}
        </button>
        {floor.deleted ? null : (
          <button
            type="button"
            className="button button-danger"
            disabled={disabled}
            onClick={onDelete}
          >
            Delete floor
          </button>
        )}
      </div>
    </section>
  );
}

function deleteMessage(floor, usage) {
  const pins = plural(usage?.pins ?? 0, 'pin');
  const points = plural(usage?.routePoints ?? 0, 'route point');
  return `This removes the ${floor.label} plan, its ${pins} and its ${points}, and hides the floor in the app. Rooms in Spaces are kept. This can't be undone; to bring the floor back, upload a new plan and add its pins again.`;
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}
