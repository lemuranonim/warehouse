export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Memuat data warehouse" className="page route-loading">
      <div className="route-loading-header">
        <span className="loading-skeleton loading-kicker" />
        <span className="loading-skeleton loading-title" />
        <span className="loading-skeleton loading-copy" />
      </div>
      <div className="route-loading-metrics">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="route-loading-card" key={index}>
            <span className="loading-skeleton loading-icon" />
            <span className="loading-skeleton loading-value" />
            <span className="loading-skeleton loading-label" />
          </div>
        ))}
      </div>
      <div className="route-loading-panel">
        <div className="route-loading-panel-head">
          <span className="loading-skeleton loading-panel-title" />
          <span className="loading-skeleton loading-panel-action" />
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <span className="loading-skeleton loading-row" key={index} />
        ))}
      </div>
      <span className="sr-only">Mengambil data terbaru dari database.</span>
    </div>
  );
}
