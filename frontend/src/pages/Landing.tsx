import { Link } from "react-router-dom";
import { GlobalNav } from "../components/GlobalNav";

export default function Landing() {
  return (
    <>
      <GlobalNav />
      <main id="main">
        <section className="section center">
          <div className="section-inner">
            <p className="eyebrow">Imperial Treasure Palo Alto</p>
            <h1 className="headline">From first hello<br />to first shift.</h1>
            <p className="subhead">Find a job, learn it in your language and your way, and get approved for your first shift.</p>
            <div className="row" style={{ justifyContent: "center", marginTop: 26 }}>
              <Link className="btn btn-primary btn-lg" to="/jobs">Browse jobs</Link>
              <Link className="btn btn-lg" to="/learn">Start training</Link>
            </div>
          </div>
        </section>

        <section className="section alt">
          <div className="section-inner">
            <div className="tiles">
              <Link className="tile" to="/jobs">
                <span className="ico" aria-hidden="true">💼</span>
                <h3>Jobs</h3>
                <p>Open roles in the dining room and the kitchen. Apply in a minute. No résumé needed.</p>
                <span className="more">See open jobs ›</span>
              </Link>
              <Link className="tile" to="/learn">
                <span className="ico" aria-hidden="true">🎓</span>
                <h3>Training</h3>
                <p>Short lessons with video, pictures and read-aloud in English, 中文 and Español, each ending in a quick quiz.</p>
                <span className="more">Start learning ›</span>
              </Link>
              <Link className="tile" to="/manager">
                <span className="ico" aria-hidden="true">✅</span>
                <h3>For managers</h3>
                <p>Post once to every channel, follow each hire's progress, and approve them with evidence.</p>
                <span className="more">Open the pipeline ›</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="section center">
          <div className="section-inner">
            <h2 className="headline" style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>Every language. Every ability.</h2>
            <p className="subhead">Captioned video for people who are Deaf or hard of hearing. Picture steps for visual learners. Read-aloud for low vision. No time limits, ever.</p>
          </div>
        </section>
      </main>
      <p className="footer-note">Team33 · Built on Converge.AI Enter and Framia · Sample training content · Demo data</p>
    </>
  );
}
