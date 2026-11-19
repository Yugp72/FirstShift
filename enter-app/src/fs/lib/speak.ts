import { useEffect, useState } from "react";

/** Read-aloud via the browser's speechSynthesis. No network, no rate limit. No-ops if unsupported. */
export const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

function voices(): SpeechSynthesisVoice[] {
  return ttsSupported ? window.speechSynthesis.getVoices() : [];
}

export function voiceFor(bcp47: string): SpeechSynthesisVoice | null {
  const want = bcp47.toLowerCase().replace("_", "-");
  const base = want.split("-")[0];
  const all = voices();
  const norm = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-");
  const exact = all.filter((v) => norm(v) === want);
  const pool = exact.length ? exact : all.filter((v) => norm(v).split("-")[0] === base);
  if (!pool.length) return null;
  // Prefer natural/enhanced voices when the OS offers them.
  return pool.find((v) => /natural|premium|enhanced|google/i.test(v.name)) || pool.find((v) => v.localService) || pool[0];
}

/** Slower speech for hires who chose "Extra time". */
let slow = false;
export function setSlowSpeech(on: boolean): void { slow = on; }

export function speak(text: string, bcp47: string, onEnd?: () => void): void {
  if (!ttsSupported) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = bcp47;
  const v = voiceFor(bcp47);
  if (v) u.voice = v;
  u.rate = (bcp47.startsWith("en") ? 0.95 : 0.9) * (slow ? 0.8 : 1);
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  synth.speak(u);
}

export function stopSpeaking(): void {
  if (ttsSupported) window.speechSynthesis.cancel();
}

/** True once a voice for this language is available. Chrome loads voices asynchronously. */
export function useVoice(bcp47: string): boolean {
  const [ok, setOk] = useState(() => !!voiceFor(bcp47));
  useEffect(() => {
    if (!ttsSupported) return;
    const check = () => setOk(!!voiceFor(bcp47));
    check();
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
  }, [bcp47]);
  return ok;
}
