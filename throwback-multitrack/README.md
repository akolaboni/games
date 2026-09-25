# Crate Five (throwback-multitrack)

A static browser game based on [Chris Cruise's cumulative track-reveal challenge](https://www.tiktok.com/@djchriscruise/video/7687979489258638606). A song plays one instrument layer at a time: drums, then bass, then the rest. Pick the right record sleeve out of three before the full mix. Guessing on the first layer is worth 5 points and on the full mix 1. A wrong sleeve is crossed out and drops the next layer. There is a daily puzzle with a spoiler-free share result, plus practice mode.

Live for game nights at **https://play.kaditay.com/throwback-multitrack/**, behind a shared password (see "Game-night password").

## Crates

`catalog.json` holds `packs` (crates) and `songs`. Each song has 3–5 aligned stems in reveal order, and the mixer shows as many channels as the song has. When more than one crate has songs, the start screen shows a crate picker.

| Crate | Audio | In git |
|---|---|---|
| `internet`: Internet throwbacks | 12 Kevin MacLeod tracks from incompetech.com (CC BY 4.0), the music behind a decade of YouTube videos. Every reveal card and the start screen's MUSIC CREDITS list show the required credit. | yes |
| `hits`: songs you own | Split locally for private game nights. Never published outside the password gate. | **no** (`assets/songs/hits/` is ignored) |

If `catalog.json` is empty, three browser-synthesized public-domain demo rounds play instead.

## Splitting songs (Demucs)

The splitter runs Demucs `htdemucs_6s` (drums, bass, guitar, piano, other, vocals) on the CPU from a local venv. It cuts one loop from the loudest stretch of each song (about 40 s, rounded to whole bars when the BPM is known). Stems under 4% of the mix fold into "The rest", so the layers still add up to the original. If all six stems survive, guitar and keys merge into one layer. Each song takes about 50 s on this Mac.

One-time setup (already done on Kadi's Mac):

```bash
python3 -m venv .venv
.venv/bin/pip install "torch==2.5.1" "torchaudio==2.5.1" demucs soundfile imageio-ffmpeg
```

Rebuild the Internet crate (the source MP3s download into `.staging/src/`; see `scripts/packs/internet.json`):

```bash
.venv/bin/python scripts/split.py --manifest scripts/packs/internet.json
```

Add real hits for game night: put DRM-free files you own (bought MP3/M4A, not streaming downloads) in `.staging/hits/`, named `Artist - Title (Year).mp3`, then run:

```bash
.venv/bin/python scripts/split.py --pack hits --name "Throwback hits" .staging/hits
```

A crate needs at least 3 songs, or `decoys` in its `packs` entry, to fill three sleeves. Listen to each new song before a game night. Demucs's six-stem model is experimental and can leave bleed between layers; set `start` in a manifest entry to move a clip.

## Play locally

```bash
node scripts/serve.mjs
```

Open `http://127.0.0.1:4321/`. The local server has no password.

## Deploy and game-night password

The play hub (`~/Developer/kaditay/play`) copies this folder at build time because `games.json` marks it `"gate": "password"`. Dotfiles, `scripts/` and `*.md` are left out. `functions/throwback-multitrack/_middleware.js` in the hub makes every file here, including audio, return 401 until someone enters the password. An unlock lasts 12 hours.

```bash
cd ~/Developer/kaditay/play
npx wrangler pages secret put GAME_NIGHT_PASSWORD --project-name play-kaditay   # change the password
npm run deploy                                                                   # ship changes (also needed after a password change)
```

Changing the password logs everyone out.
