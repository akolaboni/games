# The Set — decisions

- Separate workshop game on play.kaditay.com, not a mode inside Crate Five.
- One authored six-song sequence across decades and genres. The order is fixed, with a short curator note connecting each track to the next. No shuffle.
- Two round types alternate: finish one short lyric fragment and guess the song. The original YouTube embed stays visible and usable.
- Each level shortens the scored answer window (55, 48, 42, 36, 32, 28 seconds). This changes the challenge pace, not the playback speed. The clock runs only while the video plays. A correct answer after it expires still earns one point; a timely one earns two.
- Video playback never stops on answer or timeout. After a round, the player decides when to advance, so the reveal can breathe and the song can keep playing.
- YouTube's embedded player may show the title, so song identification is an honor-system party round. We do not cover, crop, or alter the player.
- This first set uses official artist videos. Embedding availability can change; player errors expose a direct YouTube link and a skip action. The game hosts no copies of the videos or full lyrics.
- Starter set: ABBA → Michael Jackson → Outkast → Rihanna → Daft Punk → Wizkid & Tems. Year values describe the songs, not their YouTube upload dates.
- 2026-09-26 arcade pass: added an original lime 2D singing host beside the unobscured player, a brighter stage and answer card, level and streak feedback, and per-song CSS motion intervals active during playback. The reference direction comes from Kadi's supplied neon arcade, music hardware, illustrated karaoke, and colourful multiple-choice images; none are copied as assets.
- Direct `file://` opening is a documented failure path for YouTube embeds. The game detects it and replaces the empty frame with a direct watch link; `npm run dev` serves the game over HTTP with a referrer policy for proper embedding. YouTube can still reject individual uploads or embedded browsers, so player errors and API timeouts also use that fallback.
- 2026-09-26 embed QA: all six current official uploads reported iframe error 150 in the local in-app browser; several alternate ABBA uploads did too. A YouTube developer demonstration video loaded in the same game, confirming that the integration can embed allowed videos. Preserve the set and present direct playback until a curated embeddable catalogue is chosen. The round UI never overlays or hides the YouTube player.
