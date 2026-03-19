import React, { useMemo, useState } from 'react';

export function FeeCalculator() {
  const [usd, setUsd] = useState(200);
  const [platformFeePct, setPlatformFeePct] = useState(10);
  const [conversionRate, setConversionRate] = useState(58);

  const calc = useMemo(() => {
    const afterFeeUsd = usd * (1 - platformFeePct / 100);
    const etb = afterFeeUsd * conversionRate;
    return { afterFeeUsd, etb };
  }, [usd, platformFeePct, conversionRate]);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Fee Calculator (USD → ETB)</div>
      <div style={{ marginTop: 10 }} className="flex gap-3" />

      <div className="flex gap-4" style={{ flexWrap: 'wrap', marginTop: 10 }}>
        <label style={{ flex: '1 1 180px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Project value (USD)</div>
          <input className="input" type="number" value={usd} onChange={(e) => setUsd(Number(e.target.value))} />
        </label>
        <label style={{ flex: '1 1 180px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Platform fee (%)</div>
          <input
            className="input"
            type="number"
            value={platformFeePct}
            onChange={(e) => setPlatformFeePct(Number(e.target.value))}
          />
        </label>
        <label style={{ flex: '1 1 180px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ETB per USD</div>
          <input
            className="input"
            type="number"
            value={conversionRate}
            onChange={(e) => setConversionRate(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="divider" />

      <div style={{ color: 'var(--text-secondary)' }}>
        Take-home (USD): <strong style={{ color: 'var(--text-primary)' }}>${calc.afterFeeUsd.toFixed(2)}</strong>
        <br />
        Estimated ETB: <strong className="gradient-text">{calc.etb.toFixed(2)} ETB</strong>
      </div>
    </div>
  );
}

