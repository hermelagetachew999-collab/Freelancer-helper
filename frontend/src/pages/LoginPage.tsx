import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { paths } from '../routes/paths';

export function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      nav(paths.settings);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || 'Failed to log in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22, maxWidth: 520, margin: '0 auto' }}>
        <h1 className="display-md">Log in</h1>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          Log in to continue past the guest limit and keep your chat history.
        </p>

        <div style={{ marginTop: 14 }} className="flex flex-col gap-3">
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <div style={{ color: 'var(--red)' }}>{error}</div> : null}
          <button className="btn btn-primary" onClick={submit} disabled={busy || !email || !password}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => nav(paths.forgotPassword)}>
              Forgot Password?
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

