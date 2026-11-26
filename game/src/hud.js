// hud.js — top bar plus the bottom instrument panel: airspeed dial,
// altimeter, vertical-speed dial, compass tape, fuel and throttle bars,
// lives as hearts, and a STALL warning.
export function drawDial(ctx, cx, cy, r, label, valueText, frac, ticks) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(10,14,24,0.82)';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.stroke();
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  for (const t of ticks) {
    const a = -Math.PI * 0.75 + t * Math.PI * 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8));
    ctx.lineTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
    ctx.stroke();
  }
  const na = -Math.PI * 0.75 + frac * Math.PI * 1.5;
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(na) * (r - 10), Math.sin(na) * (r - 10));
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath(); ctx.arc(0, 0, 3, 0, 6.29); ctx.fill();
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(label, 0, 29);
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(valueText, 0, 13);
  ctx.restore();
}

export function drawTopBar(ctx, W, mission, plane, distanceM) {
  ctx.fillStyle = 'rgba(10,14,24,0.78)';
  ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MERIDIAN RUN', 14, 29);
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(mission ? mission.objective : '', 190, 29);
  ctx.textAlign = 'right';
  const t = mission ? Math.max(0, Math.ceil(mission.timeLeft)) : 0;
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`SCORE ${mission ? mission.score : 0}    ${mm}:${ss}    ${(distanceM / 1000).toFixed(2)} km`, W - 14, 29);
  ctx.textAlign = 'left';
}

export function drawInstruments(ctx, W, H, plane, world, mission, time) {
  const panelY = H - 118;
  ctx.fillStyle = 'rgba(10,14,24,0.82)';
  ctx.fillRect(0, panelY, W, 118);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, panelY, W, 3);

  const knots = Math.round(plane.speed * 1.944);
  drawDial(ctx, 78, panelY + 58, 46, 'AIRSPEED kt', String(knots), Math.min(1, plane.speed / 75), [0, 0.25, 0.5, 0.75, 1]);
  const aglFt = Math.max(0, Math.round((plane.alt - world.groundHeight(plane.x)) * 3.281));
  drawDial(ctx, 196, panelY + 58, 46, 'ALT AGL ft', String(aglFt), Math.min(1, aglFt / 1200), [0, 0.25, 0.5, 0.75, 1]);
  const vsFpm = Math.round(plane.vy * 196.85);
  drawDial(ctx, 314, panelY + 58, 46, 'VERT SPD fpm', (vsFpm >= 0 ? '+' : '') + vsFpm, Math.min(1, Math.max(0, (plane.vy + 12) / 24)), [0, 0.25, 0.5, 0.75, 1]);

  // Compass tape: heading is east (090) with a little wander from pitch.
  const heading = 90 + plane.pitch * 18;
  ctx.save();
  ctx.translate(470, panelY + 58);
  ctx.fillStyle = 'rgba(10,14,24,0.82)';
  ctx.fillRect(-110, -46, 220, 92);
  ctx.strokeStyle = '#f59e0b';
  ctx.strokeRect(-110, -46, 220, 92);
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const labels = [[0, 'N'], [45, 'NE'], [90, 'E'], [135, 'SE'], [180, 'S'], [225, 'SW'], [270, 'W'], [315, 'NW'], [360, 'N']];
  for (const [deg, name] of labels) {
    const d = ((deg - heading + 540) % 360) - 180;
    const dx = d * 2.4;
    if (Math.abs(dx) > 105) continue;
    ctx.fillStyle = deg % 90 === 0 ? '#fbbf24' : '#e5e7eb';
    ctx.fillText(name, dx, -18);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(String(deg).padStart(3, '0'), dx, 34);
    ctx.font = 'bold 14px system-ui, sans-serif';
  }
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(-6, -34); ctx.lineTo(6, -34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(Math.round(((heading % 360) + 360) % 360)).padStart(3, '0'), 0, 14);
  ctx.restore();

  // Fuel + throttle bars.
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('FUEL', 620, panelY + 26);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(620, panelY + 34, 180, 14);
  ctx.fillStyle = plane.fuel < 25 ? '#ef4444' : '#22c55e';
  ctx.fillRect(620, panelY + 34, 180 * (plane.fuel / 100), 14);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(Math.round(plane.fuel) + '%', 806, panelY + 46);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('THROTTLE', 620, panelY + 72);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(620, panelY + 80, 180, 14);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(620, panelY + 80, 180 * plane.throttle, 14);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(Math.round(plane.throttle * 100) + '%', 806, panelY + 92);

  // Lives as hearts.
  ctx.font = '22px system-ui, sans-serif';
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += i < plane.lives ? '♥ ' : '♡ ';
  ctx.fillStyle = '#f87171';
  ctx.fillText(hearts, 900, panelY + 46);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#e5e7eb';
  ctx.fillText('LIVES', 900, panelY + 72);
  ctx.fillText('W/S throttle · A/D pitch', 900, panelY + 94);
  ctx.fillText('SPACE drop · P pause · M mute', 1060, panelY + 46);
  ctx.fillText('Mouse steers · wheel = throttle', 1060, panelY + 72);

  // STALL warning, flashing.
  if (plane.speed < 30 && !plane.crashed) {
    const on = Math.sin(time * 10) > -0.2;
    if (on) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ STALL — THROTTLE UP ⚠', W / 2, 84);
      ctx.textAlign = 'left';
    }
  }
  if (mission && mission.message) {
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mission.message, W / 2, panelY - 14);
    ctx.textAlign = 'left';
  }
}
