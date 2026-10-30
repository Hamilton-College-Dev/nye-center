export default function ErrorState({
  title = 'Something went wrong',
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div className="state state-error">
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
      {onAction ? (
        <button className="button button-secondary" onClick={onAction}>
          {actionLabel ?? 'Try again'}
        </button>
      ) : null}
    </div>
  );
}
