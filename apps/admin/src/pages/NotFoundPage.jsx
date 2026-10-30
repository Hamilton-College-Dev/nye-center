import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="access-denied">
      <div className="state state-empty">
        <strong>Page not found</strong>
        <p>This admin page does not exist.</p>
        <Link className="button button-primary" to="/">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
