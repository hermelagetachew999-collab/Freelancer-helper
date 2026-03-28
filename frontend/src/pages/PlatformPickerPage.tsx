import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Skill = 'design' | 'writing' | 'dev' | 'video' | 'data' | 'other';
type WorkStyle = 'longTerm' | 'quickGigs';
type Availability = 'low' | 'medium' | 'high';
type Answers = {
  skill: Skill | null;
  workStyle: WorkStyle | null;
  incomeGoal: 'side' | 'full' | null;
  availability: Availability | null;
};

type Platform = 'Upwork' | 'Fiverr' | 'PeoplePerHour' | 'Freelancer.com';

const paymentCompatibility: Record<Platform, { p2p: boolean }> = {
  Upwork: { p2p: true },
  Fiverr: { p2p: true },
  PeoplePerHour: { p2p: false },
  'Freelancer.com': { p2p: false },
};

function scorePlatform(p: Platform, a: Answers) {
  let score = 50;

  if (a.workStyle === 'quickGigs') score += p === 'Fiverr' ? 25 : p === 'Upwork' ? -5 : 0;
  if (a.workStyle === 'longTerm') score += p === 'Upwork' ? 25 : p === 'Fiverr' ? -5 : 0;

  if (a.skill === 'dev') score += p === 'Upwork' ? 10 : 0;
  if (a.skill === 'design') score += p === 'Fiverr' ? 10 : 0;
  if (a.skill === 'writing') score += p === 'Upwork' ? 6 : 0;

  if (a.availability === 'low') score += p === 'Fiverr' ? 5 : 0;
  if (a.availability === 'high') score += p === 'Upwork' ? 5 : 0;

  if (a.incomeGoal === 'full') score += p === 'Upwork' ? 5 : 0;
  if (a.incomeGoal === 'side') score += p === 'Fiverr' ? 5 : 0;

  return Math.max(0, Math.min(100, score));
}

export function PlatformPickerPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answers>({
    skill: null,
    workStyle: null,
    incomeGoal: null,
    availability: null,
  });

  const complete = Object.values(answers).every(Boolean);

  const results = useMemo(() => {
    if (!complete) return [];
    const platforms: Platform[] = ['Upwork', 'Fiverr', 'PeoplePerHour', 'Freelancer.com'];

    const filtered = platforms.filter((p) => paymentCompatibility[p].p2p);

    return filtered
      .map((p) => ({ platform: p, score: scorePlatform(p, answers) }))
      .sort((a, b) => b.score - a.score);
  }, [answers, complete]);

  const share = async () => {
    const url = new URL(window.location.href);
    Object.entries(answers).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    await navigator.clipboard.writeText(url.toString());
    alert('Share link copied.');
  };

  const reset = () => {
    setAnswers({ skill: null, workStyle: null, incomeGoal: null, availability: null });
  };

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
        <h1 className="display-md">Platform Picker</h1>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          Answer 4 quick questions. We’ll recommend platforms compatible with P2P settlement (Bybit/Binance/MEXC).
        </p>

        <div className="divider" />

        <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
          <div className="card" style={{ padding: 16, flex: '1 1 340px' }}>
            <div className="flex flex-col gap-3">
              <label>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>1) Skill</div>
                <select
                  className="input"
                  value={answers.skill ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, skill: (e.target.value || null) as Skill | null }))}
                >
                  <option value="">Select…</option>
                  <option value="design">Design</option>
                  <option value="writing">Writing</option>
                  <option value="dev">Web development</option>
                  <option value="video">Video editing</option>
                  <option value="data">Data entry</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>2) Work style</div>
                <select
                  className="input"
                  value={answers.workStyle ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, workStyle: (e.target.value || null) as WorkStyle | null }))}
                >
                  <option value="">Select…</option>
                  <option value="longTerm">Long-term projects</option>
                  <option value="quickGigs">Quick gigs / packages</option>
                </select>
              </label>

              <label>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>3) Income goal</div>
                <select
                  className="input"
                  value={answers.incomeGoal ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, incomeGoal: (e.target.value || null) as Answers['incomeGoal'] }))}
                >
                  <option value="">Select…</option>
                  <option value="side">Side income</option>
                  <option value="full">Full-time</option>
                </select>
              </label>

              <label>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>4) Availability</div>
                <select
                  className="input"
                  value={answers.availability ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, availability: (e.target.value || null) as Availability | null }))}
                >
                  <option value="">Select…</option>
                  <option value="low">Low (a few hours/week)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (daily)</option>
                </select>
              </label>
            </div>

            <div className="divider" />

            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={reset}>
                Reset
              </button>
              <button className="btn btn-primary btn-sm" onClick={share} disabled={!complete}>
                Copy share link
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 16, flex: '1 1 340px' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Results</div>
            <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
              {complete ? 'Ranked platforms with match %.' : 'Complete all answers to see recommendations.'}
            </p>

            {complete ? (
              <div style={{ marginTop: 12 }} className="flex flex-col gap-3">
                {results.map((r) => (
                  <div key={r.platform} className="card" style={{ padding: 12 }}>
                    <div className="flex justify-between items-center">
                      <strong>{r.platform}</strong>
                      <span className="badge badge-purple">{r.score}% match</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

