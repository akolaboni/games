# HANDOFF — games

> Auto-created 2026-09-19 07:54 GMT. **Any agent working here
> must leave this accurate before the session ends.** Contract: `~/Developer/AGENTS.md`.
> This file is the fallback record if a chat transcript is lost.

## State
- **Blewu** (was Needle & Sign; `blewu/index.html`): single-file canvas driving game about Ghana speed limits (km/h signs vs mph dials). Public at https://play.kaditay.com/blewu/ (verified 2026-09-24). The play hub copies this folder at build time (`cd ~/Developer/kaditay/play && npm run build`), so rebuild the hub after every Blewu change. `#test` hash exposes `window.__ns` (skip/tick/bench) for headless checks.
- Ancestral-Combat: see its own folder; served by `ancestral-combat` launch config (8741).

## In flight
- `who-said-it/index.html`: quote attribution game (Nazi-era vs Israeli figures, 36 sourced quotes), copied from Kadi's Downloads on 2026-09-24. Workshop only and hidden on the hub. The 2026-09-24 build adds a validated source-bank check, a five-level evidence-terminal route (euphemism → explicit violence; increasing clue redaction, not a hierarchy of suffering), confidence wagers, Quick Five / Streak / Timeline / Daily modes, layered reveals, archive challenges, a post-game record recap, keyboard progression (`1` / `2` to answer, `N` for next), persistent local best score, hash-routable archive, visible source/context note, and `window.__whoSaidIt` test hook. It still needs a check of every quote and source, especially the 2026-dated ones, before it goes public.
- play.kaditay.com is built in `~/Developer/kaditay/play` (own repo).

## Next
- (v9, 2026-09-24 07:40 GMT, commit 9956b34, artifact v10) Hazards you can see coming, after Kadi said hits were too sudden to read:
  - **Warning first:** a red triangle sign (children, pedestrians or animals) 150–240 m before. Then the person or goats stand visible at the roadside, drawn larger than life far off, with a light halo, a ring at their feet, and an amber tag with live distance (`HAZARD · 84 M / CHILD AT THE KERB`).
  - **The step-out:** slow motion through the 0.67 s reaction; the tag turns red; brake lights come on only after the reaction. `stepOut()`/`runHazard()` script the stop with the same physics as the card.
  - **Outcome:** stop short (pop "3 m to spare"), or reach them (freeze, thud, then the card). The card gives the speed you reached them at and how far back the cue was visible. Already braking = no reaction time.
  - **Heavy vehicles** get a higher camera (`CAMH` 2800) so the road shows over the roof. On the motorway you pull out round the stopped truck.
  - **Verified:** headless at 30/50/80 km/h (school), 90/110 (goats), 100/120 (truck), rain, steer mode, coach and artic; the 95%-of-limit bot ran all 7 routes with no JS errors.
  - **Next:** Kadi plays it by hand on a real phone with sound on (still never done).
- The "Ewe for 'slowly'" gloss is gone (Kadi: it tribalizes the game). The in-game tag reads "Ghana's new speed limits"; the hub tagline is "Every sign is in km/h." (play@68bf35a).
- play.kaditay.com (the games hub where Blewu becomes PL·001) has its own handoff: `/Users/kadi/Developer/kaditay/play/HANDOFF.md`. Start there for hub work; stay here for game changes.
- Blewu (renamed from Needle & Sign, folder `blewu/`) v8 is live: swipe to steer on touch, swipeable car/road rows with drawn thumbnails. Hub: play.kaditay.com (recommended over games.) for all games, Blewu = PL·001. The hub is built in `~/Developer/kaditay/play`; deploy status lives in its HANDOFF. Earlier: v7: rain mode (braking x2), dramatic crashes with head-on explainer, quieter wind, 7 roads incl. Tema-Aflao, Ashaiman-Akosombo, Akosombo-Ho (Adomi Bridge).
- (v6) Needle & Sign v6 is live (artifact v7, 24 Sep 2026): which-limit quiz on unsigned stretches, limit roundel inside the LEGAL/OVER box, 15 vehicles incl. Pragya, horn (H / Horn pedal), layered crash audio, 3D-shaded scenery (roofs, gutters, shop signs, ECG poles). Next: a hand playtest on a real phone with sound on.
- (v5) Needle & Sign v5 is live (artifact v5): education first. Street-racing look kept for graphics only; heat, pursuits, busted, score, combos, medals and radar removed at Kadi's request. Added: live LEGAL / OVER +N status with the next camera fine, mph->km/h on the gauge, stopping-distance strip on the road, next-sign preview, 'why' moments (someone steps out 14 m ahead in 30 zones, goats 72 m on highways, broken truck 86 m on the motorway; stopping maths 0.67 s + v^2/2a, a=6.4 car / 5 heavy), results with % within limit, moments, notices, late-fee and DVLA timeline, touch pedals and phone HUD scaling. Next: a real hand playtest on a phone.
- (v4) Needle & Sign v4: street-racing look (amber harmattan grade, bloom, grain, speed streaks, race HUD with tach/radar/heat) and a real score loop: pace combo for holding 85-100% of the limit, perfect camera passes, red lights with an amber dilemma, seatbelt check, heat bars, MTTD patrol pull-overs (don't stop = BUSTED), medals and a rap sheet. World runs 1.4x over stretches shortened to 65%. Tune medals in `finish()` (maxScore ratio .7/.45/.25).
- (v3) Needle & Sign v3: full-screen night world after inspiration-library `ui-the-bridge-illustrated-night-world`; the game starts on first gas press; setup and rules live in two drawers; steering and overtaking are an option, off by default (`ns-steer`). v2 notes follow.
- (v2) Road categories 30/50/90/100 are confirmed from the Ghana Police Traffitech-GH FAQ 5.2. The per-vehicle table in L.I. 2519 isn't online; heavy highway/motorway (60/80) are MTTD 2021 figures and flagged unverified in the UI. Next: get the gazetted L.I. 2519 PDF (Assembly Press / Parliament) and replace `LIMITS.heavy`, then share before 1 Oct 2026.

## Decisions
- Needle & Sign: practice notices are labelled 'Practice notice' and never mimic the GPS-MTTD sender, because fake ENV SMS scams are real. Structure borrowed from inspiration-library items: bound-to-focus (ticket setup), vacation (notice card), taste-labs (drill hero), unseen (sound doorway), nair.cx (opt-outs).
- Needle & Sign: no steering on purpose; the game is only about speed. Camera fines use the reported L.I. 2519 automated ladder (GH¢120 x3, 180, 240, 6th = suspension). Route distances are compressed.

## Do not
- Do not gloss the name Blewu as Ewe (or any one language) in the game, the hub or anywhere else. Kadi, 2026-09-24: it tribalizes the game.
- The preview pane throttles rAF to ~2 fps, so live play there looks frozen. Use `#test` + `__ns.tick()` to exercise the logic instead.
