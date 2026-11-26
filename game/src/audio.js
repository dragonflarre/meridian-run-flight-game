// audio.js — everything is WebAudio synthesis, no audio files.
// Engine hum follows throttle, wind hiss follows speed, and short
// blips mark rings, crate landings and crashes. Audio only starts
// after the player's first gesture.
export function createAudio() {
  const a = { ctx: null, muted: false, engineOsc: null, engineGain: null, windGain: null, started: false };
  a.ensure = function ensure() {
    if (a.started) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      a.ctx = new AC();
      a.engineOsc = a.ctx.createOscillator();
      a.engineOsc.type = 'sawtooth';
      a.engineOsc.frequency.value = 70;
      const lp = a.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      a.engineGain = a.ctx.createGain();
      a.engineGain.gain.value = 0.0;
      a.engineOsc.connect(lp);
      lp.connect(a.engineGain);
      a.engineGain.connect(a.ctx.destination);
      a.engineOsc.start();
      // Wind: looped noise buffer through a bandpass.
      const len = a.ctx.sampleRate;
      const buf = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const noise = a.ctx.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;
      const bp = a.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 900;
      a.windGain = a.ctx.createGain();
      a.windGain.gain.value = 0.0;
      noise.connect(bp);
      bp.connect(a.windGain);
      a.windGain.connect(a.ctx.destination);
      noise.start();
      a.started = true;
    } catch (e) { /* audio is optional */ }
  };
  a.update = function update(throttle, speed) {
    if (!a.started || !a.ctx) return;
    const g = a.muted ? 0 : 0.05 + throttle * 0.06;
    a.engineGain.gain.setTargetAtTime(g, a.ctx.currentTime, 0.1);
    a.engineOsc.frequency.setTargetAtTime(55 + throttle * 90 + speed * 0.4, a.ctx.currentTime, 0.1);
    a.windGain.gain.setTargetAtTime(a.muted ? 0 : Math.min(0.09, speed * 0.0012), a.ctx.currentTime, 0.15);
  };
  a.blip = function blip(freq, dur, type) {
    if (!a.started || !a.ctx || a.muted) return;
    const o = a.ctx.createOscillator();
    const g = a.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.18, a.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.ctx.currentTime + dur);
    o.connect(g); g.connect(a.ctx.destination);
    o.start(); o.stop(a.ctx.currentTime + dur);
  };
  a.ring = function ring() { a.blip(880, 0.25); setTimeout(() => a.blip(1320, 0.3), 90); };
  a.thud = function thud() { a.blip(140, 0.22, 'triangle'); };
  a.crash = function crash() {
    a.blip(90, 0.5, 'sawtooth');
    setTimeout(() => a.blip(60, 0.6, 'sawtooth'), 120);
  };
  a.toggleMute = function toggleMute() { a.muted = !a.muted; return a.muted; };
  return a;
}
