// render.js — the dusk valley: gradient sky, low sun with halo, early
// stars, three parallax cloud layers, far mountains, mid hills, near
// terrain with pines, houses, the river and the runway, then rings,
// drop zones, crates and the plane.
export const SCALE = 1.15;
export const PLANE_SX = 380;
export const BASE_Y = 560;

export function worldToScreen(x, alt, camX) {
  return { sx: (x - camX) * SCALE + PLANE_SX, sy: BASE_Y - alt * SCALE };
}

export function drawScene(ctx, W, H, world, plane, mission, camX, time) {
  // Sky: dusk gradient, purple up top to orange at the horizon.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2b1b4e');
  sky.addColorStop(0.45, '#7c3f6d');
  sky.addColorStop(0.75, '#e07a4f');
  sky.addColorStop(1, '#f6b26b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Early stars, fading in.
  for (const s of world.stars) {
    ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(time * 0.7 + s.tw));
    ctx.fillStyle = '#fff7d6';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.29); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Low sun with halo.
  const sunX = 1020, sunY = 218;
  const halo = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 130);
  halo.addColorStop(0, 'rgba(255,214,120,0.9)');
  halo.addColorStop(0.35, 'rgba(255,170,80,0.45)');
  halo.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 140, sunY - 140, 280, 280);
  ctx.fillStyle = '#ffd97a';
  ctx.beginPath(); ctx.arc(sunX, sunY, 34, 0, 6.29); ctx.fill();

  // Clouds: three small layers, parallax by layer, never big slabs.
  for (const c of world.clouds) {
    const par = 0.25 + c.layer * 0.22;
    let sx = ((c.x - camX * par) % 1500 + 1500) % 1500 - 110;
    const sy = c.y + c.layer * 12 + Math.sin(time * 0.3 + c.x) * 2;
    ctx.fillStyle = `rgba(255,236,220,${0.75 - c.layer * 0.16})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy, c.s, c.s * 0.38, 0, 0, 6.29);
    ctx.ellipse(sx + c.s * 0.7, sy + 3, c.s * 0.7, c.s * 0.3, 0, 0, 6.29);
    ctx.ellipse(sx - c.s * 0.7, sy + 4, c.s * 0.6, c.s * 0.28, 0, 0, 6.29);
    ctx.fill();
  }

  // Far mountains (slow parallax) and mid hills.
  drawRidge(ctx, W, camX, 0.12, 300, '#5b3a6e', 90);
  drawRidge(ctx, W, camX, 0.3, 380, '#7a4a63', 60);

  // Near terrain: filled polygon along the ground line.
  ctx.beginPath();
  ctx.moveTo(-10, H);
  for (let sx = -10; sx <= W + 10; sx += 8) {
    const wx = camX + (sx - PLANE_SX) / SCALE;
    const g = world.groundHeight(Math.max(0, Math.min(world.length, wx)));
    ctx.lineTo(sx, BASE_Y - g * SCALE);
  }
  ctx.lineTo(W + 10, H);
  ctx.closePath();
  const groundGrad = ctx.createLinearGradient(0, 380, 0, H);
  groundGrad.addColorStop(0, '#4d7c3a');
  groundGrad.addColorStop(1, '#2c4a22');
  ctx.fillStyle = groundGrad;
  ctx.fill();

  // River: a blue band where the valley dips.
  const river = worldToScreen(2100, world.groundHeight(2100), camX);
  ctx.fillStyle = '#3b82c4';
  ctx.beginPath();
  ctx.ellipse(river.sx, river.sy + 8, 120, 12, 0, 0, 6.29);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(river.sx - 90, river.sy + 4, 180, 2);

  // Runway: dark strip with white dashes and edge lights.
  const r0 = worldToScreen(world.runway.x0, world.runway.ground, camX);
  const r1 = worldToScreen(world.runway.x1, world.runway.ground, camX);
  if (r1.sx > -50 && r0.sx < W + 50) {
    ctx.fillStyle = '#374151';
    ctx.fillRect(r0.sx, r0.sy - 4, r1.sx - r0.sx, 10);
    ctx.fillStyle = '#f8fafc';
    for (let x = r0.sx + 12; x < r1.sx - 12; x += 34) ctx.fillRect(x, r0.sy - 1, 18, 3);
    ctx.fillStyle = '#facc15';
    for (let x = r0.sx; x <= r1.sx; x += 44) {
      ctx.beginPath(); ctx.arc(x, r0.sy - 7, 2.5, 0, 6.29); ctx.fill();
    }
  }

  // Trees and village houses.
  for (const t of world.trees) {
    const p = worldToScreen(t.x, world.groundHeight(t.x), camX);
    if (p.sx < -20 || p.sx > W + 20) continue;
    ctx.fillStyle = t.shade;
    ctx.beginPath();
    ctx.moveTo(p.sx, p.sy - t.h);
    ctx.lineTo(p.sx - t.w / 2, p.sy);
    ctx.lineTo(p.sx + t.w / 2, p.sy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5b3a1e';
    ctx.fillRect(p.sx - 1.5, p.sy - 3, 3, 4);
  }
  for (const v of world.villages) {
    for (const h of v.homes) {
      const p = worldToScreen(v.x + h.dx, world.groundHeight(v.x + h.dx), camX);
      if (p.sx < -30 || p.sx > W + 30) continue;
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(p.sx - h.w / 2, p.sy - h.h, h.w, h.h);
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(p.sx - h.w / 2 - 2, p.sy - h.h);
      ctx.lineTo(p.sx, p.sy - h.h - 9);
      ctx.lineTo(p.sx + h.w / 2 + 2, p.sy - h.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(p.sx - 3, p.sy - 9, 6, 7);
    }
  }

  // Drop zones: dashed ellipses on the ground.
  if (mission && mission.kind === 'drop') {
    for (const z of mission.zones) {
      const p = worldToScreen(z.x, z.ground, camX);
      ctx.save();
      ctx.setLineDash([8, 7]);
      ctx.strokeStyle = z.scored ? '#22c55e' : '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(p.sx, p.sy + 2, z.r * SCALE, 10, 0, 0, 6.29); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = z.scored ? '#22c55e' : '#fbbf24';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(z.scored ? `+${z.result}` : 'DROP ZONE', p.sx, p.sy - 16);
      ctx.textAlign = 'left';
    }
  }

  // Rings: glowing gold circles.
  if (mission && mission.kind === 'ring') {
    for (const ring of mission.rings) {
      const p = worldToScreen(ring.x, ring.alt, camX);
      if (p.sx < -60 || p.sx > W + 60) continue;
      const pulse = 1 + 0.08 * Math.sin(time * 4 + ring.x);
      ctx.save();
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = ring.passed ? '#22c55e' : '#fbbf24';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(p.sx, p.sy, ring.r * SCALE * pulse, 0, 6.29); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = 'rgba(251,191,36,0.16)';
      ctx.beginPath(); ctx.arc(p.sx, p.sy, ring.r * SCALE * pulse, 0, 6.29); ctx.fill();
    }
  }

  // Crates with red parachutes.
  if (mission) {
    for (const c of mission.crates) {
      const p = worldToScreen(c.x, c.alt, camX);
      if (!c.landed) {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(p.sx, p.sy - 26, 16, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.moveTo(p.sx - 14, p.sy - 26); ctx.lineTo(p.sx - 6, p.sy - 8);
        ctx.moveTo(p.sx + 14, p.sy - 26); ctx.lineTo(p.sx + 6, p.sy - 8);
        ctx.stroke();
      }
      ctx.fillStyle = '#a16207';
      ctx.fillRect(p.sx - 8, p.sy - 8, 16, 16);
      ctx.strokeStyle = '#451a03';
      ctx.strokeRect(p.sx - 8, p.sy - 8, 16, 16);
    }
  }

  // Exhaust puffs.
  for (const p of plane.exhaust) {
    const s = worldToScreen(p.x, p.alt, camX);
    ctx.fillStyle = `rgba(226,232,240,${Math.max(0, p.life)})`;
    ctx.beginPath(); ctx.arc(s.sx, s.sy, p.r, 0, 6.29); ctx.fill();
  }
}

function drawRidge(ctx, W, camX, par, baseY, color, amp) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-10, baseY + 160);
  for (let sx = -10; sx <= W + 10; sx += 20) {
    const wx = camX * par + sx * 0.9;
    const y = baseY - (Math.sin(wx * 0.004) * 0.5 + 0.5) * amp - Math.sin(wx * 0.011) * amp * 0.3;
    ctx.lineTo(sx, y);
  }
  ctx.lineTo(W + 10, baseY + 160);
  ctx.closePath();
  ctx.fill();
}
