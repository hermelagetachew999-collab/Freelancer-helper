import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { guidesApi } from '../api/client';
import type { GuideDetail } from '../api/client';
import { useSessionId } from '../hooks/useSession';

function formatVotes(v: GuideDetail['votes']) {
  const up = v.helpful ?? 0;
  const down = v.not_helpful ?? 0;
  return { up, down };
}

export function PaymentGuidePage() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const sessionId = useSessionId();

  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const slug = topic || '';

  const load = async () => {
    const { data } = await guidesApi.get('payment', slug);
    setGuide(data);
  };

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        setGuide(null);
        await load();
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: string } } };
        setError(err?.response?.data?.error || 'Failed to load guide');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const votes = useMemo(() => (guide ? formatVotes(guide.votes) : { up: 0, down: 0 }), [guide]);

  const vote = async (helpful: boolean) => {
    await guidesApi.vote('payment', slug, sessionId, helpful);
    await load();
  };

  if (!slug) {
    return (
      <div className="container">
        <section className="card" style={{ padding: 22 }}>
          Missing guide topic.
        </section>
      </div>
    );
  }

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22 }}>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => navigate(-1)} 
          style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          ← Back
        </button>
        {error ? <div style={{ color: 'var(--red)' }}>{error}</div> : null}
        {guide ? (
          <>
            <h1 className="display-md">{guide.title}</h1>
            <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Last verified: {guide.last_verified || '—'}
            </div>

            <div className="divider" />

            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide.content_md}</ReactMarkdown>
            </div>

            <div className="divider" />

            <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Was this helpful?</span>
              <button className="btn btn-ghost btn-sm" onClick={() => vote(true)}>
                Yes ({votes.up})
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => vote(false)}>
                No ({votes.down})
              </button>
            </div>
          </>
        ) : error ? null : (
          <div style={{ color: 'var(--text-secondary)' }}>Loading…</div>
        )}
      </section>
    </div>
  );
}

