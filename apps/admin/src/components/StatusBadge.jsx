export default function StatusBadge({ value }) {
  const published = value === true;
  return (
    <span className={`status-badge ${published ? 'status-published' : 'status-draft'}`}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
}
