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
  stage6_audit.md
  stage6_phase2_audit.md
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
(148/148 PASSED). **Phase 3 pending.**
