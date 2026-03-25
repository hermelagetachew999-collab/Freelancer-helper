import { Link } from 'react-router-dom';
import { paths } from '../routes/paths';

export function LandingPage() {
  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 28 }}>
        <span className="badge badge-purple">Phase 1 MVP</span>
        <h1 className="display-lg" style={{ marginTop: 10 }}>
          Navigating <span className="gradient-text">Global Payment Corridors</span> for Ethiopian Freelancers.
        </h1>
        <p style={{ marginTop: 10, color: 'var(--text-secondary)', maxWidth: 820 }}>
          A technical resource for proposal optimization, risk analysis, and international payment integration 
          strategies for the emerging digital economy in Ethiopia.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
          <Link to={paths.coach} className="btn btn-primary">
            Open AI Coach
          </Link>
          <Link to={paths.paymentNavigator} className="btn btn-ghost">
            Payment Navigator
          </Link>
          <Link to={paths.scamRadar} className="btn btn-ghost">
            Scam Radar
          </Link>
        </div>
      </section>

      <div className="divider" />

      <section className="flex gap-6" style={{ flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: 18, flex: '1 1 280px' }}>
          <h2 className="display-md">Payment Navigator</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Guidance on cross-border financial rails, regulatory-compliant wallet setup, and forex market analysis.
          </p>
        </div>
        <div className="card" style={{ padding: 18, flex: '1 1 280px' }}>
          <h2 className="display-md">ProposalWin AI Coach</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Paste a job post or draft proposal. Get a score, fixes, and ready-to-send templates.
          </p>
        </div>
        <div className="card" style={{ padding: 18, flex: '1 1 280px' }}>
          <h2 className="display-md">Scam Radar</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Detect red flags common in Ethiopia/Africa-targeted scams and get the next best step.
          </p>
        </div>
      </section>
    </div>
  );
}

