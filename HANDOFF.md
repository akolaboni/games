# HANDOFF — games

> Auto-created 2026-09-19 07:54 GMT. **Any agent working here — Claude Code, Codex, Cursor —
> must leave this accurate before the session ends.** Contract: `~/Developer/AGENTS.md`.
> This file is the fallback record if a chat transcript is lost.

## State
- **Blewu** (was Needle & Sign; `blewu/index.html`): single-file canvas driving game about Ghana speed limits (km/h signs vs mph dials). Live as a private Claude artifact: https://claude.ai/artifact/4C5A7R7UDxTQh1SA28wSeW. Local preview: launch config `blewu` (port 8742). `#test` hash exposes `window.__ns` (skip/tick/bench) for headless checks.
- Ancestral-Combat: see its own folder; served by `ancestral-combat` launch config (8741).

## In flight
_What is half-done, and in which files._

## Next
- Blewu (renamed from Needle & Sign, folder `blewu/`) v8 is live (artifact v9, 24 Sep 2026): swipe to steer on touch, swipeable car/road rows with drawn thumbnails. Hub: a kaditay.com subdomain for all games (play. recommended over games.), Blewu first; homepage prototype in progress. Earlier: v7: rain mode (braking x2), dramatic crashes with head-on explainer, quieter wind, 7 roads incl. Tema-Aflao, Ashaiman-Akosombo, Akosombo-Ho (Adomi Bridge).
- (v6) Needle & Sign v6 is live (artifact v7, 24 Sep 2026): which-limit quiz on unsigned stretches, limit roundel inside the LEGAL/OVER box, 15 vehicles incl. Pragya, horn (H / Horn pedal), layered crash audio, 3D-shaded scenery (roofs, gutters, shop signs, ECG poles). Next: a hand playtest on a real phone with sound on.
- (v5) Needle & Sign v5 is live (artifact v5): education first. Street-racing look kept for graphics only; heat, pursuits, busted, score, combos, medals and radar removed at Kadi's request. Added: live LEGAL / OVER +N status with the next camera fine, mph->km/h on the gauge, stopping-distance strip on the road, next-sign preview, 'why' moments (someone steps out 14 m ahead in 30 zones, goats 72 m on highways, broken truck 86 m on the motorway; stopping maths 0.67 s + v^2/2a, a=6.4 car / 5 heavy), results with % within limit, moments, notices, late-fee and DVLA timeline, touch pedals and phone HUD scaling. Next: a real hand playtest on a phone.
- (v4) Needle & Sign v4: street-racing look (amber harmattan grade, bloom, grain, speed streaks, race HUD with tach/radar/heat) and a real score loop: pace combo for holding 85-100% of the limit, perfect camera passes, red lights with an amber dilemma, seatbelt check, heat bars, MTTD patrol pull-overs (don't stop = BUSTED), medals and a rap sheet. World runs 1.4x over stretches shortened to 65%. Tune medals in `finish()` (maxScore ratio .7/.45/.25).
- (v3) Needle & Sign v3: full-screen night world after inspiration-library `ui-the-bridge-illustrated-night-world`; the game starts on first gas press; setup and rules live in two drawers; steering and overtaking are an option, off by default (`ns-steer`). v2 notes follow.
- (v2) Road categories 30/50/90/100 are confirmed from the Ghana Police Traffitech-GH FAQ 5.2. The per-vehicle table in L.I. 2519 isn't online; heavy highway/motorway (60/80) are MTTD 2021 figures and flagged unverified in the UI. Next: get the gazetted L.I. 2519 PDF (Assembly Press / Parliament) and replace `LIMITS.heavy`, then share before 1 Oct 2026.

## Decisions
- Needle & Sign: practice notices are labelled 'Practice notice' and never mimic the GPS-MTTD sender, because fake ENV SMS scams are real. Structure borrowed from inspiration-library items: bound-to-focus (ticket setup), vacation (notice card), taste-labs (drill hero), unseen (sound doorway), nair.cx (opt-outs).
- Needle & Sign: no steering on purpose; the game is only about speed. Camera fines use the reported L.I. 2519 automated ladder (GH¢120 x3, 180, 240, 6th = suspension). Route distances are compressed.

## Do not
- The preview pane throttles rAF to ~2 fps, so live play there looks frozen. Use `#test` + `__ns.tick()` to exercise the logic instead.

<!-- agent-session-log: managed automatically, do not edit below -->
Last session: claude-code · 548a0abd-1aca-404a-ad8b-624937cc7f32 · 2026-09-24 05:30 GMT
Transcript backup: ~/ClaudeBackup/latest/projects/
