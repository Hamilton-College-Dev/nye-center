export default function ColorPaletteField({ field, value, onChange, error }) {
  const options = field.options ?? [];
  const selectedValue = String(value ?? '').toUpperCase();
  const hasKnownValue = options.some((option) => option.value.toUpperCase() === selectedValue);

  return (
    <fieldset className="form-field color-palette-field">
      <legend>
        {field.label}
        {field.required ? <em>Required</em> : null}
      </legend>

      <div className="color-palette">
        {options.map((option) => {
          const selected = option.value.toUpperCase() === selectedValue;
          return (
            <label
              className={`color-palette-option${selected ? ' is-selected' : ''}`}
              key={option.value}
            >
              <input
                type="radio"
                name={field.name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(field.name, option.value)}
              />
              <span
                aria-hidden="true"
                className="color-palette-swatch"
                style={{ backgroundColor: option.value }}
              />
              <span className="color-palette-label">{option.label}</span>
            </label>
          );
        })}
      </div>

      {selectedValue && !hasKnownValue ? (
        <small>The saved color is outside this palette. Choose a swatch to replace it.</small>
      ) : null}
      {field.hint ? <small>{field.hint}</small> : null}
      {error ? <small className="field-error">{error}</small> : null}
    </fieldset>
  );
}
