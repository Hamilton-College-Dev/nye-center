import { useState } from 'react';

import StatusBadge from './StatusBadge.jsx';

export default function DataTable({
  columns,
  rows,
  labelField,
  referenceColumns = {},
  colorField,
  colorSourceField,
  options = {},
  searchQuery = '',
  onSearchChange,
  onEdit,
  onDelete,
  onTogglePublished,
  orderField,
  onReorder,
  reordering = false,
  actionBusy = false,
}) {
  const [draggedRowId, setDraggedRowId] = useState(null);
  const [dragOverRowId, setDragOverRowId] = useState(null);
  const labelMaps = {};
  for (const [column, table] of Object.entries(referenceColumns)) {
    const map = new Map();
    for (const option of options[table] ?? []) {
      if (option.slug != null) map.set(String(option.slug), option.label);
      if (option.id != null) map.set(String(option.id), option.label);
    }
    labelMaps[column] = map;
  }

  const query = String(searchQuery ?? '')
    .trim()
    .toLowerCase();
  const filteredRows = query
    ? rows.filter((row) => rowMatchesQuery(row, columns, labelField, labelMaps, query))
    : rows;
  const reorderable = Boolean(orderField && onReorder);
  const showsColor = Boolean(colorField);
  const canReorder = reorderable && !query && !actionBusy;

  function requestReorder(nextRows) {
    if (nextRows !== rows && canReorder) onReorder(nextRows);
  }

  function handleDragStart(event, rowId) {
    if (!canReorder) return;
    setDraggedRowId(rowId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(rowId));
  }

  function handleDrop(event, targetRowId) {
    if (!canReorder) return;
    event.preventDefault();
    const sourceRowId = draggedRowId ?? event.dataTransfer.getData('text/plain');
    setDraggedRowId(null);
    setDragOverRowId(null);
    requestReorder(moveRowTo(rows, sourceRowId, targetRowId));
  }

  function clearDragState() {
    setDraggedRowId(null);
    setDragOverRowId(null);
  }

  return (
    <div className="table-panel">
      {onSearchChange ? (
        <div className="table-toolbar">
          <label className="table-search">
            <span className="sr-only">Search records</span>
            <input
              type="search"
              value={searchQuery}
              placeholder={`Search ${rows.length} record${rows.length === 1 ? '' : 's'}…`}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          {query ? (
            <span className="table-search-meta">
              {filteredRows.length} match{filteredRows.length === 1 ? '' : 'es'}
            </span>
          ) : null}
          {reorderable ? (
            <span className="table-order-help">
              {query
                ? 'Clear search to reorder.'
                : reordering
                  ? 'Saving order…'
                  : 'Drag rows or use the arrows to change display order.'}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {reorderable ? <th className="order-header">Order</th> : null}
              {showsColor ? <th className="color-header">Color</th> : null}
              {columns.map((column) => (
                <th key={column}>{formatHeader(column)}</th>
              ))}
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length ? (
              filteredRows.map((row, rowIndex) => (
                <tr
                  className={[
                    draggedRowId === row.id ? 'row-dragging' : '',
                    dragOverRowId === row.id ? 'row-drag-over' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={row.id}
                  onDragEnter={() => canReorder && setDragOverRowId(row.id)}
                  onDragOver={(event) => {
                    if (canReorder) event.preventDefault();
                  }}
                  onDrop={(event) => handleDrop(event, row.id)}
                >
                  {reorderable ? (
                    <td className="order-cell">
                      <div className="order-controls">
                        <span
                          aria-hidden="true"
                          className="drag-handle"
                          draggable={canReorder}
                          onDragEnd={clearDragState}
                          onDragStart={(event) => handleDragStart(event, row.id)}
                          title="Drag to reorder"
                        >
                          ⋮⋮
                        </span>
                        <button
                          aria-label={`Move ${row[labelField]} up`}
                          className="order-button"
                          disabled={!canReorder || rowIndex === 0}
                          onClick={() => requestReorder(moveRowBy(rows, row.id, -1))}
                          type="button"
                        >
                          ↑
                        </button>
                        <button
                          aria-label={`Move ${row[labelField]} down`}
                          className="order-button"
                          disabled={!canReorder || rowIndex === rows.length - 1}
                          onClick={() => requestReorder(moveRowBy(rows, row.id, 1))}
                          type="button"
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                  ) : null}
                  {showsColor ? (
                    <td className="color-cell">
                      <ColorCell
                        color={row[colorField]}
                        source={colorSourceField ? row[colorSourceField] : null}
                      />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td key={column}>{formatCell(row[column], column, labelMaps[column])}</td>
                  ))}
                  <td className="actions-cell">
                    <button
                      className="button button-secondary button-table"
                      disabled={actionBusy}
                      onClick={() => onEdit(row)}
                    >
                      Edit
                    </button>
                    {'is_published' in row ? (
                      <button
                        className="button button-secondary button-table"
                        disabled={actionBusy}
                        onClick={() => onTogglePublished(row)}
                      >
                        {row.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                    ) : null}
                    <button
                      className="button button-danger button-table"
                      disabled={actionBusy}
                      onClick={() => onDelete(row)}
                    >
                      Delete
                    </button>
                    <span className="sr-only">{row[labelField]}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="table-empty"
                  colSpan={columns.length + 1 + (reorderable ? 1 : 0) + (showsColor ? 1 : 0)}
                >
                  No records match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ColorCell({ color, source }) {
  if (!color) return <span className="cell-muted">—</span>;

  return (
    <span className="color-value" title={source ? `Inherited from ${source}` : color}>
      <span aria-hidden="true" className="color-swatch" style={{ backgroundColor: color }} />
      <span>{color}</span>
    </span>
  );
}

export function moveRowTo(rows, sourceRowId, targetRowId) {
  const sourceIndex = rows.findIndex((row) => String(row.id) === String(sourceRowId));
  const targetIndex = rows.findIndex((row) => String(row.id) === String(targetRowId));
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return rows;

  const next = [...rows];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

export function moveRowBy(rows, rowId, delta) {
  const sourceIndex = rows.findIndex((row) => String(row.id) === String(rowId));
  const targetIndex = sourceIndex + delta;
  if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= rows.length) return rows;

  const next = [...rows];
  [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
  return next;
}

function rowMatchesQuery(row, columns, labelField, labelMaps, query) {
  const parts = [
    row[labelField],
    ...columns.map((column) => formatSearchValue(row[column], labelMaps[column])),
  ];
  return parts.some((part) =>
    String(part ?? '')
      .toLowerCase()
      .includes(query),
  );
}

function formatSearchValue(value, labelMap) {
  if (value == null || value === '') return '';
  if (Array.isArray(value)) {
    const display = labelMap ? value.map((item) => labelMap.get(String(item)) ?? item) : value;
    return display.join(', ');
  }
  if (typeof value === 'boolean') return value ? 'published' : 'draft';
  if (labelMap) return labelMap.get(String(value)) ?? String(value);
  return String(value);
}

function formatHeader(value) {
  return String(value).replace(/_/g, ' ');
}

function formatCell(value, column, labelMap) {
  if (column === 'is_published') return <StatusBadge value={value} />;
  if (value == null || value === '') return <span className="cell-muted">—</span>;
  if (Array.isArray(value)) {
    if (!value.length) return <span className="cell-muted">—</span>;
    const display = labelMap ? value.map((item) => labelMap.get(String(item)) ?? item) : value;
    return <span className="cell-text">{display.join(', ')}</span>;
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return <span className="cell-text">{JSON.stringify(value)}</span>;
  if (column === 'updated_at') return new Date(value).toLocaleDateString();
  if (labelMap)
    return <span className="cell-text">{labelMap.get(String(value)) ?? String(value)}</span>;
  return <span className="cell-text">{String(value)}</span>;
}
