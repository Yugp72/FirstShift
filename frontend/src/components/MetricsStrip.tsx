import type { Board } from "../lib/api";

export function MetricsStrip({ m, onGaps }: { m: Board["metrics"]; onGaps: () => void }) {
  return (
    <section className="metrics" aria-label="Business metrics">
      <div className="metric">
        <div className="num">{m.on_rail}</div>
        <div className="lbl">Tickets on the rail</div>
        <span className="tag">In demo data</span>
      </div>
      <div className="metric">
        <div className="num">{m.avg_days_to_ready ?? "–"}<small>days</small></div>
        <div className="lbl">Avg time, hire to shift-ready</div>
        <span className="tag">In demo data</span>
      </div>
      <div className="metric">
        <div className="num">{m.completion_rate}<small>%</small></div>
        <div className="lbl">Training steps completed</div>
        <span className="tag">In demo data</span>
      </div>
      <div className="metric">
        <div className="num">{m.approvals_with_evidence}</div>
        <div className="lbl">Approvals with evidence attached</div>
        <span className="tag">In demo data</span>
      </div>
      <div className="metric target">
        <div className="num">½</div>
        <div className="lbl">Manager minutes per opening</div>
        <span className="tag">Pilot target: cut by half</span>
      </div>
      <button type="button" className="gap-btn" onClick={onGaps}>
        <span aria-hidden="true">⚑</span> TEAM KNOWLEDGE GAPS
      </button>
    </section>
  );
}
