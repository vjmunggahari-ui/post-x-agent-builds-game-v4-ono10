// NEON ORBIT — a tiny neon orbit-ring dodger.
// One prompt built it: "Build me a tiny neon browser game: a ship circles a
// star on 3 orbit rings. One key jumps to the next ring out. Dodge asteroids,
// collect stardust, score 100 to win. Single HTML file, no libraries."
// Controls: SPACE / click / tap jumps to the next ring out. R restarts after
// WIN or GAME OVER. ?autoplay=1 runs a built-in bot (used for the video).
(function () {
  'use strict';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var CX = W / 2, CY = H / 2;
  var RINGS = [130, 215, 300];          // orbit radii, inner -> outer
  var WIN_SCORE = 100;
  var DUST_VALUE = 10;                  // 10 stardust wins the game

  // --- deterministic RNG so every run plays the same ---
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var params = new URLSearchParams(location.search);
  var AUTOPLAY = params.get('autoplay') === '1';
  var SEED = parseInt(params.get('seed') || '11', 10);
  var rng = mulberry32(SEED);

  // --- angle helpers (all angles in radians, ship travels +angle) ---
  var TAU = Math.PI * 2;
  function angNorm(a) { // to [-PI, PI)
    a = a % TAU;
    if (a >= Math.PI) a -= TAU;
    if (a < -Math.PI) a += TAU;
    return a;
  }
  function angAhead(from, to) { // forward gap from->to in [0, TAU)
    var d = (to - from) % TAU;
    if (d < 0) d += TAU;
    return d;
  }

  // --- state ---
  var ship = { ring: 1, angle: -Math.PI / 2, r: RINGS[1], fromR: RINGS[1], toR: RINGS[1], jumpT: 1, speed: 1.5, trail: [] };
  var asteroids = [];   // {ring, angle, av, size}
  var dust = [];        // {ring, angle, taken, pulse}
  var bgStars = [];
  var parts = [];       // particles {x,y,vx,vy,life,color,size}
  var confetti = [];
  var score = 0, got = 0, shields = 3, state = 'play'; // play | win | dead
  var stateT = 0, frames = 0, invuln = 0, jumpCool = 0, elapsed = 0;
  var log = [];

  function note(msg) { log.push({ t: +elapsed.toFixed(2), msg: msg }); }

  for (var i = 0; i < 120; i++) {
    bgStars.push({ x: rng() * W, y: rng() * H, s: rng() * 1.7 + 0.5, tw: rng() * TAU, sp: 0.5 + rng() * 1.5 });
  }

  function ringRadius(idx) { return RINGS[idx]; }

  function spawnAsteroid(ahead) {
    var ring = Math.floor(rng() * 3);
    var angle = ship.angle + ahead + rng() * 2.0;
    var dir = rng() < 0.55 ? 1 : -1;
    var av = dir * (0.6 + rng() * 0.6) * (rng() < 0.3 ? 2.0 : 1.0);
    asteroids.push({ ring: ring, angle: angle, av: av, size: 15 + rng() * 10 });
  }
  function spawnDust(ahead) {
    var ring = Math.floor(rng() * 3);
    var angle = ship.angle + ahead + rng() * 2.5;
    dust.push({ ring: ring, angle: angle, taken: false, pulse: rng() * TAU });
  }
  function targetAsteroids() { return Math.min(13, 5 + Math.floor(score / 20)); }
  function ensureField() {
    while (asteroids.length < targetAsteroids()) spawnAsteroid(1.6 + rng() * 1.5);
    while (dust.filter(function (d) { return !d.taken; }).length < 4) spawnDust(1.5 + rng() * 2.0);
  }
  for (var s = 0; s < 5; s++) spawnAsteroid(1.2 + s * 1.1);
  for (var d = 0; d < 5; d++) spawnDust(1.2 + d * 1.5);

  function burst(x, y, n, color) {
    for (var i = 0; i < n; i++) {
      var a = rng() * TAU, sp = 40 + rng() * 160;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + rng() * 0.4, color: color, size: 2 + rng() * 3 });
    }
  }
  function jumpRing() {
    if (state !== 'play' || jumpCool > 0) return;
    var next = (ship.ring + 1) % 3;
    ship.fromR = ship.r; ship.toR = RINGS[next]; ship.ring = next; ship.jumpT = 0;
    jumpCool = 0.22;
    var px = CX + Math.cos(ship.angle) * ship.r, py = CY + Math.sin(ship.angle) * ship.r;
    burst(px, py, 8, '#22d3ee');
  }

  // --- autoplay bot: jump when the current ring is dangerous ahead, or when
  // another ring holds stardust ahead and is safe ---
  function ringDanger(ring, aheadWindow) {
    for (var i = 0; i < asteroids.length; i++) {
      var a = asteroids[i];
      if (a.ring !== ring) continue;
      var gap = angAhead(ship.angle, a.angle);
      if (gap < aheadWindow) return true;
    }
    return false;
  }
  function ringDustAhead(ring) {
    var best = Infinity;
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      if (d.taken || d.ring !== ring) continue;
      var gap = angAhead(ship.angle, d.angle);
      if (gap < best) best = gap;
    }
    return best;
  }
  function botThink() {
    if (!AUTOPLAY || state !== 'play') return;
    var cur = ship.ring;
    var danger = ringDanger(cur, 0.55);
    var bestRing = cur, bestScore = -Infinity;
    for (var r = 0; r < 3; r++) {
      var sc = 0;
      var dg = ringDustAhead(r);
      if (dg < 1.6) sc += 3 - dg;
      if (ringDanger(r, 0.7)) sc -= 6;
      if (r !== cur) sc -= 0.4;
      if (sc > bestScore) { bestScore = sc; bestRing = r; }
    }
    if (bestRing !== cur && (danger || bestScore > 1.2)) {
      // jump repeatedly until we reach the chosen ring
      jumpRing();
    }
  }

  function resetGame() {
    rng = mulberry32(SEED);
    ship = { ring: 1, angle: -Math.PI / 2, r: RINGS[1], fromR: RINGS[1], toR: RINGS[1], jumpT: 1, speed: 1.5, trail: [] };
    asteroids = []; dust = []; parts = []; confetti = [];
    score = 0; got = 0; shields = 3; state = 'play'; stateT = 0; invuln = 0; jumpCool = 0; elapsed = 0;
    for (var s = 0; s < 5; s++) spawnAsteroid(1.2 + s * 1.1);
    for (var d = 0; d < 5; d++) spawnDust(1.2 + d * 1.5);
    note('restart seed=' + SEED);
  }

  function update(dt) {
    frames++;
    elapsed += dt;
    if (jumpCool > 0) jumpCool -= dt;
    if (invuln > 0) invuln -= dt;
    if (state === 'win' || state === 'dead') {
      stateT += dt;
      updateParticles(dt);
      return;
    }
    // ship moves along its ring
    ship.angle += ship.speed * dt;
    if (ship.jumpT < 1) {
      ship.jumpT = Math.min(1, ship.jumpT + dt / 0.18);
      var e = ship.jumpT * ship.jumpT * (3 - 2 * ship.jumpT);
      ship.r = ship.fromR + (ship.toR - ship.fromR) * e;
    }
    var sx = CX + Math.cos(ship.angle) * ship.r, sy = CY + Math.sin(ship.angle) * ship.r;
    ship.trail.push({ x: sx, y: sy, life: 0.35 });
    if (ship.trail.length > 22) ship.trail.shift();

    botThink();
    ensureField();

    for (var i = 0; i < asteroids.length; i++) {
      asteroids[i].angle += asteroids[i].av * dt;
    }
    for (var j = 0; j < dust.length; j++) {
      dust[j].angle += 0.25 * dt;
      dust[j].pulse += dt * 4;
    }
    // cull what fell far behind the ship: keep it while the ship is still
    // less than 5.6 rad behind it going forward (a passed object sits near
    // TAU ahead, so the gap is measured FROM the ship, not to it)
    asteroids = asteroids.filter(function (a) { return angAhead(ship.angle, a.angle) < 5.6; });
    dust = dust.filter(function (d) { return !d.taken && angAhead(ship.angle, d.angle) < 5.6; });

    // collect stardust
    for (var k = 0; k < dust.length; k++) {
      var dd = dust[k];
      if (dd.taken || dd.ring !== ship.ring) continue;
      if (Math.abs(angNorm(dd.angle - ship.angle)) < 0.12) {
        dd.taken = true;
        got++; score += DUST_VALUE;
        var dx = CX + Math.cos(dd.angle) * RINGS[dd.ring], dy = CY + Math.sin(dd.angle) * RINGS[dd.ring];
        burst(dx, dy, 10, '#ffd166');
        note('dust ' + got + ' score=' + score);
        if (score >= WIN_SCORE) {
          state = 'win'; stateT = 0;
          note('WIN score=' + score + ' dust=' + got + ' t=' + elapsed.toFixed(1));
          for (var c = 0; c < 90; c++) {
            confetti.push({ x: rng() * W, y: -20 - rng() * 200, vx: (rng() - 0.5) * 60, vy: 90 + rng() * 120, life: 2.5 + rng(), color: ['#22d3ee', '#f472b6', '#ffd166', '#a3e635'][c % 4], size: 4 + rng() * 5 });
          }
        }
      }
    }
    // asteroid hits
    if (invuln <= 0) {
      for (var m = 0; m < asteroids.length; m++) {
        var as = asteroids[m];
        if (as.ring !== ship.ring) continue;
        var rr = RINGS[as.ring];
        if (Math.abs(ship.r - rr) > 30) continue;
        if (Math.abs(angNorm(as.angle - ship.angle)) < (16 + as.size) / rr + 0.04) {
          shields--;
          invuln = 1.2;
          burst(sx, sy, 16, '#ef4444');
          note('HIT shields=' + shields + ' t=' + elapsed.toFixed(1));
          if (shields <= 0) {
            state = 'dead'; stateT = 0;
            note('DEAD score=' + score + ' t=' + elapsed.toFixed(1));
          }
          break;
        }
      }
    }
    updateParticles(dt);
  }
  function updateParticles(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    for (var j = confetti.length - 1; j >= 0; j--) {
      var q = confetti[j];
      q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
      if (q.life <= 0 || q.y > H + 20) confetti.splice(j, 1);
    }
    for (var k = ship.trail.length - 1; k >= 0; k--) {
      ship.trail[k].life -= dt;
      if (ship.trail[k].life <= 0) ship.trail.splice(k, 1);
    }
  }

  // --- render ---
  function drawStar(x, y, r) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
    g.addColorStop(0.25, 'rgba(255, 200, 90, 0.55)');
    g.addColorStop(1, 'rgba(255, 180, 60, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff7d6';
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function render() {
    ctx.fillStyle = '#050514';
    ctx.fillRect(0, 0, W, H);
    // background stars
    for (var i = 0; i < bgStars.length; i++) {
      var st = bgStars[i];
      var tw = 0.45 + 0.55 * Math.sin(elapsed * st.sp + st.tw);
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#c7d2fe';
      ctx.fillRect(st.x, st.y, st.s, st.s);
    }
    ctx.globalAlpha = 1;
    // orbit rings
    for (var r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.arc(CX, CY, RINGS[r], 0, TAU);
      ctx.strokeStyle = r === ship.ring ? 'rgba(34, 211, 238, 0.55)' : 'rgba(34, 211, 238, 0.18)';
      ctx.lineWidth = r === ship.ring ? 3 : 1.5;
      ctx.stroke();
    }
    drawStar(CX, CY, 42);
    // stardust
    for (var j = 0; j < dust.length; j++) {
      var d = dust[j];
      if (d.taken) continue;
      var dx = CX + Math.cos(d.angle) * RINGS[d.ring], dy = CY + Math.sin(d.angle) * RINGS[d.ring];
      var pulse = 7 + Math.sin(d.pulse) * 2;
      ctx.save();
      ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(dx, dy, pulse, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath(); ctx.arc(dx, dy, 3, 0, TAU); ctx.fill();
    }
    // asteroids
    for (var k = 0; k < asteroids.length; k++) {
      var a = asteroids[k];
      var ax = CX + Math.cos(a.angle) * RINGS[a.ring], ay = CY + Math.sin(a.angle) * RINGS[a.ring];
      ctx.save();
      ctx.fillStyle = '#3f3f56';
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ax, ay, a.size, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#55556e';
      ctx.beginPath(); ctx.arc(ax - a.size * 0.3, ay - a.size * 0.25, a.size * 0.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(ax + a.size * 0.35, ay + a.size * 0.3, a.size * 0.2, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // ship trail
    for (var t = 0; t < ship.trail.length; t++) {
      var tp = ship.trail[t];
      ctx.globalAlpha = Math.max(0, tp.life / 0.35) * 0.6;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath(); ctx.arc(tp.x, tp.y, 5, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // ship (triangle pointing along travel, tangent to the ring)
    var sx = CX + Math.cos(ship.angle) * ship.r, sy = CY + Math.sin(ship.angle) * ship.r;
    var heading = ship.angle + Math.PI / 2;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(heading);
    if (invuln > 0 && Math.floor(elapsed * 12) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(20, 0); ctx.lineTo(-14, -12); ctx.lineTo(-7, 0); ctx.lineTo(-14, 12);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
    // particles
    for (var p = 0; p < parts.length; p++) {
      var pt = parts[p];
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // confetti
    for (var c = 0; c < confetti.length; c++) {
      var cf = confetti[c];
      ctx.fillStyle = cf.color;
      ctx.fillRect(cf.x, cf.y, cf.size, cf.size * 0.6);
    }
    // HUD
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 44px monospace';
    ctx.fillText('SCORE ' + score, 28, 58);
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#ffd166';
    ctx.fillText('STARDUST ' + got + ' / 10', 28, 90);
    ctx.fillStyle = '#67e8f9';
    ctx.fillText('NEON ORBIT', 28, H - 24);
    // progress bar to WIN
    var bw = 300, bx = W / 2 - bw / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(bx, 30, bw, 16);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(bx, 30, bw * Math.min(1, score / WIN_SCORE), 16);
    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
    ctx.fillText('WIN at ' + WIN_SCORE, W / 2, 66);
    ctx.textAlign = 'left';
    // shields top-right
    for (var s = 0; s < 3; s++) {
      ctx.fillStyle = s < shields ? '#f472b6' : 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(W - 40 - s * 40, 44, 12, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('SHIELDS', W - 168, 88);
    // end screens
    if (state === 'win') {
      ctx.fillStyle = 'rgba(5, 5, 20, 0.72)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a3e635';
      ctx.font = 'bold 96px monospace';
      ctx.fillText('YOU WIN!', W / 2, H / 2 - 20);
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 34px monospace';
      ctx.fillText('SCORE 100  —  10 STARDUST', W / 2, H / 2 + 40);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('One prompt built this game. My agent beat it.', W / 2, H / 2 + 90);
      ctx.textAlign = 'left';
    } else if (state === 'dead') {
      ctx.fillStyle = 'rgba(5, 5, 20, 0.72)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 84px monospace';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 30px monospace';
      ctx.fillText('SCORE ' + score + '  —  press R to retry', W / 2, H / 2 + 40);
      ctx.textAlign = 'left';
    }
  }

  // --- input + main loop (fixed 1/60 steps, deterministic per frame) ---
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space') { e.preventDefault(); jumpRing(); }
    if (e.code === 'KeyR' && (state === 'win' || state === 'dead')) resetGame();
  });
  canvas.addEventListener('pointerdown', function () { jumpRing(); });

  var last = 0;
  function frame(ts) {
    var dt = 1 / 60;
    if (!last) last = ts;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.__game = {
    get state() { return state; },
    get score() { return score; },
    get stardust() { return got; },
    get shields() { return shields; },
    get frames() { return frames; },
    get elapsed() { return +elapsed.toFixed(2); },
    get log() { return log.slice(); },
    snapshot: function () {
      return { s: state, score: score, dust: got, shields: shields, frames: frames, t: +elapsed.toFixed(2) };
    }
  };
})();
