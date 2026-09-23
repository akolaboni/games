# HANDOFF — games

> Auto-created 2026-09-19 07:54 GMT. **Any agent working here — Claude Code, Codex, Cursor —
> must leave this accurate before the session ends.** Contract: `~/Developer/AGENTS.md`.
> This file is the fallback record if a chat transcript is lost.

## State
- **Needle & Sign** (`Needle-and-Sign/index.html`): single-file canvas driving game about Ghana speed limits (km/h signs vs mph dials). Live as a private Claude artifact: https://claude.ai/artifact/4C5A7R7UDxTQh1SA28wSeW. Local preview: launch config `needle-and-sign` (port 8742). `#test` hash exposes `window.__ns` (skip/tick/bench) for headless checks.
- Ancestral-Combat: see its own folder; served by `ancestral-combat` launch config (8741).

## In flight
_What is half-done, and in which files._

## Next
- Needle & Sign v2 is live (artifact v2). Road categories 30/50/90/100 are confirmed from the Ghana Police Traffitech-GH FAQ 5.2. The per-vehicle table in L.I. 2519 isn't online; heavy highway/motorway (60/80) are MTTD 2021 figures and flagged unverified in the UI. Next: get the gazetted L.I. 2519 PDF (Assembly Press / Parliament) and replace `LIMITS.heavy`, then share before 1 Oct 2026.

## Decisions
- Needle & Sign: practice notices are labelled 'Practice notice' and never mimic the GPS-MTTD sender, because fake ENV SMS scams are real. Structure borrowed from inspiration-library items: bound-to-focus (ticket setup), vacation (notice card), taste-labs (drill hero), unseen (sound doorway), nair.cx (opt-outs).
- Needle & Sign: no steering on purpose; the game is only about speed. Camera fines use the reported L.I. 2519 automated ladder (GH¢120 x3, 180, 240, 6th = suspension). Route distances are compressed.

## Do not
- The preview pane throttles rAF to ~2 fps, so live play there looks frozen. Use `#test` + `__ns.tick()` to exercise the logic instead.

<!-- agent-session-log: managed automatically, do not edit below -->
Last session: claude-code · 548a0abd-1aca-404a-ad8b-624937cc7f32 · 2026-09-23 07:43 GMT
Transcript backup: ~/ClaudeBackup/latest/projects/
