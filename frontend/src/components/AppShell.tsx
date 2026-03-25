
import { NavLink, Outlet } from 'react-router-dom';
import { paths } from '../routes/paths';

import './AppShell.css';

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header glass">
        <div className="container app-header-inner">
          <div className="app-brand">
            <NavLink to={paths.home} className="app-logo gradient-text">
              FreelanceClarity
            </NavLink>
            <span className="app-tagline">Built for Ethiopian freelancers</span>
          </div>

          <nav className="app-nav" aria-label="Primary">
            <NavLink to={paths.coach} className="app-nav-link">
              Coach
            </NavLink>
            <NavLink to={paths.paymentNavigator} className="app-nav-link">
              Payment
            </NavLink>
            <NavLink to={paths.platforms} className="app-nav-link">
              Platforms
            </NavLink>
            <NavLink to={paths.scamRadar} className="app-nav-link">
              Scam Radar
            </NavLink>
            <NavLink to={paths.platformPicker} className="app-nav-link">
              Picker
            </NavLink>
            <NavLink to={paths.blog} className="app-nav-link">
              Blog
            </NavLink>
          </nav>

          <div className="app-header-actions">
            <NavLink to={paths.settings} className="btn btn-ghost btn-sm">
              Settings
            </NavLink>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

