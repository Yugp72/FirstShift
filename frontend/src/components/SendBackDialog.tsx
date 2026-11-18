import { useEffect, useRef, useState } from "react";
import { api, LANG_CHIP, type Meta, type Ticket } from "../lib/api";

interface Props {
  t: Ticket;
  meta: Meta | null;
  onClose: () => void;
  onSent: (msg: { lang: string; note: string; translated: boolean }) => void;
}

export function SendBackDialog({ t, meta, onClose, onSent }: Props) {
  const mods = t.hire?.modules ?? [];
  const suggested = mods.find((m) => (m.confidence ?? 3) === 1 || (m.score ?? 1) < 0.7) || mods[0];
  const [moduleId, setModuleId] = useState<number>(suggested?.id ?? 0);
  const presets = meta?.send_back_notes ?? [];
  const [note, setNote] = useState<string>(presets[0]?.en ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = async () => {
    if (!t.hire) return;
    setBusy(true);
    setErr("");
    try {
      const r = await api.sendBack(t.hire.id, moduleId, note);
      onSent(r);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="dialog paper" role="dialog" aria-modal="true" aria-labelledby="sb-title">
        <button type="button" className="close-x" onClick={onClose} aria-label="Close">×</button>
        <h2 id="sb-title">SEND BACK · {t.name.toUpperCase()}</h2>
        <p className="sub">Pick one step to review again. Your note is translated into {LANG_CHIP[t.lang]} and shown on their phone.</p>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field-label">Step to review</legend>
          {mods.map((m, i) => (
            <label className="opt" key={m.id}>
              <input ref={i === 0 ? first : undefined} type="radio" name="mod" checked={moduleId === m.id} onChange={() => setModuleId(m.id)} />
              <span>{m.icon} {m.title} · {m.score !== null ? `${Math.round(m.score * 100)}% first try` : "–"} {m.confidence === 1 ? "· feels unsure" : ""}</span>
            </label>
          ))}
        </fieldset>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field-label">A kind note</legend>
          {presets.map((p, i) => (
            <label className="opt" key={i}>
              <input type="radio" name="note" checked={note === p.en} onChange={() => setNote(p.en)} />
              <span>{p.en}</span>
            </label>
          ))}
          <label className="field-label" htmlFor="sb-note">Or write your own</label>
          <textarea id="sb-note" className="ta" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={400} />
        </fieldset>
        {err && <p role="alert" style={{ color: "var(--primary)", fontWeight: 700 }}>{err}</p>}
        <div className="tkt-actions" style={{ marginTop: 18 }}>
          <button type="button" className="tbtn primary wide" onClick={send} disabled={busy || !moduleId}>
            {busy ? "TRANSLATING…" : `SEND BACK IN ${LANG_CHIP[t.lang]}`}
          </button>
          <button type="button" className="tbtn" onClick={onClose}>CANCEL</button>
        </div>
      </div>
    </>
  );
}
