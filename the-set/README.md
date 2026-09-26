# The Set

A six-song, video-led party game: guess the song and finish a lyric. It is a workshop game for `play.kaditay.com`, sourced from `~/Developer/games/the-set/`.

## Mini spec

- **Goal:** make music recognition playful without rushing people past the song.
- **Platform:** static browser game linked from the Play shelf.
- **Data:** an ordered `window.THE_SET` array in `setlist.js`; each cut has its official YouTube ID, question, answers, time window, and bridge to the next cut.
- **Screens:** sleeve-like intro, video and challenge round, song reveal that keeps the video running, final setlist.
- **Decisions:** mixed decades and genres; later levels have shorter answer windows, not sped-up audio. Six fixed songs; no shuffle.
- **Defaults:** multiple-choice answers for fast group play; 55 to 28 second windows; untimed correct answers earn one point; direct YouTube fallback if embedding fails.
- **Out of scope for this round:** playlists submitted by players, accounts, leaderboard, beatmatched audio transitions, and a released PL number.

Run `npm run dev`, then open `http://127.0.0.1:4329/`. Opening `index.html` directly as a `file://` URL gives YouTube no usable web origin and can leave its embedded player blank. The game now detects that case and shows a playable direct YouTube link inside the illustrated stage. The local server sends a `strict-origin-when-cross-origin` referrer policy, as YouTube expects for embedded players.

The stage has an original SVG singing host. Their head idles gently; head, mouth, microphone arm, notes, and speaker bars animate more strongly when the YouTube Player API reports playback or the direct video link is chosen. Each song has a hand-tuned motion interval in `setlist.js`; this gives a tempo-matched feel without reading or altering YouTube audio. Reduced-motion preferences stop the animation. If the embed API fails, times out, or a video blocks embedding, the stage becomes a clear direct-link fallback. External playback is untimed and a correct answer can still earn one point. No audio or video files are stored here.

**Current catalogue limitation (2026-09-26):** all six chosen official song uploads returned YouTube iframe error 150 in the local in-app browser. YouTube documents 150 as an upload owner refusing embedded playback. A YouTube developer sample embedded in the same game, so the player integration itself can work. ABBA's official live video, auto-generated audio upload, a fan upload, and a live cover also returned 150. The current six-song set is preserved for direct YouTube playback; inline video still requires a different embeddable set or different uploader choices. Do not release this as an inline-video game until that is resolved.

Edit the fixed set in `setlist.js`. Each round has a YouTube video ID, start cue, challenge, choices, answer, and bridge copy. Keep quoted lyric fragments short and check the answer against the artist's own video or official materials. The game clock starts on actual playback, pauses when the video pauses, and stops awarding the time bonus at zero while still accepting an answer. Correct answers score 2 points inside the window or 1 afterward.

This game intentionally leaves the YouTube player visible. YouTube may display the song title or artist, making guess rounds honor-system play. The video remains playable after the reveal until the player chooses Next.
