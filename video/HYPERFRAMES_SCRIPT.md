# FirstShift launch film: HyperFrames script (v2)

This is a ~82-second, 1920×1080, 30 fps film in three acts:

| Act | Time | What it does |
|---|---|---|
| **1. The problem** | 0:00–0:26 | Statistics only, told as people, not charts |
| **2. The product** | 0:26–1:10 | The real UI carries the film |
| **3. The scale** | 1:10–1:22 | Close |

The progression is **Palo Alto → Santa Clara County → America's kitchens → 1 in 6 people → "one way for everyone" → FirstShift → the world.**

For the 2–3 minute submission, this film is the opening. Cut from it to an unedited live run-through of the app.

---

## 1. How HyperFrames wants to be prompted

This is a summary of HeyGen's own guides: [Prompting](https://hyperframes.heygen.com/guides/prompting), [Motion](https://hyperframes.heygen.com/prompting/motion.md), [Data and maps](https://hyperframes.heygen.com/prompting/data-and-maps.md), [Media and audio](https://hyperframes.heygen.com/prompting/media-and-audio.md) and [Website to video](https://hyperframes.heygen.com/guides/website-to-video).

**Structure of a strong prompt:**

| Part | Rule |
|---|---|
| **Route** | Start with `/hyperframes`, so the framework rules load. |
| **Spec** | Duration and resolution up front. Use "~82 seconds", not "exactly 82", because narration sets the real length. |
| **Beats** | Timestamped beats, e.g. `Beat 3 (10.0–15.0s)`. Write pauses in explicitly, or the agent removes the breathing room. |
| **Copy** | On-screen text in "quotes"; `/` marks a line break. Unquoted text gets paraphrased. |
| **Technique** | Name catalog blocks by slug (`focus-rack`, `world-map` …) as starting points to adapt. |
| **Negatives** | Close the gaps: "no bounce on text or UI", "no flags", "never invent UI". |

**Describe each beat with five slots:** element, motion, layout, style and timing. For example: *"A giant '55.2%' (element) counts up with an odometer roll, easing out as it lands (motion), centre-left (layout), heavy black SF type (style), from 6.4s over 1.2s (timing)."*

**Rules that matter most for this film:**
- **Make one thing travel across each cut.** Here it's the dots, which are people. That's what stops a statistics opening feeling like slides.
- **Once a number or title lands, it holds still.** No "breathing" drift.
- **Never use overshoot on text, UI or numbers.** Save it for physical things like the seal.
- **Give a script verbatim** and say "use it verbatim". Budget about 130–150 spoken words a minute.
- **Write exact hand-off times** so overlaps are intentional: "out by 9.8s; at 9.8s …".
- **Give exact asset paths.**
- **Iterate one variable at a time,** using absolute targets ("number 320px", not "bigger"). Say "freeze what works".

**Workflow:**
1. Ask for a **storyboard of stills first**, and approve it.
2. Build **Act 1 alone** and lock it, because it carries the film.
3. Build Acts 2–3.
4. Then add the audio mix.

---

## 2. Verified statistics (checked Nov 18 at the source)

| # | Claim on screen | Source line to show | Notes |
|---|---|---|---|
| S1 | **42.3%** of Palo Alto residents (age 5+) speak a language other than English at home | U.S. Census Bureau, QuickFacts (ACS 2020–2024) | Foreign-born: 37.0% |
| S2 | **55.2%** of Santa Clara County residents (age 5+) speak a language other than English at home | U.S. Census Bureau, QuickFacts (ACS 2020–2024) | Foreign-born: 41.5% |
| S3 | **46%** of U.S. restaurant chefs and **39%** of cooks speak a language other than English at home | National Restaurant Association, *Restaurant Employee Demographics*, March 2026 (2024 data) | Same brief: **30%** of all restaurant employees (vs 25% of all U.S. workers); 23% foreign-born |
| S4 | Restaurants employ **more minority managers than any other industry** | NRA, same brief | 52% of restaurant employees are minorities, vs 42% of the total U.S. workforce |
| S5 | **1 in 6** people worldwide experiences significant disability (1.3 billion) | World Health Organization, 2023 | |
| S6 | **2.2 billion** people have a near or distance vision impairment | World Health Organization, 2026 | |
| S7 | **~7,000** languages are in use worldwide (spoken or signed) | UNESCO World Atlas of Languages | The 8,324 figure includes languages no longer used, so don't use it |

**Don't claim these (no source supports them):**
- "Restaurants are *the most* diverse workplace in America." Say S4 instead, or "more diverse than the U.S. workforce".
- "At least half the world is bilingual." Not verified, so it's dropped.

---

## 3. Narration (verbatim, about 190 words)

Lines in *italics* are on screen only, with no voice.

| Time | Act | Voiceover |
|---|---|---|
| 0:00 | 1 | *(silence: one dot, kitchen ambience)* |
| 0:01.5 | 1 | In Palo Alto, forty-two percent of us speak a language other than English at home. |
| 0:06.5 | 1 | Across Santa Clara County, it's more than half. |
| 0:10 | 1 | In America's restaurants, nearly half of all chefs do too. |
| 0:15 | 1 | And one in six people worldwide lives with a significant disability. |
| 0:20 | 1 | Yet most restaurants still train everyone the same way. One language. One format. One quiz. |
| 0:23.5 | 1 | *(silence, then the question on screen)* |
| 0:26 | 2 | Meet FirstShift. From first hello to first shift. |
| 0:30 | 2 | A manager describes the job once. FirstShift writes every post, in four languages. |
| 0:38 | 2 | Each hire chooses their language, and how they learn best. Watch with captions. Follow the pictures. Listen. Or read, in larger text, with all the time they need. |
| 0:52 | 2 | After every answer, one more question: how sure are you? |
| 0:56 | 2 | So managers see what a score can't. Mei scored a hundred, but feels unsure, so she gets a buddy shift. Jorge feels confident, but missed the allergy check. It's caught before a guest is. |
| 1:04 | 2 | Approved with evidence. And the news lands on her phone, in her language. |
| 1:10 | 3 | Around seven thousand languages are in use worldwide. FirstShift speaks four today, and it's built to add the next. |
| 1:18 | 3 | FirstShift. From first hello to first shift. |

**Why the opening works:**
- It starts personal ("us") and widens.
- Every number is a person you can see.
- Then a turn: everything goes grey and identical.
- Then **two seconds of silence** carry the question. That pause is the emotional beat, so don't let the agent remove it.

**Optional real voices:** record three short lines for the Act 2 language beat, about 1.5 s each.

| Language | Line | Save as |
|---|---|---|
| 中文 | 用你的语言学习。 | `assets/vo-zh.wav` |
| 粵語 | 用你嘅語言學。 | `assets/vo-yue.wav` |
| Español | Aprende en tu idioma. | `assets/vo-es.wav` |

---

## 4. Setup

Only Edge is installed, not Chrome. If preview or render can't find a browser, install Chrome or point HyperFrames at Edge.

```bash
npx skills add heygen-com/hyperframes
```

```bash
npx hyperframes init video/film
```

```bash
cd video/film && npx hyperframes preview
```

Copy these into `video/film/assets/`:

| Asset | From |
|---|---|
| `tokens.css`, `app.css` | `enter-app/src/fs/styles/` |
| `allergy.mp4`, `allergy-poster.jpg`, `allergy-c1.jpg`…`allergy-c5.jpg` | `framia/web/` |
| `reference/*.png` | `video/reference/` |
| `rec-posts.webm`, `rec-seal.webm`, `rec-approve.webm` (optional, real) | Playwright recordings of the live app. `video/capture.mjs` is the starting point; press Reset demo before each take |

---

## 5. Prompt 1: storyboard first (paste this whole block)

> /hyperframes
>
> Storyboard first. Make one still per beat for the film below and wait for my approval before any motion. Don't ask clarifying questions; everything is specified here.
>
> **Spec.** ~82-second film, 1920×1080, 30 fps, 16:9, for a hackathon demo and a judges' screen.
>
> **Product.** FirstShift takes a restaurant hire from job post to first shift. It's built for Imperial Treasure, a Cantonese restaurant in Palo Alto. Hires learn in their language (English, 中文, 粵語, Español) and in the format they learn best (captioned video, picture steps, listen, read). Managers get a readiness passport that combines scores with how sure each hire feels.
>
> **Style tokens.** Apple-keynote restraint.
> - Colours: background `#ffffff` and `#f5f5f7`; text `#1d1d1f`; muted `#4d4d52`; inactive `#86868b`; brand blue `#00479a`; approval green `#0f5222` (only for the approval seal); flag orange `#8a3300` (only for passport flags).
> - Type: `-apple-system, "SF Pro Display", "Segoe UI", system-ui`. Headlines weight 800, tracking −0.03em. Statistic numerals 280–340px.
> - No gradients, no neon, no stock photos of people, no flags (languages are not nationalities).
>
> **Visual idea for Act 1.** People as dots. A 10×10 grid of 100 small filled circles (18px, `#86868b`) stands for 100 people. Highlighted people turn brand blue. The dots are the one thing that travels across every cut in Act 1, and at 26s they assemble into the FirstShift logo.
>
> **Script and beats.** Read `video/HYPERFRAMES_SCRIPT.md`:
> - §2: the only statistics allowed;
> - §3: the narration, to use verbatim;
> - §6 and §7: the timed beats.
>
> Storyboard every beat from §6 and §7: one still each, with its on-screen copy and its timestamp.

---

## 6. Prompt 2: build Act 1 only (0:00–0:26)

> /hyperframes
>
> Build only Act 1 (0.0–26.0s) from the approved storyboard, then stop so I can review. Keep the style tokens and the dot idea exactly as specified.
>
> **Beat 1 (0.0–1.5s): one person.**
> - On a pure white `#ffffff` stage, a single 18px dot `#86868b` sits dead centre and holds still.
> - Kitchen ambience fades in at −30 dB. No music yet.
>
> **Beat 2 (1.5–6.4s): Palo Alto.**
> - The camera pulls back (smooth, `power2.inOut`, over 1.2s). The dot becomes one of a 10×10 grid of 100 dots on the left half.
> - Behind the grid: a stylised, hand-drawn SVG map in `#f5f5f7` with a thin `#d2d2d7` San Francisco Bay shoreline, and a small blue pin labelled "Palo Alto". This is a hand-drawn map, not a registry block. Keep it schematic: no roads, no tiles.
> - From 2.2s, 42 dots turn brand blue one by one, staggered 0.02s, in reading order.
> - At the same time, a giant "42.3%" counts up on the right half with an odometer roll, easing out as it lands at 3.6s. Base it on `mk-progress-stat`, but hand-draw the type and drop the progress track.
> - Under the number, in 40px, weight 600: "speak a language other than English at home".
> - Source line, 16px `#4d4d52`, bottom-right: "U.S. Census Bureau, QuickFacts · ACS 2020–2024".
> - From 3.8s, small language words drift in beside a few blue dots, 20px, `#4d4d52`, staggered 0.15s: "中文", "Español", "Tiếng Việt", "Tagalog", "हिन्दी", "한국어", "粵語", "తెలుగు". No flags.
>
> **Beat 3 (6.4–10.0s): Santa Clara County.**
> - The map pulls back further (1.0s), and the label "Palo Alto" becomes "Santa Clara County".
> - 13 more dots turn blue (55 in total), staggered 0.03s.
> - The number rolls from "42.3%" to "55.2%" and lands at 8.0s, then holds still. The caption stays.
> - Source line: "U.S. Census Bureau, QuickFacts · ACS 2020–2024".
>
> **Beat 4 (10.0–15.0s): America's kitchens.**
> - The map fades out fully by 10.4s.
> - The 100 dots re-flow into four long horizontal rows, like a kitchen line, over 0.8s. Blue drops back to grey, then 46 dots turn blue, staggered 0.02s.
> - Each blue dot in the front row gets a tiny 12px white chef's-hat glyph.
> - Number: "46%" lands at 11.6s. Caption: "of U.S. restaurant chefs speak another language at home".
> - Second line, 28px, at 12.4s: "39% of cooks".
> - Source line: "National Restaurant Association · Restaurant Employee Demographics, March 2026 · 2024 data".
>
> **Beat 5 (15.0–20.0s): one in six.**
> - The rows collapse into six large standing-person glyphs (120px tall, `#86868b`) in one centred row, over 0.8s.
> - At 15.8s, one glyph fills brand blue. Number: "1 in 6" lands at 16.2s. Caption: "people worldwide live with a significant disability".
> - At 17.4s, a smaller line, 28px `#4d4d52`: "2.2 billion people have a vision impairment".
> - Source line: "World Health Organization · 2023, 2026".
>
> **Beat 6 (20.0–23.5s): the same way for everyone.**
> - All colour drains to grey over 0.6s. The six people flatten into identical grey silhouettes.
> - Three phrases slam in word by word on the voice, centred and stacked, weight 800, 96px, `#1d1d1f`, snappy `power4.out`, no bounce: "One language." at 21.4s, "One format." at 22.1s, "One quiz." at 22.8s.
> - Everything holds still.
>
> **Beat 7 (23.5–26.0s): the question (silence).**
> - All of Beat 6 fades out fully by 23.9s. Music and voice are silent here; kitchen ambience only, at −34 dB.
> - At 23.9s, centred, 72px weight 700: "What if training asked how you learn / — not what limits you?" Fade in over 0.6s, then **hold completely still until 26.0s.**
>
> **Hand-off at 26.0s.** The text clears. All the grey dots from the scene rush to centre (0.5s, `expo.out`) and assemble into the FirstShift logo: a blue `#00479a` rounded square with a white check (inline SVG path `M5 12.5l4.5 4.5L19 7.5`, stroke 3.2, round caps). The music enters on that landing.
>
> **Audio for Act 1.**
> - VO: Kokoro `af_heart` (warm, unhurried, about 140 wpm), using the Act 1 lines verbatim.
> - Captions: `caption-highlight` style, one line, bottom-centre, word-synced. Show the VO words only; never caption the silence in Beat 7.
>
> **Negatives.**
> - No bounce on text or numbers; no drifting after a number lands; no flags; no stock people.
> - Never round 42.3% or 55.2% differently from the source.
> - Every statistic shows its source line for its full time on screen.

---

## 7. Prompt 3: build Acts 2 and 3 (0:26–1:22)

> /hyperframes
>
> Act 1 is approved. Freeze it and don't touch anything before 26.0s. Now build Acts 2–3 (26.0–82.0s).
>
> **The product is the hero.**
> - Rebuild app screens as real HTML using `assets/tokens.css` and `assets/app.css`, matching `assets/reference/*.png` exactly.
> - Animate individual real elements. Never invent buttons, labels or numbers that aren't in the references.
> - Where `assets/rec-*.webm` exists, play it inside the device screen instead of the rebuild.
>
> **Stage.** A phone (the hire) on the left in `device-frame-stage`; a laptop (the manager) on the right, hand-drawn as a minimal silver frame. Use `focus-rack` for attention swaps: the active device is at 1.0 scale; the other is at 0.92 scale and 60% opacity. Use `ui-focus-zoom` for push-ins on specific UI regions. Product shots hold a framing for 4–8 seconds.
>
> **Beat 8 (26.0–30.0s): reveal.**
> - The logo from Act 1 holds still. The wordmark "FirstShift" fades in beside it (weight 800).
> - At 27.4s, under it, 40px: "From first hello to first shift."
> - At 29.4s, the logo shrinks to the top-left corner (0.6s), and the two devices rise in.
>
> **Beat 9 (30.0–38.0s): hire.**
> - Laptop in focus, showing the "Post a job" screen (`reference/m6-posts.png`).
> - "Weekend server" types into the role field (`code-typing` caret), and the "Generate posts" pill is pressed at 32.0s.
> - Eight post cards cascade in, staggered 0.08s: Job board, Classifieds, WeChat 中文, WhatsApp 粵語, WhatsApp Español, Flyer, Bilingual, Easy-read. Each card carries the tag "✦ Written by Enter AI".
> - Overlay at 35.0s, bottom-left, 32px: "Write it once. / Reach people where they are."
>
> **Beat 10 (38.0–52.0s): train.**
> - `focus-rack` to the phone. The language picker shows "English · 中文 · 粵語 · Español", and Lin taps "中文" at 39.0s. The screen re-renders in Chinese.
> - "How do you learn best?" chips appear; "Read aloud" and "Picture steps" toggle on.
> - On the lesson (`reference/p2-lin-lesson.png`), the format tabs switch on the voice:
>   - 视频 (41.5s): a 2s slice of `assets/allergy.mp4` with captions;
>   - 图片 (43.5s): the five step photos slide in;
>   - 听 (45.5s): the read-aloud highlight sweeps across the text;
>   - 阅读 (47.0s): the large-text view.
> - At 48.5s, the camera moves to the laptop for 3s: Daniel's readiness passport (`reference/m2-passport-daniel.png`), with `ui-focus-zoom` on his "Captions · Visual steps · Seated station" chips.
> - Small overlay, 24px `#4d4d52`: "Every text colour meets WCAG AAA contrast."
>
> **Beat 11 (52.0–56.0s): how sure are you?**
> - Phone in focus, quiz screen (`reference/p3-lin-quiz.png`). Lin picks an answer, and the kind green feedback slides up.
> - At 54.0s, "How sure are you?" appears with its confidence picker, and she taps one.
> - On the dimmed laptop, Lin's card moves one column.
>
> **Beat 12 (56.0–64.0s): the confidence gap.**
> - `focus-rack` to the laptop. `ui-focus-zoom` into Mei's passport (`reference/m3-passport-mei.png`). The orange flag "Needs a buddy shift" slides in at 57.5s, with its detail line exactly as in the reference.
> - At 60.0s, a second passport (Jorge) slides in beside it: confident, but the allergy check missed, with the flag "Double-check: Allergy questions".
> - Small corner label for the whole beat: "In demo data".
>
> **Beat 13 (64.0–70.0s): approve.**
> - The cursor clicks the green "Approve for shift" pill at 64.6s, and the card travels from "Ready for review" to "Shift-ready" (0.6s).
> - `focus-rack` to the phone. The green check seal springs in at 66.2s (this is the only overshoot in the film: scale 0 → 1.08 → 1 over 0.6s) with "可以上班", plus one soft chime.
> - From 67.6s, the seal word changes in place every 0.6s: "可以返工", "Listo", "Ready".
>
> **Beat 14 (70.0–78.0s): the world.**
> - Both devices shrink and fade by 70.8s, and a `world-map` globe rotates in, `#f5f5f7` land with `#d2d2d7` borders. Shading is optional; keep it calm.
> - Number: "~7,000" lands at 72.0s. Caption: "languages are in use worldwide, spoken or signed". Source: "UNESCO World Atlas of Languages".
> - At 74.5s, four blue dots light up at Palo Alto, labelled "English · 中文 · 粵語 · Español", then: "4 live today. / Built to add the next."
>
> **Beat 15 (78.0–82.0s): end card.**
> - Adapt `logo-outro` (no glow bloom, no URL pill): the logo and "FirstShift", then "From first hello to first shift." and, smaller, "In your language. In the way you learn best."
> - Footer, 16px `#4d4d52`: "Built on Converge.AI Enter and Framia".
> - Hold still to the end.
>
> **Transitions.** Calm `light-leak` at 26.0s, `whip-pan` (0.4s) only between the phone and laptop where `focus-rack` isn't enough, and `cinematic-zoom` once, into the globe at 70.0s. No dissolves between unrelated scenes.
>
> **Audio.**
> - VO: Kokoro `af_heart`, using the Act 2–3 lines verbatim. If `assets/vo-zh.wav`, `vo-yue.wav` and `vo-es.wav` exist, play them at 39.2s, 39.8s and 40.4s under the "chooses their language" line.
> - Music: warm, minimal piano and marimba, about 92 bpm, entering at 26.0s, ducked about 12 dB under the voice and kept under −18 dB.
> - SFX: one soft tick per tap, one chime at 66.2s, nothing else.
> - Captions: word-synced throughout. The Chinese lines are captioned in their own script.
>
> **Guardrails.**
> - "4 languages live, built to add the next". Never "every language", and never present the 7,000 figure as a product claim.
> - Learning preferences are "how you learn best", never disability or medical labels.
> - The Cantonese content is AI-drafted and pending native review, so don't zoom in on long 粵語 lesson text.
> - All people are fictional demo data.
>
> **Output.** `film.mp4` (H.264, −14 LUFS) and `film.srt`.

---

## 8. Iteration phrases (one change per message)

| Problem | Say |
|---|---|
| Act 1 reads like slides | "It feels like slides. Carry the dots across every cut; never clear the grid between Beats 2–5." |
| Too much text in a beat | "Beat 4: remove the '39% of cooks' line; keep only the number, caption and source." |
| Numbers too small on a laptop | "Statistic numerals are 320px; captions 44px." |
| The question pause got trimmed | "Beat 7 must hold silent and still from 23.9s to 26.0s. Don't shorten it." |
| Motion too busy | "Move only what is changing. Once a number lands, it holds still." |
| Fine except one detail | "Don't touch the framing; only change the dot size to 20px." |

## 9. Before rendering

- [ ] Every number and source line matches §2 exactly.
- [ ] The on-screen app text matches `video/reference/*.png`. The flag wording comes from `core.ts`: "Needs a buddy shift" and "Double-check: Allergy questions".
- [ ] The seal words match `HireDone.tsx`: Ready / 可以上班 / 可以返工 / Listo.
- [ ] Kokoro pronounces "Imperial Treasure" and "FirstShift" correctly. If not, use the teammate VO.
- [ ] The Enter badge is hidden in every recording.
