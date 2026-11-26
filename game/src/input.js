// input.js — keyboard, mouse steering and wheel throttle.
// Arrow Up/Down or W/S: throttle. Arrow Left/Right or A/D: pitch.
// Mouse above the plane climbs, below it descends. SPACE drops a crate
// (or restarts after a crash), P pauses, R restarts, M mutes.
export function createInput(canvas) {
  const keys = {};
  const input = {
    pitchInput: 0,
    throttleDelta: 0,
    throttleSet: null,
    mousePitch: 0,
    mouseActive: false,
    dropQueued: false,
    restartQueued: false,
    pauseQueued: false,
    muteQueued: false,
    startQueued: false,
  };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (e.repeat) return;
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') input.dropQueued = true;
    if (e.key.toLowerCase() === 'r') input.restartQueued = true;
    if (e.key.toLowerCase() === 'p') input.pauseQueued = true;
    if (e.key.toLowerCase() === 'm') input.muteQueued = true;
    if (e.key === 'Enter') input.startQueued = true;
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  let mouseY = null;
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
    input.mouseActive = true;
  });
  canvas.addEventListener('mousedown', () => { input.startQueued = true; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    input.throttleSet = null;
    input.wheelDelta = (input.wheelDelta || 0) + (e.deltaY < 0 ? 0.06 : -0.06);
  }, { passive: false });

  input.poll = function poll(planeScreenY) {
    let pitch = 0;
    if (keys['arrowleft'] || keys['a']) pitch -= 1;
    if (keys['arrowright'] || keys['d']) pitch += 1;
    // In this side view, Right / D climbs and Left / A descends; the
    // mouse steering below overrides when the mouse has moved.
    if (input.mouseActive && mouseY !== null) {
      const dy = planeScreenY - mouseY;
      if (Math.abs(dy) > 12) pitch = Math.max(-1, Math.min(1, dy / 140));
    }
    input.pitchInput = pitch;
    let td = 0;
    if (keys['arrowup'] || keys['w']) td += 0.55;
    if (keys['arrowdown'] || keys['s']) td -= 0.55;
    if (input.wheelDelta) { td += input.wheelDelta * 8; input.wheelDelta = 0; }
    input.throttleDelta = td;
    input.throttleSet = null;
  };

  input.consume = function consume(name) {
    const v = input[name];
    input[name] = false;
    return v;
  };
  return input;
}
