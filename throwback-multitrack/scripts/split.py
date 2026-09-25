#!/usr/bin/env python3
"""Split songs into the game's layered stems with Demucs (htdemucs_6s) and add them to catalog.json.

  A pack manifest:   .venv/bin/python scripts/split.py --manifest scripts/packs/internet.json
  A folder of files: .venv/bin/python scripts/split.py --pack hits .staging/hits
                     (files named "Artist - Title (Year).mp3"; any format ffmpeg reads)

Each song gets one loop-length clip, cut from its loudest stretch unless the manifest gives `start`.
A manifest song can rename layers with `labels`, e.g. {"guitar": "Strings"}: Demucs names stems by pop-band role.
Quiet stems fold into "the rest" so the layers still add up to the original mix. Only split audio you may use.
"""
import argparse, json, re, subprocess, sys, time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / 'catalog.json'
SR = 44100
CLIP = 40.0                      # seconds; the game loops it while a new layer arrives every 10 s
PAD = 3.0                        # context either side of the clip so Demucs has no cold edges
QUIET = 0.04                     # stems under 4% of the mix's RMS don't earn their own layer
ORDER = ['drums', 'bass', 'guitar', 'piano', 'keys', 'other', 'vocals']
LABEL = {'drums': 'Drums', 'bass': 'Bass', 'guitar': 'Guitar', 'piano': 'Keys', 'keys': 'Guitar & keys', 'other': 'The rest', 'vocals': 'Vocals'}


def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def decode(path):
    import imageio_ffmpeg
    raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).T.copy()


def rms(x):
    return float(np.sqrt(np.mean(np.square(x, dtype=np.float64)))) if x.size else 0.0


def clip_length(bpm, song_seconds):
    length = CLIP
    if bpm:  # whole bars, so the loop point lands on the beat
        bar = 240.0 / bpm
        length = max(1, round(CLIP / bar)) * bar
    return min(length, song_seconds)


def loudest_start(mix, length):
    hop = SR // 4
    frames = mix.shape[1] // hop
    energy = np.square(mix[:, :frames * hop].mean(0)).reshape(frames, hop).mean(1)
    width = int(length * 4)
    if frames <= width:
        return 0.0
    sums = np.convolve(energy, np.ones(width), 'valid')
    lo = min(int(frames * 0.08), len(sums) - 1)  # skip count-ins and fade-ups
    return (lo + int(np.argmax(sums[lo:]))) * hop / SR


def load_model():
    import torch
    from demucs.pretrained import get_model
    model = get_model('htdemucs_6s')
    model.eval()
    return model, 'cpu'  # htdemucs needs ops that Apple's MPS backend lacks (torch 2.5)


def separate(model, device, seg):
    import torch
    from demucs.apply import apply_model
    wav = torch.from_numpy(seg)
    ref = wav.mean(0)
    mean, std = ref.mean(), ref.std() + 1e-8
    with torch.no_grad():
        out = apply_model(model, ((wav - mean) / std)[None], device=device, shifts=1, split=True, overlap=0.25, progress=False)[0]
    out = out * std + mean
    return {name: out[i].cpu().numpy() for i, name in enumerate(model.sources)}


def layers_for(stems, mix):
    level = {k: rms(v) / max(rms(mix), 1e-9) for k, v in stems.items()}
    layers = {k: stems[k].copy() for k in ORDER if k in stems and level[k] >= QUIET}
    if not layers:
        raise ValueError('every stem is quiet')
    sink = 'other' if 'other' in layers else max((k for k in layers if k != 'drums'), key=level.get, default=next(iter(layers)))
    for k, v in stems.items():
        if k not in layers:
            layers[sink] += v
    if len(layers) > 5:
        layers['keys'] = layers.pop('guitar') + layers.pop('piano')
    order = [k for k in ORDER if k in layers]
    if len(order) < 3:
        raise ValueError(f'only {len(order)} audible layers ({", ".join(order)}); the game needs 3–5')
    return order, layers, level


def write_mp3(x, path, kbps=96):
    import lameenc
    enc = lameenc.Encoder()
    enc.set_bit_rate(kbps)
    enc.set_in_sample_rate(SR)
    enc.set_channels(2)
    enc.set_quality(2)
    pcm = (np.clip(x, -1, 1).T * 32767).astype('<i2').tobytes()
    path.write_bytes(enc.encode(pcm) + enc.flush())


def process(song, pack, model, device):
    started = time.time()
    source = Path(song['file'])
    if not source.is_absolute():
        source = ROOT / source
    mix = decode(source)
    seconds = mix.shape[1] / SR
    length = clip_length(song.get('bpm'), seconds)
    start = float(song['start']) if 'start' in song else loudest_start(mix, length)
    start = max(0.0, min(start, seconds - length))
    a, b = int(start * SR), int((start + length) * SR)
    pa, pb = max(0, a - int(PAD * SR)), min(mix.shape[1], b + int(PAD * SR))
    stems = {k: v[:, a - pa:a - pa + (b - a)] for k, v in separate(model, device, mix[:, pa:pb]).items()}
    order, layers, level = layers_for(stems, mix[:, a:b])
    fade = np.ones(b - a, dtype=np.float32)
    n = int(0.015 * SR)
    fade[:n], fade[-n:] = np.linspace(0, 1, n), np.linspace(1, 0, n)
    slug = song.get('slug') or slugify(song['title'])
    out = ROOT / 'assets' / 'songs' / pack['id'] / slug
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('*.mp3'):
        old.unlink()
    for k in order:
        write_mp3(layers[k] * fade, out / f'{k}.mp3')
    entry = {'id': slug, 'pack': pack['id'], 'title': song['title'], 'artist': song['artist'], 'year': str(song['year']),
             'clip': {'start': round(start, 2), 'length': round(length, 3)},
             'stems': [{'key': k, 'label': song.get('labels', {}).get(k, LABEL[k]), 'file': f'assets/songs/{pack["id"]}/{slug}/{k}.mp3'} for k in order]}
    for key in ('bpm', 'cover', 'credit'):
        if song.get(key):
            entry[key] = song[key]
    levels = ' '.join(f'{k}:{level[k]:.2f}' for k in ['drums', 'bass', 'guitar', 'piano', 'other', 'vocals'])
    print(f'✓ {song["title"]}  {start:.1f}s +{length:.1f}s → {", ".join(order)}  [{levels}]  {time.time() - started:.0f}s')
    return entry


def from_folder(folder):
    songs = []
    for path in sorted(Path(folder).iterdir()):
        m = re.match(r'^(?P<artist>.+?) - (?P<title>.+?) \((?P<year>\d{4})\)$', path.stem)
        if path.is_file() and m:
            songs.append({'file': str(path.resolve()), **m.groupdict()})
        elif path.is_file() and not path.name.startswith('.'):
            print(f'skipped {path.name}: name it "Artist - Title (Year).mp3"')
    return songs


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('folder', nargs='?', help='folder of "Artist - Title (Year).ext" files')
    ap.add_argument('--manifest', help='pack manifest JSON (see scripts/packs/)')
    ap.add_argument('--pack', help='pack id for a folder, e.g. hits')
    ap.add_argument('--name', help='pack display name for a new folder pack')
    ap.add_argument('--only', help='only songs whose title contains this text')
    args = ap.parse_args()
    if args.manifest:
        manifest = json.loads(Path(args.manifest).read_text())
        pack, songs = manifest['pack'], manifest['songs']
    elif args.folder and args.pack:
        pack, songs = {'id': args.pack, 'name': args.name or args.pack.title()}, from_folder(args.folder)
    else:
        ap.error('give --manifest, or a folder plus --pack')
    if args.only:
        songs = [s for s in songs if args.only.lower() in s['title'].lower()]
    if not songs:
        sys.exit('no songs to split')
    catalog = json.loads(CATALOG.read_text()) if CATALOG.exists() else {}
    packs = [p for p in catalog.get('packs', []) if p['id'] != pack['id']]
    previous = next((p for p in catalog.get('packs', []) if p['id'] == pack['id']), {})
    packs.append({**previous, **pack})
    entries = {s['id']: s for s in catalog.get('songs', [])}
    model, device = load_model()
    print(f'Demucs htdemucs_6s on {device}: {len(songs)} songs → pack "{pack["id"]}"')
    failed = []
    for song in songs:
        try:
            entry = process(song, pack, model, device)
            entries[entry['id']] = entry
        except Exception as err:
            failed.append(song['title'])
            print(f'✗ {song["title"]}: {err}')
        CATALOG.write_text(json.dumps({'packs': packs, 'songs': list(entries.values())}, indent=2, ensure_ascii=False) + '\n')
    print(f'catalog.json: {len(entries)} songs in {len(packs)} packs' + (f'; failed: {", ".join(failed)}' if failed else ''))
    if failed:
        sys.exit(1)


if __name__ == '__main__':
    main()
