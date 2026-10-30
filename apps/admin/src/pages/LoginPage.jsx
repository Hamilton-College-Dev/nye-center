import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BrandLockup from '../components/BrandLockup.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { isSupabaseConfigured, supabaseConfigMessage } from '../lib/supabaseClient.js';
import { getAdminProfile, signInAdmin } from '../services/adminAuthService.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await signInAdmin(email, password);
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { profile } = await getAdminProfile();
    setLoading(false);
    if (!profile) {
      setError('Signed in, but this account is not approved as a Nye admin.');
      return;
    }

    navigate('/');
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-card-head">
          <BrandLockup />
          <h1>Staff Dashboard</h1>
        </div>

        {!isSupabaseConfigured ? (
          <ErrorState title="Supabase not configured" message={supabaseConfigMessage} />
        ) : null}

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
            />
          </label>
          {error ? <div className="inline-error">{error}</div> : null}
          <button
            className="button button-primary"
            type="submit"
            disabled={loading || !isSupabaseConfigured}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        {loading ? <LoadingState message="Verifying admin profile..." /> : null}
      </section>
    </main>
  );
}
