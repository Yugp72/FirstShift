# Plan: real interview scheduling

## Where it stands today
- **Applicant side:** after applying, `POST /api/careers/jobs/:id/apply` returns three made-up slots, built by `interviewSlots()` in `core.ts`: the next three weekdays at 3:00 PM PT.
  - The applicant can tap one, but nothing is saved.
  - The page says "Interview times are a demo preview."
- **Manager side:** "Schedule interview" on each Applied card (`Ticket.tsx`) is a disabled `DemoOnly` button.
- **What works:** apply → hire → training → approve all work for real. Only the interview step in between is pretend.

## Goal
1. An applicant books a real time in their own language, without a résumé or a phone call.
2. They can ask for what they need, such as an interpreter, a text-only interview or a seated room.
3. The manager sees every booked interview on the pipeline, records the outcome in one tap, and "Hire" follows from that.

## Data (in the existing `fs_state` JSON row, so no new tables)
```ts
availability: {                     // per location, set by the manager
  tz: "America/Los_Angeles",
  windows: { weekday: 1-5, start: "14:00", end: "17:00" }[],
  slot_minutes: 20, per_slot: 1,    // per_slot > 1 allows group interviews
  blackout: string[]                // ISO dates, e.g. holidays
}
interview: {
  id, candidate_id, job_id,
  start_utc: string,                // stored in UTC, always shown in PT
  mode: "in_person" | "phone" | "video" | "text",
  needs: ("interpreter_zh" | "interpreter_es" | "sign_language" | "text_only" | "seated" | "extra_time")[],
  status: "booked" | "rescheduled" | "cancelled" | "done" | "no_show",
  outcome?: "hire" | "hold" | "no",
  manager_note?: string, created_at, updated_at
}[]
```
The versioned save already retries on conflict, so two people can't take the last seat in a slot. When booking, re-check that the slot is free inside the same retry.

## API (added to `core.ts`; all go through the existing handler and session checks)
| Route | Who | What |
|---|---|---|
| `GET /api/jobs/:id/slots?lang=` | public | Open slots for the next 10 days, from availability minus bookings, labelled in the applicant's language |
| `POST /api/me/applications/:id/interview` | applicant | Book `{start_utc, mode, needs}`; returns a confirmation in their language |
| `POST /api/interviews/:id/reschedule` · `/cancel` | applicant or manager | Moves or frees the slot; the other side sees it on their next poll |
| `GET /api/interviews?from=&to=` | manager | The manager's interview list |
| `POST /api/interviews/:id/outcome` | manager | `hire` calls the existing hire flow (training link + QR); `hold` and `no` send a kind, translated message |
| `GET /api/interviews/:id/ics` | applicant or manager | Calendar file for Apple, Google or Outlook |
| `GET/PUT /api/manager/availability` | manager | Edit availability windows |

## Screens
**Applicant (`Jobs.tsx`, after Apply)**
- The current slot chips become real, loaded from `/slots`.
- Under the chips, the applicant picks how to meet: "In person · Phone · Video · Text chat".
- They can also tick "I'd like…": a Mandarin or Spanish interpreter, sign language, a text-only interview, somewhere to sit, or extra time. These are the same kind of work-preference chips as today, not disability questions.
- The confirmation card appears in their language and includes:
  - a read-aloud button;
  - "Add to calendar" (the `.ics` file);
  - Reschedule and Cancel.
- "My applications" shows the booked time and its status.

**Manager (pipeline)**
- A new **Interviews today** strip sits above the board. It uses the same banner style as the new review alert, with role `status` for screen readers.
- Each Applied card shows the booked time, the meeting type and badges for the applicant's needs (for example "Mandarin interpreter" or "Text-only").
- "Schedule interview" becomes real. It opens a dialog (using `useDialog`, so focus is trapped and Esc closes it) with the next open slots, for applicants who haven't booked one.
- After the interview: **Hire · Hold · Not this time**. Hire runs the existing hire flow, so the training link and QR appear exactly as they do now.
- An availability editor sits in the manager header, next to "Reset demo".

## Accessibility and language
- Times are written out in full in the applicant's language (for example "Thursday, November 19, 3:00 PM Pacific"), not only as numbers.
- Booking has no countdown or timed hold. Slots are re-checked when the applicant submits, and if one was taken they see a kind "That time was just taken, here are the next three".
- **Text-only interview:** a simple chat page where the manager types in English, and the applicant reads and replies in their own language. Enter AI translates both ways, using the existing `translate` task and cache. This is the strongest feature here for deaf, hard-of-hearing and limited-English applicants.
- Interpreter requests show on the manager's card and in the confirmation, so nobody arrives unprepared.

## Messages and reminders
- **Phase 1:** in-app only. The applicant's page and the manager's board already poll every 3 seconds.
- **Phase 3:** email or SMS confirmation plus reminders 24 hours and 2 hours before.
  - These need a scheduled job, such as Supabase `pg_cron` or a scheduled Enter function.
  - Message text is translated once with Enter AI and cached.

## Edge cases
- **Daylight saving:** store times in UTC and build slots in `America/Los_Angeles` with the same weekday check that fixed the Sunday bug.
- **Double booking:** the re-check inside the versioned save prevents it.
- **No-shows:** after 15 minutes, the manager can mark one with a single tap, and the applicant can rebook once.
- **Closed jobs:** closing a job post cancels its future interviews and sends a translated note.
- **Demo reset:** clears interviews and keeps the default availability.

## Phases
| Phase | Scope | Effort |
|---|---|---|
| **1. Demo-ready** | Fixed availability (weekdays 2–5 PM, 20 min), real booking, confirmation in the applicant's language, booked time on the manager's card, Interviews today strip, Hire/Hold/No outcome, `DemoOnly` button replaced | ~3–4 hours |
| **2. Pilot-ready** | Availability editor, reschedule and cancel, `.ics` files, needs chips, translated outcome messages, no-show handling | ~1 day |
| **3. Production** | Email/SMS reminders, Google/Outlook calendar sync, video links, the text-only interview room | ~2–3 days |

## Testing
- Extend `e2e_fn.py` to cover:
  - book → see it on the board → reschedule → cancel;
  - two applicants racing for one seat (exactly one wins);
  - outcome Hire → training link works;
  - a slot that falls on the DST change;
  - Chinese and Spanish confirmations.
- Run the same contrast and keyboard checks used for the accessibility pass on the new dialog and strip.
