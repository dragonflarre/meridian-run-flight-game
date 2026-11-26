// world.js — the valley: terrain from summed sine waves, a river dip,
// pine trees, two small villages and one flat runway strip.
import { makeRng } from './rng.js';

export const WORLD_LENGTH = 6200;
export const RUNWAY = { x0: 4800, x1: 5350, ground: 42 };

function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function createWorld(seed) {
  const rng = makeRng(seed);
  const p1 = rng.range(0, Math.PI * 2);
  const p2 = rng.range(0, Math.PI * 2);
  const p3 = rng.range(0, Math.PI * 2);
  const p4 = rng.range(0, Math.PI * 2);

  function rawGround(x) {
    let g = 42;
    g += 26 * Math.sin(x * 0.0011 + p1);
    g += 16 * Math.sin(x * 0.0027 + p2);
    g += 8 * Math.sin(x * 0.0061 + p3);
    g += 5 * Math.sin(x * 0.013 + p4);
    // River valley dip around x = 2100.
    const d = (x - 2100) / 260;
    g -= 24 * Math.exp(-d * d);
    return g;
  }

  function groundHeight(x) {
    const g = rawGround(x);
    // Flatten the strip where the runway sits.
    const flat = smoothstep(RUNWAY.x0 - 180, RUNWAY.x0 + 60, x) *
      (1 - smoothstep(RUNWAY.x1 - 60, RUNWAY.x1 + 180, x));
    return g + (RUNWAY.ground - g) * flat;
  }

  const trees = [];
  for (let x = 60; x < WORLD_LENGTH; x += 55) {
    if (x > RUNWAY.x0 - 120 && x < RUNWAY.x1 + 120) continue;
    if (Math.abs(x - 2100) < 90) continue; // keep the river clear
    trees.push({
      x: x + rng.range(-18, 18),
      h: rng.range(14, 26),
      w: rng.range(7, 11),
      shade: rng.pick(['#1d4d2b', '#256b35', '#17401f']),
    });
  }

  const villages = [
    { x: 1450, houses: 6, name: 'MERIDIAN' },
    { x: 3600, houses: 5, name: 'KERTAS' },
  ];
  for (const v of villages) {
    v.homes = [];
    for (let i = 0; i < v.houses; i++) {
      v.homes.push({ dx: -90 + i * 34 + rng.range(-6, 6), w: 22, h: 16 + rng.range(0, 8) });
    }
  }

  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({ x: rng.range(0, 1280), y: rng.range(0, 190), r: rng.range(0.6, 1.8), tw: rng.range(0, 6.28) });
  }

  const clouds = [];
  for (let layer = 0; layer < 3; layer++) {
    for (let i = 0; i < 8; i++) {
      clouds.push({
        layer,
        x: rng.range(0, WORLD_LENGTH),
        y: rng.range(50, 150 + layer * 55),
        s: rng.range(10, 20) - layer * 2,
        drift: rng.range(1.5, 4),
      });
    }
  }

  return { seed, length: WORLD_LENGTH, runway: RUNWAY, groundHeight, rawGround, trees, villages, stars, clouds };
}
