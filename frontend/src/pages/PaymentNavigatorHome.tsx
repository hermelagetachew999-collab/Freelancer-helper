import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { guidesApi, GuideListItem } from '../api/client';
import { paths } from '../routes/paths';

export function PaymentNavigatorHome() {
  const [items, setItems] = useState<GuideListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await guidesApi.list('payment');
        setItems(data);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: string } } };
        setError(err?.response?.data?.error || 'Failed to load guides');
      }
    })();
  }, []);

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22 }}>
        <h1 className="display-md">Payment Navigator</h1>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          The Ethiopia-specific part nobody explains: getting paid safely, setting up Payoneer, and avoiding ETB conversion traps.
        </p>

        {error ? <div style={{ marginTop: 12, color: 'var(--red)' }}>{error}</div> : null}

        <div className="divider" />

        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <Link className="btn btn-ghost" to={`${paths.paymentNavigator}/birr-calculator`}>
            Open birr calculator
          </Link>
        </div>

        <div style={{ marginTop: 16 }} className="flex flex-col gap-3">
          {items.map((g) => (
            <Link
              key={g.id}
              to={`${paths.paymentNavigator}/${g.slug}`}
              className="card"
              style={{ padding: 14 }}
            >
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

