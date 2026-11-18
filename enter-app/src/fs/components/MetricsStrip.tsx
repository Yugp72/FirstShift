import type { Board } from "../lib/api";

export function MetricsStrip({ m }: { m: Board["metrics"] }) {
  return (
    <section className="stats" aria-label="Business metrics">
      <div className="stat"><div className="num">{m.on_rail}</div><div className="lbl">People in the pipeline</div><div className="tag">In demo data</div></div>
      <div className="stat"><div className="num">{m.avg_days_to_ready ?? "–"}<small>days</small></div><div className="lbl">Hire to shift-ready</div><div className="tag">In demo data</div></div>
      <div className="stat"><div className="num">{m.completion_rate}<small>%</small></div><div className="lbl">Training steps completed</div><div className="tag">In demo data</div></div>
      <div className="stat"><div className="num">{m.approvals_with_evidence}</div><div className="lbl">Approvals with evidence</div><div className="tag">In demo data</div></div>
      <div className="stat"><div className="num">50<small>%</small></div><div className="lbl">Less manager time per opening</div><div className="tag">Pilot target, not a result</div></div>
    </section>
  );
}
