import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GlobalNav } from "../components/GlobalNav";
import { api, LANG_CHIP, type Application, type PublicJob } from "../lib/api";
import { useAuth } from "../lib/auth";

const ICON: Record<string, string> = { server: "🍽️", kitchen: "🥟" };

export function JobBoard() {
  const [jobs, setJobs] = useState<PublicJob[] | null>(null);
  useEffect(() => { api.openJobs().then((r) => setJobs(r.jobs)).catch(() => setJobs([])); }, []);
  return (
    <div className="mgr">
      <GlobalNav />
      <main id="main" className="page narrow">
        <div className="page-head">
          <div>
            <h1>Jobs at Imperial Treasure</h1>
            <p>Palo Alto · Training in English, 中文 and Español · No résumé needed</p>
          </div>
        </div>
        {jobs === null && <p className="muted">Loading…</p>}
        {jobs?.length === 0 && <div className="empty"><b>No open jobs right now</b>Check back soon.</div>}
        <div className="job-list">
          {jobs?.map((j) => (
            <Link key={j.id} className="job-row" to={`/jobs/${j.id}`}>
              <span className="ico" aria-hidden="true">{ICON[j.role]}</span>
              <span>
                <h3>{j.title}</h3>
                <p>{j.area} · {j.schedule} · {j.pay_range}</p>
                <span className="row" style={{ marginTop: 8, gap: 6 }}>{j.languages.map((l) => <span key={l} className="badge">{LANG_CHIP[l]}</span>)}</span>
              </span>
              <span className="btn">View job</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export function JobDetail() {
  const { id = "" } = useParams();
  const { account } = useAuth();
  const nav = useNavigate();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [err, setErr] = useState("");
  const [easy, setEasy] = useState(false);
  const [applied, setApplied] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.openJob(Number(id)).then(setJob).catch((e) => setErr((e as Error).message)); }, [id]);
  useEffect(() => {
    if (account?.role !== "applicant") return;
    api.myApplications().then((r) => setApplied(r.applications.find((a) => a.job_id === Number(id)) ?? null)).catch(() => undefined);
  }, [account, id]);

  const apply = async () => {
    if (!account) { nav(`/login?next=${encodeURIComponent(`/jobs/${id}`)}&mode=up`); return; }
    setBusy(true);
    setErr("");
    try {
      await api.apply(Number(id));
      const r = await api.myApplications();
      setApplied(r.applications.find((a) => a.job_id === Number(id)) ?? null);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="mgr">
      <GlobalNav />
      <main id="main" className="page narrow">
        <p><Link to="/jobs">‹ All jobs</Link></p>
        {err && !job && <div className="empty"><b>Job not found</b>{err}</div>}
        {job && (
          <div className="job-detail">
            <article className="card-box">
              <p className="eyebrow" style={{ margin: 0 }}>{job.area}</p>
              <h1 style={{ margin: "6px 0 14px", fontSize: 40, fontWeight: 600 }}>{job.title}</h1>
              <div className="seg" role="group" aria-label="Reading level" style={{ maxWidth: 320, marginBottom: 18 }}>
                <button type="button" aria-pressed={!easy} onClick={() => setEasy(false)}>Full listing</button>
                <button type="button" aria-pressed={easy} onClick={() => setEasy(true)}>Easy read</button>
              </div>
              <pre>{easy ? job.easy_read : job.listing}</pre>
            </article>
            <aside className="card-box sticky-card">
              <h2 style={{ margin: 0, fontSize: 21, fontWeight: 600 }}>{job.pay_range}</h2>
              <p className="muted" style={{ margin: "6px 0 16px", fontSize: 15 }}>{job.schedule}<br />{job.location}</p>
              {applied ? (
                <>
                  <span className="badge badge-success">Applied ✓</span>
                  <p style={{ fontSize: 15 }}>We'll be in touch. Track it in <Link to="/me">My applications</Link>.</p>
                  <Link className="btn btn-block" to={`/learn/${job.role}`}>Practice the training now</Link>
                </>
              ) : account?.role === "manager" ? (
                <p className="muted" style={{ fontSize: 15 }}>You're signed in as a manager. Applicants apply here.</p>
              ) : (
                <button type="button" className="btn btn-primary btn-lg btn-block" onClick={apply} disabled={busy}>
                  {busy ? "Sending…" : account ? "Apply now" : "Sign in to apply"}
                </button>
              )}
              {err && job && <p className="err" role="alert">{err}</p>}
              <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>Training is available in English, 中文 and Español, with video, pictures and read-aloud.</p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

const STEPS: { key: string; label: string }[] = [
  { key: "APPLIED", label: "Applied" }, { key: "TRAINING", label: "Training" },
  { key: "REVIEW", label: "Manager review" }, { key: "SHIFT_READY", label: "Shift-ready" },
];

export function MyApplications() {
  const { account } = useAuth();
  const [apps, setApps] = useState<Application[] | null>(null);
  useEffect(() => { api.myApplications().then((r) => setApps(r.applications)).catch(() => setApps([])); }, []);
  return (
    <div className="mgr">
      <GlobalNav />
      <main id="main" className="page narrow">
        <div className="page-head"><div><h1>Hi, {account?.name.split(" ")[0]}.</h1><p>Your applications and training.</p></div></div>
        {apps === null && <p className="muted">Loading…</p>}
        {apps?.length === 0 && (
          <div className="empty"><b>No applications yet</b><span>Find a role that fits you.</span>
            <div style={{ marginTop: 16 }}><Link className="btn btn-primary" to="/jobs">Browse jobs</Link></div>
          </div>
        )}
        <div className="job-list">
          {apps?.map((a) => {
            const idx = STEPS.findIndex((s) => s.key === a.status);
            return (
              <article key={a.id} className="card-box">
                <div className="row" style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{a.title}</h2>
                    <p className="muted" style={{ margin: "2px 0 0", fontSize: 15 }}>{a.location} · {a.schedule}</p>
                  </div>
                  {a.status === "SHIFT_READY" && <span className="badge badge-success">Approved for your first shift</span>}
                </div>
                <div className="timeline" aria-label={`Status: ${STEPS[idx]?.label}`}>
                  {STEPS.map((s, i) => <span key={s.key} className={i < idx ? "done" : i === idx ? "on" : ""}>{s.label}</span>)}
                </div>
                <div className="row" style={{ marginTop: 18 }}>
                  {a.training ? (
                    <>
                      <Link className="btn btn-primary" to={`/learn/${a.role}`}>{a.training.passed === 0 ? "Start training" : a.training.passed < a.training.total ? "Continue training" : "Review training"}</Link>
                      <span className="muted" style={{ fontSize: 14 }}>{a.training.passed} of {a.training.total} sections passed</span>
                    </>
                  ) : (
                    <>
                      <span className="muted" style={{ fontSize: 15 }}>The manager will review your application.</span>
                      <Link className="btn" to={`/learn/${a.role}`}>Practice the training</Link>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
