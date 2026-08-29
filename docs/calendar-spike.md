# Calendar feasibility spike (todo.md Task 2)

Date: 2026-08-29
Status: Generation logic implemented and unit-tested; **device verification pending** (requires the user's Android phone; see manual steps below).

## What was built

- `src/reminder/reminder.ts` - fixed constants: 5:00 PM `America/Toronto`,
  15-minute duration, generic title/prompt, stable UID.
- `src/reminder/ical.ts` - standards-compatible ICS generator:
  - `VTIMEZONE` for `America/Toronto` with the US/Canada DST rules
    (EDT -0400 from the second Sunday in March; EST -0500 from the first
    Sunday in November), so the daily 5:00 PM occurrence survives DST
    transitions. A 5:00 PM local event never coincides with the 2:00 AM
    transition instant itself.
  - `DTSTART;TZID=America/Toronto:20260831T170000`, `RRULE:FREQ=DAILY`,
    `VALARM` with `TRIGGER:PT0S` (fires at event start - the chosen
    "non-negative setting" default per spec §9.2).
  - Stable UID `cohere-preparation-checkin-daily@ml-prep-tracker`, CRLF line
    endings, RFC 5545 75-octet folding, TEXT escaping (backslash, semicolon,
    comma, newline).
  - HTTPS-only app URL validation and date validation before download
    (spec §16).
- `src/reminder/googleCalendar.ts` - Google Calendar template URL with
  `ctz=America/Toronto` so Google interprets the naive times in Toronto and
  the daily recurrence follows DST.
- Tests: `tests/ical.test.ts`, `tests/googleCalendar.test.ts` (23 cases).

## Chosen primary route (pending device confirmation)

1. **Primary: `.ics` import.** It carries an explicit `TZID` + `VTIMEZONE`,
   which is the only route whose timezone semantics are fully under our
   control. The Google template link depends on Google's client-side
   interpretation of `ctz` and may behave differently across clients.
2. **Fallback: Google Calendar template URL.** Offered as the one-tap
   "Add to Google Calendar" control; verified manually on Android.

The spec (§9.1) anticipates this: `.ics` is canonical; the Google link is the
convenience route.

## Duplicate-event behavior

Because the UID is stable, standards-compliant clients should treat a
re-import as the same event. Google Calendar does not always honor this for
`.ics` imports and may create a duplicate. The UI (Task 15) must warn:
**delete the old event before re-importing.**

## Manual verification steps (user, Android phone)

1. Build the app (`npm run build`) and either deploy it or use the sample
   artifact generated with:
   `npx tsx scripts/generate-reminder-artifacts.mjs "<deployed-app-url>"`
   (writes `/tmp/reminder.ics` and prints the Google Calendar URL).
2. On Android, send `/tmp/reminder.ics` to the phone and open it; accept the
   import into Google Calendar.
3. Confirm the event "Cohere preparation check-in" appears on
   **2026-08-31 at 5:00 PM** with duration 15 minutes and recurs **daily**.
4. Tap the event body: confirm the description contains the deployed app URL
   and that tapping it opens the Today view.
5. Check the next DST boundary: after **2026-11-01** (EST resumes), the event
   must still show at **5:00 PM**, not 4:00 PM or 6:00 PM.
6. Repeat import once to observe duplicate behavior; record whether a second
   event appears or the import updates the original.
7. Open the Google Calendar URL from `scripts/generate-reminder-artifacts.mjs`
   on Android and confirm the prefilled event matches steps 3-5.
8. Record results below and choose the final primary route for Task 15.

## Results (to be filled by the user)

- [ ] ICS import succeeded at 5:00 PM Toronto
- [ ] Daily recurrence shown
- [ ] Description URL opens the app
- [ ] Post-DST (after 2026-11-01) occurrence still 5:00 PM
- [ ] Re-import duplicate behavior recorded:
- [ ] Google Calendar URL prefilled correctly
- [ ] Chosen primary route:
