import { Outlet, useOutletContext } from 'react-router-dom';

import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AdminLayout() {
  const context = useOutletContext();

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <Topbar profile={context?.profile} />
        <main className="content-panel">
          <Outlet context={context} />
        </main>
      </div>
    </div>
  );
}
