import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type ScamReport = {
  id: string;
  content: string;
  pattern_type: string | null;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
};

export function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('fc_admin_token') || '');
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  const saveToken = () => {
    localStorage.setItem('fc_admin_token', token);
  };

  const loadReports = async () => {
    setError(null);
    try {
      const { data } = await axios.get<ScamReport[]>(`${API_BASE}/admin/scam-reports`, {
        headers: { 'x-admin-token': token },
        withCredentials: true,
      });
      setReports(data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || 'Failed to load reports');
    }
  };

  const setStatus = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    await axios.patch(
      `${API_BASE}/admin/scam-reports/${id}`,
      { status },
      { headers: { 'x-admin-token': token }, withCredentials: true }
    );
    await loadReports();
  };

  useEffect(() => {
    if (token) void loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22 }}>
        <h1 className="display-md">Admin</h1>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          Minimal admin panel (Phase 3 will expand this into a full CMS).
        </p>

        <div className="divider" />

        <div className="flex gap-3" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            style={{ maxWidth: 520 }}
            placeholder="ADMIN_TOKEN"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button className="btn btn-ghost btn-sm" onClick={saveToken}>
            Save token
          </button>
          <button className="btn btn-primary btn-sm" onClick={loadReports} disabled={!token}>
            Load scam reports
          </button>
        </div>

        {error ? <div style={{ marginTop: 12, color: 'var(--red)' }}>{error}</div> : null}

        <div style={{ marginTop: 16 }} className="flex flex-col gap-3">
          {reports.map((r) => (
            <div key={r.id} className="card" style={{ padding: 14 }}>
              <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <strong>{r.pattern_type || 'unspecified'}</strong>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>· {new Date(r.created_at).toLocaleString()}</span>
                </div>
                <span className="badge badge-purple">{r.status}</span>
              </div>
              <p style={{ marginTop: 10, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{r.content}</p>
              <div className="divider" />
              <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setStatus(r.id, 'approved')}>
                  Approve
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setStatus(r.id, 'rejected')}>
                  Reject
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setStatus(r.id, 'pending')}>
                  Reset to pending
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

