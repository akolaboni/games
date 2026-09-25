(() => {
  'use strict';
  const DEMOS = [
    { id:'ode-to-joy', title:'Ode to Joy', artist:'Ludwig van Beethoven', year:'DEMO', demo:true, cover:'covers/ode-to-joy.svg', bpm:112, roots:[48,55,53,48], melody:[64,64,65,67,67,65,64,62,60,60,62,64,64,62,62,60] },
    { id:'twinkle', title:'Twinkle, Twinkle, Little Star', artist:'Traditional', year:'DEMO', demo:true, cover:'covers/twinkle.svg', bpm:104, roots:[48,53,55,48], melody:[60,60,67,67,69,69,67,null,65,65,64,64,62,62,60,null] },
    { id:'mary', title:'Mary Had a Little Lamb', artist:'Traditional', year:'DEMO', demo:true, cover:'covers/mary.svg', bpm:116, roots:[48,55,48,55], melody:[64,62,60,62,64,64,64,null,62,62,62,null,64,67,67,null] }
  ];
  const DECOYS = ['Amazing Grace','Auld Lang Syne','Frère Jacques','Happy Birthday','Jingle Bells','London Bridge','Old MacDonald','Row Your Boat','When the Saints Go Marching In'];
  const DEFAULT_TRACKS = ['DRUMS','BASS','KEYS','OTHER','VOCALS'];
  const ICONS = ['🥁','🎸','🎹','🎛️','🎤'];
  const STEM_ICONS = [[/drum|kit/i,'🥁'],[/percussion/i,'🪘'],[/string|pizzicato/i,'🎻'],[/mallet/i,'🎶'],[/ukulele/i,'🪕'],[/synth/i,'🎛️'],[/piano|keys/i,'🎹'],[/vocal/i,'🎤'],[/guitar/i,'🎸'],[/bass|low end/i,'🔊'],[/rest/i,'🎛️']];
  const COVER_COLORS = [['#ff7653','#ffdc62'],['#a6efb4','#ff7653'],['#ffdc62','#4d8dff'],['#c9a7ff','#ffdc62'],['#4d8dff','#a6efb4']];
  const REVEAL_MS = 10000;
  const $ = id => document.getElementById(id);
  let catalog = DEMOS, packs = [], pack = null;
  const state = { mode:'daily', playlist:[], round:0, stage:0, score:0, roundStart:0, stageStart:0, hiddenAt:0, timer:null, scheduler:null, resultStop:null, dropFlash:null, ctx:null, master:null, buffers:new Map(), sources:[], gains:[], nextNote:0, step:0, playing:false, muted:false, loadFailed:false, options:[], wrongChoices:new Set(), lastResult:null };
  const song = () => state.playlist[state.round];
  const norm = s => String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const escapeHtml = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const two = n => String(n).padStart(2,'0');
  const clock = ms => `${Math.floor(Math.max(0,ms)/60000)}:${String(Math.floor(Math.max(0,ms)%60000/1000)).padStart(2,'0')}`;
  const dateKey = () => new Date().toISOString().slice(0,10);
  const catalogKey = () => catalog.map(s=>s.id).join('|');
  const storageKey = () => `throwback-multitrack:daily:${dateKey()}:${catalogKey()}`;
  const saved = () => { try { return JSON.parse(localStorage.getItem(storageKey())||'null'); } catch { return null; } };
  const save = value => { try { localStorage.setItem(storageKey(),JSON.stringify(value)); } catch {} };
  const dailyIndex = () => { let hash=2166136261; for(const char of dateKey()+catalogKey()) hash=Math.imul(hash^char.charCodeAt(0),16777619); return (hash>>>0)%catalog.length; };
  const hash = value => { let h=2166136261;for(const c of value)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0 };
  const labels = () => song().stems ? song().stems.map(s=>s.label.toUpperCase()) : DEFAULT_TRACKS;
  const icons = () => song().stems ? song().stems.map((s,i)=>(STEM_ICONS.find(([re])=>re.test(s.label))||[,ICONS[i]])[1]) : ICONS;
  const lastStage = () => labels().length-1;
  const pointsAt = stage => lastStage()>0 ? 5-Math.round(stage*4/lastStage()) : 5;
  function show(which) { for(const id of ['intro','game','result']) $(id).hidden=id!==which; }
  function initAudio() {
    if(state.ctx) return true;
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context) { $('feedback').textContent='This browser cannot play audio.'; return false; }
    state.ctx=new Context(); state.master=state.ctx.createGain(); state.master.gain.value=state.muted?0:.38; state.master.connect(state.ctx.destination); return true;
  }
  function tone(midi,when,length,type,volume,filter) {
    const ctx=state.ctx, osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type=type; osc.frequency.setValueAtTime(440*2**((midi-69)/12),when);
    gain.gain.setValueAtTime(.0001,when); gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),when+.012); gain.gain.exponentialRampToValueAtTime(.0001,when+length);
    if(filter){const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=filter;osc.connect(low);low.connect(gain)}else osc.connect(gain);
    gain.connect(state.master);osc.start(when);osc.stop(when+length+.02);
  }
  function kick(when) {
    const ctx=state.ctx,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(150,when);osc.frequency.exponentialRampToValueAtTime(45,when+.13);gain.gain.setValueAtTime(.75,when);gain.gain.exponentialRampToValueAtTime(.001,when+.18);osc.connect(gain);gain.connect(state.master);osc.start(when);osc.stop(when+.19);
  }
  function noise(when,length,volume,highpass) {
    const ctx=state.ctx,size=Math.ceil(ctx.sampleRate*length),buffer=ctx.createBuffer(1,size,ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<size;i++)data[i]=Math.random()*2-1;
    const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=buffer;filter.type='highpass';filter.frequency.value=highpass;gain.gain.setValueAtTime(volume,when);gain.gain.exponentialRampToValueAtTime(.001,when+length);src.connect(filter);filter.connect(gain);gain.connect(state.master);src.start(when);
  }
  function demoStep(step,when) {
    const s=song(),beat=60/s.bpm,within=step%64,bar=Math.floor(within/16),beatInBar=Math.floor((within%16)/4);
    if(within%4===0){if(beatInBar===0||beatInBar===2)kick(when);if(beatInBar===1||beatInBar===3)noise(when,.11,.24,900)}
    if(within%2===0)noise(when,.035,.045,6000);
    if(state.stage>=1&&within%4===0)tone(s.roots[bar]+(beatInBar===3?7:0),when,beat*.8,'sawtooth',.13,320);
    if(state.stage>=2&&within%16===0)for(const offset of [0,4,7])tone(s.roots[bar]+12+offset,when,beat*3.7,'triangle',.05,1350);
    if(state.stage>=3&&within%4===2)tone(s.roots[bar]+24+[0,7,4,7][beatInBar],when,beat*.32,'sine',.035,2200);
    if(state.stage>=4&&within%4===0){const note=s.melody[Math.floor(within/4)];if(note!=null){tone(note,when,beat*.83,'sawtooth',.07,1100);tone(note+12,when,beat*.65,'sine',.038)}}
  }
  function scheduleDemo() {
    if(!state.playing||!state.ctx)return;
    const interval=60/song().bpm/4;
    while(state.nextNote<state.ctx.currentTime+.14){demoStep(state.step,state.nextNote);state.nextNote+=interval;state.step++}
  }
  async function buffersFor(s) {
    if(state.buffers.has(s.id))return state.buffers.get(s.id);
    const buffers=await Promise.all(s.stems.map(async stem=>{const response=await fetch(stem.file);if(!response.ok)throw Error(`Missing ${stem.file}`);return state.ctx.decodeAudioData(await response.arrayBuffer())}));
    const shortest=Math.min(...buffers.map(b=>b.duration)),longest=Math.max(...buffers.map(b=>b.duration));
    if(longest-shortest>.1)throw Error('Stem files are not aligned to the same clip.');
    state.buffers.set(s.id,buffers);return buffers;
  }
  async function startAudio() {
    if(!initAudio())throw Error('Audio is unavailable in this browser.');
    await state.ctx.resume();state.playing=true;
    if(song().stems){
      const buffers=await buffersFor(song()),when=state.ctx.currentTime+.09;
      state.sources=buffers.map((buffer,i)=>{const src=state.ctx.createBufferSource(),gain=state.ctx.createGain();src.buffer=buffer;src.loop=true;gain.gain.value=i===0?1:0;src.connect(gain);gain.connect(state.master);src.start(when);state.gains[i]=gain;return src});
    }else{state.nextNote=state.ctx.currentTime+.07;state.step=0;state.scheduler=setInterval(scheduleDemo,40)}
    $('record').classList.add('playing');
  }
  function activateStage() {if(state.gains[state.stage])state.gains[state.stage].gain.setTargetAtTime(1,state.ctx.currentTime,.035)}
  function stopAudio() {state.playing=false;clearInterval(state.scheduler);state.scheduler=null;for(const src of state.sources){try{src.stop()}catch{}}state.sources=[];state.gains=[];$('record').classList.remove('playing')}
  function drawTracks() {
    const names=labels();$('tracks').innerHTML=names.map((name,i)=>{const live=i<=state.stage,next=i===state.stage+1,verb=live?'playing':next?`tap to drop early for ${pointsAt(i)} points`:'locked';return `<button type="button" class="track ${live?'live':''} ${next?'next':''}" data-stage="${i}" aria-label="${escapeHtml(name)}: ${verb}" ${next?'':'disabled'}><span class="track-top"><span class="track-index">${two(i+1)}</span><span class="track-status">${live?'● ON':next?'＋ DROP':'○ OFF'}</span></span><span class="track-icon" aria-hidden="true">${icons()[i]}</span><span class="track-name">${escapeHtml(name)}</span><span class="track-fader" aria-hidden="true"></span><span class="bars" aria-hidden="true">${'<i></i>'.repeat(9)}</span></button>`}).join('');
    $('tracks').style.gridTemplateColumns=`repeat(${names.length},minmax(0,1fr))`;
    $('stage-count').textContent=`${two(state.stage+1)} / ${two(names.length)} LIVE`;$('potential-points').textContent=String(pointsAt(state.stage));$('next-layer').disabled=state.stage>=lastStage();
  }
  function optionsFor(current) {
    const pool=[...new Set([...catalog.map(s=>s.title),...(pack?pack.decoys||[]:DECOYS)])].filter(title=>norm(title)!==norm(current.title));
    pool.sort((a,b)=>hash(`${current.id}:${dateKey()}:${a}`)-hash(`${current.id}:${dateKey()}:${b}`));
    const options=pool.slice(0,2);options.splice(hash(`${current.id}:${dateKey()}:answer`)%3,0,current.title);return options;
  }
  function renderChoices() {
    $('choices').innerHTML=state.options.map((title,i)=>{const wrong=state.wrongChoices.has(i),length=title.length>27?'verylong':title.length>17?'long':'';return `<button type="button" class="choice choice-${i} ${length} ${wrong?'wrong':''}" data-choice="${i}" aria-label="Option ${'ABC'[i]}: ${escapeHtml(title)}${wrong?', incorrect':''}" ${wrong||!state.roundStart?'disabled':''}><span class="choice-letter">${'ABC'[i]}</span><span class="choice-disc" aria-hidden="true"></span><span class="choice-name">${escapeHtml(title)}</span><span class="choice-action">${wrong?'NOPE':'+ PICK'}</span></button>`}).join('');
  }
  function updateTimer() {
    if(document.hidden)return;
    const elapsed=Date.now()-state.stageStart;
    if(elapsed>=REVEAL_MS){if(state.stage<lastStage())reveal();else{finish(false);return}}
    const remaining=REVEAL_MS-(Date.now()-state.stageStart);
    $('timer').textContent=clock(Math.ceil(Math.max(0,remaining)/1000)*1000);
    $('progress-fill').style.width=`${Math.max(0,Math.min(100,100-remaining/REVEAL_MS*100))}%`;
  }
  function reveal(manual=false) {if(!state.roundStart||state.stage>=lastStage())return;state.stage++;state.stageStart=Date.now();activateStage();$('prompt').textContent=`${labels()[state.stage]} IN — KNOW IT?`;drawTracks();$('game').classList.remove('drop-hit');void $('game').offsetWidth;$('game').classList.add('drop-hit');clearTimeout(state.dropFlash);state.dropFlash=setTimeout(()=>$('game').classList.remove('drop-hit'),500);if(manual&&navigator.vibrate)navigator.vibrate(25);updateTimer()}
  async function beginRound() {
    clearTimeout(state.resultStop);stopAudio();clearInterval(state.timer);
    state.stage=0;state.roundStart=0;state.stageStart=0;state.loadFailed=false;$('give-up').textContent='REVEAL SONG';
    const s=song();$('round-label').textContent=state.mode==='daily'?'DAILY CHALLENGE':`${two(state.round+1)} / ${two(state.playlist.length)}`;
    $('round-number').textContent=`SIDE A / ${two(state.round+1)}`;$('hint').textContent=`THROWBACK ${s.year}`;$('score').textContent=String(state.score).padStart(2,'0');
    state.options=optionsFor(s);state.wrongChoices.clear();$('prompt').textContent='Preparing the mix…';$('prompt').classList.add('loading-note');$('feedback').textContent='';
    renderChoices();drawTracks();$('next-layer').disabled=true;$('give-up').disabled=true;show('game');
    try{await startAudio();state.roundStart=Date.now();state.stageStart=state.roundStart;$('prompt').textContent=`${labels()[0]} ONLY — KNOW IT?`;$('prompt').classList.remove('loading-note');$('give-up').disabled=false;renderChoices();drawTracks();updateTimer();state.timer=setInterval(updateTimer,100)}
    catch(error){stopAudio();state.loadFailed=true;$('prompt').textContent='Could not load this song.';$('feedback').textContent=error.message;$('give-up').disabled=false;$('give-up').textContent='BACK TO START'}
  }
  function resultText(r) {const heard=icons().slice(0,r.stage+1).join('');const outcome=r.correct?`guessed at stage ${r.stage+1} in ${clock(r.elapsed)}`:'missed';const link=location.hostname==='play.kaditay.com'?'\nplay.kaditay.com/throwback-multitrack/':'';return `Crate Five · ${r.date}\n${heard} ${outcome} · ${r.points}/5${link}`}
  function coverFor(s,useSupplied=true) {
    if(useSupplied&&s.cover)return s.cover;
    const initials=s.title.split(/\s+/).filter(word=>/[a-z0-9]/i.test(word[0])).slice(0,3).map(word=>word[0]).join('').toUpperCase(),[back,disc]=COVER_COLORS[hash(s.id)%COVER_COLORS.length];
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="500" fill="${back}"/><circle cx="340" cy="170" r="180" fill="${disc}"/><circle cx="340" cy="170" r="100" fill="#121c28"/><text x="34" y="443" fill="#121c28" font-family="Arial,sans-serif" font-size="124" font-weight="900">${escapeHtml(initials)}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  function renderResult(r) {
    $('result-round').textContent=state.mode==='daily'?'DAILY CHALLENGE':`${two(state.round+1)} / ${two(state.playlist.length)}`;
    $('result-kicker').textContent=r.correct?'YOU GOT IT':'THE FULL MIX';$('result-kicker').style.color=r.correct?'var(--green)':'var(--orange)';
    $('answer-title').textContent=song().title;$('answer-artist').textContent=song().artist;$('result-year').textContent=song().year;
    const artwork=$('answer-cover');artwork.onerror=()=>{artwork.onerror=null;artwork.src=coverFor(song(),false)};artwork.src=coverFor(song());artwork.alt=`Cover artwork for ${song().title}`;
    $('answer-copy').textContent=song().demo?'ORIGINAL SYNTH DEMO ARRANGEMENT':`THROWBACK ${song().year}`;
    const credit=song().credit;$('answer-credit').hidden=!credit;$('answer-credit').innerHTML=credit?creditHtml(credit):'';
    $('round-points').textContent=`+${r.points}`;
    $('medal-points').textContent=String(r.points);
    $('share').hidden=state.mode!=='daily';$('share-preview').hidden=state.mode!=='daily';$('share-preview').textContent=state.mode==='daily'?resultText(r):'';
    const nextLabel=state.mode==='daily'?'PLAY PRACTICE':state.round===state.playlist.length-1?'PLAY AGAIN':'PLAY NEXT SONG';
    $('continue-label').textContent=nextLabel;$('continue').setAttribute('aria-label',nextLabel.toLowerCase());
    $('end-copy').hidden=state.mode==='daily'||state.round!==state.playlist.length-1;$('end-copy').textContent=`Final score: ${state.score} out of ${state.playlist.length*5}.`;
    show('result');
    const next=state.mode==='practice'&&state.playlist[state.round+1];if(next?.stems&&state.ctx)buffersFor(next).catch(()=>{});
  }
  function creditHtml(c) {return `${escapeHtml(c.text)} <a href="${escapeHtml(c.source)}" target="_blank" rel="noopener noreferrer">Source ↗</a> · <a href="${escapeHtml(c.license)}" target="_blank" rel="noopener noreferrer">CC BY 4.0 ↗</a>`}
  function finish(correct) {
    if(!state.roundStart)return;
    clearInterval(state.timer);const elapsed=Math.max(0,Date.now()-state.roundStart),points=correct?pointsAt(state.stage):0;
    state.score+=points;const r={date:dateKey(),stage:state.stage,elapsed,correct,points};state.lastResult=r;
    if(state.mode==='daily')save(r);
    state.stage=lastStage();if(state.gains.length)for(const gain of state.gains)gain.gain.setTargetAtTime(1,state.ctx.currentTime,.035);
    state.resultStop=setTimeout(stopAudio,8500);renderResult(r);
  }
  let allSongs = [];
  function choosePack(id) {
    pack=packs.find(p=>p.id===id)||packs[0];catalog=allSongs.filter(s=>(s.pack||packs[0].id)===pack.id);
    try{localStorage.setItem('throwback-multitrack:pack',pack.id)}catch{}
    $('packs').innerHTML=packs.length>1?packs.map(p=>`<button type="button" class="pack-chip" data-pack="${escapeHtml(p.id)}" aria-pressed="${p.id===pack.id}">${escapeHtml(p.name)}</button>`).join(''):'';$('packs').hidden=packs.length<2;
    $('practice').innerHTML=`PRACTICE ${catalog.length} ${catalog.length===1?'SONG':'SONGS'} <span aria-hidden="true">↗</span>`;
    $('intro-status').textContent=`${pack.name} · ${catalog.length} songs${pack.blurb?` · ${pack.blurb}`:''}`;
    const credits=catalog.filter(s=>s.credit);$('credits').hidden=!credits.length;$('credit-list').innerHTML=credits.map(s=>`<li>${creditHtml(s.credit)}</li>`).join('');
    const done=saved(),label=$('start').querySelector('span:last-child');$('start').setAttribute('aria-label',done?"View today's result":"Play today's song");label.innerHTML=done?'VIEW<br>RESULT':'PLAY<br>TODAY';
  }
  async function loadCatalog() {
    try{const response=await fetch('./catalog.json',{cache:'no-store'});if(response.ok){const json=await response.json();allSongs=(json.songs||[]).filter(s=>s.id&&s.title&&s.artist&&/^\d{4}$/.test(String(s.year))&&Array.isArray(s.stems)&&s.stems.length>=3&&s.stems.length<=5&&s.stems.every(t=>t.label&&t.file));packs=(json.packs||[]).filter(p=>allSongs.some(s=>s.pack===p.id))}}catch{}
    if(allSongs.length){if(!packs.length)packs=[{id:'songs',name:'Throwbacks'}];let last=null;try{last=localStorage.getItem('throwback-multitrack:pack')}catch{}choosePack(last)}
    else if(saved()){$('start').setAttribute('aria-label',"View today's result");$('start').querySelector('span:last-child').innerHTML='VIEW<br>RESULT'}
  }
  $('packs').addEventListener('click',event=>{const chip=event.target.closest('[data-pack]');if(chip)choosePack(chip.dataset.pack)});
  $('start').addEventListener('click',()=>{state.mode='daily';state.playlist=[catalog[dailyIndex()]];state.round=0;state.score=0;const previous=saved();if(previous){state.lastResult=previous;renderResult(previous)}else beginRound()});
  $('practice').addEventListener('click',()=>{state.mode='practice';state.playlist=[...catalog];state.round=0;state.score=0;beginRound()});
  $('sound').addEventListener('click',()=>{state.muted=!state.muted;if(state.master)state.master.gain.value=state.muted?0:.38;$('sound').setAttribute('aria-pressed',String(state.muted));$('sound').innerHTML=state.muted?'SOUND OFF <span aria-hidden="true">×</span>':'SOUND ON <span aria-hidden="true">◖))</span>';$('sound').setAttribute('aria-label',state.muted?'Unmute audio':'Mute audio')});
  $('choices').addEventListener('click',event=>{const card=event.target.closest('[data-choice]');if(!card||!state.roundStart)return;const index=Number(card.dataset.choice);if(state.wrongChoices.has(index))return;if(norm(state.options[index])===norm(song().title)){finish(true);return}state.wrongChoices.add(index);$('feedback').textContent='NOPE. ANOTHER STEM DROPS.';if(state.stage>=lastStage())finish(false);else{reveal(true);renderChoices()}});
  $('next-layer').addEventListener('click',()=>reveal(true));$('give-up').addEventListener('click',()=>state.loadFailed?show('intro'):finish(false));
  $('tracks').addEventListener('click',event=>{const channel=event.target.closest('[data-stage]');if(channel&&Number(channel.dataset.stage)===state.stage+1)reveal(true)});
  $('continue').addEventListener('click',()=>{if(state.mode==='daily'){state.mode='practice';state.playlist=[...catalog];state.round=0;state.score=0}else if(state.round===state.playlist.length-1){state.round=0;state.score=0}else state.round++;beginRound()});
  $('share').addEventListener('click',async()=>{const message=resultText(state.lastResult);try{if(navigator.share)await navigator.share({text:message});else{await navigator.clipboard.writeText(message);$('share').textContent='COPIED TO CLIPBOARD ✓'}}catch(error){if(error.name!=='AbortError')$('share').textContent='COPY THE RESULT ABOVE'}});
  document.addEventListener('visibilitychange',()=>{if(!state.ctx)return;if(document.hidden){state.hiddenAt=Date.now();state.ctx.suspend()}else{if(state.hiddenAt){const paused=Date.now()-state.hiddenAt;state.roundStart+=paused;state.stageStart+=paused;state.hiddenAt=0}if(state.playing)state.ctx.resume()}});
  loadCatalog();
})();
