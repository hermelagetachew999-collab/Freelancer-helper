import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { paths } from '../routes/paths';

import './AppShell.css';

export function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggle = () => setIsMenuOpen(!isMenuOpen);
  const close = () => setIsMenuOpen(false);

  return (
    <div className="app-shell">
      <header className="app-header glass">
        <div className="container app-header-inner">
          <div className="app-brand">
            <NavLink to={paths.home} className="app-logo gradient-text" onClick={close}>
              FreelanceClarity
            </NavLink>
            <span className="app-tagline">Ethiopian Freelance Research</span>
          </div>

          <button 
            className={`burger-btn ${isMenuOpen ? 'open' : ''}`} 
            onClick={toggle}
            aria-label="Toggle menu"
          >
            <span className="burger-bar" />
            <span className="burger-bar" />
            <span className="burger-bar" />
          </button>

          <div className={`nav-menu-container ${isMenuOpen ? 'active' : ''}`}>
            <nav className="app-nav" aria-label="Primary">
              <NavLink to={paths.coach} className="app-nav-link" onClick={close}>
                Coach
              </NavLink>
              <NavLink to={paths.paymentNavigator} className="app-nav-link" onClick={close}>
                Payment
              </NavLink>
              <NavLink to={paths.platforms} className="app-nav-link" onClick={close}>
                Platforms
              </NavLink>
              <NavLink to={paths.scamRadar} className="app-nav-link" onClick={close}>
                Scam Radar
              </NavLink>
              <NavLink to={paths.platformPicker} className="app-nav-link" onClick={close}>
                Picker
              </NavLink>
              <NavLink to={paths.blog} className="app-nav-link" onClick={close}>
                Blog
              </NavLink>
            </nav>

            <div className="app-header-actions">
              <NavLink to={paths.settings} className="btn btn-ghost btn-sm" onClick={close}>
                Settings
              </NavLink>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

