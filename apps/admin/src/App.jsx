// Admin dashboard root: mounts the router. Auth gating and the page routes live
// in routes/ (ProtectedRoute + AdminRoutes). See docs/02-architecture.md §6.
import { BrowserRouter } from 'react-router-dom';

import AdminRoutes from './routes/AdminRoutes.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AdminRoutes />
    </BrowserRouter>
  );
}
