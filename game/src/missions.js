// missions.js — the three missions: Ring Run, Supply Drop and Runway.
// Each mission owns its targets, its score and its clock.
export function createMission(kind, world) {
  const m = { kind, score: 0, timeLeft: 240, done: false, message: '', rings: [], zones: [], crates: [], dropsLeft: 3 };
  if (kind === 'ring') {
    m.timeLeft = 150;
    for (let i = 0; i < 10; i++) {
      const x = 650 + i * 520;
      const alt = world.groundHeight(x) + 62 + ((i * 37) % 70);
      m.rings.push({ x, alt, r: 19, passed: false });
    }
    m.objective = 'Fly through 10 gold rings';
  } else if (kind === 'drop') {
    m.timeLeft = 200;
    const centres = [1500, 2900, 4300];
    for (const x of centres) {
      m.zones.push({ x, ground: world.groundHeight(x), r: 55, scored: false, result: null });
    }
    m.objective = 'Drop 3 crates into the marked zones (SPACE)';
  } else {
    m.timeLeft = 240;
    m.objective = 'Fly 4.8 km and land gently on the runway';
  }
  return m;
}

export function missionName(kind) {
  return kind === 'ring' ? 'RING RUN' : kind === 'drop' ? 'SUPPLY DROP' : 'RUNWAY';
}

export function updateMission(mission, plane, world, dt) {
  if (mission.done) return;
  mission.timeLeft -= dt;
  if (mission.timeLeft <= 0) {
    mission.done = true;
    mission.message = 'Time up — sortie over.';
    return;
  }
  if (mission.kind === 'ring') {
    for (const ring of mission.rings) {
      if (ring.passed) continue;
      const dx = plane.x - ring.x;
      const dy = plane.alt - ring.alt;
      if (dx * dx + dy * dy < ring.r * ring.r) {
        ring.passed = true;
        mission.score += 100;
        plane.fuel = Math.min(100, plane.fuel + 8);
        mission.message = 'Ring! +100 pts, +fuel';
      }
    }
    if (mission.rings.every((r) => r.passed)) {
      mission.done = true;
      mission.message = 'All 10 rings! Sortie complete.';
    }
  }
  if (mission.kind === 'drop') {
    for (const crate of mission.crates) {
      if (crate.landed) continue;
      crate.vy = Math.min(crate.vy + 9 * dt, 7);
      crate.alt -= crate.vy * dt;
      crate.x += 2.5 * dt; // light drift while the chute is open
      const g = world.groundHeight(crate.x);
      if (crate.alt <= g + 2) {
        crate.alt = g + 2;
        crate.landed = true;
        const zone = mission.zones.find((z) => !z.scored && Math.abs(crate.x - z.x) < z.r + 40);
        if (zone) {
          const d = Math.abs(crate.x - zone.x);
          const pts = d < 15 ? 100 : d < 30 ? 70 : d < 60 ? 40 : 10;
          zone.scored = true;
          zone.result = pts;
          mission.score += pts;
          mission.message = `Crate down ${Math.round(d)} m off centre: +${pts}`;
        } else {
          mission.message = 'Crate missed every zone.';
        }
      }
    }
    if (mission.zones.every((z) => z.scored) || (mission.dropsLeft === 0 && mission.crates.every((c) => c.landed))) {
      mission.done = true;
      mission.message = 'Supply run finished.';
    }
  }
  if (mission.kind === 'runway') {
    if (plane.landed && plane.x >= world.runway.x0 - 40 && plane.x <= world.runway.x1 + 40) {
      const softness = Math.max(0, -plane.vy);
      const pts = plane.vy >= -2 ? 500 : plane.vy >= -3.2 ? 350 : 200;
      mission.score += pts;
      mission.done = true;
      mission.message = `Touchdown at ${Math.abs(plane.vy).toFixed(1)} m/s down — +${pts} pts.`;
    } else if (plane.landed) {
      mission.done = true;
      mission.message = 'Landed off the runway — no points for that one.';
    }
  }
}

export function dropCrate(mission, plane) {
  if (mission.kind !== 'drop' || mission.dropsLeft <= 0) return false;
  mission.dropsLeft -= 1;
  mission.crates.push({ x: plane.x, alt: plane.alt - 6, vy: 0, landed: false });
  return true;
}
