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
  MASTER_ROADMAP.md
  ROADMAP.md
  stage6_audit.md
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

**Phase 1 complete.** All 3 segments green:
Segment 1 engine (68 tests), Segment 2 UI shell + assets (82 cumulative),
Segment 3 controller + anti-drift (91 cumulative). Gate command:
`node test_revolutions.js` (91/91 PASSED). Stage 6 Gemini 4 Argon audit:
`AUDIT VERDICT: PASS` (plans/stage6_audit.md). **Phase 2 pending.**
