import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import HomeFeedPage from '../pages/HomeFeedPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import PostDetailPage from '../pages/PostDetailPage.jsx';
import AdminPanelPage from '../pages/AdminPanelPage.jsx';
import WordOfDayPage from '../pages/WordOfDayPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeFeedPage />} />
      <Route path="/hyrje" element={<LoginPage />} />
      <Route path="/regjistrohu" element={<RegisterPage />} />
      <Route path="/postimi/:id" element={<PostDetailPage />} />
      <Route path="/fjala-e-dites" element={<WordOfDayPage />} />
      <Route path="/:username" element={<ProfilePage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminPanelPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
