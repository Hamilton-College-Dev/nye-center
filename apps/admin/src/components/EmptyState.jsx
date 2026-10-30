export default function EmptyState({
  title = 'Nothing here yet',
  message = 'Create the first record to get started.',
}) {
  return (
    <div className="state state-empty">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
