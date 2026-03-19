import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { guidesApi, GuideListItem } from '../api/client';
import { paths } from '../routes/paths';

export function PlatformsHome() {
  const [items, setItems] = useState<GuideListItem[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await guidesApi.list('platform');
        setItems(data);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: string } } };
        setError(err?.response?.data?.error || 'Failed to load platform guides');
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((g) => g.title.toLowerCase().includes(s) || g.slug.toLowerCase().includes(s));
  }, [items, q]);

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22 }}>
        <h1 className="display-md">Platform Library</h1>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          Simple guides that explain rules, fees, and what matters — with an Ethiopia section on every platform page.
        </p>

        <div style={{ marginTop: 14 }}>
          <input
            className="input"
            placeholder="Search platforms…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {error ? <div style={{ marginTop: 12, color: 'var(--red)' }}>{error}</div> : null}

        <div style={{ marginTop: 16 }} className="flex flex-col gap-3">
          {filtered.map((g) => (
            <Link key={g.id} to={`${paths.platforms}/${g.slug}`} className="card" style={{ padding: 14 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>{g.title}</div>
              <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Last verified: {g.last_verified || '—'}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

