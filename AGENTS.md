# Revolutions Automotive — Local Agent Rules

## Project

- **Project Name:** Revolutions Automotive — Midas-Style Service, Estimator & Appointment Platform
- **Client Details:** Revolutions Automotive, 1-15A Fisherman Dr, Brampton, ON L7A 1B7 | (905) 846-8351

## Active Stack

- HTML5, CSS3, Vanilla ES6+ JavaScript
- Dual UMD engine: `revolutions_engine.js` (`window.RevolutionsEngine` in browser, `module.exports` in Node)
- Headless Node `assert` test suite: `node test_revolutions.js`

## File List

```
.gitignore
AGENTS.md
revolutions_engine.js
app.js
index.html
track.html
safety.html
styles.css
test_revolutions.js
plans/
  prompt_stage2.txt
  prompt_stage6.txt
  prompt_phase2.txt
  prompt_stage6_phase2.txt
  MASTER_ROADMAP.md
  ROADMAP.md
  PHASE2_ROADMAP.md
  prompt_phase3.txt
  PHASE3_ROADMAP.md
  prompt_stage6_phase3.txt
  stage6_phase3_audit.md
  stage6_audit.md
  stage6_phase2_audit.md
  prompt_phase4.txt
  PHASE4_ROADMAP.md
assets/
  hero_bay.jpg
  diagnostics_tech.jpg
  safety_badge.jpg
```

## Test Gate Command

```
node test_revolutions.js
```

## Portability Rule

Always invoke bridge scripts from inside the project directory using relative
parent paths — `python ..\ask_gemini.py` and `python ..\generate_image.py` —
with `--prompt-file`/`--out` flags. Never hardcode absolute machine paths.
Zero shell redirects (`>`, `2>`) and zero shell variables (`$?`, `$VAR`) in
any command.

## Current Status

**Phase 1 complete.** All 3 segments green: engine (68 tests), UI shell +
assets (82 cumulative), controller + anti-drift (91 cumulative). Stage 6
Gemini 4 Argon audit: `AUDIT VERDICT: PASS` (plans/stage6_audit.md).

**Phase 2 complete.** All 3 segments green (148/148 total):
- Segment 1 engine: `DIAGNOSTIC_DECISION_TREE` (5 anomaly branches, 33
  terminals), `MTO_SSC_CHECKLIST_ITEMS` (11 areas, weights sum 100),
  `WORK_ORDER_STATES` (6-state lifecycle), `SEED_WORK_ORDERS`
  (`REV-2048`, `REV-3105`, `REV-4092`), `evaluateDiagnosticWizard`,
  `evaluateSafetyPreCheck`, `lookupWorkOrder`, `createWorkOrder`
  (+27 tests = 118).
- Segment 2 UI: wizard, MTO pre-check and bay tracker sections with all 17
  contract DOM IDs + `#tracker-feedback`, triage badges, score gauge and
  6-stage timeline styling (+15 tests = 133).
- Segment 3 controller: wizard traversal + add-service CTA, safety
  checklist + book-inspection CTA, bay tracker + sample buttons,
  appointment-to-tracker bridge via `createWorkOrder` with
  "Track My Vehicle Now", Phase 2 state persisted under
  `revolutions_automotive_state_v1` (+15 tests = 148).
Stage 6 Gemini 4 Argon audit: `AUDIT VERDICT: PASS`
(plans/stage6_phase2_audit.md). Gate: `node test_revolutions.js`
(148/148 PASSED).

**Phase 3 complete.** All 3 segments green (207/207 total):
- Segment 1 engine: `TIER_CONFIG_DEFAULTS` ($130/hr labor, 5% supplies, $35
  cap, PIN `8351`, active coupons), `SEO_SCHEMA_DATA` (Schema.org AutoRepair,
  Brampton geo 43.7196/-79.7946, telephone +1-905-846-8351, 12-service offer
  catalog), `parseTireSize`, `compareTireSizes` (±3.0% safe/caution fitment),
  `generateVoucherData` (REV-VOUCH-XXXX, 30-day UTC expiry),
  `exportBookingsToCsv` (RFC-4180, 15-column header), `validateOwnerPin`
  (constant-time) (+30 tests = 178).
- Segment 2 UI: `#seo-schema-json` JSON-LD script matching `SEO_SCHEMA_DATA`,
  announcement banner, tire calculator section, voucher modal with
  `#voucher-print-area` + `@media print` isolation, and owner config drawer
  (all 26 contract DOM IDs) (+17 tests = 195).
- Segment 3 controller: tire comparison with speedometer/fitment badges,
  voucher printing with empty-estimate guard and `window.print()`, owner
  drawer PIN unlock, live labor-rate/supplies-cap/banner overrides persisted
  in `state.ownerConfig` under `revolutions_automotive_state_v1`, and
  RFC-4180 CSV Blob download (`revolutions_automotive_bookings.csv`)
  (+12 tests = 207).
Stage 6 Gemini 4 Argon audit: `AUDIT VERDICT: PASS`
(plans/stage6_phase3_audit.md). Gate: `node test_revolutions.js`
(207/207 PASSED).

**Phase 4 complete.** All segments green (224/224 total, append-only test
growth from 207):
- Clear All controls: `#btn-clear-symptoms` next to `#symptom-chips` and
  `#btn-clear-services` next to `#category-filter-bar` reset symptom and
  service state and return the live estimate to $0.00.
- Multi-sensory add-service feedback: `playAddServiceChime()` (Web Audio
  587 Hz -> 880 Hz, ~150 ms), `#toast-notification` slide-in toast and the
  `.est-highlight-pulse` glow on `#estimate-summary-card`, wired into
  `addServices()` for the wizard and symptom recommendation CTAs.
- Tracker clear/reset: `#btn-track-clear` clears both inputs, technician
  notes and feedback and resets all 6 timeline steps to `is-pending`.
- Page extraction: dedicated `track.html` (Live Repair Bay Tracker with
  URL query support via `URLSearchParams`, e.g. `track.html?code=REV-2048`)
  and `safety.html` (MTO SSC Inspection Hub with reset/cancel actions).
  `index.html` keeps high-converting banner cards linking to both pages;
  legacy tracker/safety panels remain in `hidden` wrappers so the Phase
  2/3 DOM ID contracts and all three anti-drift checks stay intact.
  `app.js` is now page-aware (every bind/render entry point guards on its
  anchor element); "Track My Vehicle Now" deep-links to
  `track.html?code=REV-XXXX` and the safety book CTA pre-selects
  `mto_safety_exhaust` and redirects to `index.html#booking-form`.
Gate: `node test_revolutions.js` (224/224 PASSED).

**Phase 5 complete.** PIPEDA privacy redaction on the public bay tracker
(238/238 total, append-only test growth from 224):
- Engine: `maskCustomerName` ("Priya Grewal" -> "Priya G.", empty/invalid ->
  "Customer Vehicle"), `maskLicensePlate` ("CJKD 905" -> "*** 905"),
  `maskPhoneNumber` ("(905) 555-0192" -> "***-***-0192"), all exported for
  unit testing. `lookupWorkOrder(query, phoneOrPlate)` now returns a
  sanitized public view (masked name/phone/plate, invoice total omitted,
  `sanitized: true`) when `phoneOrPlate` is omitted or null; a provided
  phone/plate still acts as secondary verification and returns the full
  record. Passing an empty string preserves the legacy internal bridge
  semantics used by the booking flow.
- Controller: `trackVehicle` converts a blank phone/plate field to an
  unauthenticated (null) query, so public lookups always render the
  sanitized view; `#tracker-technician-notes` never outputs the full last
  name or unmasked plate (`[Year Make Model] | Customer: Priya G. | Plate:
  *** 905`) and omits the estimated total for sanitized views.
- Demo cleanup: `#btn-track-sample-1/2` preserved but wrapped in a
  collapsed `#tracker-demo-tools` container behind the discreet
  `#btn-toggle-demo` ("Staff / Demo Presets"); `?demo=1` in the URL or the
  toggle reveals them. Customers see only the code/phone inputs, track and
  clear buttons.
Gate: `node test_revolutions.js` (238/238 PASSED).

**Phase 6 complete.** Universal phone/plate normalization, plate intake and
duplicate feedback (251/251 total, append-only test growth from 238):
- Engine: `normalizePhoneNumber` (strips non-digits, collapses 11-digit +1
  country code to the 10-digit standard; short input returns the trimmed
  original) and `normalizePlateNumber` (strips whitespace/hyphens/underscores
  /dots, uppercases), both exported. `validateBooking` normalizes the phone
  before the 10-digit check, accepting "(905) 846-8351", "905 846 8351",
  "+1 (905) 846-8351" etc. `createWorkOrder` accepts the new `plate` field
  (stored normalized, e.g. "CJDK905", null when absent) alongside the legacy
  `licensePlate` display field. `lookupWorkOrder` compares phones and plates
  through the normalizers on both sides and still falls back to matching the
  raw query box against phone/plate.
- UI: `#cust-plate` optional plate intake in `#booking-form` ("e.g. CJDK 905",
  maxlength 10, ".field-hint" explains it enables live bay tracking), bound
  to `state.customerPlate`, passed as `plate` into `validateBooking` and
  `createWorkOrder`, and seeded with "CJDK 905" by the sample loader.
  `#btn-track-vehicle` normalizes phone-shaped searches to 10 digits and
  plate-shaped searches to the universal plate form before lookup.
- Duplicate feedback: `addServices` splits requests into `toAdd` and
  `alreadySelected`; new services add normally (chime + toast + pulse), a
  mixed batch toasts "✓ Added N service(s) (M already in estimate)", and a
  fully-duplicate request pulses the estimate card with the toast "ℹ
  Recommended service(s) are already added to your estimate" instead of
  staying silent.
Gate: `node test_revolutions.js` (251/251 PASSED).
