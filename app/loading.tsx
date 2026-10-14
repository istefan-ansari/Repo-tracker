/**
 * Loading skeleton for the home page search results.
 * Shown while server components are rendering.
 */

export default function Loading() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      {/* Search bar skeleton */}
      <div style={{ maxWidth: 700, margin: "0 auto 40px" }}>
        <div className="skeleton" style={{ height: 46, marginBottom: 12, borderRadius: 10 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 140, height: 32, borderRadius: 6 }} />
        </div>
      </div>

      {/* Grid skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, marginBottom: 8, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 12, width: "70%", borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="skeleton" style={{ width: 60, height: 12, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 50, height: 12, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 55, height: 12, borderRadius: 4 }} />
            </div>
            <div className="skeleton" style={{ height: 1, borderRadius: 1 }} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div className="skeleton" style={{ width: 72, height: 32, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
