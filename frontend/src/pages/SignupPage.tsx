import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { paths } from '../routes/paths';

export function SignupPage() {
  const nav = useNavigate();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signup(email, password);
      nav(paths.settings);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || 'Failed to sign up.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22, maxWidth: 520, margin: '0 auto' }}>
        <h1 className="display-md">Create account</h1>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          Sign up to save your progress and remove the guest limit.
        </p>

        <div style={{ marginTop: 14 }} className="flex flex-col gap-3">
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className="input"
            placeholder="Password (min 8 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <div style={{ color: 'var(--red)' }}>{error}</div> : null}
          <button className="btn btn-primary" onClick={submit} disabled={busy || !email || password.length < 8}>
            {busy ? 'Creating…' : 'Sign up'}
          </button>
        </div>
      </section>
    </div>
  );
}

