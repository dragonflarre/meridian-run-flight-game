// aircraft.js — honest arcade physics for the bush plane, plus drawing it.
// Throttle sets a target speed, pitch sets climb/descent. Below the stall
// speed (~30 m/s) the nose drops and the plane sinks. Fuel burns faster
// at full throttle. A hard touch is a crash, a gentle one is a landing.
export const STALL_SPEED = 30;
export const MAX_SPEED = 70;

export function createAircraft(world) {
  return {
    x: 120,
    alt: world.groundHeight(120) + 55,
    speed: 42,
    pitch: 0,
    throttle: 0.62,
    fuel: 100,
    lives: 3,
    vy: 0,
    crashed: false,
    landed: false,
    propAngle: 0,
    exhaust: [],
  };
}

export function updateAircraft(plane, control, world, dt) {
  if (plane.crashed) return 'crashed';
  // Throttle: keyboard nudges it, mouse wheel sets it directly.
  if (control.throttleSet !== null && control.throttleSet !== undefined) {
    plane.throttle = control.throttleSet;
  } else {
    plane.throttle += (control.throttleDelta || 0) * dt;
  }
  plane.throttle = Math.max(0, Math.min(1, plane.throttle));

  // Pitch eases toward the pilot's input.
  const targetPitch = (control.pitchInput || 0) * 0.55;
  plane.pitch += (targetPitch - plane.pitch) * Math.min(1, dt * 3.2);

  // Stall: below 30 m/s the nose drops on its own and the sink grows.
  const stalled = plane.speed < STALL_SPEED;
  if (stalled) {
    plane.pitch -= (STALL_SPEED - plane.speed) * 0.012 * dt * 60 * 0.016;
    plane.pitch = Math.max(-0.7, plane.pitch);
  }

  const targetSpeed = plane.fuel > 0 ? 12 + plane.throttle * 58 : 12;
  plane.speed += (targetSpeed - plane.speed) * Math.min(1, dt * 0.45);
  if (plane.fuel <= 0) plane.speed = Math.max(10, plane.speed - 6 * dt);

  const sink = stalled ? (STALL_SPEED - plane.speed) * 0.55 : 0;
  plane.vy = plane.speed * Math.sin(plane.pitch) - sink;
  plane.alt += plane.vy * dt;
  plane.x += plane.speed * Math.cos(plane.pitch) * dt;
  plane.propAngle += dt * (6 + plane.throttle * 34);

  plane.fuel = Math.max(0, plane.fuel - (0.10 + plane.throttle * 0.85) * dt);

  // Exhaust puffs, capped so the list never grows unbounded.
  if (plane.throttle > 0.15 && plane.exhaust.length < 60) {
    plane.exhaust.push({ x: plane.x - 26, alt: plane.alt - 1, life: 0.7, r: 2 + Math.random() * 2 });
  }
  for (const p of plane.exhaust) { p.life -= dt; p.x -= 14 * dt; }
  plane.exhaust = plane.exhaust.filter((p) => p.life > 0);

  if (plane.x > world.length - 40) plane.x = world.length - 40;

  const ground = world.groundHeight(plane.x);
  // Touchdown counts inside 2 m of the ground: a plane flaring at
  // walking height has landed, it is not still flying.
  if (plane.alt <= ground + 2.0) {
    plane.alt = ground + 0.4;
    if (plane.vy >= -4.5 && plane.speed > 22) {
      plane.landed = true;
      plane.speed = Math.max(0, plane.speed - 30 * dt);
      return 'landed';
    }
    plane.crashed = true;
    return 'crashed';
  }
  plane.landed = false;
  return stalled ? 'stall' : 'fly';
}

export function drawAircraft(ctx, sx, sy, plane, time) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-plane.pitch);
  // Shadow-less clean side view, nose to the right.
  ctx.fillStyle = '#f3e6c8';
  ctx.strokeStyle = '#2b3a42';
  ctx.lineWidth = 1.5;
  // Fuselage.
  ctx.beginPath();
  ctx.moveTo(-42, 2);
  ctx.quadraticCurveTo(-30, -12, 2, -12);
  ctx.quadraticCurveTo(34, -12, 46, -2);
  ctx.quadraticCurveTo(40, 6, 10, 8);
  ctx.lineTo(-34, 8);
  ctx.quadraticCurveTo(-44, 6, -42, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Teal cheatline.
  ctx.fillStyle = '#0f766e';
  ctx.fillRect(-38, -1, 78, 4);
  // Cabin windows.
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath();
  ctx.moveTo(6, -11);
  ctx.lineTo(26, -11);
  ctx.lineTo(30, -3);
  ctx.lineTo(6, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Tail: red fin and stabiliser.
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(-40, -8);
  ctx.lineTo(-52, -30);
  ctx.lineTo(-38, -30);
  ctx.lineTo(-28, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(-52, -4, 22, 5);
  // Wing (high wing, seen from the side as a chord bar).
  ctx.fillStyle = '#e7d9b0';
  ctx.fillRect(-14, -16, 30, 6);
  ctx.strokeRect(-14, -16, 30, 6);
  // Fixed gear.
  ctx.strokeStyle = '#2b3a42';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-18, 8); ctx.lineTo(-22, 20);
  ctx.moveTo(14, 8); ctx.lineTo(18, 20);
  ctx.stroke();
  ctx.fillStyle = '#111827';
  ctx.beginPath(); ctx.arc(-22, 21, 5, 0, 6.29); ctx.fill();
  ctx.beginPath(); ctx.arc(18, 21, 5, 0, 6.29); ctx.fill();
  // Propeller blur disc + hub.
  ctx.save();
  ctx.translate(48, -3);
  ctx.rotate(plane.propAngle);
  ctx.fillStyle = 'rgba(148,163,184,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 0, 4, 26, 0, 0, 6.29); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#374151';
  ctx.beginPath(); ctx.arc(48, -3, 4, 0, 6.29); ctx.fill();
  // Blinking nav lights.
  const blink = Math.sin(time * 5) > 0;
  if (blink) {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(44, -10, 3, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(-50, -28, 3, 0, 6.29); ctx.fill();
  }
  ctx.restore();
}
