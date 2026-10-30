import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { isSupabaseConfigured, supabaseConfigMessage } from '../lib/supabaseClient.js';
import { getAdminProfile, getSession } from '../services/adminAuthService.js';

export default function ProtectedRoute() {
  const [state, setState] = useState({
    loading: true,
    session: null,
    profile: null,
    denied: false,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!isSupabaseConfigured) {
        setState({
          loading: false,
          session: null,
          profile: null,
          denied: true,
          error: supabaseConfigMessage,
        });
        return;
      }

      const session = await getSession();
      if (!session) {
        if (mounted)
          setState({ loading: false, session: null, profile: null, denied: false, error: null });
        return;
      }

      const { profile, error } = await getAdminProfile();
      if (mounted) {
        setState({
          loading: false,
          session,
          profile,
          denied: !profile,
          error: error?.message ?? null,
        });
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) return <LoadingState message="Checking admin access..." />;
  if (!state.session && !state.denied) return <Navigate to="/login" replace />;
  if (state.denied) {
    return (
      <main className="access-denied">
        <ErrorState
          title="Access denied"
          message={
            state.error || 'Your account is signed in, but it is not approved as a Nye admin.'
          }
        />
      </main>
    );
  }

  return <Outlet context={{ profile: state.profile }} />;
}
