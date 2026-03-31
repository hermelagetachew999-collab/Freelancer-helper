import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { paths } from '../routes/paths';
import { authApi, Account } from '../api/client';

import './AppShell.css';

export function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const toggle = () => setIsMenuOpen(!isMenuOpen);
  const close = () => setIsMenuOpen(false);

  const checkAuth = async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.account);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      close();
      navigate(paths.home);
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container app-header-inner">
          <div className="app-brand">
            <NavLink to={paths.home} className="app-logo gradient-text" onClick={close}>
              Freelancer-Helper
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
              {!loading && (
                <>
                  {user ? (
                    <>
                      <NavLink to={paths.settings} className="btn btn-ghost btn-sm" onClick={close}>
                        {user.firstName || 'Settings'}
                      </NavLink>
                      <button onClick={handleLogout} className="btn btn-ghost btn-danger btn-sm">
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <NavLink to={paths.login} className="btn btn-ghost btn-sm" onClick={close}>
                        Login
                      </NavLink>
                      <NavLink to={paths.signup} className="btn btn-primary btn-sm" onClick={close}>
                        Sign Up
                      </NavLink>
                    </>
                  )}
                </>
              )}
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

