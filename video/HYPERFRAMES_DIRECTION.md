# FirstShift × HyperFrames: video direction (exploration, not a storyboard)

Status: recommendation for a ~70-second product film.
- Final narration is not written yet, and no shot list is locked.
- Everything below comes from master (`ca1eb08`) and the live Enter deployment, captured on Nov 18.

---

## 0. Two things to settle first

1. **Check the submission format.** `plan.md` §8 says the required demo video must be **2–3 minutes long and show the product actually running**. A 70-second launch film probably cannot replace it. Two ways to use it:
   - **(a)** make it the **first 70 seconds** of the 2:30 submission, followed by an unedited live run-through;
   - **(b)** keep it as a **separate sizzle** for the finalist slides (due Thu Nov 19, 8 PM PT) and the Demo Day opener.

   I recommend (a): one production serves both.
2. **Correct the product facts.** The README's accessibility list describes the earlier UI. It does not match what is live today, so the film must not claim it.

| README says | Live today (Apple-style redesign) |
|---|---|
| 20px Atkinson Hyperlegible body text | System font (SF / Segoe). Hire lesson text is 21px, 25px with "Extra time" |
| 24px larger-text option | "Extra time" preference gives larger text, larger buttons, 0.75× video and slower speech |
| 48px+ tap targets | Hire buttons are 50–60px. Manager buttons are 30–36px |
| Gold 可以/READY chop "slams down" | Green check **seal** that springs in: "Ready", "可以上班" or "Listo", then read aloud |
| ORDER IN / FIRE A POSTING / AT THE PASS | "Post a job" / "Generate posts" / "Ready for review" |
| "Accessible" | **New since then:** every text colour meets WCAG **AAA** (7:1); visual and screen-reader review alerts; dialogs trap focus and close with Esc; translated picture descriptions |

Update (Nov 18): four live learner languages: EN, 中文, 粵語 (Cantonese, AI-drafted, pending native review) and Español. Vietnamese stays visibly marked "pilot". There are four formats, five preferences, untimed quizzes and the confidence question.

---

## 1. The pitch I'd build the film around

**Problem, in the restaurant's own terms.** Imperial Treasure keeps re-explaining the same procedures, in whatever language works, and still can't tell who is really ready for the floor. A quiz score can't tell you how sure someone feels. A wrong answer about allergens isn't a training problem; it's a guest's health and the restaurant's liability.

**Insight that wins the room.** FirstShift's most distinctive feature isn't the translation; translation is expected now. It's the **readiness passport**, which combines what someone answered with how sure they were:
- **Mei** scored 100% but feels unsure → *"Needs a buddy shift."*
- **Jorge** feels confident but missed the allergy checks → *"Double-check."*

No LMS or translation app shows a manager that. It ties language access straight to food safety and to day-one retention. Both moments already exist in the seed data and on screen (see `reference/m3-passport-mei.png`).

**Positioning (a candidate to react to, not final copy).** *Hire in any language. Train in any format. Approve with evidence.* Language and ability are how people get in; **evidence of readiness** is what the business is buying.

**Business impact, in judge-weighted order** (Business Impact 30%, Innovation 20%, Execution & AI 20%, Scalability 20%, Demo 10%):
1. **Manager time.** One entry becomes 8 channel posts in 4 languages, plus task cards. On the pipeline: "50% less manager time per opening", already labelled *pilot target, not a result*. Keep that label in the film.
2. **Risk.** Confident-but-wrong allergen answers are flagged before the first shift.
3. **Throughput.** "Hire to shift-ready" in days, with approvals backed by evidence. The pipeline already shows these, labelled "in demo data".
4. **Reach.** You hire from the people who are actually there: 55.2% of Santa Clara County speaks a language other than English at home, and 46% of chefs and 39% of cooks do too.
5. **Scale.** Roles, languages and locations are data. The Framia video carries **no on-screen text by design**, and captions come from each lesson's cards. So one shoot works in every language, and adding a language means adding text, not re-filming. That is the honest bridge to "global".

**Guardrails** (repeat these in the HyperFrames brief):
- Say "four languages live, built to add more". Never say "every language".
- The 8,324 / ~7,000 figures describe the world, not the product.
- Preferences are "how you learn best", never a disability label. Use the product's own line: *"This is not a medical or disability record."*
- Say "removes unnecessary barriers"; never claim FirstShift "solves disability".
- Every number on screen carries its label ("In demo data" or "Pilot target"), and every statistic gets a small source line.
- Before rendering, re-check each statistic against its source page (Census QuickFacts, National Restaurant Association March 2026, WHO, UNESCO). I didn't re-verify the figures you supplied.

---

## 2. What the real UI offers on camera (ranked by on-camera value)

| Rank | Moment | Where | Why it films well |
|---|---|---|---|
| 1 | **Passport: "Scored 100% but feels unsure"** | `/manager` → Mei | The insight in one frame. Orange flag, emoji confidence column, "learned with" chips |
| 2 | **Seal lands on the hire's phone, in their language, read aloud** | `/t/ana-demo` (Listo), `/t/kevin-demo` (可以上班) | Emotional payoff, with a real spring animation (Framer Motion) |
| 3 | **Approve for shift** on the laptop, then the card moves to Shift-ready | `/manager` | Cause → effect across two devices |
| 4 | **One entry → 7 posts + task cards, "✦ Written by Enter AI"** | `/manager/new` | Visible AI output in 中文 and Español. Cached, so fast |
| 5 | **Format switch: 视频 / 图片 / 听 / 阅读 on the same lesson** | `/t/lin-demo` (phone) | Accessibility shown, not told. Real Framia photos and the allergen spread |
| 6 | **"Set up for you" strip: 朗读, auto read each step** | `/t/lin-demo` | Preferences visibly change the product |
| 7 | **Kind feedback + "How sure are you?"** | Lin's quiz | Warmth and the source of the confidence data |
| 8 | **Daniel's passport: Captions · Visual steps · Seated station + setup notes** | `/manager` → Daniel | Inclusion handled respectfully, from the manager's side |
| 9 | Review alert banner + "(1) Ready for review" in the tab title | `/manager` | A good insert for "never miss a hire" |
| 10 | Job page in Chinese, "How do you work best?" chips, no résumé | `/jobs/2` as Lin | Shows the front door; secondary |

**Weak on camera:** the Learn index, the login page, the full pipeline at rest (too dense unless you push in), and exports.

**Look and feel to keep:**
- Colours: white and #f5f5f7 surfaces; blue #00479a; success green #0f5222 for the seal and Approve; warning #8a3300 for flags.
- Type: SF-style system type, heavy headlines with tight tracking, pill buttons.
- Logo: a blue rounded square with a white check, plus the "FirstShift" wordmark.
- The landing headline **"From first hello to first shift."** is the strongest existing line; consider ending on it.
- Framia assets: `media/allergy.mp4` (15 s, 5 steps × 3 s, **no burned-in text**), the poster, and 5 step photos (`allergy-c1…c5.jpg`).
- Cast (fictional demo data):
  - **Lin Chen** (中文, read aloud)
  - **Mei Huang** (中文, unsure → buddy shift)
  - **Jorge Castillo** (ES, confident but wrong)
  - **Daniel Reyes** (EN, captions / visual / seated)
  - **Ana López** (ES, shift-ready, "Listo")
  - **Kevin Wu** (中文, shift-ready)

Reference captures (2×/3× retina, Enter badge hidden) are in `video/reference/`. Re-capture any time with `node video/capture.mjs`; it needs `playwright-core` and Edge, and it resets the demo data at the end.

---

## 3. How HyperFrames should be used here

HyperFrames ([repo](https://github.com/heygen-com/hyperframes), [docs](https://hyperframes.heygen.com)) turns an HTML page with `data-start` / `data-duration` clips and a paused GSAP timeline into a video file (MP4 and other formats). It renders deterministically with headless Chrome and FFmpeg, and installs skills for Claude Code (`/hyperframes`, `/media-use`, …).

**Requirements on this machine:**
- Node 22 ✓
- FFmpeg ✓
- **No Chrome**, only Edge, so check during `init` which browser HyperFrames uses.

### Recommended production method: three layers

1. **Live UI rebuilt as HTML (the main layer).** Because FirstShift *is* HTML/CSS, the closest shots aren't screen recordings; they're the real DOM:
   - Snapshot each key screen's markup and load the app's own `tokens.css` and `app.css` inside the composition.
   - Then animate *individual elements* with GSAP: the Mei flag sliding in, the confidence emoji pulsing, a card travelling from "Ready for review" to "Shift-ready", the seal springing, the 视频→图片→听 switch.

   This gives pixel-identical UI, perfectly smooth camera moves, focus pulls on any element, and text that stays sharp at 4K. It's the strongest fit for an "Apple launch" feel and keeps the product the hero. The cost is about 15–30 minutes per screen.
2. **Scripted screen recordings (proof layer).** Record 2–4 *genuine* interactions with Playwright `recordVideo` at 2× on the deployed app, and drop them into HyperFrames as `<video>` clips inside a browser or phone frame (catalog: **Browser Device Stage**). Good candidates:
   - AI posts appearing;
   - read-aloud highlighting;
   - the real seal spring;
   - Approve → the card moving.

   These answer "is this real?", and the submission rules want the product running.
3. **Motion graphics (context layer).** Statistics, maps and type. These stay in the gaps around the product, never as stand-alone slides.

### Catalog pieces that fit (names from the HyperFrames catalog)
- **Browser Device Stage**: browser, window or phone chrome with the real recording in the screen slot.
- **Screen Flow Carousel**: hire screens in 中文 / 粵語 / Español / English on one rail. A natural "same lesson, three languages" or "four formats" beat.
- **Focus Swap**: phone ↔ laptop attention swaps (hire finishes → manager sees it).
- **3D UI Reveal** / **App Showcase**: hero entrance for the pipeline or the phone screens.
- **Count Up**: 55.2% → 46%, with the source line underneath.
- **NYC Paris Flight**: an Apple-style map technique (SVG). Adapt it to a Palo Alto pin, then pull back to the Bay Area. Use it for one beat only.
- **Native Notification Pop / Notification Stack**: "Lin is ready for review" landing on the manager's screen; the WeChat / WhatsApp post previews.
- **Typed Prompt**: the manager typing the role once.
- **Caption components** (Clip Wipe, Editorial Emphasis): on-screen captions. The film should be **captioned throughout**; a film about access with no captions undercuts itself.

### Audio
- HyperFrames can add a voiceover (local Kokoro TTS or HeyGen voices), music with automatic ducking, and captions from Whisper.
- Consider **a few words in each language** in Mandarin and Spanish, voiced by teammates, rather than TTS. Real voices make the multilingual claim believable. Check that Kokoro has zh and es voices first if you go with TTS.
- Capture the app's own read-aloud (browser speech) as screen audio for the "听一听" moment.

---

## 4. Structure options (choose one; none is locked)

All three keep the product on screen more than 70% of the time.

**A. "One hire, two screens" (recommended).** A split frame: Lin's phone on the left, the manager's laptop on the right, both real UI, synced on one timeline.
- Context appears as small overlays at the moments that make it relevant: the county statistic arrives when Lin taps 中文, and the chef/cook statistic when the kitchen role appears.
- It builds to the passport insight (Mei / Jorge) and then the seal landing on both screens.
- It closes on the pull-back from the Palo Alto pin, with "4 languages live, built to add more".

Strengths: the product is the protagonist, the progression is causal, and the most important shot (the seal on two screens) is native to it.

**B. "The confidence gap" (insight first).** Cold open on two passports side by side, 100% 😟 vs 💪 ❌ allergens, with a single question. Then rewind to show how FirstShift captured that: post → learn in your format → answer + how sure → approve with evidence.

Strengths: the most memorable. Risk: it needs a strong first 5 seconds of copy.

**C. "Zoom" (local → global).** Open on a map: Palo Alto → county statistic → into the restaurant → product run-through → pull back out past the Bay Area to the world.

Strengths: the cleanest way to show scale. Risk: it most easily turns into a slideshow of statistics. If chosen, cap the map at about 8 seconds in total.

Your LOCAL → WORKFORCE → INCLUSION → PRODUCT → GLOBAL order works best when the first three are folded **into** the product (A), not placed before it.

---

## 5. Product changes that would strengthen the film (ranked by impact ÷ hours, about 5 h to deadline)

1. **Use clean capture state (15 min).** Capture from a local build or hide the "Build with Enter" badge (`capture.mjs` already does this), and press Reset demo before each take.
2. **Seed a hire for filming (30 min).** Daniel is already in review, so his captioned *video* lesson can't be filmed. Add a mid-training hire with prefs `captions + visual + extra_time` on the allergy module, so the film can show captions, the slower video, the larger text and "Take your time".
3. **Make Cantonese (粵語) live: DONE Nov 18 (on prod, e2e-tested).** This is the language I'd add, ahead of Vietnamese.
   - **Why:** Imperial Treasure is a Cantonese restaurant, the persona Mei in `PLAN.md` speaks Cantonese, and the chip is already in the UI as "pilot". Switching it from "pilot" to live **on camera** proves the "a language is data" claim far better than saying it.
   - **Work involved:**
     - `Lang` union and the backend allow-list;
     - about 87 UI strings in `i18n.ts`;
     - about 100 lesson / quiz strings in `modules_*.json` (Traditional script);
     - `BCP47` `zh-HK` for read-aloud (Chrome and Edge ship a Cantonese voice; check);
     - picture descriptions.
   - **Free:** captions and the video come along at no cost, because captions are built from the cards.
   - **Risk:** allergen training is safety content. AI-drafted translations need a quick check by a native speaker; label them "AI-drafted, pending review" otherwise. If time is short, do it after the deadline for Demo Day instead.
4. **Vietnamese (≈2 h, same steps).** Valuable locally; San José's Vietnamese community is one of the largest in the US. It is less tied to this restaurant than Cantonese. It's a good **Demo Day** addition.
5. **A "+ Add a language" manager moment (prototype only).** It would be striking on video (Enter AI drafts the course in a new language while you watch). It isn't built, and faking it would break the honesty rules, so leave it for the pilot.

---

## 6. Next step: what to give HyperFrames

Install, then start the project inside this repo so the captures and CSS are close by:

```bash
npx skills add heygen-com/hyperframes
npx hyperframes init video/film
```

A starting brief for `/hyperframes`. It gives direction, not a storyboard; refine it after choosing A, B or C:

> Make a ~70-second 1920×1080 product launch film for FirstShift, a restaurant hiring-to-shift-ready app built for Imperial Treasure Palo Alto. Apple-keynote restraint: white and #f5f5f7 surfaces, blue #00479a, green #0f5222 for approval, system SF-style type with heavy, tight headlines, pill buttons. The product is the hero. Rebuild key screens from the real UI using `enter-app/src/fs/styles/tokens.css` and `app.css` and the captures in `video/reference/`. Animate real elements; never invent controls or labels. Use Browser Device Stage for screen recordings, Focus Swap between the hire's phone and the manager's laptop, Count Up for statistics with a small source line, and one Apple-style map beat at Palo Alto. Captions on throughout. Story spine (structure A): one hire learns in her language and format on the phone while the manager watches readiness build on the laptop; the passport reveals the confidence gap ("Scored 100% but feels unsure → Needs a buddy shift"; confident but wrong on allergens → Double-check); the manager approves and the seal lands on the phone in her language. Context statistics appear only as overlays tied to product moments. End on "From first hello to first shift." Guardrails: four languages live (EN, 中文, 粵語, ES), "built to add more"; preferences are "how you learn best", never a disability label; every number keeps its "In demo data" or "Pilot target" label. Built on Converge.AI Enter and Framia.

**Asset checklist for HyperFrames:**
- `video/reference/*.png`
- `media/allergy.mp4` and the five step photos
- the app's CSS
- 2–4 Playwright screen recordings (see the layer-2 candidates in §3)
- teammates' voices in 中文 and ES, if you go that way
- a logo SVG (the check mark in `GlobalNav`)
