import type { Lang } from "./api";

export const BCP47: Record<Lang, string> = { en: "en-US", zh: "zh-CN", es: "es-ES" };
/** Value for the HTML lang attribute so screen readers and TTS pronounce each block correctly. */
export const HTML_LANG: Record<Lang, string> = { en: "en", zh: "zh-CN", es: "es" };

type Dict = Record<Lang, string>;

// Hire-facing copy. Never "wrong", "fail", "test" or "quiz".
const S = {
  chooseLang: { en: "Choose your language", zh: "选择你的语言", es: "Elige tu idioma" },
  pilot: { en: "Coming in pilot", zh: "试点阶段推出", es: "Disponible en el piloto" },
  welcome: { en: "Welcome, {name}.", zh: "欢迎你，{name}。", es: "Te damos la bienvenida, {name}." },
  welcomeSub: {
    en: "Let's get you ready for your first shift. Go at your own pace. Nothing here is timed.",
    zh: "我们一起为你的第一次上班做好准备。按你自己的节奏来，不限时间。",
    es: "Vamos a prepararte para tu primer turno. Ve a tu ritmo. Aquí nada tiene tiempo límite.",
  },
  yourRole: { en: "Your role", zh: "你的岗位", es: "Tu puesto" },
  steps: { en: "Your steps", zh: "你的步骤", es: "Tus pasos" },
  stepOf: { en: "Step {n} of {total}", zh: "第 {n} 步，共 {total} 步", es: "Paso {n} de {total}" },
  stepDone: { en: "Done", zh: "已完成", es: "Hecho" },
  stepNext: { en: "Up next", zh: "下一步", es: "Lo siguiente" },
  stepRedo: { en: "Look at this again", zh: "请再看一遍", es: "Repasa otra vez" },
  start: { en: "Start", zh: "开始", es: "Empezar" },
  open: { en: "Open", zh: "打开", es: "Abrir" },
  next: { en: "Next", zh: "下一个", es: "Siguiente" },
  back: { en: "Back", zh: "上一个", es: "Atrás" },
  home: { en: "My steps", zh: "我的步骤", es: "Mis pasos" },
  listen: { en: "Listen", zh: "听一听", es: "Escuchar" },
  stop: { en: "Stop", zh: "停止", es: "Detener" },
  toChecks: { en: "Let's check", zh: "我们来确认一下", es: "Vamos a repasar" },
  checkOf: { en: "Check {n} of {total}", zh: "确认 {n} / {total}", es: "Repaso {n} de {total}" },
  chooseOne: { en: "Choose one answer.", zh: "选一个答案。", es: "Elige una respuesta." },
  inYourWords: {
    en: "Answer in your own words. Any language is fine.",
    zh: "用你自己的话回答，用什么语言都可以。",
    es: "Responde con tus palabras. Cualquier idioma está bien.",
  },
  placeholder: { en: "Type here…", zh: "在这里输入…", es: "Escribe aquí…" },
  send: { en: "Send", zh: "发送", es: "Enviar" },
  reading: { en: "Reading your answer", zh: "正在看你的回答", es: "Leyendo tu respuesta" },
  tryAgain: { en: "Try again", zh: "再试一次", es: "Intentar otra vez" },
  speakAnswer: { en: "Say it", zh: "用说的", es: "Dilo en voz" },
  listening: { en: "Listening… tap to stop", zh: "正在听…点一下停止", es: "Escuchando… toca para parar" },
  howFeel: { en: "How do you feel about this step?", zh: "这一步你觉得怎么样？", es: "¿Cómo te sientes con este paso?" },
  feelNote: {
    en: "Any answer is okay. It helps your manager support you.",
    zh: "怎么选都可以。这能帮助经理更好地支持你。",
    es: "Cualquier respuesta está bien. Ayuda a tu gerente a apoyarte.",
  },
  conf1: { en: "Not sure yet", zh: "还不太确定", es: "Todavía con dudas" },
  conf2: { en: "Okay", zh: "还可以", es: "Bien" },
  conf3: { en: "Confident", zh: "很有把握", es: "Con confianza" },
  moduleDone: { en: "Nice work. “{module}” is done.", zh: "做得好！“{module}”完成了。", es: "¡Buen trabajo! Terminaste «{module}»." },
  nextStep: { en: "Next step", zh: "下一步", es: "Siguiente paso" },
  allDone: { en: "You finished every step.", zh: "你已经完成了所有步骤。", es: "Terminaste todos los pasos." },
  allDoneSub: {
    en: "Your manager is looking at your ticket now. This page updates by itself.",
    zh: "经理正在看你的单子。这个页面会自动更新。",
    es: "Tu gerente está revisando tu ficha. Esta página se actualiza sola.",
  },
  ready: { en: "You're ready for your first shift!", zh: "你已经准备好第一次上班了！", es: "¡Todo listo para tu primer turno!" },
  readySub: {
    en: "Your manager stamped your ticket. See you soon.",
    zh: "经理已经在你的单子上盖章了。期待见到你！",
    es: "Tu gerente selló tu ficha. ¡Nos vemos pronto!",
  },
  managerNote: { en: "A note from your manager", zh: "经理给你的留言", es: "Una nota de tu gerente" },
  original: { en: "Original", zh: "原文", es: "Original" },
  sample: { en: "Sample training content", zh: "示例培训内容", es: "Contenido de capacitación de ejemplo" },
  language: { en: "Language", zh: "语言", es: "Idioma" },
  bigger: { en: "Bigger text", zh: "放大字体", es: "Letra más grande" },
  cardOf: { en: "Card {n} of {total}", zh: "第 {n} 张，共 {total} 张", es: "Tarjeta {n} de {total}" },
  linkInactive: {
    en: "This training link isn't active. Ask your manager for a new one.",
    zh: "这个培训链接无效。请向经理要一个新的链接。",
    es: "Este enlace de capacitación no está activo. Pide uno nuevo a tu gerente.",
  },
} satisfies Record<string, Dict>;

export type Key = keyof typeof S;

export function tr(key: Key, lang: Lang, vars: Record<string, string | number> = {}): string {
  let s: string = S[key][lang] || S[key].en;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
