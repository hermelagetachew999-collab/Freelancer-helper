import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { paths } from './routes/paths';
import { LandingPage } from './pages/LandingPage';
import { CoachPage } from './pages/CoachPage';
import { ScamRadarPage } from './pages/ScamRadarPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { SettingsPage } from './pages/SettingsPage';
import { PaymentNavigatorHome } from './pages/PaymentNavigatorHome';
import { PaymentGuidePage } from './pages/PaymentGuidePage';
import { BirrCalculatorPage } from './pages/BirrCalculatorPage';
import { PlatformsHome } from './pages/PlatformsHome';
import { PlatformGuidePage } from './pages/PlatformGuidePage';
import { PlatformPickerPage } from './pages/PlatformPickerPage';
import { BlogHome } from './pages/BlogHome';
import { BlogPostPage } from './pages/BlogPostPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path={paths.home} element={<LandingPage />} />
        <Route path={paths.coach} element={<CoachPage />} />
        <Route path={paths.scamRadar} element={<ScamRadarPage />} />
        <Route path={paths.platforms} element={<PlatformsHome />} />
        <Route path={`${paths.platforms}/:slug`} element={<PlatformGuidePage />} />
        <Route
          path={paths.paymentNavigator}
          element={<PaymentNavigatorHome />}
        />
        <Route path={`${paths.paymentNavigator}/birr-calculator`} element={<BirrCalculatorPage />} />
        <Route path={`${paths.paymentNavigator}/:topic`} element={<PaymentGuidePage />} />
        <Route path={paths.platformPicker} element={<PlatformPickerPage />} />
        <Route path={paths.blog} element={<BlogHome />} />
        <Route path={`${paths.blog}/:slug`} element={<BlogPostPage />} />
        <Route path={paths.admin} element={<AdminPage />} />
        <Route path={paths.settings} element={<SettingsPage />} />
        <Route path={paths.login} element={<LoginPage />} />
        <Route path={paths.signup} element={<SignupPage />} />
        <Route path="*" element={<Navigate to={paths.home} replace />} />
      </Route>
    </Routes>
  );
}

export default App;
