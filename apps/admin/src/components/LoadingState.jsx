export default function LoadingState({ message = 'Loading...' }) {
  return <div className="state state-loading">{message}</div>;
}
