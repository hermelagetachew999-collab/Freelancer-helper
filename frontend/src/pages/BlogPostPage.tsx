import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { guidesApi } from '../api/client';
import type { GuideDetail } from '../api/client';
import { useSessionId } from '../hooks/useSession';

export function BlogPostPage() {
  const { slug } = useParams();
  const sessionId = useSessionId();
  const [post, setPost] = useState<GuideDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const s = slug || '';

  const load = async () => {
    const { data } = await guidesApi.get('blog', s);
    setPost(data);
  };

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        setPost(null);
        await load();
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: string } } };
        setError(err?.response?.data?.error || 'Failed to load post');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const votes = useMemo(() => {
    const up = post?.votes?.helpful ?? 0;
    const down = post?.votes?.not_helpful ?? 0;
    return { up, down };
  }, [post]);

  const vote = async (helpful: boolean) => {
    await guidesApi.vote('blog', s, sessionId, helpful);
    await load();
  };

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22 }}>
        {error ? <div style={{ color: 'var(--red)' }}>{error}</div> : null}
        {post ? (
          <>
            <h1 className="display-md">{post.title}</h1>
            <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Last verified: {post.last_verified || '—'}
            </div>
            <div className="divider" />
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content_md}</ReactMarkdown>
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

