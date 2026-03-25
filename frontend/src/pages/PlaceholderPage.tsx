

export function PlaceholderPage({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="container">
      <section className="card" style={{ padding: 22 }}>
        <h1 className="display-md">{title}</h1>
        {subtitle ? <p style={{ marginTop: 10, color: 'var(--text-secondary)' }}>{subtitle}</p> : null}
      </section>
    </div>
  );
}

