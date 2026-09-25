# HANDOFF — games

## Update 2026-09-25 17:15 GMT — Crate Five live for game nights
- **Live:** https://play.kaditay.com/throwback-multitrack/ behind a shared password (Kadi: "publically deployed. but only game nights with a password"). Every file there, audio included, returns 401 until the password is entered; an unlock lasts 12 h. The gate is `~/Developer/kaditay/play/functions/throwback-multitrack/_middleware.js`, and the password is the Pages secret `GAME_NIGHT_PASSWORD`. To change it: `npx wrangler pages secret put GAME_NIGHT_PASSWORD --project-name play-kaditay`, then `npm run deploy`. The hub card stays NEXT UP, so strangers aren't sent to a locked door.
- **Internet throwbacks crate (12 songs, live):** Kevin MacLeod tracks (CC BY 4.0) split by Demucs `htdemucs_6s` on the CPU: Monkeys Spinning Monkeys, Sneaky Snitch, Fluffing a Duck, Investigations, Local Forecast – Elevator, Carefree, Wallpaper, Pixel Peeker Polka, Scheming Weasel, Hyperfun, Kool Kats, Funkorama. Credits are on every reveal card and in MUSIC CREDITS on the start screen. Layer names come from incompetech's instrument lists plus a spectral check (for example, Monkeys is Low strings → Strings → The rest).
- **Hits crate (not started):** real hits need audio files Kadi owns. Drop DRM-free files named `Artist - Title (Year).mp3` in `throwback-multitrack/.staging/hits/`, run `.venv/bin/python scripts/split.py --pack hits --name "Throwback hits" .staging/hits`, then `npm run deploy` in the hub. The crate picker appears automatically. Hits audio is git-ignored.
- **Game changes:** songs have 3–5 layers (quiet stems fold into "The rest"), points run 5 → 1 across however many layers a song has, crates have their own decoy titles, generated covers vary in colour, and counters pad to two digits (the old code showed "02 / 012"). `scripts/split.py` replaced `prepare-song.mjs`, and the venv is `throwback-multitrack/.venv` (git-ignored, excluded from builds).
- **Verified:** all 58 stems decode with zero length spread, a local round plays at 1440 px and 375 px (wrong pick drops a layer; correct pick scores; credit shows), the gate middleware passes 8 Node checks, and the live site returns 401 without the password and 200 with it. A cache-busted `game.js` contains the new code, and tooling paths fall through to the hub page.
- **Not verified:** nobody has *listened* to the splits. Before the first game night, play each song with sound on. If one bleeds badly or the loop lands badly, set `start` or `labels` in `scripts/packs/internet.json` and rerun with `--only "<title>"`.

## Update 2026-09-25 — Multitrack rack and three-choice reveal
- Kadi asked for more visual depth and fewer text interactions. `throwback-multitrack/` now has a wood/metal rack, three illustrated record-sleeve options, and a tilted reveal card with custom SVG cover art, artist, title and year. Wrong options are crossed out and advance the stem/point countdown; correct options finish the round. The intro no longer shows the saved-result sentence.
- The local server now serves SVG covers with the correct MIME type. Desktop and 375px phone layouts were visually checked; a wrong option crossed out and advanced the stem, and the tilted reveal displayed the custom cover and artist. Daily and practice, stem audio, timing and sharing remain. Release remains workshop-only.

## Update 2026-09-25 — Multitrack arcade redesign
- Kadi said the first game looked too much like text. Rebuilt `throwback-multitrack/index.html` and `style.css` around a playable turntable, prominent countdown, five visual channel strips with fader/LED states, and a score medal. The next channel is tappable to reveal early; point value drops from 5 to 1 as layers arrive. Daily mode and share behavior remain.
- Checked desktop and 375px phone previews, console errors (none), and an early channel tap; the mixer moved from one to two live stems and potential points from 5 to 4.

## Update 2026-09-25 — Throwback Multitrack
- `throwback-multitrack/` now implements the requested five-stage reveal, title autocomplete, 5-to-1 scoring, daily share result, practice mode, and a real synchronized Web Audio stem loader. Three browser-synthesized public-domain demo arrangements play until a cleared throwback catalog is added.
- `scripts/prepare-song.mjs` stages six-stem Demucs separation, aligned FFmpeg clips, and catalog metadata outside the site source. Neither tool nor a source recording is present here; separation has not run. A generated five-stem WAV fixture verified the browser loader and was removed. See `throwback-multitrack/README.md` and `DECISIONS.md`.
- The game remains workshop-only in the Play hub. No commercial audio is in this repo or deployed.

> Auto-created 2026-09-19 07:54 GMT. **Any agent working here
> must leave this accurate before the session ends.** Contract: `~/Developer/AGENTS.md`.
> This file is the fallback record if a chat transcript is lost.

## State
- **Blewu** (was Needle & Sign; `blewu/index.html`): single-file canvas driving game about Ghana speed limits (km/h signs vs mph dials). Public at https://play.kaditay.com/blewu/ (verified 2026-09-24). The play hub copies this folder at build time (`cd ~/Developer/kaditay/play && npm run build`), so rebuild the hub after every Blewu change. `#test` hash exposes `window.__ns` (skip/tick/bench) for headless checks.
- Ancestral-Combat: see its own folder; served by `ancestral-combat` launch config (8741).

## In flight
- `who-said-it/index.html`: quote attribution game (Nazi-era vs Zionist figures, 36 sourced quotes), copied from Kadi's Downloads on 2026-09-24. Workshop only and hidden on the hub. The 2026-09-25 combat build makes a five-round fighter match: choose a character, identify the speaker in 15 seconds; correct attribution makes the player's fighter hit the CPU; wrong/time-out triggers a counter-hit. Each hit removes 25 HP, knockout ends early, and round five compares remaining HP. The top HUD shows both fighters' health plus EVIL LEVEL meters summing language-intensity levels of sampled source-linked quotes; results name the evil-level leader for the match. Verdict cards show check/X, attribution, quote, context, source and Next; match-end recap lists each source behind each side's meter. Fighter art lives in `who-said-it/assets/archivist-3d.png` and `who-said-it/assets/advocate-3d.png`. Quick Five / Streak / Timeline / Daily modes, archive challenges, local best score and hash-routable archive remain. Still review every quote/source, especially 2026-dated ones, before public release.
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

<!-- agent-session-log: managed automatically, do not edit below -->
Last session: claude-code · fa0b4ae2-de95-4592-9290-e31712c29522 · 2026-09-25 16:54 GMT
Transcript backup: ~/ClaudeBackup/latest/projects/
