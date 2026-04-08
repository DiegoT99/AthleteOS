import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { CategoryPage } from './pages/CategoryPage';
import { TechniquesPage } from './pages/TechniquesPage';
import { NotesPage } from './pages/NotesPage';
import { GoalsPage } from './pages/GoalsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { BillingPage } from './pages/BillingPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/techniques" element={<TechniquesPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
