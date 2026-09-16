import { processMap } from "@/lib/demo-data";

const headers = ["Step", "Admin", "Checker", "Operator", "App", "Inventory View"];

export function ProcessMap() {
  return (
    <div className="process-map" aria-label="Swimlane process map">
      {headers.map((header) => (
        <div className="lane-cell header" key={header}>
          {header}
        </div>
      ))}
      {processMap.map((row) => (
        <ProcessRow key={row.step} row={row} />
      ))}
    </div>
  );
}

function ProcessRow({ row }: { row: (typeof processMap)[number] }) {
  return (
    <>
      <div className="lane-cell">
        <strong style={{ color: "var(--ink)", fontSize: "0.84rem" }}>{row.step}</strong>
        {row.sender ? (
          <p className="muted small" style={{ marginTop: 4 }}>{row.sender}</p>
        ) : null}
      </div>
      <div className="lane-cell">{row.admin || <span className="muted">—</span>}</div>
      <div className="lane-cell">{row.checker || <span className="muted">—</span>}</div>
      <div className="lane-cell">{row.operator || <span className="muted">—</span>}</div>
      <div className="lane-cell">{row.system || <span className="muted">—</span>}</div>
      <div className="lane-cell">{row.dashboard || <span className="muted">—</span>}</div>
    </>
  );
}
