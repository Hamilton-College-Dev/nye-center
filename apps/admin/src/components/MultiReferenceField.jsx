// Multi-select for related records: pick from a dropdown, see selections as
// removable chips. Stores an ordered array of the configured value key
// (slug or id) so editors never type identifiers by hand.
export default function MultiReferenceField({ field, value, options, onChange, error }) {
  const valueKey = field.ref.value;
  const selected = value ?? [];
  const optionByValue = new Map(options.map((option) => [String(option[valueKey]), option]));
  const available = options.filter((option) => !selected.includes(option[valueKey]));

  function add(event) {
    const next = event.target.value;
    if (!next) return;
    onChange([...selected, next]);
    event.target.value = '';
  }

  function remove(target) {
    onChange(selected.filter((item) => item !== target));
  }

  function move(index, delta) {
    const next = [...selected];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="form-field">
      <span>
        {field.label}
        {field.required ? <em>Required</em> : null}
      </span>

      {selected.length ? (
        <ul className="chip-list">
          {selected.map((item, index) => {
            const option = optionByValue.get(String(item));
            return (
              <li className="chip" key={item}>
                <button
                  type="button"
                  className="chip-move"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="chip-move"
                  disabled={index === selected.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                >
                  ↓
                </button>
                <span className="chip-label">{option?.label ?? item}</span>
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => remove(item)}
                  aria-label={`Remove ${option?.label ?? item}`}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="chip-empty">Nothing selected yet.</p>
      )}

      <select value="" onChange={add} disabled={!available.length}>
        <option value="">{available.length ? '+ Add…' : 'All added'}</option>
        {available.map((option) => (
          <option key={option.id} value={option[valueKey]}>
            {option.label}
          </option>
        ))}
      </select>

      {field.hint ? <small>{field.hint}</small> : null}
      {error ? <small className="field-error">{error}</small> : null}
    </div>
  );
}
