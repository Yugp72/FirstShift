import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GlobalNav } from "../components/GlobalNav";
import { api, MEDIA_BASE, type Course } from "../lib/api";

const COVER: Record<string, string> = { server: `${MEDIA_BASE}allergy-c1.jpg`, kitchen: "" };
const ICON: Record<string, string> = { server: "🍽️", kitchen: "🥟" };

/** Course catalogue: plain training, open to anyone. */
export default function Learn() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  useEffect(() => { api.courses().then((r) => setCourses(r.courses)).catch(() => setCourses([])); }, []);
  return (
    <div className="mgr">
      <GlobalNav />
      <main id="main" className="page narrow">
        <div className="page-head">
          <div>
            <h1>Training</h1>
            <p>Short lessons with a quick quiz after each section. Learn in English, 中文 or Español, and by video, pictures, listening or reading.</p>
          </div>
        </div>
        <div className="course-grid">
          {courses?.map((c) => (
            <Link key={c.role} className="course" to={`/learn/${c.role}`}>
              <div className="cover">{COVER[c.role] ? <img src={COVER[c.role]} alt="" /> : <span aria-hidden="true">{ICON[c.role]}</span>}</div>
              <div className="body">
                <span className="badge">{c.area}</span>
                <h3 style={{ marginTop: 10 }}>{c.title}</h3>
                <p>{c.blurb}</p>
                <ul>
                  {c.sections.map((s, i) => (
                    <li key={s.title}><span aria-hidden="true">{s.icon}</span> {i + 1}. {s.title} <span className="muted">· {s.lessons} lessons{s.has_video ? " · video" : ""} · quiz</span></li>
                  ))}
                </ul>
                <p style={{ marginTop: 16, color: "var(--link)" }}>Start course ›</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
