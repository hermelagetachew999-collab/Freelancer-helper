import { useEffect, useState } from 'react';
import axios from 'axios';

const envUrl = import.meta.env.VITE_API_URL;
const API_BASE = envUrl 
  ? (envUrl.endsWith('/api') ? envUrl : envUrl.replace(/\/$/, '') + '/api')
  : (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

type ScamReport = {
  id: string;
  content: string;
  pattern_type: string | null;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
};

type ContentItem = {
  id: string;
  guide_type: 'payment' | 'platform' | 'blog';
  slug: string;
  title: string;
  content_md: string;
  last_verified: string | null;
  updated_at: string;
};

export function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('fc_admin_token') || '');
  const [view, setView] = useState<'reports' | 'content'>('reports');
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [editing, setEditing] = useState<Partial<ContentItem> | null>(null);
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
      setError('Failed to load reports');
    }
  };

  const loadContent = async () => {
    setError(null);
    try {
      const { data } = await axios.get<ContentItem[]>(`${API_BASE}/admin/content`, {
        headers: { 'x-admin-token': token },
        withCredentials: true,
      });
      setContent(data);
    } catch (e: unknown) {
      setError('Failed to load content');
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

  const saveContent = async () => {
    if (!editing) return;
    try {
      if (editing.id) {
        await axios.patch(`${API_BASE}/admin/content/${editing.id}`, editing, {
          headers: { 'x-admin-token': token },
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_BASE}/admin/content`, editing, {
          headers: { 'x-admin-token': token },
          withCredentials: true,
        });
      }
      setEditing(null);
      await loadContent();
    } catch (e: unknown) {
      setError('Failed to save content');
    }
  };

  const deleteContent = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    await axios.delete(`${API_BASE}/admin/content/${id}`, {
      headers: { 'x-admin-token': token },
      withCredentials: true,
    });
    await loadContent();
  };

  useEffect(() => {
    if (token) {
      void loadReports();
      void loadContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
            style={{ maxWidth: 300 }}
            placeholder="ADMIN_TOKEN"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button className="btn btn-ghost btn-sm" onClick={saveToken}>
            Save
          </button>
          <div className="divider-v" />
          <button
            className={`btn btn-sm ${view === 'reports' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('reports')}
          >
            Scam Reports
          </button>
          <button
            className={`btn btn-sm ${view === 'content' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('content')}
          >
            Content CMS
          </button>
        </div>

        {error ? <div style={{ marginTop: 12, color: 'var(--red)' }}>{error}</div> : null}

        {view === 'reports' ? (
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 16 }} className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 style={{ fontSize: '1.1rem' }}>Manage Guides & Blog</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setEditing({ guide_type: 'platform', title: '', slug: '', content_md: '' })}
              >
                + New Content
              </button>
            </div>

            {editing && (
              <div className="card" style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <h3>{editing.id ? 'Edit' : 'Create'} Content</h3>
                <div className="flex flex-col gap-3 mt-3">
                  <div className="flex gap-3">
                    <select
                      className="input"
                      value={editing.guide_type}
                      onChange={(e) => setEditing({ ...editing, guide_type: e.target.value as any })}
                    >
                      <option value="platform">Platform Guide</option>
                      <option value="payment">Payment Guide</option>
                      <option value="blog">Blog Post</option>
                    </select>
                    <input
                      className="input"
                      placeholder="Slug (e.g. upwork-guide)"
                      value={editing.slug}
                      onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    />
                  </div>
                  <input
                    className="input"
                    placeholder="Title"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  />
                  <textarea
                    className="input"
                    style={{ minHeight: 200 }}
                    placeholder="Content (Markdown supported)"
                    value={editing.content_md}
                    onChange={(e) => setEditing({ ...editing, content_md: e.target.value })}
                  />
                  <div className="flex gap-3">
                    <button className="btn btn-primary" onClick={saveContent}>
                      Save Changes
                    </button>
                    <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {content.map((c) => (
              <div key={c.id} className="card" style={{ padding: 14 }}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="badge badge-purple" style={{ marginRight: 8 }}>
                      {c.guide_type}
                    </span>
                    <strong>{c.title}</strong>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>
                      /{c.guide_type}/{c.slug} · Updated: {new Date(c.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>
                      Edit
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteContent(c.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

