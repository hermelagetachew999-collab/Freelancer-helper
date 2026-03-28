import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { paths } from '../routes/paths';

export function SignupPage() {
  const nav = useNavigate();
  const { signup } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signup(email, password, firstName, lastName);
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

        <div style={{ marginTop: 14 }} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input className="input" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className="input" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div style={{ position: 'relative' }}>
            <input
              className="input"
              style={{ width: '100%', paddingRight: '40px' }}
              placeholder="Password (min 8 chars)"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          {error ? <div style={{ color: 'var(--red)' }}>{error}</div> : null}
          <button className="btn btn-primary" onClick={submit} disabled={busy || !email || password.length < 8 || !firstName || !lastName}>
            {busy ? 'Creating…' : 'Sign up'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: 10, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <button className="btn btn-ghost btn-sm" onClick={() => nav(paths.login)}>
              Log in
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

