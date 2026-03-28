import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/client';
import { paths } from '../routes/paths';

export function ResetPasswordPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { data } = await authApi.resetPassword(email, code, newPassword);
      setMessage(data.message);
      setTimeout(() => nav(paths.login), 2000);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to reset password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22, maxWidth: 520, margin: '0 auto' }}>
        <h1 className="display-sm">Reset Password</h1>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          Enter the 6-digit code sent to your email and your new password.
        </p>

        <div style={{ marginTop: 14 }} className="flex flex-col gap-3">
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="6-digit Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <input
            className="input"
            placeholder="New Password (min 8 chars)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {error ? <div style={{ color: 'var(--red)' }}>{error}</div> : null}
          {message ? <div style={{ color: 'var(--green)' }}>{message}</div> : null}
          <button className="btn btn-primary" onClick={submit} disabled={busy || !email || !code || newPassword.length < 8}>
            {busy ? 'Resetting…' : 'Reset Password'}
          </button>
        </div>
      </section>
    </div>
  );
}
