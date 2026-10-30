import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from '../components/AdminLayout.jsx';
import ArchivedEventsPage from '../pages/ArchivedEventsPage.jsx';
import ArchivedPage from '../pages/ArchivedPage.jsx';
import ContactPage from '../pages/ContactPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import EventsPage from '../pages/EventsPage.jsx';
import FAQsPage from '../pages/FAQsPage.jsx';
import FloorMapsPage from '../pages/FloorMapsPage.jsx';
import HomeFeaturedPage from '../pages/HomeFeaturedPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import MapPinsPage from '../pages/MapPinsPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import ResourcesPage from '../pages/ResourcesPage.jsx';
import SpacesPage from '../pages/SpacesPage.jsx';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="home-featured" element={<HomeFeaturedPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="spaces" element={<SpacesPage />} />
          <Route path="map-pins" element={<MapPinsPage />} />
          <Route path="floor-maps" element={<FloorMapsPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events-archived" element={<ArchivedEventsPage />} />
          <Route path="faqs" element={<FAQsPage />} />
          <Route path="archived" element={<ArchivedPage />} />
          <Route path="site-settings" element={<Navigate to="/contact" replace />} />
          <Route path="projects" element={<Navigate to="/archived" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
