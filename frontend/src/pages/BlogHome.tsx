import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { guidesApi } from '../api/client';
import type { GuideListItem } from '../api/client';
import { paths } from '../routes/paths';

export function BlogHome() {
  const [items, setItems] = useState<GuideListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await guidesApi.list('blog');
        setItems(data);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: string } } };
        setError(err?.response?.data?.error || 'Failed to load blog');
      }
    })();
  }, []);

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22 }}>
        <h1 className="display-md">Blog</h1>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          Ethiopia-focused guides to help you get paid, avoid scams, and win your first clients.
        </p>
        {error ? <div style={{ marginTop: 12, color: 'var(--red)' }}>{error}</div> : null}
        <div style={{ marginTop: 16 }} className="flex flex-col gap-3">
          {items.map((g) => (
            <Link key={g.id} to={`${paths.blog}/${g.slug}`} className="card" style={{ padding: 14 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>{g.title}</div>
              <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Verified: {g.last_verified || '—'}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

