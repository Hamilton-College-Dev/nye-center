import { useEffect, useRef, useState } from 'react';
import { clampPercent, resolveFloorPlans } from '@nye-center/shared';

import { listFloorMaps } from '../services/floorMapsService.js';

// Click-to-place picker for a pin's floor and position.
//
// Coordinates are stored as percentages of the floor image, the same
// convention the mobile app uses to draw pins — so what is clicked here is
// exactly where the marker lands in the app, at any screen size. Floor
// geometry comes from the shared package so the two cannot drift apart, and
// uploaded plans from the floor_maps table replace the bundled ones here just
// as they do in the app.
export default function MapPinField({ field, record, onChange, error }) {
  const imageRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  // Bundled plans until the table answers, and if it never does.
  const [plans, setPlans] = useState(() => resolveFloorPlans());

  useEffect(() => {
    let active = true;
    listFloorMaps().then(({ data }) => {
      if (active && data) setPlans(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const floorField = field.floorField ?? 'floor';
  const xField = field.xField ?? 'x';
  const yField = field.yField ?? 'y';

  const visiblePlans = plans.filter((plan) => !plan.deleted);
  const floorNumber = Number(record[floorField]) || visiblePlans[0]?.floor || plans[0].floor;
  const floor = plans.find((plan) => plan.floor === floorNumber) ?? plans[0];
  // An existing pin may still name a deleted floor; keep it selectable so the
  // editor can see why and move the pin.
  const floorOptions = floor.deleted ? [...visiblePlans, floor] : visiblePlans;
  const x = record[xField] === '' || record[xField] == null ? null : Number(record[xField]);
  const y = record[yField] === '' || record[yField] == null ? null : Number(record[yField]);
  const placed = Number.isFinite(x) && Number.isFinite(y);

  function setFromEvent(event) {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    onChange(xField, clampPercent(((event.clientX - rect.left) / rect.width) * 100));
    onChange(yField, clampPercent(((event.clientY - rect.top) / rect.height) * 100));
  }

  // Arrow keys nudge by 0.5% so a pin can be positioned precisely without a
  // steady hand, and so the control is usable from the keyboard.
  function nudge(event) {
    const step = event.shiftKey ? 2 : 0.5;
    const moves = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange(xField, clampPercent((Number.isFinite(x) ? x : 50) + move[0]));
    onChange(yField, clampPercent((Number.isFinite(y) ? y : 50) + move[1]));
  }

  return (
    <div className="form-field map-pin-field">
      <span>
        {field.label}
        {field.required ? <em>Required</em> : null}
      </span>

      <div className="map-pin-toolbar">
        <label className="map-pin-floor">
          Floor
          <select
            value={String(floorNumber)}
            onChange={(event) => onChange(floorField, Number(event.target.value))}
          >
            {floorOptions.map((option) => (
              <option key={option.id} value={option.floor}>
                {option.deleted ? `${option.label} (deleted)` : option.label}
              </option>
            ))}
          </select>
        </label>
        <span className="map-pin-readout">
          {placed ? `x ${x}%  ·  y ${y}%` : 'Click the plan to place the pin'}
        </span>
        {placed ? (
          <button
            type="button"
            className="button button-secondary map-pin-clear"
            onClick={() => {
              onChange(xField, '');
              onChange(yField, '');
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {floor.deleted ? (
        <small className="map-pin-deleted-floor">
          {floor.label} has been deleted. Choose another floor, or upload a new plan under Floor
          maps first.
        </small>
      ) : null}

      <div
        className="map-pin-canvas"
        role="application"
        aria-label={`Pin position on ${floor.label}. Click to place, arrow keys to nudge.`}
        tabIndex={0}
        onKeyDown={nudge}
        onMouseDown={(event) => {
          setDragging(true);
          setFromEvent(event);
        }}
        onMouseMove={(event) => dragging && setFromEvent(event)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
      >
        <img
          ref={imageRef}
          alt={`${floor.label} plan`}
          src={floor.imageUrl ?? `/maps/${floor.imageFile}`}
          draggable={false}
          style={{ aspectRatio: `${floor.imageSize.width} / ${floor.imageSize.height}` }}
        />
        {placed ? (
          <span className="map-pin-marker" style={{ left: `${x}%`, top: `${y}%` }} />
        ) : null}
      </div>

      {field.hint ? <small>{field.hint}</small> : null}
      {error ? <small className="field-error">{error}</small> : null}
    </div>
  );
}
