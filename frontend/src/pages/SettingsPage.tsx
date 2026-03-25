
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { paths } from '../routes/paths';
import { useSessionId } from '../hooks/useSession';

export function SettingsPage() {
  const sessionId = useSessionId();
  const { account, loading, logout } = useAuth();

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22 }}>
        <h1 className="display-md">Settings</h1>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          Your guest session ID is <code>{sessionId}</code>.
        </p>

        <div className="divider" />

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading…</div>
        ) : account ? (
          <div className="flex flex-col gap-3">
            <div>
              <div style={{ color: 'var(--text-secondary)' }}>Signed in as</div>
              <div style={{ fontWeight: 700 }}>{account.email}</div>
            </div>
            <button className="btn btn-ghost" onClick={logout}>
              Log out
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p style={{ color: 'var(--text-secondary)' }}>
              You’re currently using the app as a guest. Guests can send up to 3 AI messages.
            </p>
            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" to={paths.signup}>
                Create account
              </Link>
              <Link className="btn btn-ghost" to={paths.login}>
                Log in
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

