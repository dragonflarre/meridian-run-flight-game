// main.js — state machine (menu / fly / pause / crash / done), the game
// loop, and the frozen screenshot poses (?shot=menu|flight|drop|landing).
import { createWorld } from './world.js';
import { createAircraft, updateAircraft, drawAircraft, STALL_SPEED } from './aircraft.js';
import { createMission, updateMission, dropCrate, missionName } from './missions.js';
import { drawTopBar, drawInstruments } from './hud.js';
import { drawScene, worldToScreen, PLANE_SX } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { hashSeed } from './rng.js';

const W = 1280;
const H = 720;
const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedText = params.get('seed') || 'meridian-2026';
const seed = hashSeed(seedText);

const world = createWorld(seed);
const input = createInput(canvas);
const audio = createAudio();

let plane = createAircraft(world);
let mission = createMission('ring', world);
let state = 'menu'; // menu | fly | pause | crash | done
let time = 0;
let camX = 0;
let crashTimer = 0;
let lastScore = 0;

function startMission(kind) {
  mission = createMission(kind, world);
  plane = createAircraft(world);
  if (kind === 'runway') {
    plane.x = 120;
    plane.alt = world.groundHeight(120) + 55;
  }
  state = 'fly';
  time = 0;
}

function planeScreenPos() {
  return worldToScreen(plane.x, plane.alt, camX);
}

function updateCamera() {
  camX = plane.x - PLANE_SX / 1.15;
  if (camX < -320) camX = -320;
}

function drawMenu() {
  drawScene(ctx, W, H, world, plane, null, 0, time);
  ctx.fillStyle = 'rgba(16,10,32,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('MERIDIAN RUN', W / 2, 150);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('— Sky Courier —', W / 2, 196);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('A bush plane, a dusk valley, three sorties. Pick one:', W / 2, 250);
  const rows = [
    ['1', 'RING RUN', 'Fly through 10 gold rings before the clock runs out'],
    ['2', 'SUPPLY DROP', 'Drop 3 crates into the marked zones — SPACE to release'],
    ['3', 'RUNWAY', 'Fly 4.8 km and land gently on the runway'],
  ];
  rows.forEach((r, i) => {
    const y = 300 + i * 66;
    ctx.fillStyle = 'rgba(10,14,24,0.8)';
    ctx.fillRect(W / 2 - 330, y - 30, 660, 54);
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(W / 2 - 330, y - 30, 660, 54);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(r[0] + '  ' + r[1], W / 2 - 310, y - 2);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(r[2], W / 2 - 310, y + 20);
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d1d5db';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('W/S or Up/Down throttle · A/D or Left/Right pitch · mouse steers · wheel = throttle', W / 2, 520);
  ctx.fillText('SPACE drop / restart · P pause · R restart · M mute · Enter / click to fly', W / 2, 548);
  ctx.fillText('Fuel burns fast at full throttle. Below 30 m/s the nose drops — mind the stall.', W / 2, 576);
  ctx.textAlign = 'left';
}

function drawEndScreen(title, lines) {
  ctx.fillStyle = 'rgba(16,10,32,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = title === 'CRASHED' ? '#ef4444' : '#fbbf24';
  ctx.font = 'bold 56px system-ui, sans-serif';
  ctx.fillText(title, W / 2, 260);
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px system-ui, sans-serif';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 320 + i * 38));
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillStyle = '#d1d5db';
  ctx.fillText('SPACE or R — fly again · 1/2/3 — pick another mission', W / 2, 480);
  ctx.textAlign = 'left';
}

function render() {
  updateCamera();
  drawScene(ctx, W, H, world, plane, mission, camX, time);
  const p = planeScreenPos();
  drawAircraft(ctx, p.sx, p.sy, plane, time);
  drawTopBar(ctx, W, mission, plane, plane.x);
  drawInstruments(ctx, W, H, plane, world, mission, time);
  if (state === 'pause') {
    ctx.fillStyle = 'rgba(16,10,32,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('P to resume', W / 2, H / 2 + 40);
    ctx.textAlign = 'left';
  }
}

function step(dt) {
  time += dt;
  input.poll(planeScreenPos().sy);
  if (input.consume('muteQueued')) audio.toggleMute();
  if (state === 'menu') {
    if (input.consume('startQueued')) startMission('ring');
    return;
  }
  if (state === 'pause') {
    if (input.consume('pauseQueued')) state = 'fly';
    return;
  }
  if (state === 'crash' || state === 'done') {
    crashTimer -= dt;
    if (input.consume('dropQueued') || input.consume('restartQueued') || crashTimer <= 0 && input.consume('startQueued')) {
      startMission(mission.kind);
    }
    return;
  }
  // fly
  if (input.consume('pauseQueued')) { state = 'pause'; return; }
  if (input.consume('restartQueued')) { startMission(mission.kind); return; }
  audio.ensure();
  audio.update(plane.throttle, plane.speed);
  if (input.consume('dropQueued')) {
    if (dropCrate(mission, plane)) audio.thud();
  }
  const beforeRings = mission.rings ? mission.rings.filter((r) => r.passed).length : 0;
  const result = updateAircraft(plane, input, world, dt);
  updateMission(mission, plane, world, dt);
  if (mission.rings && mission.rings.filter((r) => r.passed).length > beforeRings) audio.ring();
  if (result === 'crashed') {
    audio.crash();
    plane.lives -= 1;
    crashTimer = 1.6;
    if (plane.lives <= 0) {
      state = 'done';
      lastScore = mission.score;
    } else {
      state = 'crash';
      const keepX = Math.max(120, plane.x - 500);
      const keepAlt = world.groundHeight(keepX) + 80;
      // Respawn immediately at a safe spot, keeping the lives count.
      const livesLeft = plane.lives;
      plane = createAircraft(world);
      plane.x = keepX;
      plane.alt = keepAlt;
      plane.lives = livesLeft;
      state = 'fly';
    }
  }
  if (mission.done && state === 'fly') {
    state = 'done';
    lastScore = mission.score;
  }
}

// Keyboard mission select (works in menu and on end screens).
window.addEventListener('keydown', (e) => {
  if (state === 'menu' || state === 'done' || state === 'crash') {
    if (e.key === '1') startMission('ring');
    if (e.key === '2') startMission('drop');
    if (e.key === '3') startMission('runway');
  }
});

function frame(now) {
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000 || 0.016);
  frame.last = now;
  step(dt);
  if (state === 'crash' || state === 'done') {
    render();
    if (state === 'done') drawEndScreen(plane.lives <= 0 ? 'OUT OF LIVES' : 'SORTIE COMPLETE', [
      `${missionName(mission.kind)} — score ${lastScore}`,
      mission.message || '',
      `Distance flown ${(plane.x / 1000).toFixed(2)} km`,
    ]);
    else drawEndScreen('CRASHED', [`Lives left: ${plane.lives}`, 'Back in the air — watch the ground.']);
  } else if (state === 'menu') {
    time += dt;
    drawMenu();
  } else {
    render();
  }
  requestAnimationFrame(frame);
}

function applyPose() {
  // Frozen deterministic frames for screenshots.
  time = 2.4;
  if (shot === 'menu') {
    state = 'menu';
    plane = createAircraft(world);
    plane.x = 4900;
    plane.alt = world.groundHeight(4900) + 1;
    drawMenu();
    return true;
  }
  if (shot === 'flight') {
    mission = createMission('ring', world);
    plane = createAircraft(world);
    plane.x = 1000;
    plane.alt = world.groundHeight(1000) + 88;
    plane.speed = 52;
    plane.throttle = 0.72;
    plane.pitch = 0.08;
    state = 'fly';
    render();
    return true;
  }
  if (shot === 'drop') {
    mission = createMission('drop', world);
    plane = createAircraft(world);
    plane.x = 2820;
    plane.alt = world.groundHeight(2820) + 112;
    plane.speed = 46;
    plane.throttle = 0.6;
    plane.pitch = 0.02;
    mission.crates.push({ x: 2870, alt: world.groundHeight(2870) + 62, vy: 4, landed: false });
    state = 'fly';
    render();
    return true;
  }
  if (shot === 'landing') {
    mission = createMission('runway', world);
    plane = createAircraft(world);
    plane.x = 4980;
    plane.alt = world.groundHeight(4980) + 16;
    plane.speed = 38;
    plane.throttle = 0.35;
    plane.pitch = -0.04;
    plane.vy = -2.4;
    state = 'fly';
    render();
    return true;
  }
  return false;
}

if (shot) {
  if (!applyPose()) requestAnimationFrame(frame);
} else {
  requestAnimationFrame(frame);
}
