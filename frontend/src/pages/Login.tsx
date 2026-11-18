import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BrandMark, GlobalNav } from "../components/GlobalNav";
import { api, type Lang } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Login() {
  const [params] = useSearchParams();
  const next = params.get("next") || "";
  const asManager = params.get("as") === "manager";
  const { setAccount } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">(params.get("mode") === "up" ? "up" : "in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const done = (role: string) => nav(next || (role === "manager" ? "/manager" : "/me"), { replace: true });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = mode === "in" ? await api.login(email, password) : await api.signup(name, email, password, lang);
      setAccount(r.account);
      done(r.account.role);
    } catch (e2) { setErr((e2 as Error).message); }
    setBusy(false);
  };

  const demo = async (role: "manager" | "applicant") => {
    setBusy(true);
    setErr("");
    try { const r = await api.demoLogin(role); setAccount(r.account); done(r.account.role); }
    catch (e2) { setErr((e2 as Error).message); }
    setBusy(false);
  };

  return (
    <>
      <GlobalNav />
      <main id="main" className="auth-wrap">
        <div className="auth">
          <div className="center" style={{ marginBottom: 14 }}><BrandMark size={44} /></div>
          <h1>{mode === "in" ? "Sign in" : "Create your account"}</h1>
          <p className="sub">{mode === "in" ? (asManager ? "Managers sign in to see the hiring pipeline." : "Apply for jobs and keep your training progress.") : "Apply to jobs and track your training. It takes a minute."}</p>

          <div className="seg" role="group" aria-label="Sign in or create account" style={{ marginBottom: 6 }}>
            <button type="button" aria-pressed={mode === "in"} onClick={() => setMode("in")}>Sign in</button>
            <button type="button" aria-pressed={mode === "up"} onClick={() => setMode("up")}>Create account</button>
          </div>

          <form onSubmit={submit}>
            {mode === "up" && (
              <>
                <label className="field-label" htmlFor="l-name">Your name</label>
                <input id="l-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
              </>
            )}
            <label className="field-label" htmlFor="l-email">Email</label>
            <input id="l-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <label className="field-label" htmlFor="l-pw">Password</label>
            <input id="l-pw" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={mode === "up" ? 8 : undefined} required />
            {mode === "up" && (
              <>
                <span className="field-label" id="l-lang">Preferred language</span>
                <div className="seg" role="group" aria-labelledby="l-lang">
                  {([["en", "English"], ["zh", "中文"], ["es", "Español"]] as [Lang, string][]).map(([c, n]) => (
                    <button key={c} type="button" aria-pressed={lang === c} onClick={() => setLang(c)} lang={c === "zh" ? "zh-CN" : c}>{n}</button>
                  ))}
                </div>
              </>
            )}
            {err && <p className="err" role="alert">{err}</p>}
            <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 22 }} disabled={busy}>
              {busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* [DEMO ONLY] one-click demo accounts for judges */}
          <div className="divider">or try the demo</div>
          <div className="row" style={{ justifyContent: "center" }}>
            <button type="button" className="btn" onClick={() => demo("manager")} disabled={busy}>Demo manager</button>
            <button type="button" className="btn" onClick={() => demo("applicant")} disabled={busy}>Demo applicant (Lin)</button>
          </div>
        </div>
      </main>
    </>
  );
}
