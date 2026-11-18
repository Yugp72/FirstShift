import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="mgr">
      <main id="main" className="landing">
        <div className="landing-inner">
          <span className="brand-mark" style={{ width: 44, height: 44, borderRadius: 12 }} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
          <h1>From first hello to first shift, in every language and every ability.</h1>
          <p>
            Post a job once and FirstShift writes it for every channel. Each new hire gets one link with training in their
            language and the format that works for them: captioned video, picture steps, read-aloud or text. The manager
            sees a readiness passport and approves with one click.
          </p>
          <div className="doors">
            <Link className="door" to="/manager">
              <span className="badge">Manager · laptop</span>
              <b>Hiring pipeline →</b>
              <span className="muted">Job posts, training progress, readiness passports, approvals.</span>
            </Link>
            <Link className="door" to="/t/lin-demo">
              <span className="badge">New hire · phone</span>
              <b>Lin's training →</b>
              <span className="muted"><span lang="zh-CN">中文</span> / Español / English, with video, pictures and read-aloud.</span>
            </Link>
            <Link className="door" to="/t/hana-demo">
              <span className="badge">New hire · phone</span>
              <b>Start fresh as Hana →</b>
              <span className="muted">See the full flow, including "How do you learn best?"</span>
            </Link>
            <Link className="door" to="/manager/new">
              <span className="badge">Manager · laptop</span>
              <b>Post a job →</b>
              <span className="muted">One entry, seven channel-ready posts.</span>
            </Link>
          </div>
          <p style={{ fontSize: 13, marginTop: 26 }}>Team33 · Built on Converge.AI Enter and Framia · Sample training content · All people are demo data</p>
        </div>
      </main>
    </div>
  );
}
