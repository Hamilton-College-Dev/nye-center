export default function Toast({ message, tone = 'success', onDismiss }) {
  if (!message) return null;

  return (
    <div className={`toast toast-${tone}`} role="status">
      <span>{message}</span>
      <button aria-label="Dismiss message" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
