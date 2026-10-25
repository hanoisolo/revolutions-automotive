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
plans/
  prompt_stage2.txt
  MASTER_ROADMAP.md
  ROADMAP.md
assets/
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

Stage 1 & Stage 2 complete (Master Roadmap generated at
`plans\MASTER_ROADMAP.md`, mirrored to `plans\ROADMAP.md`).
**Phase 1 pending** — no application code written yet.
