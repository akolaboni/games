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
- Needle & Sign: verify the limit values in `LIMITS` against the gazetted L.I. 2519 schedule (current values: light 30/50/80/90/100, heavy 30/50/70/70/80 from secondary sources). Then share the artifact link.

## Decisions
- Needle & Sign: no steering on purpose; the game is only about speed. Camera fines use the reported L.I. 2519 automated ladder (GH¢120 x3, 180, 240, 6th = suspension). Route distances are compressed.

## Do not
- The preview pane throttles rAF to ~2 fps, so live play there looks frozen. Use `#test` + `__ns.tick()` to exercise the logic instead.

<!-- agent-session-log: managed automatically, do not edit below -->
