(() => {
  'use strict';
  const auditionKey = new URL(location.href).searchParams.get('audition');
  const auditionSong = Object.hasOwn(window.AUDITION_CUTS || {}, auditionKey) ? window.AUDITION_CUTS[auditionKey] : null;
  const songs = auditionSong ? [auditionSong] : window.THE_SET;
  const $ = id => document.getElementById(id);
  const state = { index: 0, score: 0, streak: 0, time: 0, phase: 'intro', player: null, ready: false, apiFailed: false, timer: null, playerWatchdog: null, played: false, external: false };
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

  function clearPlayerWatchdog() {
    if (state.playerWatchdog) clearTimeout(state.playerWatchdog);
    state.playerWatchdog = null;
  }

  function unlockChoices() {
    if (state.phase !== 'answering') return;
    $('choices').querySelectorAll('button').forEach(button => { button.disabled = false; });
  }

  function playerSlot() {
    const slot = document.createElement('div');
    slot.id = 'player';
    document.querySelector('.video-frame').replaceChildren(slot);
    return slot;
  }

  function fallback(message) {
    stopClock();
    clearPlayerWatchdog();
    $('game').classList.remove('is-playing');
    state.external = true;
    state.played = true; // The blocked player makes this an honour-system round.
    unlockChoices();
    try { state.player?.destroy(); } catch { /* The embed may have failed before its API was ready. */ }
    state.player = null;
    const slot = playerSlot();
    slot.className = 'video-placeholder';
    const icon = document.createElement('span'); icon.className = 'play-glyph'; icon.textContent = '▶';
    const title = document.createElement('strong'); title.textContent = 'THE SHOW GOES ON.';
    const note = document.createElement('p'); note.textContent = message;
    const link = document.createElement('a'); link.href = $('youtube-link').href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'WATCH ON YOUTUBE ↗';
    link.addEventListener('click', externalPlayback);
    slot.append(icon, title, note, link);
    $('player-error-message').textContent = 'Use the direct video, or move to the next level.';
    $('player-error').hidden = false;
    $('video-note').textContent = 'EXTERNAL PLAYBACK AVAILABLE';
    $('host-line').textContent = 'YOUR BACKUP SINGER IS HERE.';
    $('challenge-help').textContent = 'No clock on this level. Watch on YouTube, then answer for 2 points.';
    paintClock();
  }

  function paintClock() {
    const song = current();
    if (state.external) {
      $('timer').textContent = '∞';
      $('timer').setAttribute('aria-label', 'No timer for this level');
      $('timer-fill').style.width = '100%';
      $('timer').classList.remove('low');
      return;
    }
    $('timer').removeAttribute('aria-label');
    $('timer').textContent = `0:${pad(Math.ceil(state.time))}`;
    $('timer-fill').style.width = `${Math.max(0, state.time / song.seconds * 100)}%`;
    $('timer').classList.toggle('low', state.time <= 10);
  }

  function tickClock() {
    if (state.phase !== 'answering' || !state.played || state.external || state.timer) return;
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
    if (location.protocol === 'file:') {
      fallback('This file has no web origin for YouTube playback. Use npm run dev, or open the video on YouTube and return to answer.');
      return;
    }
    if (state.apiFailed) {
      fallback('YouTube could not load in this browser. Open the song on YouTube and return to answer without a timer.');
      return;
    }
    if (!state.ready) {
      const slot = playerSlot();
      slot.className = 'video-wait';
      slot.innerHTML = '<span>GETTING THE VIDEO READY…</span><small>If it stays here, use “Open on YouTube”.</small>';
      return;
    }
    clearPlayerWatchdog();
    const expectedVideo = song.video;
    const expectedRound = state.index;
    state.playerWatchdog = setTimeout(() => {
      if (state.phase === 'answering' && state.index === expectedRound && current().video === expectedVideo) {
        fallback('This YouTube player stayed blank. Open the song on YouTube and answer without a timer.');
      }
    }, 12000);
    if (state.player) {
      try { state.player.cueVideoById({ videoId: song.video, startSeconds: song.start }); }
      catch { fallback('The player could not switch videos. Open this song on YouTube and return to answer.'); }
      return;
    }
    playerSlot();
    state.player = new YT.Player('player', {
      width: '100%', height: '100%', videoId: song.video,
      playerVars: { playsinline: 1, origin: location.origin, start: song.start, rel: 0 },
      events: {
        onReady(event) { event.target.cueVideoById({ videoId: current().video, startSeconds: current().start }); },
        onStateChange(event) {
          if (event.target.getVideoData?.().video_id !== current().video) return;
          if (event.data === YT.PlayerState.CUED || event.data === YT.PlayerState.PLAYING) clearPlayerWatchdog();
          if (event.data === YT.PlayerState.PLAYING) {
            state.played = true;
            unlockChoices();
            $('game').classList.add('is-playing');
            $('host-line').textContent = 'SING IT!';
            $('video-note').textContent = 'ON AIR / TAKE YOUR TIME';
            if (state.phase === 'answering') tickClock();
          } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.BUFFERING || event.data === YT.PlayerState.ENDED) {
            stopClock();
            $('game').classList.remove('is-playing');
            $('host-line').textContent = event.data === YT.PlayerState.ENDED ? 'ONE MORE TIME?' : 'PAUSED / STILL YOUR TURN';
          }
        },
        onError(event) {
          if (event.target.getVideoData?.().video_id !== current().video) return;
          const code = event.data;
          queueMicrotask(() => fallback(`YouTube could not play this video here (code ${code}). Open it on YouTube and return to answer without a timer.`));
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
    state.external = false;
    stopClock();
    clearPlayerWatchdog();
    $('game').classList.remove('is-playing', 'celebrate', 'missed');
    $('game').style.setProperty('--beat', `${song.motionMs || 600}ms`);
    $('host-line').textContent = 'READY WHEN YOU ARE.';
    document.documentElement.style.setProperty('--round', song.color);
    $('round-count').textContent = `LVL ${pad(state.index + 1)} / ${pad(songs.length)}`;
    $('round-lane').textContent = song.lane;
    $('round-year').textContent = song.year;
    $('challenge-type').textContent = song.kind === 'lyric' ? 'FINISH THE LYRIC' : 'GUESS THE SONG';
    $('score').textContent = `${pad(state.score)} PTS`;
    $('streak').textContent = `${state.streak} STREAK`;
    $('cue').textContent = song.cue;
    $('round-title').textContent = song.prompt;
    $('challenge-help').textContent = 'Start the video to unlock your answers. The clock follows the music.';
    $('choices').hidden = false;
    $('result').hidden = true;
    $('choices').innerHTML = '';
    song.options.forEach((option, i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'choice';
      button.disabled = true;
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
    let points = 0;
    if (correct && state.played) points = state.external || state.time > 0 ? 2 : 1;
    state.score += points;
    state.streak = correct && state.played ? state.streak + 1 : 0;
    state.phase = 'reveal';
    stopClock();
    $('player-error').hidden = true;
    $('score').textContent = `${pad(state.score)} PTS`;
    $('streak').textContent = `${state.streak} STREAK`;
    $('game').classList.add(correct ? 'celebrate' : 'missed');
    $('host-line').textContent = correct ? 'THAT’S THE ONE!' : 'KEEP THE MUSIC GOING.';
    $('choices').querySelectorAll('button').forEach(button => {
      button.disabled = true;
      button.classList.toggle('right', button.querySelector('strong').textContent === song.answer);
      button.classList.toggle('wrong', button.querySelector('strong').textContent === option && !correct);
    });
    $('result-verdict').textContent = correct ? points === 2 ? state.external ? 'RIGHT ANSWER · +2' : 'RIGHT ON TIME · +2' : points === 1 ? 'RIGHT ANSWER · +1' : 'RIGHT ANSWER · PLAY FIRST FOR POINTS' : 'NOT THIS ONE · +0';
    $('result-song').textContent = `${song.title} — ${song.artist}`;
    $('bridge').textContent = song.bridge;
    $('result').hidden = false;
    $('next').innerHTML = state.index === songs.length - 1 ? 'SEE YOUR SET <span>→</span>' : 'NEXT CUT <span>→</span>';
    $('challenge-help').textContent = correct ? 'Nice. Stay with the video as long as you like.' : 'The answer is lit below. Keep listening.';
  }

  function finish() {
    state.phase = 'finish'; stopClock(); clearPlayerWatchdog();
    $('final-score').textContent = `${pad(state.score)} / ${pad(songs.length * 2)} POINTS`;
    $('finish-list').innerHTML = songs.map((song, i) => `<a href="https://www.youtube.com/watch?v=${song.video}" target="_blank" rel="noopener noreferrer"><span>${pad(i + 1)} / ${song.year}</span><strong>${song.title}</strong><em>${song.artist}</em><b>↗</b></a>`).join('');
    show('finish');
    try { state.player?.stopVideo(); } catch { /* The player may already be unavailable. */ }
  }

  $('start').addEventListener('click', () => { state.index = 0; state.score = 0; state.streak = 0; loadRound(); });
  $('next').addEventListener('click', () => { state.index++; if (state.index < songs.length) loadRound(); else finish(); });
  $('replay').addEventListener('click', () => { if (state.player) { state.player.seekTo(current().start, true); state.player.playVideo(); } else $('youtube-link').click(); });
  function externalPlayback() {
    // Direct YouTube playback never loses the time bonus to an unavailable embed.
    if (state.phase === 'answering') {
      state.played = true;
      state.external = true;
      unlockChoices();
      stopClock(); paintClock();
      $('challenge-help').textContent = 'No clock on this level. Return when ready and answer for 2 points.';
      $('host-line').textContent = 'I’LL KEEP THE BEAT HERE.';
      $('game').classList.add('is-playing');
    }
  }
  $('youtube-link').addEventListener('click', externalPlayback);
  $('skip').addEventListener('click', () => { state.streak = 0; state.index++; if (state.index < songs.length) loadRound(); else finish(); });
  $('again').addEventListener('click', () => { state.index = 0; state.score = 0; state.streak = 0; loadRound(); });

  if (auditionSong) {
    document.querySelector('.back').href = 'audition.html';
    document.querySelector('.back span').textContent = 'AUDITION';
    document.querySelector('.finish-actions a').href = 'audition.html';
    document.querySelector('.finish-actions a').textContent = 'OTHER CANDIDATES ↗';
    document.querySelector('.finish>p:not(.final-score)').textContent = 'One candidate heard. Compare the others in the audition room.';
  }

  window.onYouTubeIframeAPIReady = () => {
    if (state.apiFailed) return;
    state.ready = true;
    if (state.phase === 'answering' && !state.player) setPlayer(current());
  };
  if (location.protocol === 'file:') {
    $('preview-hint').hidden = false;
  } else if (window.YT?.Player) {
    window.onYouTubeIframeAPIReady();
  } else {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onerror = () => { state.apiFailed = true; if (state.phase === 'answering') fallback('YouTube did not load in this browser. Open the song on YouTube and return to answer without a timer.'); };
    document.head.append(tag);
    setTimeout(() => {
      if (!state.ready) {
        state.apiFailed = true;
        if (state.phase === 'answering') fallback('YouTube took too long to load. Open the song on YouTube and return to answer without a timer.');
      }
    }, 10000);
  }
  if (auditionSong) loadRound();
})();
