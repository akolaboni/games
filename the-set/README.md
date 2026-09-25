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

Open `index.html` through a local HTTP server. The YouTube IFrame Player API loads videos after a player clicks Start. A network connection and videos that allow embedding are required. If a video is unavailable, use its direct link and skip the round. No audio or video files are stored here.

Edit the fixed set in `setlist.js`. Each round has a YouTube video ID, start cue, challenge, choices, answer, and bridge copy. Keep quoted lyric fragments short and check the answer against the artist's own video or official materials. The game clock starts on actual playback, pauses when the video pauses, and stops awarding the time bonus at zero while still accepting an answer. Correct answers score 2 points inside the window or 1 afterward.

This game intentionally leaves the YouTube player visible. YouTube may display the song title or artist, making guess rounds honor-system play. The video remains playable after the reveal until the player chooses Next.
