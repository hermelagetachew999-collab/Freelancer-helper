import React, { useMemo, useState } from 'react';
import { scamApi, ScamResult } from '../api/client';

function riskBadge(level: ScamResult['riskLevel']) {
  if (level === 'high') return <span className="badge badge-red">High risk</span>;
  if (level === 'medium') return <span className="badge badge-yellow">Medium risk</span>;
  return <span className="badge badge-green">Low risk</span>;
}

export function ScamRadarPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [patternType, setPatternType] = useState('payment');

  const canAnalyze = useMemo(() => text.trim().length >= 20, [text]);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setReportStatus(null);
    try {
      const { data } = await scamApi.analyze(text);
      setResult(data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || 'Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async () => {
    setReportStatus(null);
    try {
      const { data } = await scamApi.report(text, patternType);
      setReportStatus(data?.message || 'Report submitted. Thank you!');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setReportStatus(err?.response?.data?.error || 'Failed to submit report.');
    }
  };

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22 }}>
        <div className="flex justify-between items-center gap-3" style={{ flexWrap: 'wrap' }}>
          <div>
            <h1 className="display-md">Scam Radar</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
              Paste a job post or client message. We’ll flag risky patterns (including Ethiopia-targeted scams).
            </p>
          </div>
          <button className="btn btn-primary" onClick={analyze} disabled={!canAnalyze || loading}>
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <textarea
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the job post or message here (min 20 characters)…"
          />
          <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Tip: Include the payment method, timeline, and any off-platform requests if present.
          </div>
        </div>

        {error ? (
          <div className="divider" />
        ) : null}
        {error ? (
          <div className="card" style={{ padding: 14, borderColor: 'rgba(255,71,87,0.35)' }}>
            <strong style={{ color: 'var(--red)' }}>Error</strong>
            <div style={{ marginTop: 6, color: 'var(--text-secondary)' }}>{error}</div>
          </div>
        ) : null}

        {result ? (
          <>
            <div className="divider" />
            <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap' }}>
              {riskBadge(result.riskLevel)}
              <div style={{ color: 'var(--text-secondary)' }}>{result.explanation}</div>
            </div>
            <div style={{ marginTop: 14 }} className="card">
              <div style={{ padding: 16 }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1rem' }}>Red flags</h2>
                <ul style={{ marginTop: 10, marginLeft: 18, color: 'var(--text-secondary)' }}>
                  {result.redFlags.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <div className="divider" />
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1rem' }}>What to do next</h2>
                <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{result.recommendation}</p>

                <div className="divider" />
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1rem' }}>Report a new scam pattern</h2>
                <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
                  If this looks like a scam we should add to the database, report it. Our team will review it.
                </p>
                <div className="flex gap-3 items-center" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                  <select className="input" style={{ maxWidth: 240 }} value={patternType} onChange={(e) => setPatternType(e.target.value)}>
                    <option value="payment">Payment</option>
                    <option value="off_platform">Off-platform contact</option>
                    <option value="credentials">Credentials</option>
                    <option value="advance_work">Work-first</option>
                    <option value="other">Other</option>
                  </select>
                  <button className="btn btn-ghost btn-sm" onClick={submitReport}>
                    Submit report
                  </button>
                </div>
                {reportStatus ? (
                  <div style={{ marginTop: 10, color: reportStatus.toLowerCase().includes('failed') ? 'var(--red)' : 'var(--green)' }}>
                    {reportStatus}
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

