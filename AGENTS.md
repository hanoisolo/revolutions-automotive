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
test_revolutions.js
index.html
styles.css
plans/
  prompt_stage2.txt
  MASTER_ROADMAP.md
  ROADMAP.md
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

Stage 1 & Stage 2 complete. **Phase 1 — Segments 1 and 2 complete**
(engine + tests 82/82 green; index.html, styles.css and 3 AI assets).
**Phase 1 — Segment 3 pending** (app.js controller + anti-drift tests).
