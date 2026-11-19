# FirstShift launch film: HyperFrames script

A ~75-second, 1920×1080, 30 fps film using structure A ("One hire, two screens"), from [HYPERFRAMES_DIRECTION.md](HYPERFRAMES_DIRECTION.md).

How to use it:
1. Run the setup below.
2. Paste the whole **"Prompt for HyperFrames"** section into Claude Code as `/hyperframes <prompt>`, or into the HyperFrames agent.
3. Iterate scene by scene with `npx hyperframes preview`.

For the 2–3 min submission, use this film as the first ~75 s, then cut to an unedited live run-through (see §0 of the direction doc).

---

## Setup (once)

```bash
npx skills add heygen-com/hyperframes
```

```bash
npx hyperframes init video/film
```

```bash
cd video/film && npx hyperframes preview
```

Only Edge is installed, not Chrome. If `init` or `render` can't find a browser, point it at Edge or install Chrome.

**Assets to copy into `video/film/assets/`:**

| File | From |
|---|---|
| `tokens.css`, `app.css` | `enter-app/src/fs/styles/` |
| `allergy.mp4`, `allergy-poster.jpg`, `allergy-c1…c5.jpg` | `framia/web/` |
| reference screenshots | `video/reference/*.png` |
| logo | inline SVG: blue `#00479a` rounded square with a white check, path `M5 12.5l4.5 4.5L19 7.5`, stroke 3.2, round caps |

**Optional real screen recordings:**
- Record these on the live app with Playwright `recordVideo` at 2×; `video/capture.mjs` is the starting point:
  - `rec-posts.webm`: Generate posts on `/manager/new`;
  - `rec-seal.webm`: the seal on `/t/ana-demo`;
  - `rec-approve.webm`: Approve on `/manager`.
- Press **Reset demo** before each take.

---

## Prompt for HyperFrames

> Build a 75-second, 1920×1080, 30 fps product launch film for **FirstShift**: a restaurant app that takes a new hire from job post to first shift, built for Imperial Treasure Palo Alto (a Cantonese restaurant).
>
> **Style.** Apple-keynote restraint.
> - Colours: white and `#f5f5f7` surfaces; text `#1d1d1f`, muted `#4d4d52`; blue `#00479a`; approval green `#0f5222`; warning `#8a3300`.
> - Type: system SF-style (`-apple-system, "SF Pro Display", "Segoe UI", system-ui`). Headlines are heavy (700–800) with tracking −0.03em. Pill buttons.
> - Motion: slow eased camera moves (`power3.inOut`), soft shadows, generous whitespace.
> - No gradients-on-everything, no neon, no stock people.
>
> **The product is the hero.**
> - Rebuild every app screen as real HTML using `assets/tokens.css` and `assets/app.css`, matching `assets/reference/*.png` exactly.
> - Animate individual real elements; never invent buttons, labels or numbers that aren't in the references.
> - Where a recording exists (`assets/rec-*.webm`), show it inside a **Browser Device Stage** frame instead.
>
> **Layout.** For most of the film, a split stage:
> - **left:** a phone (the hire, Lin);
> - **right:** a laptop (the manager's hiring pipeline).
>
> Use **Focus Swap** to move attention between them: the active device scales to 1.0, and the other dims to 0.92 scale and 60% opacity.
>
> **Captions on throughout.** Bottom-centre, white on a 70% black pill, max 2 lines. Use the VO line as the caption, with the language's own script when the line isn't English.
>
> **Audio.** A calm, warm piano/marimba bed at 92 bpm, ducked under the VO. A soft "tick" on each UI tap. A single warm chime when the seal lands. VO is a calm, confident voice (Kokoro or HeyGen); swap in real teammate voices for the 中文 / 粵語 / Español lines if they're provided as `assets/vo-*.wav`.
>
> ### Scenes
>
> **1 · 0:00–0:06 · Cold open: the question**
> - Black-to-white fade.
> - Centered headline types on, word by word: **"Who's actually ready for their first shift?"**
> - Beneath it, a small muted line: *"A quiz score can't tell you."*
> - VO: "Every restaurant asks the same question. A quiz score can't answer it."
>
> **2 · 0:06–0:14 · Local reality (map beat)**
> - An Apple-Maps-style map (adapt **NYC Paris Flight**) pushes in to a blue pin: **Palo Alto · Imperial Treasure**.
> - **Count Up** overlay: **55.2%**, then the line *"of Santa Clara County speaks a language other than English at home."*
> - Source line (12 px, muted): *U.S. Census Bureau, QuickFacts.*
> - Second count-up: **46% of chefs · 39% of cooks**, then *"speak another language at home."*
> - Source line: *National Restaurant Association.*
> - VO: "Here, more than half of us speak another language at home. So do nearly half the people in our kitchens."
>
> **3 · 0:14–0:22 · One entry, every channel**
> - Laptop in focus: the **Post a job** screen (`m6-posts.png`).
> - **Typed Prompt** types the role "Weekend server" into the field, and the "Generate posts" pill is pressed.
> - Eight post cards cascade in, staggered by 0.08 s: Job board, Classifieds, WeChat 中文, WhatsApp 粵語, WhatsApp Español, Flyer, Bilingual, Easy-read. Each card carries the small tag **"✦ Written by Enter AI"**.
> - Use `rec-posts.webm` here if it exists.
> - VO: "The manager writes the job once. FirstShift posts it in four languages, everywhere people actually look."
>
> **4 · 0:22–0:34 · Learn your way (phone)**
> - Focus Swap to the phone. The language picker shows **English · 中文 · 粵語 · Español**, Lin taps **中文**, and the screen re-renders in Chinese.
> - The "How do you learn best?" chips appear; **Read aloud** and **Picture steps** toggle on.
> - Lesson view (`p2-lin-lesson.png`): the format tabs **视频 / 图片 / 听 / 阅读** switch one by one.
>   - **视频:** a 2-second slice of `allergy.mp4` plays in the card;
>   - **图片:** the five step photos slide in;
>   - **听:** the read-aloud highlight sweeps across the lesson text;
>   - **阅读:** large text.
> - The small strip **"Set up for you"** pulses once.
> - VO: "Every hire learns in their own language, in the format that works for them: video, pictures, listening or reading."
> - Caption on the 听 beat: 「有冇人對食物敏感？」. The same allergen question in 粵語 appears as a second caption line.
>
> **5 · 0:34–0:42 · Answer, then "How sure are you?"**
> - Quiz screen (`p3-lin-quiz.png`). Lin picks an answer, and the kind green feedback slides up.
> - Then the **"How sure are you?"** confidence picker appears, and she taps one.
> - On the laptop side (dimmed), Lin's card advances a column on the pipeline.
> - VO: "After every answer, one more question: how sure are you?"
>
> **6 · 0:42–0:56 · The insight: the confidence gap (laptop)**
> - Focus Swap to the laptop. The camera pushes into the **Readiness passport** (`m3-passport-mei.png`).
>   - Mei's row: **100%**, then the flag **"Needs a buddy shift"** slides in in warning orange, with its detail line *"Scored 100% but feels unsure about …"* (copy the module name from the capture).
> - Split the passport frame. A second passport, Jorge, shows **💪 confident** next to **❌ allergy check missed**, then the flag **"Double-check: Allergy questions"**.
> - Small label in the corner: *In demo data.*
> - VO: "That's what no score shows. Mei aced it but isn't sure, so she gets a buddy shift. Jorge feels confident, but missed the allergy check. That's caught before a guest is."
>
> **7 · 0:56–1:06 · Approve with evidence, and the seal lands**
> - The manager clicks **Approve for shift** (green pill).
> - The card travels from **Ready for review** to **Shift-ready** (a shared-layout move).
> - Focus Swap to the phone. The green check **seal** springs in (scale 0 → 1.08 → 1, 0.6 s) with **「可以上班」**, and the chime plays.
> - A quick **Screen Flow Carousel** follows on the phone: the same seal in **Listo** (Español), **Ready** (English) and **可以返工** (粵語).
> - Use `rec-seal.webm` and `rec-approve.webm` if they exist.
> - VO: "Approved with evidence. And the good news reaches her phone, in her language."
>
> **8 · 1:06–1:15 · Close**
> - Pull back: both devices shrink and centre, and the map pin from scene 2 fades in behind them, then pulls back to the Bay Area.
> - Headline: **"Hire in any language. Train in any format. Approve with evidence."** Hold for 2 s.
> - Then the logo plus the **FirstShift** wordmark, with a line under it: **"From first hello to first shift."**
> - Footer, small and muted: *4 languages live · built to add more · Built on Converge.AI Enter and Framia.*
> - VO: "FirstShift. From first hello to first shift."
>
> ### Guardrails (must hold in every frame)
> - Say "4 languages live, built to add more". Never "every language", and never use world-language counts as product claims.
> - Preferences are "how you learn best". Never call them disability or medical labels.
> - Every number keeps its label ("In demo data", "Pilot target") and every statistic has a source line.
> - Cantonese content is AI-drafted, pending native review. Don't zoom in on long 粵語 lesson text; short UI words are fine.
> - All people are fictional demo data.
>
> ### Output
> Render `film.mp4` (H.264, 1920×1080, 30 fps, −14 LUFS) and a captions file `film.srt`.

---

## Narration only (for teammates recording real voices)

| Time | Line |
|---|---|
| 0:00 | Every restaurant asks the same question. A quiz score can't answer it. |
| 0:06 | Here, more than half of us speak another language at home. So do nearly half the people in our kitchens. |
| 0:14 | The manager writes the job once. FirstShift posts it in four languages, everywhere people actually look. |
| 0:22 | Every hire learns in their own language, in the format that works for them: video, pictures, listening or reading. |
| 0:34 | After every answer, one more question: how sure are you? |
| 0:42 | That's what no score shows. Mei aced it but isn't sure, so she gets a buddy shift. Jorge feels confident, but missed the allergy check. That's caught before a guest is. |
| 0:56 | Approved with evidence. And the good news reaches her phone, in her language. |
| 1:06 | FirstShift. From first hello to first shift. |

**Optional native-language lines (about 2 s each), slotted into scenes 4 and 7:**

| Language | Line |
|---|---|
| 中文 | 用你的语言学习。 |
| 粵語 | 用你嘅語言學。 |
| Español | Aprende en tu idioma. |

Save them as `assets/vo-zh.wav`, `vo-yue.wav` and `vo-es.wav`.

## Before rendering, check
- [ ] Statistics re-verified against the source pages (Census QuickFacts; National Restaurant Association, March 2026).
- [ ] The on-screen text matches the reference captures exactly. Check the scene 6 flag wording against `m3-passport-mei.png`.
- [x] Scene 7's 粵語 seal word 可以返工 matches the app (`HireDone.tsx`).
- [ ] The Enter badge is hidden in any recordings.
