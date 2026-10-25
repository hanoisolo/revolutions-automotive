# Phase 4 Roadmap — Page Extraction, Clear Controls & Multi-Sensory Feedback

Source spec: `plans/prompt_phase4.txt` (user-requested, verbatim).
Constraint: all 207 existing assertions stay untouched and green; only
additive test appends are allowed.

## Binding architecture constraints (from Stage 1 context map)

1. Three existing anti-drift tests require every `getElementById('x')` /
   `querySelector('#x')` literal in `app.js` to exist verbatim as `id="x"` in
   `index.html`. Therefore `index.html` must retain every ID `app.js` touches,
   including the extracted safety/tracker surfaces (kept inside `hidden`
   legacy panels) — this is the spec's "maintain required anchor tags/IDs"
   clause.
2. Phase 2/3 tests pin section copy (`Ontario Safety Standards Certificate
   (MTO SSC) Pre-Check`, `Book Official MTO Safety Inspection`, tracker
   placeholders, sample button labels, the 6-stage `<ol id="tracker-status-timeline">`,
   quick-nav anchors `#wizard-section`, `#safety-precheck-section`,
   `#bay-tracker-section`) inside `index.html`.
3. `app.js` is shared by all three pages, so `init()` and every bind/render
   entry point must be page-aware: skip modules whose anchor element is
   absent on the current page. The anti-drift regex still sees the literals,
   and `index.html` still defines them, so the checks stay intact.

## Segments (1-3 code files each, gate: `node test_revolutions.js`)

### Segment 1 — Clear All controls (spec #1)
Files: `index.html`, `app.js`
- Add `#btn-clear-symptoms` next to `#symptom-chips` and
  `#btn-clear-services` next to `#category-filter-bar`.
- `app.js`: `clearAllSymptoms()` empties `state.activeSymptoms`, re-renders
  chips and clears `#symptom-recommendations`; `clearSelectedServices()`
  empties `state.selectedServiceIds`, re-renders grid and estimate ($0.00).
Gate: 207/207 still green.

### Segment 2 — Multi-sensory feedback + tracker clear (spec #2, #3)
Files: `index.html`, `app.js`, `styles.css`
- Add `#toast-notification` slide-in toast and `#btn-track-clear` next to
  `#btn-track-vehicle`.
- `app.js`: `playAddServiceChime()` (Web Audio 587 Hz -> 880 Hz, ~150 ms),
  `notifyAddedServices(count)` (toast + `.est-highlight-pulse` on
  `#estimate-summary-card`), wired into `addServices()` for the wizard and
  symptom "Add Recommended" paths; `clearTrackerPanel()` resets inputs,
  notes, feedback and all 6 timeline steps to `is-pending`.
- `styles.css`: `.toast-notification` slide-in, `.est-highlight-pulse`
  keyframes.
Gate: 207/207 still green.

### Segment 3 — `track.html` + homepage tracker banner (spec #4)
Files: `track.html` (new), `index.html`, `app.js`
- `track.html`: dedicated Live Repair Bay Tracker page (header nav back to
  Home, shop hours, direct call button, full tracker ID set incl.
  `#btn-track-clear`), shares `styles.css` / `revolutions_engine.js` /
  `app.js`.
- `index.html`: `#bay-tracker-section` becomes a high-converting banner card
  linking to `track.html`; the legacy tracker panel (all contract IDs) is
  retained inside a `hidden` wrapper.
- `app.js`: page-aware guards for every bind/render entry point;
  `trackFromUrl()` parses `?code=` via `URLSearchParams` and auto-runs the
  lookup on `track.html`; "Track My Vehicle Now" bridge now navigates to
  `track.html?code=REV-XXXX`.
Gate: 207/207 still green.

### Segment 4 — `safety.html` + homepage safety showcase (spec #5)
Files: `safety.html` (new), `index.html`, `app.js`
- `safety.html`: dedicated MTO SSC Inspection Hub with checklist, gauge,
  summary alert, `#btn-safety-book-inspection` (adds `mto_safety_exhaust` to
  state and redirects to `index.html#booking-form`), `#btn-safety-reset`,
  `#btn-safety-cancel`.
- `index.html`: `#safety-precheck-section` becomes the
  `assets/safety_badge.jpg` showcase with "Launch Interactive MTO Pre-Check →"
  CTA to `safety.html`; legacy checklist/gauge/alert/book CTA retained in a
  `hidden` wrapper.
- `app.js`: `resetSafetyChecklist()`, safety cancel binding, cross-page
  book-inspection redirect, guards for safety renders.
Gate: 207/207 still green.

### Segment 5 — Additive test append (spec #6)
Files: `test_revolutions.js`
- New group `Phase 4 - Page Extraction & Feedback`: `track.html` /
  `safety.html` existence + doctype + script order + full ID contracts;
  `#btn-clear-symptoms`, `#btn-clear-services`, `#btn-track-clear`,
  `#toast-notification` in `index.html`; URL parameter handling
  (`URLSearchParams`, `track.html?code=`); chime tokens (587/880,
  `AudioContext`); toast message and `.est-highlight-pulse`; cross-page
  anti-drift (every `app.js` ID exists in at least one page; every ID used by
  the tracker page exists in `track.html`; every ID used by the safety page
  exists in `safety.html`); styles.css toast/pulse/banner rules.
Gate: 207 prior + new tests all green (220+ total).

### Stage 5-6 — Full verification, audit, AGENTS.md, commit
- Full `node test_revolutions.js` run.
- Assertion integrity audit: confirm no prior assertion was weakened, skipped
  or deleted (git diff review of `test_revolutions.js` is append-only).
- Update `AGENTS.md` status to Phase 4 complete; Section 4 secret scan;
  commit with the spec-mandated message.
