# PLAN.md: Imperial Treasure Palo Alto, Hiring → Shift-Ready (Team 33)

**Challenge:** From Hiring to Shift-Ready: streamlining restaurant recruitment and multilingual training.
**Deadline:** Wed Nov 18, 11:59 PM PT (no extensions). Demo Day: Fri Nov 20, 3 PM PT.
**Rule:** the core of the solution must use Converge.AI products. We use **Enter** (the app) and **Framia** (training media).

---

## 1. Pitch in one line

> **One door, every language, every ability, from hello to first shift.**

An end-to-end platform that gets multilingual and disabled candidates hired, trained in the format that works for them, and approved as shift-ready by the manager.

---

## 2. Converge.AI setup (do this first, ~10 min)

### Before you start (each teammate)
- [ ] Create a Converge.AI account at convergeai.com.
- [ ] Check that event credits are on the account (ask in Discord **#converge-ai-help** if not).
- [ ] Sign the participant agreement at consent.wefluens.com.

### Install Enter in Claude Code (one teammate, one shared project)
1. Open Claude Code in an empty project folder.
2. Paste exactly:
   ```
   Install the enter.pro CLI skill from https://github.com/enter-pro/CLI and log me in.
   ```
3. **Manual step:** a browser window opens. Log in to Enter and approve.
4. Then paste:
   ```
   Create a new enter.pro project called Team33_ShiftReady and confirm it exists.
   ```

### Install Framia in Claude Code
1. Open https://framia.converge.ai/plugin and copy the **current install prompt** for your agent.
2. Paste it into the same Claude Code session.
3. **Manual step:** log in to Framia, choose a workspace, and grant access.
4. Test it:
   ```
   Use Framia to generate one test image of a restaurant prep station and give me the link.
   ```

### Rules
- Never paste passwords, tokens or API keys into chat. Log in only through the browser window the tool opens.
- AI features inside the app (translation, quiz grading, voice) use Enter's built-in model access, so there are no extra API keys.
- Approve Claude Code's permission prompts when it runs commands.
- Use **one** Enter project for the whole team.

---

## 3. Demo personas (label as DEMO DATA in the UI)

| Persona | Background | Needs |
|---|---|---|
| **Mei** | Cantonese speaker, limited English | Chinese UI, Cantonese audio, voice answers |
| **Daniel** | Deaf, learns visually | Captions, picture steps, no audio-only content |

---

## 4. The 5 screens (build in Enter)

### Screen 1: Manager, describe the role once
- The manager types: "Weekend dumpling prep, 4 shifts/week."
- The AI generates the job post in **English, Chinese and Spanish**, plus a **plain-language easy-read** version.
- The AI breaks the role into **task cards** (seated prep, standing, lifting, customer-facing), so candidates see which stations fit them.
- Each channel's post is ready to copy. Label it: "Posting to job boards is manual in this prototype."

### Screen 2: Applicant, apply your way
- Apply by **voice** (any language), by typing, or by tapping. **No résumé.**
- Optional **"How do you work best?"** step: captions, visual steps, read-aloud, seated station, extra time.
  - Frame this as work preferences, NOT disability disclosure. Under the ADA, employers generally can't ask about disability before an offer.
- An instant, warm reply in the applicant's language, with interview slots. Mark the slots as mocked.

### Screen 3: Training, one SOP, many ways in (Framia media)
- One real module (allergen or food-safety checklist), available as:
  - a **captioned video** (Daniel)
  - **Cantonese voiceover** (Mei)
  - **picture-step cards** (cognitive or learning disabilities)
  - **screen-reader text + read-aloud** (low vision)
- **Format toggle** on one screen. This is the hero demo moment.

### Screen 4: Quiz, prove it your way
- Answer by voice, tap or picture. Multilingual. **Untimed by default.**
- After each answer: "How sure are you?"
- Flag **confidently wrong allergen answers** for the manager.

### Screen 5: Manager, readiness passport
- Pipeline for each person: Applied → Trained → Passed → **Approved**.
- Each passport shows scores, the formats used, and work-setup notes (e.g. "visual instructions, seated prep station").
- A one-click **Approve for shift** button.

---

## 5. Framia tasks (1 teammate, in parallel)

Paste into Claude Code after Framia is connected:
```
Use Framia to create a 45–60 second training video from this SOP: [paste SOP].
Make two versions: Cantonese voiceover with Chinese + English captions, and English with burned-in captions.
Also create 5 picture-step cards (one image per step, simple, high contrast, minimal text).
Give me the links for each asset.
```
Then:
```
Embed these Framia assets in Screen 3 of the Team33_ShiftReady enter.pro project, with a format toggle: Video+Captions / Cantonese Audio / Picture Steps / Read-Aloud Text.
```

**Get one real SOP or training document from the owner** (contact on the brief). Use only materials the company provides.

---

## 6. Build prompts for Enter (paste one at a time)

```
In the Team33_ShiftReady enter.pro project, build a web app called "ShiftReady" for Imperial Treasure Palo Alto with 5 screens: Manager Role Builder, Applicant Apply, Training, Quiz, Manager Readiness Passport. Use accessible, high-contrast design, large tap targets, keyboard navigation and screen-reader labels. Language switcher: English / 中文 / Español. Mark all seeded people as DEMO DATA.
```
```
Build Screen 1 (Manager Role Builder): a text box for the role description. On submit, use AI to generate the job post in English, Chinese and Spanish, a plain-language easy-read version, and task cards (seated / standing / lifting / customer-facing). Show a copy button per channel. Label posting as manual.
```
```
Build Screen 2 (Applicant Apply): apply by voice, text or tap, in any language, with no résumé. Optional "How do you work best?" preferences: captions, visual steps, read-aloud, seated station, extra time. Show an instant AI reply in the applicant's language with mocked interview slots.
```
```
Build Screen 4 (Quiz): 5 questions from the SOP, multilingual, answers by tap/picture/voice, untimed, plus a "How sure are you?" step. Flag confidently wrong allergen answers.
```
```
Build Screen 5 (Readiness Passport): pipeline Applied → Trained → Passed → Approved for seeded personas Mei and Daniel, showing scores, formats used, work-setup notes, and an "Approve for shift" button that updates state.
```
```
Publish the project and give me the public URL. Check that it works when logged out.
```

---

## 7. 3-hour schedule

| Time | Work | Who |
|---|---|---|
| 0:00–0:15 | Setup (section 2), personas, get SOP from owner | All |
| 0:15–1:45 | Enter: screens 1, 2, 4, 5 | 2 people |
| 0:15–1:15 | Framia: training video + picture cards | 1 person |
| 1:15–1:45 | One-pager + stats slide | 1 person |
| 1:45–2:15 | Embed Framia in screen 3; full end-to-end run | All |
| 2:15–2:45 | Record 2–3 min demo video (product running, not slides) | All |
| 2:45–3:00 | Submit form; set all links to "Anyone with the link" | 1 person |

**Cut first if behind:** Combos game, Spanish version, real voice input (fall back to typing), real scheduling (mocked).
**Never cut:** the live format toggle, Daniel's passport turning green, the published Enter link.

---

## 8. Pitch stats (sources in one-pager)

**Local: multilingual**
- Palo Alto: **42.3%** speak a language other than English at home (Census QuickFacts 2020–2024).
- Santa Clara County: **55.2%** speak a language other than English at home; **41.5%** foreign-born.
- Most common non-English language in the Palo Alto area: **Chinese (Mandarin, Cantonese)**.

**Local: disability**
- Santa Clara County: about **170,100 people (~9%)** have a disability (ACS 2020–2024).
- By type: cognitive 3.7%, hearing 2.3%, self-care 2.2%, vision 1.5%.

**The gap (US, BLS 2025)**
- Working age (16–64): **38.1%** employed with a disability vs **74.8%** without, about half.
- All ages: 22.8% vs 65.2%.

**Global (scale slide)**
- **1.3 billion people (16%, 1 in 6)** live with significant disability (WHO).

**Caveats:** there is no single nine-county Bay Area figure, so use county and city numbers. Don't claim a "multilingual AND disabled" overlap figure; we have no source for one.

---

## 9. Demo script (2 min)

1. **0:00–0:15 Hook:** "In Palo Alto, 4 in 10 people speak another language at home. People with disabilities are employed at half the rate. Imperial Treasure needs staff and can't train them one by one."
2. **0:15–0:35 Manager:** describe the role once → 3 languages + easy-read + task cards.
3. **0:35–0:55 Mei applies by voice in Cantonese** → instant reply in Cantonese.
4. **0:55–1:25 Training:** toggle the same SOP through captioned video → picture steps → Cantonese audio. (Hero moment.)
5. **1:25–1:45 Quiz:** Daniel answers by tapping pictures; one confidently wrong allergen answer gets flagged.
6. **1:45–2:00 Passport:** the manager approves Daniel for shift. "Built on Enter and Framia by Converge.AI."

---

## 10. Submission checklist (by 11:59 PM PT)

- [ ] Team info (number, name, members, emails)
- [ ] Company: Imperial Treasure Palo Alto + assigned challenge
- [ ] Demo video 2–3 min (YouTube unlisted / Loom) showing the product running
- [ ] Working prototype link (published Enter URL, tested logged out)
- [ ] One-page overview: problem, solution, day-to-day use, next steps
- [ ] Converge.AI products used: **Enter, Framia**
- [ ] All files named `Team33_ShiftReady`
- [ ] All links set to "Anyone with the link"
- [ ] Disclose any code that existed before Nov 17
