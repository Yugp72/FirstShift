import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="mgr">
      <main id="main" className="landing">
        <div className="landing-inner">
          <span className="brand-chop" aria-hidden="true" style={{ width: 64, height: 64, fontSize: 36, borderWidth: 4 }}>可</span>
          <h1 style={{ marginTop: 22 }}>FROM HELLO<br />TO FIRST SHIFT.</h1>
          <p>
            One entry posts the job to every channel. One link trains each new hire in their own language, out loud,
            with kind checks. The manager watches every ticket move down the rail and stamps them shift-ready.
          </p>
          <div className="doors">
            <Link className="door paper torn" to="/manager">
              <span className="tkt-head" style={{ display: "flex" }}><span><b>MANAGER</b> · LAPTOP</span><span>→</span></span>
              <b>THE RAIL</b>
              Pipeline, readiness, confidence flags, one-tap stamp.
            </Link>
            <Link className="door paper torn" to="/t/lin-demo">
              <span className="tkt-head" style={{ display: "flex" }}><span><b>NEW HIRE</b> · PHONE</span><span>→</span></span>
              <b>LIN'S FIRST SHIFT</b>
              <span lang="zh-CN">中文</span> / Español / English lessons, read aloud, kind checks.
            </Link>
          </div>
          <p style={{ fontSize: 12.5, marginTop: 26 }}>Team33 · Stanford 30x30 “We Mean Business” · Sample training content · All people are demo data</p>
        </div>
      </main>
    </div>
  );
}
