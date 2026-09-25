(() => {
  'use strict';
  const songs = window.THE_SET;
  const $ = id => document.getElementById(id);
  const state = { index: 0, score: 0, time: 0, phase: 'intro', player: null, ready: false, timer: null, played: false };
  const pad = n => String(n).padStart(2, '0');
  const current = () => songs[state.index];

  function show(id) {
    ['intro', 'game', 'finish'].forEach(name => $(name).hidden = name !== id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function stopClock() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  }

  function paintClock() {
    const song = current();
    $('timer').textContent = `0:${pad(Math.ceil(state.time))}`;
    $('timer-fill').style.width = `${Math.max(0, state.time / song.seconds * 100)}%`;
    $('timer').classList.toggle('low', state.time <= 10);
  }

  function tickClock() {
    if (state.phase !== 'answering' || !state.played || state.timer) return;
    let last = performance.now();
    state.timer = setInterval(() => {
      const now = performance.now();
      state.time = Math.max(0, state.time - (now - last) / 1000);
      last = now;
      paintClock();
      if (state.time === 0) {
        stopClock();
        $('challenge-help').textContent = 'Time bonus gone. You can still answer for 1 point.';
      }
    }, 100);
  }

  function setPlayer(song) {
    $('player-error').hidden = true;
    $('youtube-link').href = `https://www.youtube.com/watch?v=${song.video}`;
    $('video-note').textContent = 'PRESS PLAY IN THE VIDEO';
    if (!state.ready) {
      $('player').innerHTML = '<div class="video-wait"><span>THE VIDEO IS LOADING</span><small>If it takes a moment, use “Open on YouTube”.</small></div>';
      return;
    }
    if (state.player) {
      state.player.cueVideoById({ videoId: song.video, startSeconds: song.start });
      return;
    }
    state.player = new YT.Player('player', {
      width: '100%', height: '100%', videoId: song.video,
      playerVars: { playsinline: 1, origin: location.origin, start: song.start, rel: 0 },
      events: {
        onReady(event) { event.target.cueVideoById({ videoId: current().video, startSeconds: current().start }); },
        onStateChange(event) {
          if (event.target.getVideoData?.().video_id !== current().video) return;
          if (event.data === YT.PlayerState.PLAYING) {
            state.played = true;
            $('video-note').textContent = 'TAKE YOUR TIME WITH THE SONG';
            if (state.phase === 'answering') tickClock();
          } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.BUFFERING || event.data === YT.PlayerState.ENDED) {
            stopClock();
          }
        },
        onError() {
          stopClock();
          $('player-error').hidden = false;
          $('video-note').textContent = 'VIDEO UNAVAILABLE HERE';
        }
      }
    });
  }

  function progress() {
    $('set-progress').innerHTML = songs.map((song, i) => `<span class="progress-cut ${i < state.index ? 'done' : ''} ${i === state.index ? 'current' : ''}" aria-label="Cut ${i + 1}${i < state.index ? ', complete' : i === state.index ? ', current' : ''}"><b>${pad(i + 1)}</b><i></i><small>${song.year}</small></span>`).join('');
  }

  function loadRound() {
    const song = current();
    state.phase = 'answering';
    state.time = song.seconds;
    state.played = false;
    stopClock();
    document.documentElement.style.setProperty('--round', song.color);
    $('round-count').textContent = `CUT ${pad(state.index + 1)} / ${pad(songs.length)}`;
    $('round-lane').textContent = song.lane;
    $('round-year').textContent = song.year;
    $('challenge-type').textContent = song.kind === 'lyric' ? 'FINISH THE LYRIC' : 'GUESS THE SONG';
    $('score').textContent = `${pad(state.score)} PTS`;
    $('cue').textContent = song.cue;
    $('round-title').textContent = song.prompt;
    $('challenge-help').textContent = 'Hit play. The answer clock starts with the music.';
    $('choices').hidden = false;
    $('result').hidden = true;
    $('choices').innerHTML = '';
    song.options.forEach((option, i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'choice';
      button.innerHTML = `<span>${String.fromCharCode(65 + i)}</span><strong></strong><b>↗</b>`;
      button.querySelector('strong').textContent = option;
      button.addEventListener('click', () => choose(option));
      $('choices').append(button);
    });
    paintClock(); progress(); show('game'); setPlayer(song);
  }

  function choose(option) {
    if (state.phase !== 'answering') return;
    const song = current();
    const correct = option === song.answer;
    const points = correct && state.played ? state.time > 0 ? 2 : 1 : 0;
    state.score += points;
    state.phase = 'reveal';
    stopClock();
    $('score').textContent = `${pad(state.score)} PTS`;
    $('choices').querySelectorAll('button').forEach(button => {
      button.disabled = true;
      button.classList.toggle('right', button.querySelector('strong').textContent === song.answer);
      button.classList.toggle('wrong', button.querySelector('strong').textContent === option && !correct);
    });
    $('result-verdict').textContent = correct ? points === 2 ? 'RIGHT ON TIME · +2' : points === 1 ? 'RIGHT ANSWER · +1' : 'RIGHT ANSWER · PLAY FIRST FOR POINTS' : 'NOT THIS ONE · +0';
    $('result-song').textContent = `${song.title} — ${song.artist}`;
    $('bridge').textContent = song.bridge;
    $('result').hidden = false;
    $('next').innerHTML = state.index === songs.length - 1 ? 'SEE YOUR SET <span>→</span>' : 'NEXT CUT <span>→</span>';
    $('challenge-help').textContent = correct ? 'Nice. Stay with the video as long as you like.' : 'The answer is lit below. Keep listening.';
  }

  function finish() {
    state.phase = 'finish'; stopClock();
    $('final-score').textContent = `${pad(state.score)} / ${pad(songs.length * 2)} POINTS`;
    $('finish-list').innerHTML = songs.map((song, i) => `<a href="https://www.youtube.com/watch?v=${song.video}" target="_blank" rel="noopener noreferrer"><span>${pad(i + 1)} / ${song.year}</span><strong>${song.title}</strong><em>${song.artist}</em><b>↗</b></a>`).join('');
    show('finish');
    try { state.player?.stopVideo(); } catch { /* The player may already be unavailable. */ }
  }

  $('start').addEventListener('click', () => { state.index = 0; state.score = 0; loadRound(); });
  $('next').addEventListener('click', () => { state.index++; if (state.index < songs.length) loadRound(); else finish(); });
  $('replay').addEventListener('click', () => { if (state.player) { state.player.seekTo(current().start, true); state.player.playVideo(); } });
  $('youtube-link').addEventListener('click', () => {
    // An unavailable embed can still be watched on YouTube. External playback is untimed.
    if (state.phase === 'answering' && !state.played) {
      state.played = true;
      state.time = 0;
      stopClock(); paintClock();
      $('challenge-help').textContent = 'Watching on YouTube? Return when ready and pick an answer for 1 point.';
    }
  });
  $('skip').addEventListener('click', () => { state.index++; if (state.index < songs.length) loadRound(); else finish(); });
  $('again').addEventListener('click', () => { state.index = 0; state.score = 0; loadRound(); });

  window.onYouTubeIframeAPIReady = () => {
    state.ready = true;
    if (state.phase === 'answering' && !state.player) setPlayer(current());
  };
  if (window.YT?.Player) window.onYouTubeIframeAPIReady();
})();
