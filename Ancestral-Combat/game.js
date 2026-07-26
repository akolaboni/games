'use strict';
const cv = document.getElementById('game');
const cx = cv.getContext('2d');
const W = 1280, H = 720, GROUND = 620, GRAV = 0.9;
const STAGE_L = 80, STAGE_R = 1200;

// ---------------------------------------------------------------- input
const keys = {};
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Slash'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
let pressBuf = {};
addEventListener('keydown', e => { if (!e.repeat) pressBuf[e.code] = true; });
function pressed(code) { return !!pressBuf[code]; }

const P1K = { left:'KeyA', right:'KeyD', up:'KeyW', down:'KeyS', punch:'KeyF', kick:'KeyG', special:'KeyH', super:'KeyT' };
const P2K = { left:'ArrowLeft', right:'ArrowRight', up:'ArrowUp', down:'ArrowDown', punch:'Comma', kick:'Period', special:'Slash', super:'ShiftRight' };

// ---------------------------------------------------------------- characters
const CHARS = {
  anansi: {
    name: 'ANANSI', title: 'The Spider Trickster', origin: 'Akan • Ghana',
    lore: 'Keeper of all stories, who bought them from the Sky God with cunning alone. He fights the way he bargains — you only see the trap once you are in it.',
    speed: 4.6, jump: 16.5, hp: 95, weight: 0.9,
    skin: '#7a4a2b', skinD: '#5d3720', main: '#3d2350', mainD: '#2a1738', acc: '#e8b62c',
    moves: ['Web Snare — binds the foe in silk', 'Trickster Vanish (↓+SP) — smoke-step behind them', 'SUPER: A Thousand Children — the spider swarm'],
    quote: 'All stories are mine — including how this one ends.'
  },
  shango: {
    name: 'SHANGO', title: 'Orisha of Thunder', origin: 'Yoruba • Nigeria',
    lore: 'Fourth king of Oyo, master of fire and the double-headed axe. His judgment falls from the sky, and the drums still call his name.',
    speed: 3.6, jump: 14, hp: 115, weight: 1.15,
    skin: '#6b3b1e', skinD: '#502b14', main: '#b3201b', mainD: '#7e1410', acc: '#f5f0e6',
    moves: ['Oshe Crush — the thunder axe falls', 'Sky Judgment (↓+SP) — calls a bolt onto the foe', 'SUPER: Storm of Oyo — the heavens open'],
    quote: 'Kneel. The sky has already decided.'
  },
  mamiwata: {
    name: 'MAMI WATA', title: 'Spirit of the Waters', origin: 'West & Central Africa',
    lore: 'The mother of waters, serpent-crowned, beautiful and merciless as the sea. She gives fortune with one hand and drowns with the other.',
    speed: 4.0, jump: 15, hp: 100, weight: 1.0,
    skin: '#8a5a33', skinD: '#6b4326', main: '#0f7f8b', mainD: '#0a5560', acc: '#ffd34d',
    moves: ['Tidal Surge — a wave that sweeps the floor', 'Healing Waters (↓+SP) — the river restores her', 'SUPER: Serpent’s Embrace — the great water python'],
    quote: 'The river takes back everything it gives.'
  },
  impundulu: {
    name: 'IMPUNDULU', title: 'The Lightning Bird', origin: 'Zulu / Xhosa • Southern Africa',
    lore: 'The storm given wings. Where its talons strike, lightning is born; thunder is only the sound of its wingbeat. It does not tire and it does not forgive.',
    speed: 5.2, jump: 17.5, hp: 90, weight: 0.85,
    skin: '#33272e', skinD: '#221920', main: '#e9e4da', mainD: '#b9b2a4', acc: '#d4262e',
    moves: ['Talon Dive — strikes like falling lightning', 'Static Plumes (↓+SP) — charged feather darts', 'SUPER: Birth of the Storm — the sky splits open', 'Double jump — it owns the air'],
    quote: 'You heard thunder. That was only my wings.'
  }
};
const ROSTER = ['anansi','shango','mamiwata','impundulu'];

const SUPERNAME = { anansi:'A THOUSAND CHILDREN', shango:'STORM OF OYO', mamiwata:"SERPENT'S EMBRACE", impundulu:'BIRTH OF THE STORM' };

// ---------------------------------------------------------------- game state
const game = {
  screen: 'title', mode: 'cpu', frame: 0,
  selP1: 0, selP2: 1, selPhase: 0,
  p1Char: null, p2Char: null,
  fighters: [], projectiles: [], particles: [],
  timer: 99, timerF: 0, round: 1, wins: [0, 0],
  msg: '', msgT: 0, subMsg: '',
  timeScale: 1, acc: 0, shake: 0,
  phase: 'intro', phaseT: 0, winner: -1,
  superFlash: 0, superName: '', vsT: 0
};

// ---------------------------------------------------------------- fighter
class Fighter {
  constructor(charId, x, facing, ctrlKeys, isCpu) {
    const c = CHARS[charId];
    this.id = charId; this.c = c;
    this.x = x; this.y = GROUND; this.vx = 0; this.vy = 0;
    this.facing = facing; this.onGround = true;
    this.hp = c.hp; this.maxhp = c.hp; this.meter = 0;
    this.state = 'idle'; this.t = 0; this.animT = 0;
    this.attack = null; this.attackT = 0; this.hitDone = false;
    this.stunT = 0; this.webT = 0; this.blocking = false;
    this.specialCd = 0; this.invuln = 0; this.jumps = 0;
    this.keys = ctrlKeys; this.cpu = isCpu;
    this.aiT = 0; this.aiMove = 0; this.aiBlock = 0;
    this.superSeq = null; this.healT = 0; this.koT = 0;
    this.opp = null;
  }
  get alive() { return this.hp > 0; }

  input(name) {
    if (this.cpu) return this.cpuIn && this.cpuIn[name];
    return keys[this.keys[name]];
  }
  inputPressed(name) {
    if (this.cpu) return this.cpuIn && this.cpuIn[name + 'P'];
    return pressed(this.keys[name]);
  }

  startAttack(a) {
    this.attack = a; this.attackT = 0; this.hitDone = false;
    this.state = a.anim; this.t = 0;
  }

  doSpecial(alt) {
    if (this.specialCd > 0) return;
    const me = this;
    switch (this.id) {
      case 'anansi':
        if (alt) {
          this.specialCd = 80;
          smoke(this.x, this.y - 60, '#7a4ad0');
          const o = this.opp;
          let nx = o.x - o.facing * 95;
          this.x = Math.max(STAGE_L, Math.min(STAGE_R, nx));
          this.facing = this.x < o.x ? 1 : -1;
          this.invuln = 22;
          smoke(this.x, this.y - 60, '#7a4ad0');
          this.startAttack({ anim: 'cast', startup: 6, active: 0, recover: 8, dmg: 0 });
        } else {
          this.specialCd = 55;
          this.startAttack({
            anim: 'cast', startup: 14, active: 1, recover: 16, dmg: 0,
            onActive() { spawnProj('web', me, me.x + me.facing * 40, me.y - 80, me.facing * 9.5); }
          });
        }
        break;
      case 'shango':
        if (alt) {
          this.specialCd = 110;
          const tx = this.opp.x;
          this.startAttack({ anim: 'cast', startup: 10, active: 1, recover: 24, dmg: 0,
            onActive() { spawnProj('boltmark', me, tx, 0, 0); } });
        } else {
          this.specialCd = 70;
          this.startAttack({
            anim: 'axe', startup: 16, active: 6, recover: 22, dmg: 16,
            range: 105, knockback: 11, hitstun: 26, lunge: 7, launch: -6
          });
        }
        break;
      case 'mamiwata':
        if (alt) {
          this.specialCd = 160;
          this.state = 'heal'; this.t = 0; this.healT = 75; this.attack = null;
        } else {
          this.specialCd = 75;
          this.startAttack({
            anim: 'cast', startup: 16, active: 1, recover: 18, dmg: 0,
            onActive() { spawnProj('wave', me, me.x + me.facing * 50, GROUND, me.facing * 5.5); }
          });
        }
        break;
      case 'impundulu':
        if (alt) {
          this.specialCd = 70;
          this.startAttack({
            anim: 'cast', startup: 10, active: 1, recover: 14, dmg: 0,
            onActive() {
              for (let i = -1; i <= 1; i++)
                spawnProj('feather', me, me.x + me.facing * 36, me.y - 86 + i * 4, me.facing * 13, i * 1.3);
            }
          });
        } else {
          this.specialCd = 60;
          if (!this.onGround) {
            this.startAttack({ anim: 'dive', startup: 4, active: 26, recover: 10, dmg: 13,
              range: 70, knockback: 8, hitstun: 24, dive: true });
            this.vx = this.facing * 9; this.vy = 11;
          } else {
            this.startAttack({ anim: 'dive', startup: 6, active: 14, recover: 14, dmg: 11,
              range: 80, knockback: 7, hitstun: 20, lunge: 11 });
          }
        }
        break;
    }
  }

  doSuper() {
    if (this.meter < 100) return;
    this.meter = 0;
    game.superFlash = 50;
    game.superName = SUPERNAME[this.id];
    game.shake = 10;
    this.invuln = 40;
    this.superSeq = { t: 0 };
    this.state = 'cast'; this.t = 0; this.attack = null;
    const me = this;
    switch (this.id) {
      case 'anansi':
        this.superSeq.run = t => {
          if (t > 20 && t < 92 && t % 9 === 0)
            spawnProj('spider', me, me.x + me.facing * 30, me.y - 30 - Math.random() * 70,
              me.facing * (8 + Math.random() * 4), -1 - Math.random() * 2);
          return t < 100;
        };
        break;
      case 'shango':
        this.superSeq.run = t => {
          if (t > 18 && t % 13 === 0 && t < 100) {
            const bx = me.x + me.facing * (60 + ((t - 18) / 13) * 140);
            if (bx > 30 && bx < W - 30) spawnProj('boltmark', me, bx, 0, 0, 0, true);
          }
          return t < 110;
        };
        break;
      case 'mamiwata':
        spawnProj('serpent', me, me.facing === 1 ? -80 : W + 80, GROUND - 60, me.facing * 7);
        this.superSeq.run = t => t < 60;
        break;
      case 'impundulu':
        this.superSeq.run = t => {
          if (t === 14) { me.vy = -22; me.vx = 0; }
          if (t === 40 || t === 70 || t === 100) {
            me.y = 200; me.onGround = false;
            me.x = Math.max(STAGE_L, Math.min(STAGE_R, me.opp.x - me.facing * 180));
            me.facing = me.x < me.opp.x ? 1 : -1;
            me.startAttack({ anim: 'dive', startup: 2, active: 30, recover: 6, dmg: 9,
              range: 75, knockback: 6, hitstun: 18, dive: true });
            me.vx = me.facing * 13; me.vy = 12;
            lightningFx(me.x, me.y - 60, 80);
          }
          return t < 130;
        };
        break;
    }
  }

  update() {
    this.animT++;
    if (this.specialCd > 0) this.specialCd--;
    if (this.invuln > 0) this.invuln--;
    if (this.webT > 0) this.webT--;
    if (game.superFlash > 30 && !this.superSeq) return;

    if (!this.alive) {
      this.state = 'ko'; this.koT++;
      this.physics(); return;
    }
    if (game.phase !== 'fight' && game.phase !== 'ko') {
      this.state = game.phase === 'end' && game.winner >= 0 &&
        game.fighters[game.winner] === this ? 'win' : 'idle';
      this.physics(); return;
    }

    if (this.superSeq) {
      this.superSeq.t++;
      if (!this.superSeq.run(this.superSeq.t)) this.superSeq = null;
    }

    if (this.cpu) this.thinkAI();

    if (this.stunT > 0) {
      this.stunT--;
      this.state = this.webT > 0 ? 'webbed' : 'hit';
      this.physics(); return;
    }

    if (this.state === 'heal') {
      this.t++;
      this.healT--;
      this.hp = Math.min(this.maxhp, this.hp + 0.22);
      if (this.animT % 8 === 0) drip(this.x, this.y - 100);
      if (this.healT <= 0) { this.state = 'idle'; this.t = 0; }
      this.physics(); return;
    }

    if (this.attack) {
      this.attackT++;
      this.t++;
      const a = this.attack;
      if (a.lunge && this.attackT === a.startup) this.vx = this.facing * a.lunge;
      if (a.onActive && this.attackT === a.startup) a.onActive();
      if (a.dive && this.onGround && this.attackT > a.startup) {
        this.attack = null; this.state = 'idle'; this.vx = 0;
      } else if (this.attackT >= a.startup + a.active + a.recover) {
        this.attack = null; this.state = 'idle'; this.t = 0;
      }
      this.physics(); return;
    }

    // movement intents
    const left = this.input('left'), right = this.input('right');
    const away = this.facing === 1 ? left : right;
    const oppThreat = this.opp.attack && this.opp.attackT < this.opp.attack.startup + this.opp.attack.active + 4;
    const projThreat = game.projectiles.some(p => p.owner !== this && Math.abs(p.x - this.x) < 190);
    this.blocking = this.onGround && away && (oppThreat || projThreat || (this.cpu && this.aiBlock > 0));

    if (this.blocking) {
      this.state = 'block'; this.vx = 0;
    } else {
      this.vx = 0;
      if (left) this.vx = -this.c.speed;
      if (right) this.vx = this.c.speed;
      if (this.onGround) {
        this.state = this.vx !== 0 ? 'walk' : 'idle';
        this.jumps = 0;
      } else this.state = 'jump';

      const maxJ = this.id === 'impundulu' ? 2 : 1;
      if (this.inputPressed('up') && (this.onGround || this.jumps < maxJ)) {
        this.vy = -this.c.jump; this.onGround = false; this.jumps++;
        if (this.jumps === 2) featherBurst(this.x, this.y - 40);
      }

      if (this.inputPressed('punch'))
        this.startAttack({ anim: 'punch', startup: 5, active: 4, recover: 9, dmg: 6,
          range: 78, knockback: 4, hitstun: 15 });
      else if (this.inputPressed('kick'))
        this.startAttack({ anim: 'kick', startup: 8, active: 5, recover: 13, dmg: 9,
          range: 96, knockback: 7, hitstun: 19 });
      else if (this.inputPressed('special'))
        this.doSpecial(this.input('down'));
      else if (this.inputPressed('super'))
        this.doSuper();
    }
    this.physics();
  }

  physics() {
    this.x += this.vx;
    if (!this.onGround) {
      this.vy += GRAV * this.c.weight;
      this.y += this.vy;
      if (this.y >= GROUND) {
        this.y = GROUND; this.vy = 0; this.onGround = true;
        if (!this.alive) game.shake = Math.max(game.shake, 6);
      }
    }
    this.x = Math.max(STAGE_L, Math.min(STAGE_R, this.x));
    if (this.alive && !this.attack && this.stunT <= 0 && this.opp)
      this.facing = this.x <= this.opp.x ? 1 : -1;
  }

  takeHit(dmg, kb, hitstun, srcX, opts = {}) {
    if (this.invuln > 0 || !this.alive) return false;
    const dir = this.x >= srcX ? 1 : -1;
    if (this.blocking && !opts.unblockable) {
      this.hp -= dmg * 0.18;
      this.vx = dir * kb * 0.4; this.x += this.vx;
      this.stunT = Math.max(this.stunT, 8);
      this.meter = Math.min(100, this.meter + dmg * 0.4);
      sparks(this.x - dir * 30, this.y - 80, '#9ecbff', 5);
      return false;
    }
    this.hp -= dmg;
    this.stunT = Math.max(this.stunT, hitstun);
    this.vx = dir * kb;
    this.x += this.vx;
    if (opts.launch) { this.vy = opts.launch; this.onGround = false; }
    if (opts.web) this.webT = 55, this.stunT = Math.max(this.stunT, 55);
    this.meter = Math.min(100, this.meter + dmg * 0.9);
    this.attack = null; this.state = 'hit'; this.t = 0;
    this.healT = 0;
    sparks(this.x - dir * 25, this.y - 85, '#ffe46b', 10);
    game.shake = Math.max(game.shake, Math.min(10, dmg));
    if (this.hp <= 0) {
      this.hp = 0; this.vy = -9; this.onGround = false;
      this.vx = dir * 8;
    }
    return true;
  }

  thinkAI() {
    this.aiT--;
    if (this.aiBlock > 0) this.aiBlock--;
    const o = this.opp, d = Math.abs(o.x - this.x);
    const inp = { left: false, right: false, up: false, down: false };
    if (this.aiT <= 0) {
      this.aiT = 10 + Math.random() * 14;
      const r = Math.random();
      if (this.meter >= 100 && r < 0.3) inp.superP = true;
      else if (d > 320) {
        if (r < 0.45) this.aiMove = this.x < o.x ? 1 : -1;
        else if (r < 0.75 && this.specialCd <= 0) {
          inp.specialP = true;
          if (this.id === 'impundulu' && Math.random() < 0.5) inp.down = true;
        }
        else if (r < 0.85) inp.up = true, this.aiMove = this.x < o.x ? 1 : -1;
        else this.aiMove = 0;
      } else if (d > 130) {
        if (r < 0.5) this.aiMove = this.x < o.x ? 1 : -1;
        else if (r < 0.68 && this.specialCd <= 0) inp.specialP = true;
        else if (r < 0.8) inp.up = true, this.aiMove = this.x < o.x ? 1 : -1;
        else if (r < 0.9) { this.aiMove = this.x < o.x ? -1 : 1; this.aiBlock = 20; }
        else inp.kickP = true;
      } else {
        if (r < 0.34) inp.punchP = true;
        else if (r < 0.58) inp.kickP = true;
        else if (r < 0.72 && this.specialCd <= 0) {
          inp.specialP = true;
          if ((this.id === 'mamiwata' && this.hp < this.maxhp * 0.5 && d > 100) ||
              (this.id === 'anansi' && Math.random() < 0.6)) inp.down = true;
        }
        else if (r < 0.86) { this.aiMove = this.x < o.x ? -1 : 1; this.aiBlock = 26; }
        else inp.up = true;
      }
      if (o.attack && Math.random() < 0.4) { this.aiMove = this.x < o.x ? -1 : 1; this.aiBlock = 22; }
    }
    if (this.aiMove === 1) inp.right = true;
    if (this.aiMove === -1) inp.left = true;
    this.cpuIn = {
      left: inp.left, right: inp.right, down: inp.down,
      upP: inp.up, punchP: inp.punchP, kickP: inp.kickP,
      specialP: inp.specialP, superP: inp.superP
    };
  }
}

// ---------------------------------------------------------------- projectiles & fx
function spawnProj(type, owner, x, y, vx, vy = 0, isSuper = false) {
  game.projectiles.push({ type, owner, x, y, vx, vy, t: 0, isSuper, hit: false });
}
function sparks(x, y, col, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 6;
    game.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2,
      life: 14 + Math.random() * 10, col, r: 2 + Math.random() * 3, type: 'spark' });
  }
}
function smoke(x, y, col) {
  for (let i = 0; i < 14; i++)
    game.particles.push({ x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 2, vy: -0.5 - Math.random(), life: 22 + Math.random() * 14,
      col, r: 8 + Math.random() * 12, type: 'smoke' });
}
function drip(x, y) {
  game.particles.push({ x: x + (Math.random() - 0.5) * 50, y, vx: 0, vy: -1.5,
    life: 30, col: '#62d8e8', r: 4, type: 'spark' });
}
function featherBurst(x, y) {
  for (let i = 0; i < 8; i++)
    game.particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 2,
      life: 24, col: '#e9e4da', r: 3, type: 'spark' });
}
function lightningFx(x, y, h) {
  game.particles.push({ x, y, life: 10, type: 'flash', r: h, col: '#fff' });
  game.shake = Math.max(game.shake, 8);
}

function updateProjectiles() {
  const ps = game.projectiles;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i]; p.t++;
    const foe = p.owner.opp;
    switch (p.type) {
      case 'web':
        p.x += p.vx;
        if (!p.hit && Math.abs(p.x - foe.x) < 42 && p.y > foe.y - 130 && p.y < foe.y + 5) {
          p.hit = true;
          if (foe.takeHit(8, 2, 55, p.owner.x, { web: true })) sparks(foe.x, foe.y - 80, '#b88ce8', 8);
          ps.splice(i, 1); continue;
        }
        if (p.x < -40 || p.x > W + 40) { ps.splice(i, 1); continue; }
        break;
      case 'wave':
        p.x += p.vx;
        if (!p.hit && Math.abs(p.x - foe.x) < 55 && foe.y > GROUND - 90) {
          p.hit = true;
          foe.takeHit(12, 8, 24, p.owner.x, { launch: -8 });
        }
        if (p.x < -80 || p.x > W + 80) { ps.splice(i, 1); continue; }
        break;
      case 'feather':
        p.x += p.vx; p.y += p.vy;
        if (!p.hit && Math.abs(p.x - foe.x) < 38 && p.y > foe.y - 125 && p.y < foe.y) {
          p.hit = true; foe.takeHit(4, 3, 12, p.owner.x);
          ps.splice(i, 1); continue;
        }
        if (p.x < -30 || p.x > W + 30) { ps.splice(i, 1); continue; }
        break;
      case 'spider':
        p.x += p.vx; p.y += p.vy; p.vy += 0.25;
        if (p.y > GROUND) { p.y = GROUND; p.vy = -Math.abs(p.vy) * 0.5; }
        if (!p.hit && Math.abs(p.x - foe.x) < 36 && p.y > foe.y - 125 && p.y < foe.y + 5) {
          p.hit = true; foe.takeHit(5, 3, 14, p.owner.x);
          ps.splice(i, 1); continue;
        }
        if (p.x < -30 || p.x > W + 30 || p.t > 140) { ps.splice(i, 1); continue; }
        break;
      case 'boltmark':
        if (p.t === 26) {
          lightningFx(p.x, GROUND, 400);
          if (Math.abs(p.x - foe.x) < 60)
            foe.takeHit(p.isSuper ? 9 : 15, 5, 24, p.x + 1, { launch: -9, unblockable: p.isSuper });
        }
        if (p.t > 36) { ps.splice(i, 1); continue; }
        break;
      case 'serpent':
        p.x += p.vx;
        if (Math.abs(p.x - foe.x) < 90 && p.t % 9 === 0)
          foe.takeHit(6, 4, 16, p.owner.x, { unblockable: false });
        if (p.x < -160 || p.x > W + 160) { ps.splice(i, 1); continue; }
        break;
    }
  }
}

function updateParticles() {
  const ps = game.particles;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.life--;
    if (p.vx !== undefined) { p.x += p.vx; p.y += p.vy; }
    if (p.type === 'spark' && p.vy !== undefined) p.vy += 0.3;
    if (p.life <= 0) ps.splice(i, 1);
  }
}

// ---------------------------------------------------------------- combat resolution
function resolveCombat() {
  for (const f of game.fighters) {
    const a = f.attack;
    if (!a || f.hitDone || !a.dmg) continue;
    const act = f.attackT > a.startup && f.attackT <= a.startup + a.active;
    if (!act) continue;
    const o = f.opp;
    const reachX = f.x + f.facing * (a.range || 80);
    const hx = Math.abs(((f.x + reachX) / 2) - o.x);
    const vy = a.dive ? Math.abs((f.y - 40) - (o.y - 60)) : Math.abs(f.y - o.y);
    if (hx < (a.range || 80) * 0.72 + 26 && vy < 110) {
      f.hitDone = true;
      const landed = o.takeHit(a.dmg, a.knockback || 5, a.hitstun || 15, f.x,
        { launch: a.launch });
      if (landed) f.meter = Math.min(100, f.meter + a.dmg * 1.1);
    }
  }
  // body push
  const [f1, f2] = game.fighters;
  if (f1.alive && f2.alive && Math.abs(f1.x - f2.x) < 58 && Math.abs(f1.y - f2.y) < 100) {
    const mid = (f1.x + f2.x) / 2, dir = f1.x <= f2.x ? 1 : -1;
    f1.x = mid - dir * 29; f2.x = mid + dir * 29;
    f1.x = Math.max(STAGE_L, Math.min(STAGE_R, f1.x));
    f2.x = Math.max(STAGE_L, Math.min(STAGE_R, f2.x));
  }
}

// ---------------------------------------------------------------- match flow
function startMatch() {
  game.wins = [0, 0]; game.round = 1;
  startRound();
}
function startRound() {
  const f1 = new Fighter(game.p1Char, 380, 1, P1K, false);
  const f2 = new Fighter(game.p2Char, 900, -1, P2K, game.mode === 'cpu');
  f1.opp = f2; f2.opp = f1;
  game.fighters = [f1, f2];
  game.projectiles = []; game.particles = [];
  game.timer = 99; game.timerF = 0;
  game.phase = 'intro'; game.phaseT = 0;
  game.msg = 'ROUND ' + game.round; game.msgT = 70;
  game.timeScale = 1; game.superFlash = 0;
}

function updateFight() {
  game.phaseT++;
  const [f1, f2] = game.fighters;

  if (game.phase === 'intro') {
    if (game.phaseT === 70) { game.msg = 'FIGHT!'; game.msgT = 45; }
    if (game.phaseT > 100) game.phase = 'fight';
  }

  if (game.phase === 'fight') {
    game.timerF++;
    if (game.timerF >= 60) { game.timerF = 0; game.timer--; }
    if (!f1.alive || !f2.alive) {
      game.phase = 'ko'; game.phaseT = 0;
      game.msg = 'K.O.!'; game.msgT = 90;
      game.timeScale = 0.25;
    } else if (game.timer <= 0) {
      game.phase = 'ko'; game.phaseT = 0;
      game.msg = 'TIME!'; game.msgT = 90;
      const w = f1.hp === f2.hp ? -1 : (f1.hp > f2.hp ? 0 : 1);
      if (w >= 0) game.fighters[1 - w].hp = 0;
    }
  }

  if (game.phase === 'ko') {
    if (game.phaseT > 28) game.timeScale = 1;
    if (game.phaseT > 110) {
      const w = f1.alive ? 0 : 1;
      game.wins[w]++;
      game.winner = w;
      game.phase = 'end'; game.phaseT = 0;
      const wf = game.fighters[w];
      game.msg = wf.c.name + ' WINS';
      game.subMsg = '“' + wf.c.quote + '”';
      game.msgT = 9999;
    }
  }

  if (game.phase === 'end' && game.phaseT > 170) {
    game.subMsg = '';
    if (game.wins[0] >= 2 || game.wins[1] >= 2) {
      game.screen = 'victory'; game.phaseT = 0;
    } else { game.round++; startRound(); }
  }

  if (game.superFlash > 0) game.superFlash--;
  if (game.msgT > 0) game.msgT--;
  for (const f of game.fighters) f.update();
  resolveCombat();
  updateProjectiles();
  updateParticles();
  if (game.shake > 0) game.shake *= 0.86;
}

// ---------------------------------------------------------------- drawing helpers
function limb(x1, y1, x2, y2, x3, y3, w, col, outline) {
  cx.lineCap = 'round'; cx.lineJoin = 'round';
  cx.strokeStyle = outline; cx.lineWidth = w + 4.5;
  cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.lineTo(x3, y3); cx.stroke();
  cx.strokeStyle = col; cx.lineWidth = w;
  cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.lineTo(x3, y3); cx.stroke();
}
function blob(x, y, r, col, outline) {
  cx.fillStyle = outline; cx.beginPath(); cx.arc(x, y, r + 2.2, 0, 7); cx.fill();
  cx.fillStyle = col; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill();
}
function poly(pts, col, outline) {
  cx.beginPath(); cx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) cx.lineTo(pts[i][0], pts[i][1]);
  cx.closePath();
  if (outline) { cx.strokeStyle = outline; cx.lineWidth = 4; cx.lineJoin = 'round'; cx.stroke(); }
  cx.fillStyle = col; cx.fill();
}
function jaggedBolt(x, y0, y1, w, col) {
  cx.strokeStyle = col; cx.lineWidth = w; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(x, y0);
  let yy = y0;
  while (yy < y1) { yy += 30 + Math.random() * 30; cx.lineTo(x + (Math.random() - 0.5) * 46, Math.min(yy, y1)); }
  cx.stroke();
}

// pose: returns hand/foot targets in local space (facing +x)
function getPose(f) {
  const t = f.t, bob = Math.sin(f.animT * 0.12) * 2.5;
  const P = {
    hipY: -56 + bob * 0.4, chestY: -98 + bob, headY: -124 + bob, lean: 0,
    lh: [26, -86 + bob], rh: [18, -70 + bob],
    lf: [-16, 0], rf: [18, 0], crouch: 0
  };
  const st = f.state;
  if (st === 'walk') {
    const s = Math.sin(f.animT * 0.25);
    P.lf = [-18 + s * 22, -Math.max(0, s) * 10];
    P.rf = [18 - s * 22, -Math.max(0, -s) * 10];
    P.lh = [24 - s * 8, -86]; P.rh = [16 + s * 8, -70];
  } else if (st === 'jump') {
    P.lf = [-10, -22]; P.rf = [16, -14];
    P.lh = [28, -96]; P.rh = [14, -64]; P.lean = 0.1;
  } else if (st === 'punch') {
    const a = f.attack, p = Math.min(1, t / (a ? a.startup : 5));
    const ext = f.attackT <= (a ? a.startup + a.active : 9) ? p : Math.max(0, 1 - (t - 9) / 8);
    P.lh = [20 + ext * 52, -92]; P.rh = [10, -72];
    P.lean = ext * 0.16;
  } else if (st === 'kick') {
    const a = f.attack;
    const p = Math.min(1, t / (a ? a.startup : 8));
    const ext = f.attackT <= (a ? a.startup + a.active : 13) ? p : Math.max(0, 1 - (t - 13) / 10);
    P.rf = [10 + ext * 62, -40 - ext * 32];
    P.lf = [-14, 0];
    P.lh = [26, -90]; P.rh = [-8, -80]; P.lean = -0.08 * ext;
  } else if (st === 'axe') {
    const a = f.attack, up = f.attackT < a.startup;
    if (up) { P.lh = [8, -150]; P.rh = [2, -140]; P.lean = -0.18; }
    else { P.lh = [58, -60]; P.rh = [44, -66]; P.lean = 0.3; }
  } else if (st === 'cast') {
    P.lh = [34, -110]; P.rh = [30, -100]; P.lean = 0.06;
  } else if (st === 'dive') {
    P.lean = 0.55; P.lh = [44, -96]; P.rh = [30, -60];
    P.lf = [-26, -16]; P.rf = [-10, -8];
  } else if (st === 'hit' || st === 'webbed') {
    P.lean = -0.22; P.lh = [10, -100]; P.rh = [-14, -76];
    P.headY = -118;
  } else if (st === 'block') {
    P.lh = [22, -98]; P.rh = [24, -82]; P.lean = -0.05;
  } else if (st === 'heal') {
    P.lh = [12, -132]; P.rh = [4, -128];
  } else if (st === 'win') {
    P.lh = [16, -150 + bob]; P.rh = [12, -70];
  } else if (st === 'ko') {
    P.ko = true;
  }
  return P;
}

function drawFighter(f) {
  const c = f.c;
  cx.save();
  cx.translate(f.x, f.y);
  if (f.invuln > 0 && f.animT % 6 < 3) cx.globalAlpha = 0.45;

  // shadow
  cx.fillStyle = 'rgba(0,0,0,.35)';
  cx.beginPath(); cx.ellipse(0, 6, 44, 9, 0, 0, 7); cx.fill();

  cx.scale(f.facing, 1);
  const P = getPose(f);
  const O = '#19100c';

  if (P.ko) {
    cx.rotate(-Math.PI / 2);
    cx.translate(40, -8);
  }
  cx.rotate(P.lean || 0);

  const hipY = P.hipY ?? -56, chestY = P.chestY ?? -98, headY = P.headY ?? -124;

  // character back-layer extras
  if (c === CHARS.anansi) {
    cx.strokeStyle = O; cx.lineWidth = 5; cx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const ph = Math.sin(f.animT * 0.1 + i * 1.4) * 6;
      const sy = chestY + 6 + i * 7, dir = i % 2 ? 1 : -1;
      cx.beginPath();
      cx.moveTo(-6, sy);
      cx.lineTo(-34 - i * 5, sy - 26 - ph);
      cx.lineTo(-52 - i * 7, sy + 4 + ph * 0.5);
      cx.stroke();
      cx.strokeStyle = '#3d2350'; cx.lineWidth = 2.4;
      cx.beginPath();
      cx.moveTo(-6, sy);
      cx.lineTo(-34 - i * 5, sy - 26 - ph);
      cx.lineTo(-52 - i * 7, sy + 4 + ph * 0.5);
      cx.stroke();
      cx.strokeStyle = O; cx.lineWidth = 5;
    }
  }
  if (c === CHARS.impundulu) {
    const flap = f.state === 'jump' || f.state === 'dive' ? Math.sin(f.animT * 0.5) * 24 : Math.sin(f.animT * 0.08) * 5;
    poly([[-4, chestY + 2], [-52, chestY - 26 - flap], [-86, chestY + 2 - flap * 0.5],
      [-60, chestY + 14], [-30, chestY + 22]], c.main, O);
    poly([[-4, chestY + 6], [-44, chestY - 12 - flap * 0.7], [-66, chestY + 12 - flap * 0.3],
      [-26, chestY + 24]], c.mainD, null);
  }
  if (c === CHARS.mamiwata) {
    cx.strokeStyle = O; cx.lineWidth = 13; cx.lineCap = 'round';
    cx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const hx = -8 - i * 5, hy = headY + 4 + i * 10 + Math.sin(f.animT * 0.06 + i) * 4;
      i === 0 ? cx.moveTo(hx, hy) : cx.lineTo(hx, hy);
    }
    cx.stroke();
    cx.strokeStyle = '#0d3b42'; cx.lineWidth = 9; cx.stroke();
  }

  // legs
  const kneeL = [(P.lf[0]) / 2 - 4, (hipY + P.lf[1]) / 2 + 4];
  const kneeR = [(P.rf[0]) / 2 + 6, (hipY + P.rf[1]) / 2 + 4];
  const legCol = c === CHARS.shango ? c.acc : c.mainD;
  limb(-5, hipY, kneeL[0], kneeL[1], P.lf[0], P.lf[1] - 4, 13, legCol, O);
  limb(5, hipY, kneeR[0], kneeR[1], P.rf[0], P.rf[1] - 4, 13, legCol, O);
  blob(P.lf[0], P.lf[1] - 4, 7, c.skinD, O);
  blob(P.rf[0], P.rf[1] - 4, 7, c.skinD, O);
  if (c === CHARS.impundulu) {
    poly([[P.lf[0] - 4, P.lf[1] - 4], [P.lf[0] + 14, P.lf[1] - 2], [P.lf[0] + 4, P.lf[1] - 10]], c.acc, O);
    poly([[P.rf[0] - 4, P.rf[1] - 4], [P.rf[0] + 14, P.rf[1] - 2], [P.rf[0] + 4, P.rf[1] - 10]], c.acc, O);
  }

  // torso
  poly([[-15, chestY - 6], [15, chestY - 6], [12, hipY + 6], [-12, hipY + 6]], c.main, O);
  poly([[-15, chestY - 6], [15, chestY - 6], [13, chestY + 14], [-13, chestY + 14]],
    c === CHARS.shango ? c.skin : c.main, c === CHARS.shango ? null : null);
  if (c === CHARS.shango) {
    // bare chest + bead sashes
    poly([[-15, chestY - 6], [15, chestY - 6], [12, hipY - 2], [-12, hipY - 2]], c.skin, O);
    cx.strokeStyle = c.main; cx.lineWidth = 5;
    cx.beginPath(); cx.moveTo(-13, chestY - 2); cx.lineTo(12, hipY - 4); cx.stroke();
    cx.strokeStyle = '#fff'; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(13, chestY - 2); cx.lineTo(-12, hipY - 4); cx.stroke();
  }
  if (c === CHARS.anansi) {
    // kente sash
    const g = ['#e8b62c', '#1f8a3b', '#c8281e'];
    for (let i = 0; i < 3; i++) {
      cx.strokeStyle = g[i]; cx.lineWidth = 4;
      cx.beginPath(); cx.moveTo(-14 + i * 3, chestY - 4); cx.lineTo(10 + i * 3, hipY + 4); cx.stroke();
    }
  }
  if (c === CHARS.mamiwata) {
    cx.strokeStyle = c.acc; cx.lineWidth = 3.5;
    cx.beginPath(); cx.moveTo(-12, chestY + 8); cx.lineTo(12, chestY + 8); cx.stroke();
    cx.beginPath(); cx.moveTo(-10, hipY); cx.lineTo(10, hipY); cx.stroke();
  }
  if (c === CHARS.impundulu) {
    poly([[-13, chestY - 2], [13, chestY - 2], [0, chestY + 26]], c.acc, null);
  }

  // arms
  const elbL = [(P.lh[0]) / 2 + 6, (chestY + P.lh[1]) / 2 + 6];
  const elbR = [(P.rh[0]) / 2 + 2, (chestY + P.rh[1]) / 2 + 8];
  limb(8, chestY + 2, elbR[0], elbR[1], P.rh[0], P.rh[1], 10, c.skinD, O);
  blob(P.rh[0], P.rh[1], 6.5, c.skinD, O);
  // (left arm drawn after head for front layering)

  // head
  blob(2, headY, 17, c.skin, O);
  // face — eye + brow (angular anime style)
  cx.strokeStyle = O; cx.lineWidth = 2.6; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(8, headY - 5); cx.lineTo(16, headY - 3); cx.stroke();
  cx.fillStyle = f.state === 'hit' ? '#fff' : '#1c1c1c';
  cx.fillRect(10, headY - 1, 5, 4);
  if (c === CHARS.shango && (f.state === 'cast' || f.superSeq)) {
    cx.fillStyle = '#ffe46b'; cx.fillRect(9, headY - 2, 7, 6);
  }
  cx.beginPath(); cx.moveTo(12, headY + 8); cx.lineTo(17, headY + 7); cx.stroke();

  // headgear
  if (c === CHARS.anansi) {
    poly([[-14, headY - 8], [14, headY - 10], [12, headY - 22], [-10, headY - 20]], c.main, O);
    cx.strokeStyle = c.acc; cx.lineWidth = 3;
    cx.beginPath(); cx.moveTo(-12, headY - 14); cx.lineTo(12, headY - 16); cx.stroke();
  }
  if (c === CHARS.shango) {
    poly([[-12, headY - 10], [12, headY - 10], [8, headY - 28], [0, headY - 20], [-8, headY - 28]], c.main, O);
    blob(-14, headY + 2, 4, c.acc, O);
  }
  if (c === CHARS.mamiwata) {
    poly([[-14, headY - 8], [14, headY - 8], [10, headY - 18], [-10, headY - 18]], c.acc, O);
    // serpent over shoulders
    cx.strokeStyle = O; cx.lineWidth = 9;
    cx.beginPath(); cx.moveTo(-18, chestY - 2);
    cx.quadraticCurveTo(0, chestY - 14, 18, chestY - 4); cx.stroke();
    cx.strokeStyle = '#3da45c'; cx.lineWidth = 6;
    cx.beginPath(); cx.moveTo(-18, chestY - 2);
    cx.quadraticCurveTo(0, chestY - 14, 18, chestY - 4); cx.stroke();
    blob(19, chestY - 4, 4.5, '#3da45c', O);
  }
  if (c === CHARS.impundulu) {
    // beaked mask + crest
    poly([[14, headY - 2], [34, headY + 4], [14, headY + 9]], c.acc, O);
    poly([[-8, headY - 14], [2, headY - 30], [10, headY - 14]], c.acc, O);
    poly([[-16, headY - 12], [-8, headY - 26], [-2, headY - 12]], c.main, O);
  }

  // left (front) arm
  limb(10, chestY, elbL[0], elbL[1], P.lh[0], P.lh[1], 10.5, c.skin, O);
  blob(P.lh[0], P.lh[1], 7, c.skin, O);

  // weapon: shango axe in front hand
  if (c === CHARS.shango) {
    cx.save();
    cx.translate(P.lh[0], P.lh[1]);
    const swing = f.state === 'axe' ? (f.attackT < (f.attack ? f.attack.startup : 16) ? -1.9 : 0.7) : -0.6;
    cx.rotate(swing);
    cx.strokeStyle = O; cx.lineWidth = 7; cx.beginPath(); cx.moveTo(0, 8); cx.lineTo(0, -34); cx.stroke();
    cx.strokeStyle = '#7a4a2b'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(0, 8); cx.lineTo(0, -34); cx.stroke();
    poly([[-20, -34], [20, -34], [13, -52], [-13, -52]], '#c9c2b2', O);
    cx.restore();
  }

  // webbed overlay
  if (f.webT > 0) {
    cx.strokeStyle = 'rgba(220,200,255,.9)'; cx.lineWidth = 2.5;
    for (let i = 0; i < 5; i++) {
      cx.beginPath();
      cx.moveTo(-22, headY + 8 + i * 22); cx.lineTo(24, headY + 18 + i * 22);
      cx.stroke();
    }
  }
  // heal aura
  if (f.state === 'heal') {
    cx.strokeStyle = 'rgba(98,216,232,.7)'; cx.lineWidth = 3;
    cx.beginPath(); cx.arc(0, -70, 52 + Math.sin(f.animT * 0.2) * 6, 0, 7); cx.stroke();
  }
  // attack smear
  if (f.attack && f.attackT > f.attack.startup && f.attackT <= f.attack.startup + f.attack.active && f.attack.dmg) {
    cx.strokeStyle = 'rgba(255,255,255,.65)'; cx.lineWidth = 5; cx.lineCap = 'round';
    cx.beginPath();
    cx.arc(10, -80, 60, -0.7, 0.55); cx.stroke();
  }

  cx.restore();
}

// ---------------------------------------------------------------- stage
let bgSeed = [];
for (let i = 0; i < 40; i++) bgSeed.push(Math.random());
function drawStage() {
  // dusk sky
  const sky = cx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, '#2a1140');
  sky.addColorStop(0.45, '#8a2f3a');
  sky.addColorStop(0.8, '#e8703a');
  sky.addColorStop(1, '#f5a14b');
  cx.fillStyle = sky; cx.fillRect(0, 0, W, GROUND);
  // sun
  cx.fillStyle = '#ffd98a';
  cx.beginPath(); cx.arc(W / 2, GROUND - 70, 90, 0, 7); cx.fill();
  cx.fillStyle = 'rgba(255,217,138,.25)';
  cx.beginPath(); cx.arc(W / 2, GROUND - 70, 130, 0, 7); cx.fill();
  // far hills
  cx.fillStyle = '#46203a';
  cx.beginPath(); cx.moveTo(0, GROUND - 60);
  for (let i = 0; i <= 16; i++) cx.lineTo(i * 80, GROUND - 60 - bgSeed[i] * 70);
  cx.lineTo(W, GROUND); cx.lineTo(0, GROUND); cx.fill();
  // baobab silhouettes
  cx.fillStyle = '#241019';
  drawBaobab(170, GROUND, 1.15);
  drawBaobab(1100, GROUND, 0.9);
  // birds
  cx.strokeStyle = '#241019'; cx.lineWidth = 2.5;
  for (let i = 0; i < 5; i++) {
    const bx = (game.frame * 0.3 + i * 230) % (W + 100) - 50;
    const by = 90 + bgSeed[i + 8] * 110 + Math.sin(game.frame * 0.05 + i) * 6;
    cx.beginPath(); cx.moveTo(bx - 9, by);
    cx.quadraticCurveTo(bx - 3, by - 6, bx, by);
    cx.quadraticCurveTo(bx + 3, by - 6, bx + 9, by); cx.stroke();
  }
  // arena ground
  const gr = cx.createLinearGradient(0, GROUND, 0, H);
  gr.addColorStop(0, '#9c5a2a');
  gr.addColorStop(1, '#4a2410');
  cx.fillStyle = gr; cx.fillRect(0, GROUND, W, H - GROUND);
  cx.strokeStyle = 'rgba(0,0,0,.3)'; cx.lineWidth = 3;
  cx.beginPath(); cx.moveTo(0, GROUND + 2); cx.lineTo(W, GROUND + 2); cx.stroke();
  // ground pattern (adinkra-ish marks)
  cx.strokeStyle = 'rgba(255,200,120,.16)'; cx.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    const gx = 60 + i * 90, gy = GROUND + 30 + (i % 3) * 22;
    cx.beginPath(); cx.arc(gx, gy, 8, 0, 7); cx.stroke();
    cx.beginPath(); cx.moveTo(gx - 12, gy); cx.lineTo(gx + 12, gy); cx.stroke();
  }
  // torches at edges
  for (const tx of [50, W - 50]) {
    cx.strokeStyle = '#241019'; cx.lineWidth = 8;
    cx.beginPath(); cx.moveTo(tx, GROUND); cx.lineTo(tx, GROUND - 90); cx.stroke();
    const fl = Math.sin(game.frame * 0.3 + tx) * 4;
    blob(tx, GROUND - 100 + fl * 0.4, 13 + fl * 0.6, '#ff9b2e', 'rgba(200,60,0,.9)');
    blob(tx, GROUND - 104 + fl * 0.4, 6, '#ffe46b', '#ff9b2e');
  }
}
function drawBaobab(x, y, s) {
  cx.save(); cx.translate(x, y); cx.scale(s, s);
  cx.beginPath();
  cx.moveTo(-26, 0); cx.lineTo(-18, -110); cx.lineTo(-46, -150); cx.lineTo(-38, -154);
  cx.lineTo(-10, -122); cx.lineTo(-2, -160) ; cx.lineTo(8, -160); cx.lineTo(8, -124);
  cx.lineTo(40, -152); cx.lineTo(46, -146); cx.lineTo(20, -112); cx.lineTo(26, 0);
  cx.closePath(); cx.fill();
  cx.fillRect(-70, -165, 140, 14);
  cx.restore();
}

// ---------------------------------------------------------------- projectile / fx render
function drawProjectiles() {
  for (const p of game.projectiles) {
    cx.save();
    switch (p.type) {
      case 'web':
        cx.translate(p.x, p.y); cx.rotate(p.t * 0.2);
        blob(0, 0, 13, 'rgba(190,150,255,.9)', '#2a1738');
        cx.strokeStyle = '#fff'; cx.lineWidth = 1.6;
        for (let i = 0; i < 4; i++) {
          cx.beginPath(); cx.moveTo(-13, 0); cx.lineTo(13, 0); cx.stroke(); cx.rotate(Math.PI / 4);
        }
        break;
      case 'wave': {
        cx.translate(p.x, GROUND);
        const h = 64 + Math.sin(p.t * 0.3) * 8;
        poly([[-55, 0], [-20, -h], [10, -h + 14], [40, -h * 0.55], [60, 0]], 'rgba(40,160,200,.85)', '#0a3a48');
        cx.fillStyle = '#cdf3ff';
        cx.beginPath(); cx.arc(-18, -h, 9, 0, 7); cx.arc(8, -h + 13, 7, 0, 7); cx.fill();
        break;
      }
      case 'feather':
        cx.translate(p.x, p.y); cx.rotate(Math.atan2(p.vy, p.vx));
        poly([[-12, 0], [8, -4], [14, 0], [8, 4]], '#e9e4da', '#33272e');
        cx.fillStyle = '#d4262e'; cx.fillRect(-12, -1.5, 8, 3);
        break;
      case 'spider':
        cx.translate(p.x, p.y);
        blob(0, 0, 7, '#2a1738', '#19100c');
        cx.strokeStyle = '#19100c'; cx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const lt = Math.sin(p.t * 0.6 + i) * 3;
          cx.beginPath(); cx.moveTo(-6, -2 + i * 3); cx.lineTo(-13, -5 + i * 4 + lt); cx.stroke();
          cx.beginPath(); cx.moveTo(6, -2 + i * 3); cx.lineTo(13, -5 + i * 4 + lt); cx.stroke();
        }
        cx.fillStyle = '#e8b62c'; cx.fillRect(-2, -3, 4, 2);
        break;
      case 'boltmark':
        if (p.t < 26) {
          cx.globalAlpha = 0.5 + Math.sin(p.t * 0.8) * 0.3;
          cx.strokeStyle = '#ffe46b'; cx.lineWidth = 3;
          cx.beginPath(); cx.arc(p.x, GROUND, 46 - p.t, 0, 7); cx.stroke();
          cx.globalAlpha = 1;
        } else {
          jaggedBolt(p.x, 0, GROUND, 14, 'rgba(255,228,107,.95)');
          jaggedBolt(p.x, 0, GROUND, 5, '#fff');
        }
        break;
      case 'serpent': {
        cx.strokeStyle = '#0a3a48'; cx.lineWidth = 46; cx.lineCap = 'round';
        cx.beginPath();
        for (let i = 0; i < 9; i++) {
          const sx = p.x - p.vx * i * 9;
          const sy = GROUND - 70 + Math.sin(p.t * 0.15 - i * 0.8) * 40;
          i === 0 ? cx.moveTo(sx, sy) : cx.lineTo(sx, sy);
        }
        cx.stroke();
        cx.strokeStyle = 'rgba(40,170,210,.95)'; cx.lineWidth = 36; cx.stroke();
        cx.strokeStyle = 'rgba(180,240,255,.8)'; cx.lineWidth = 10; cx.stroke();
        const hy = GROUND - 70 + Math.sin(p.t * 0.15) * 40;
        blob(p.x + p.vx * 2.4, hy, 26, '#28aad2', '#0a3a48');
        cx.fillStyle = '#fff';
        cx.beginPath(); cx.arc(p.x + p.vx * 3.2, hy - 8, 5, 0, 7); cx.fill();
        break;
      }
    }
    cx.restore();
  }
}
function drawParticles() {
  for (const p of game.particles) {
    cx.save();
    if (p.type === 'flash') {
      cx.globalAlpha = p.life / 10;
      cx.fillStyle = '#fff';
      cx.fillRect(p.x - 50, 0, 100, GROUND);
    } else {
      cx.globalAlpha = Math.min(1, p.life / 12) * (p.type === 'smoke' ? 0.5 : 1);
      cx.fillStyle = p.col;
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill();
    }
    cx.restore();
  }
}

// ---------------------------------------------------------------- HUD
function outlinedText(txt, x, y, size, fill, align = 'center', font = "'Trebuchet MS',sans-serif") {
  cx.font = `900 ${size}px ${font}`;
  cx.textAlign = align;
  cx.lineWidth = Math.max(3, size / 9);
  cx.strokeStyle = '#19100c';
  cx.lineJoin = 'round';
  cx.strokeText(txt, x, y);
  cx.fillStyle = fill;
  cx.fillText(txt, x, y);
}
function drawHUD() {
  const [f1, f2] = game.fighters;
  drawHealthBar(40, 34, 480, f1, false);
  drawHealthBar(W - 520, 34, 480, f2, true);
  // timer
  cx.fillStyle = '#19100c';
  cx.beginPath(); cx.arc(W / 2, 52, 42, 0, 7); cx.fill();
  cx.fillStyle = '#2a1d12';
  cx.beginPath(); cx.arc(W / 2, 52, 37, 0, 7); cx.fill();
  outlinedText(String(Math.max(0, game.timer)), W / 2, 66, 38, game.timer <= 10 ? '#ff5b4d' : '#ffe46b');
  // round pips
  for (let s = 0; s < 2; s++) {
    for (let i = 0; i < 2; i++) {
      const px = s === 0 ? 60 + i * 30 : W - 60 - i * 30;
      cx.fillStyle = game.wins[s] > i ? '#ffe46b' : 'rgba(0,0,0,.45)';
      cx.strokeStyle = '#19100c'; cx.lineWidth = 3;
      cx.beginPath(); cx.arc(px, 92, 9, 0, 7); cx.fill(); cx.stroke();
    }
  }
}
function drawHealthBar(x, y, w, f, flip) {
  cx.fillStyle = '#19100c'; cx.fillRect(x - 4, y - 4, w + 8, 34);
  cx.fillStyle = '#541616'; cx.fillRect(x, y, w, 26);
  const pct = Math.max(0, f.hp / f.maxhp);
  const grad = cx.createLinearGradient(x, y, x, y + 26);
  grad.addColorStop(0, pct > 0.35 ? '#ffd84d' : '#ff7a4d');
  grad.addColorStop(1, pct > 0.35 ? '#e88f1a' : '#d8341a');
  cx.fillStyle = grad;
  const bw = w * pct;
  if (flip) cx.fillRect(x + w - bw, y, bw, 26); else cx.fillRect(x, y, bw, 26);
  outlinedText(f.c.name, flip ? x + w - 8 : x + 8, y + 21, 20, '#fff', flip ? 'right' : 'left');
  // meter
  cx.fillStyle = '#19100c'; cx.fillRect(x + (flip ? w * 0.38 : 0) - 4, y + 36, w * 0.62 + 8, 16);
  cx.fillStyle = '#1d2b4a'; cx.fillRect(x + (flip ? w * 0.38 : 0), y + 38, w * 0.62, 12);
  const mw = w * 0.62 * (f.meter / 100);
  cx.fillStyle = f.meter >= 100 ? (game.frame % 14 < 7 ? '#9ef3ff' : '#4dc3ff') : '#3f7fd8';
  if (flip) cx.fillRect(x + w - mw, y + 38, mw, 12); else cx.fillRect(x, y + 38, mw, 12);
  if (f.meter >= 100)
    outlinedText('SUPER READY', flip ? x + w - 4 : x + 4, y + 64, 13, '#9ef3ff', flip ? 'right' : 'left');
}

// ---------------------------------------------------------------- screens
function drawTitle() {
  drawStage();
  cx.fillStyle = 'rgba(15,5,2,.6)'; cx.fillRect(0, 0, W, H);
  outlinedText('ANCESTRAL', W / 2, 200, 110, '#ffb52e');
  outlinedText('COMBAT', W / 2, 300, 110, '#ff5b2e');
  outlinedText('LEGENDS OF THE CONTINENT', W / 2, 348, 26, '#ffe9c4');
  const m1 = game.mode === 'cpu', blink = game.frame % 50 < 30;
  outlinedText((m1 && blink ? '▶ ' : '') + '1 PLAYER  VS  CPU', W / 2, 440, 30, m1 ? '#ffe46b' : '#b9a98a');
  outlinedText((!m1 && blink ? '▶ ' : '') + '2 PLAYERS', W / 2, 488, 30, !m1 ? '#ffe46b' : '#b9a98a');
  outlinedText('W/S to choose • ENTER to begin', W / 2, 560, 20, '#e8d8b8');
  outlinedText('P1: WASD move • F punch • G kick • H special (↓+H alt) • T super', W / 2, 630, 17, '#c9b896');
  outlinedText('P2: Arrows move • , punch • . kick • / special (↓+/ alt) • R-Shift super', W / 2, 658, 17, '#c9b896');
  outlinedText('Hold AWAY from your opponent to block', W / 2, 690, 17, '#c9b896');
}

const previewCache = {};
function previewFighter(charId, x, y, scale, facing = 1) {
  const f = previewCache[charId] || (previewCache[charId] = new Fighter(charId, 0, 1, P1K, false));
  f.animT = game.frame; f.state = 'idle'; f.facing = facing;
  cx.save(); cx.translate(x, y); cx.scale(scale, scale);
  f.x = 0; f.y = 0;
  const sx = f.x, sy = f.y; f.x = 0; f.y = 0;
  cx.translate(0, 0);
  const oldOpp = f.opp; f.opp = null;
  drawFighterAt(f);
  f.opp = oldOpp; f.x = sx; f.y = sy;
  cx.restore();
}
function drawFighterAt(f) {
  const ox = f.x, oy = f.y;
  f.x = 0; f.y = 0;
  drawFighter(f);
  f.x = ox; f.y = oy;
}

function drawSelect() {
  drawStage();
  cx.fillStyle = 'rgba(15,5,2,.72)'; cx.fillRect(0, 0, W, H);
  outlinedText('CHOOSE YOUR LEGEND', W / 2, 80, 48, '#ffb52e');
  const phase = game.selPhase;
  outlinedText(phase === 0 ? 'PLAYER 1 — SELECT' : (game.mode === 'cpu' ? '' : 'PLAYER 2 — SELECT'),
    W / 2, 122, 24, phase === 0 ? '#ffd84d' : '#7ec8ff');

  const bw = 210, gap = 40, total = ROSTER.length * bw + (ROSTER.length - 1) * gap;
  const x0 = (W - total) / 2;
  for (let i = 0; i < ROSTER.length; i++) {
    const id = ROSTER[i], c = CHARS[id];
    const bx = x0 + i * (bw + gap), by = 160;
    const sel1 = game.selP1 === i, sel2 = game.selPhase === 1 && game.selP2 === i;
    cx.fillStyle = 'rgba(30,15,8,.9)';
    cx.fillRect(bx, by, bw, 250);
    cx.lineWidth = 5;
    cx.strokeStyle = sel1 && phase === 0 ? '#ffd84d' : sel2 ? '#7ec8ff' : '#5a3a20';
    if ((sel1 && phase === 0) || sel2) cx.lineWidth = 6 + Math.sin(game.frame * 0.2) * 2;
    cx.strokeRect(bx, by, bw, 250);
    previewFighter(id, bx + bw / 2, by + 215, 1.05);
    outlinedText(c.name, bx + bw / 2, by + 240, 21, '#ffe9c4');
    if (game.p1Char === id && phase === 1)
      outlinedText('P1', bx + 24, by + 28, 20, '#ffd84d');
  }
  const hi = CHARS[ROSTER[phase === 0 ? game.selP1 : game.selP2]];
  outlinedText(hi.title + '  •  ' + hi.origin, W / 2, 460, 24, '#ffd84d');
  wrapText(hi.lore, W / 2, 495, 920, 19, '#e8d8b8');
  let my = 560;
  for (const mv of hi.moves) { outlinedText('◈ ' + mv, W / 2, my, 17, '#c9e8b8'); my += 26; }
  outlinedText(phase === 0 ? 'A/D move • F confirm' : '←/→ move • , confirm',
    W / 2, 692, 19, '#c9b896');
}
function wrapText(txt, x, y, maxW, size, col) {
  cx.font = `${size}px 'Trebuchet MS',sans-serif`;
  const words = txt.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    if (cx.measureText(line + w).width > maxW) {
      outlinedText(line, x, yy, size, col); line = w + ' '; yy += size + 7;
    } else line += w + ' ';
  }
  outlinedText(line.trim(), x, yy, size, col);
}

function drawVS() {
  drawStage();
  cx.fillStyle = 'rgba(15,5,2,.7)'; cx.fillRect(0, 0, W, H);
  const t = Math.min(1, game.vsT / 40);
  const c1 = CHARS[game.p1Char], c2 = CHARS[game.p2Char];
  cx.save(); cx.translate((1 - t) * -420, 0);
  previewFighter(game.p1Char, 330, 480, 2.2, 1);
  outlinedText(c1.name, 330, 580, 50, '#ffd84d');
  outlinedText(c1.origin, 330, 618, 22, '#e8d8b8');
  cx.restore();
  cx.save(); cx.translate((1 - t) * 420, 0);
  previewFighter(game.p2Char, W - 330, 480, 2.2, -1);
  outlinedText(c2.name, W - 330, 580, 50, '#7ec8ff');
  outlinedText(c2.origin, W - 330, 618, 22, '#e8d8b8');
  cx.restore();
  if (t >= 1) {
    const s = 90 + Math.sin(game.frame * 0.15) * 6;
    outlinedText('VS', W / 2, 380, s, '#ff5b2e');
  }
}

function drawVictory() {
  drawStage();
  const w = game.winner, wf = game.fighters[w];
  for (const f of game.fighters) drawFighter(f);
  cx.fillStyle = 'rgba(15,5,2,.55)'; cx.fillRect(0, 0, W, H);
  previewFighter(wf.id, W / 2, 430, 2.4, 1);
  outlinedText(wf.c.name + ' IS VICTORIOUS', W / 2, 150, 56, '#ffb52e');
  outlinedText('“' + wf.c.quote + '”', W / 2, 510, 26, '#ffe9c4');
  outlinedText(wf.c.title + ' • ' + wf.c.origin, W / 2, 550, 20, '#e8d8b8');
  outlinedText('ENTER — rematch    •    ESC — character select', W / 2, 650, 22, '#c9b896');
}

// ---------------------------------------------------------------- screen logic
function updateTitle() {
  if (pressed('KeyW') || pressed('ArrowUp') || pressed('KeyS') || pressed('ArrowDown'))
    game.mode = game.mode === 'cpu' ? '2p' : 'cpu';
  if (pressed('Enter') || pressed('KeyF')) {
    game.screen = 'select'; game.selPhase = 0; game.p1Char = null; game.p2Char = null;
  }
}
function updateSelect() {
  if (game.selPhase === 0) {
    if (pressed('KeyA')) game.selP1 = (game.selP1 + ROSTER.length - 1) % ROSTER.length;
    if (pressed('KeyD')) game.selP1 = (game.selP1 + 1) % ROSTER.length;
    if (pressed('KeyF') || pressed('Enter')) {
      game.p1Char = ROSTER[game.selP1];
      if (game.mode === 'cpu') {
        let pick = Math.floor(Math.random() * ROSTER.length);
        game.p2Char = ROSTER[pick];
        game.screen = 'vs'; game.vsT = 0;
      } else game.selPhase = 1;
    }
  } else {
    if (pressed('ArrowLeft')) game.selP2 = (game.selP2 + ROSTER.length - 1) % ROSTER.length;
    if (pressed('ArrowRight')) game.selP2 = (game.selP2 + 1) % ROSTER.length;
    if (pressed('Comma') || pressed('Enter')) {
      game.p2Char = ROSTER[game.selP2];
      game.screen = 'vs'; game.vsT = 0;
    }
  }
  if (pressed('Escape')) game.screen = 'title';
}
function updateVS() {
  game.vsT++;
  if (game.vsT > 130 || (game.vsT > 45 && (pressed('Enter') || pressed('KeyF')))) {
    game.screen = 'fight';
    startMatch();
  }
}
function updateVictory() {
  if (pressed('Enter')) { game.screen = 'fight'; startMatch(); }
  if (pressed('Escape')) { game.screen = 'select'; game.selPhase = 0; }
}

// ---------------------------------------------------------------- main loop
function step() {
  switch (game.screen) {
    case 'title': updateTitle(); break;
    case 'select': updateSelect(); break;
    case 'vs': updateVS(); break;
    case 'fight': updateFight(); break;
    case 'victory': updateVictory(); break;
  }
}
function render() {
  cx.save();
  if (game.shake > 0.5 && game.screen === 'fight')
    cx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);

  switch (game.screen) {
    case 'title': drawTitle(); break;
    case 'select': drawSelect(); break;
    case 'vs': drawVS(); break;
    case 'victory': drawVictory(); break;
    case 'fight': {
      drawStage();
      const order = [...game.fighters].sort((a, b) => (a.attack ? 1 : 0) - (b.attack ? 1 : 0));
      drawProjectiles();
      for (const f of order) drawFighter(f);
      drawParticles();
      drawHUD();
      if (game.superFlash > 0) {
        cx.fillStyle = `rgba(10,4,20,${Math.min(0.55, game.superFlash / 60)})`;
        cx.fillRect(0, 0, W, H);
        outlinedText(game.superName, W / 2, H / 2 - 40, 64, '#9ef3ff');
      }
      if (game.msgT > 0 && game.msg) {
        const big = game.msg === 'FIGHT!' || game.msg === 'K.O.!';
        outlinedText(game.msg, W / 2, H / 2 - 30, big ? 120 : 80,
          game.msg === 'K.O.!' ? '#ff4d3a' : '#ffb52e');
        if (game.subMsg) outlinedText(game.subMsg, W / 2, H / 2 + 40, 26, '#ffe9c4');
      }
      break;
    }
  }
  cx.restore();
}

function loop() {
  game.frame++;
  game.acc += game.screen === 'fight' ? game.timeScale : 1;
  while (game.acc >= 1) { step(); game.acc -= 1; }
  render();
  pressBuf = {};
  requestAnimationFrame(loop);
}
loop();
