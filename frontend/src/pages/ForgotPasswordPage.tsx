import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { paths } from '../routes/paths';

export function ForgotPasswordPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { data } = await authApi.forgotPassword(email);
      setMessage(data.message);
      setTimeout(() => nav(`${paths.resetPassword}?email=${encodeURIComponent(email)}`), 2000);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to request reset.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22, maxWidth: 520, margin: '0 auto' }}>
        <h1 className="display-sm">Forgot Password</h1>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          Enter your email and we'll send you a 6-digit verification code.
        </p>

        <div style={{ marginTop: 14 }} className="flex flex-col gap-3">
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error ? <div style={{ color: 'var(--red)' }}>{error}</div> : null}
          {message ? <div style={{ color: 'var(--green)' }}>{message}</div> : null}
          <button className="btn btn-primary" onClick={submit} disabled={busy || !email}>
            {busy ? 'Sending…' : 'Send Code'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => nav(paths.login)}>
            Back to Login
          </button>
        </div>
      </section>
    </div>
  );
}
