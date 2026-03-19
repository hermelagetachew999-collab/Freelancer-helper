import React, { useMemo, useState } from 'react';

export function BirrCalculatorPage() {
  const [usd, setUsd] = useState(100);
  const [platformFeePct, setPlatformFeePct] = useState(10);
  const [payoutFeePct, setPayoutFeePct] = useState(2);
  const [rateEtbPerUsd, setRateEtbPerUsd] = useState(58);
  const [conversionLossPct, setConversionLossPct] = useState(7);

  const calc = useMemo(() => {
    const afterPlatform = usd * (1 - platformFeePct / 100);
    const afterPayout = afterPlatform * (1 - payoutFeePct / 100);
    const grossEtb = afterPayout * rateEtbPerUsd;
    const netEtb = grossEtb * (1 - conversionLossPct / 100);
    return {
      afterPlatform,
      afterPayout,
      grossEtb,
      netEtb,
    };
  }, [usd, platformFeePct, payoutFeePct, rateEtbPerUsd, conversionLossPct]);

  const money = (n: number) => n.toFixed(2);

  return (
    <div className="container">
      <section className="card card-glow" style={{ padding: 22 }}>
        <h1 className="display-md">Birr Conversion Calculator</h1>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          Estimate take-home after platform fee, payout fee, and ETB conversion spread. Treat this as an estimate.
        </p>

        <div className="divider" />

        <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
          <div className="card" style={{ padding: 16, flex: '1 1 320px' }}>
            <div className="flex flex-col gap-3">
              <label>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>USD earned</div>
                <input className="input" type="number" value={usd} onChange={(e) => setUsd(Number(e.target.value))} />
              </label>
              <label>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Platform fee (%)</div>
                <input
                  className="input"
                  type="number"
                  value={platformFeePct}
                  onChange={(e) => setPlatformFeePct(Number(e.target.value))}
                />
              </label>
              <label>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Payout fee (%)</div>
                <input
                  className="input"
                  type="number"
                  value={payoutFeePct}
                  onChange={(e) => setPayoutFeePct(Number(e.target.value))}
                />
              </label>
              <label>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ETB per USD</div>
                <input
                  className="input"
                  type="number"
                  value={rateEtbPerUsd}
                  onChange={(e) => setRateEtbPerUsd(Number(e.target.value))}
                />
              </label>
              <label>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Conversion loss (%)</div>
                <input
                  className="input"
                  type="number"
                  value={conversionLossPct}
                  onChange={(e) => setConversionLossPct(Number(e.target.value))}
                />
              </label>
            </div>
          </div>

          <div className="card" style={{ padding: 16, flex: '1 1 320px' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Results</div>
            <div style={{ marginTop: 10, color: 'var(--text-secondary)' }}>
              <div>After platform fee: <strong style={{ color: 'var(--text-primary)' }}>${money(calc.afterPlatform)}</strong></div>
              <div>After payout fee: <strong style={{ color: 'var(--text-primary)' }}>${money(calc.afterPayout)}</strong></div>
              <div style={{ marginTop: 10 }}>Gross ETB: <strong style={{ color: 'var(--text-primary)' }}>{money(calc.grossEtb)} ETB</strong></div>
              <div>Estimated net ETB: <strong className="gradient-text">{money(calc.netEtb)} ETB</strong></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

