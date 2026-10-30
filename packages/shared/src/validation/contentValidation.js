export function requireFields(record = {}, fields = []) {
  return fields.reduce((errors, field) => {
    const value = record[field];
    if (value === undefined || value === null || String(value).trim() === '') {
      errors[field] = 'Required';
    }
    return errors;
  }, {});
}

export function isValidSlug(value = '') {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value));
}

export function validateContentRecord(record = {}, requiredFields = []) {
  const errors = requireFields(record, requiredFields);
  if (record.slug && !isValidSlug(record.slug)) {
    errors.slug = 'Use lowercase letters, numbers, and hyphens only.';
  }
  return errors;
}
