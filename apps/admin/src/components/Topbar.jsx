import { useNavigate } from 'react-router-dom';

import { signOutAdmin } from '../services/adminAuthService.js';

export default function Topbar({ profile }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOutAdmin();
    navigate('/login');
  }

  return (
    <header className="topbar">
      <div>
        <strong>{profile?.email ?? 'Admin'}</strong>
      </div>
      <button className="button button-secondary" onClick={handleLogout}>
        Sign out
      </button>
    </header>
  );
}
