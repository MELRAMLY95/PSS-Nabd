const SCORE = [
  { chord: [55, 59, 62, 67], bass: 43, melody: [74, 71, 67, 74] },
  { chord: [50, 57, 62, 66], bass: 38, melody: [78, 76, 74, 69] },
  { chord: [52, 59, 64, 67], bass: 40, melody: [76, 74, 71, 67] },
  { chord: [48, 55, 60, 64], bass: 36, melody: [67, 76, 74, 72] },
  { chord: [55, 59, 62, 67], bass: 43, melody: [74, 71, 69, 67] },
  { chord: [48, 55, 60, 64], bass: 36, melody: [76, 79, 76, 72] },
  { chord: [50, 57, 62, 66], bass: 38, melody: [74, 78, 81, 78] },
  { chord: [55, 59, 62, 67], bass: 43, melody: [71, 74, 79, 74] },
];

const BEAT = 0.72;
const SCALE = [0, 2, 4, 6, 7, 9, 11];

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

function thirdBelow(note) {
  const pc = ((note % 12) + 12) % 12;
  const degree = SCALE.indexOf(pc);
  if (degree < 0) return note - 4;
  const target = SCALE[(degree - 2 + 7) % 7];
  const delta = (pc - target + 12) % 12;
  return note - (delta || 12);
}

function voice(ctx, dest, freq, start, duration, level, options) {
  const attack = options.attack;
  const release = Math.min(options.release, duration * 0.45);
  const partials = options.partials;
  const spread = options.spread;
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0.0001, start);
  bus.gain.exponentialRampToValueAtTime(level, start + attack);
  bus.gain.setValueAtTime(level, start + Math.max(attack + 0.02, duration - release));
  bus.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  bus.connect(dest);

  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  lfo.frequency.value = options.vibrato;
  depth.gain.value = freq * options.depth;
  lfo.connect(depth);
  lfo.start(start);
  lfo.stop(start + duration + 0.06);

  const weight = partials.reduce((sum, [, amp]) => sum + amp, 0) * spread.length;
  partials.forEach(([partial, amp]) => {
    spread.forEach((cents) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * partial * 2 ** (cents / 1200);
      depth.connect(osc.frequency);
      const gain = ctx.createGain();
      gain.gain.value = amp / weight;
      osc.connect(gain);
      gain.connect(bus);
      osc.start(start);
      osc.stop(start + duration + 0.06);
    });
  });
}

function strings(ctx, dest, freq, start, duration, level, light) {
  voice(ctx, dest, freq, start, duration, level, {
    attack: light ? 0.06 : 0.22,
    release: light ? 0.35 : 0.55,
    vibrato: 4.6,
    depth: light ? 0.005 : 0.004,
    partials: light ? [[1, 1], [2, 0.4]] : [[1, 1], [2, 0.42], [3, 0.16], [4, 0.06]],
    spread: light ? [0] : [-8, 0, 8],
  });
}

function violin(ctx, dest, freq, start, duration, level, light) {
  voice(ctx, dest, freq, start, duration, level, {
    attack: 0.04,
    release: 0.28,
    vibrato: 5.3,
    depth: light ? 0.008 : 0.007,
    partials: light ? [[1, 1], [2, 0.48], [3, 0.16]] : [[1, 1], [2, 0.55], [3, 0.22], [4, 0.08], [5, 0.03]],
    spread: light ? [0] : [-5, 0, 5],
  });
}

function pluck(ctx, dest, freq, start, level, light) {
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0.0001, start);
  bus.gain.exponentialRampToValueAtTime(level, start + 0.012);
  bus.gain.exponentialRampToValueAtTime(0.0001, start + 1.25);
  bus.connect(dest);
  const partials = light ? [1, 2] : [1, 2, 3];
  const weights = light ? [1, 0.35] : [1, 0.4, 0.14];
  partials.forEach((partial, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * partial;
    gain.gain.value = weights[index];
    osc.connect(gain);
    gain.connect(bus);
    osc.start(start);
    osc.stop(start + 1.3);
  });
}

function hall(ctx, light) {
  const input = ctx.createGain();
  const wet = ctx.createGain();
  wet.gain.value = light ? 0.22 : 0.42;
  const times = light ? [0.047, 0.083] : [0.029, 0.041, 0.059, 0.083, 0.113];
  times.forEach((time, index) => {
    const delay = ctx.createDelay(0.2);
    const feedback = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    delay.delayTime.value = time;
    feedback.gain.value = 0.34;
    tone.type = "lowpass";
    tone.frequency.value = 3200 - index * 280;
    input.connect(delay);
    delay.connect(tone);
    tone.connect(feedback);
    feedback.connect(delay);
    tone.connect(wet);
  });
  return { input, wet };
}

export function startLabMusic() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let ctx;
  try {
    ctx = new AudioContext({ latencyHint: "interactive" });
  } catch {
    ctx = new AudioContext();
  }
  const phone = window.matchMedia("(max-width: 760px)").matches;
  try {
    if (navigator.audioSession) navigator.audioSession.type = "playback";
  } catch {
    // Older browsers have no audio session control.
  }
  try {
    const unlock = ctx.createBufferSource();
    unlock.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    unlock.connect(ctx.destination);
    unlock.start();
  } catch {
    // The tap itself is what unlocks audio on a phone.
  }
  const resumePromise = ctx.resume();

  const stringsBus = ctx.createGain();
  const melodyBus = ctx.createGain();
  const harpBus = ctx.createGain();
  const mix = ctx.createGain();
  const stringsTone = ctx.createBiquadFilter();
  const melodyTone = ctx.createBiquadFilter();
  const master = ctx.createGain();
  const room = hall(ctx, phone);

  stringsTone.type = "lowpass";
  stringsTone.frequency.value = phone ? 4200 : 2800;
  melodyTone.type = "lowpass";
  melodyTone.frequency.value = phone ? 6400 : 5200;
  stringsBus.connect(stringsTone);
  melodyBus.connect(melodyTone);
  stringsTone.connect(mix);
  melodyTone.connect(mix);
  harpBus.connect(mix);
  mix.connect(room.input);
  master.gain.value = 0;
  master.connect(ctx.destination);

  if (phone) {
    mix.connect(master);
    room.wet.connect(master);
  } else {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 18;
    comp.ratio.value = 2.2;
    comp.attack.value = 0.012;
    comp.release.value = 0.28;
    mix.connect(comp);
    room.wet.connect(comp);
    comp.connect(master);
  }

  let when = 0;
  let index = 0;
  let stopped = false;
  let started = false;
  let timer = 0;

  function schedule(bar, step, time) {
    if (step === 0) {
      const held = BEAT * 4.2;
      bar.chord.forEach((note) => strings(ctx, stringsBus, hz(note), time, held, phone ? 0.16 : 0.11, phone));
      strings(ctx, stringsBus, hz(bar.bass + 12), time, held, phone ? 0.2 : 0.12, phone);
      if (!phone) strings(ctx, stringsBus, hz(bar.bass), time, held, 0.07, false);
    }
    const note = bar.melody[step];
    violin(ctx, melodyBus, hz(note), time, BEAT * 1.12, phone ? 0.36 : 0.28, phone);
    violin(ctx, melodyBus, hz(thirdBelow(note)), time, BEAT * 1.12, phone ? 0.16 : 0.12, phone);
    if (!phone) violin(ctx, melodyBus, hz(note + 12), time, BEAT * 0.96, 0.045, false);
    const harpNotes = [...bar.chord, ...[...bar.chord].reverse()];
    pluck(ctx, harpBus, hz(harpNotes[step * 2] + 12), time, phone ? 0.14 : 0.09, phone);
    pluck(ctx, harpBus, hz(harpNotes[step * 2 + 1] + 12), time + BEAT * 0.5, phone ? 0.1 : 0.07, phone);
  }

  function pump() {
    if (stopped) return;
    const horizon = ctx.currentTime + 1.5;
    while (when < horizon) {
      const bar = Math.floor(index / 4) % SCORE.length;
      schedule(SCORE[bar], index % 4, when);
      when += BEAT;
      index += 1;
    }
    timer = window.setTimeout(pump, phone ? 240 : 180);
  }

  function begin() {
    if (started || stopped || ctx.state !== "running") return;
    started = true;
    const now = ctx.currentTime;
    when = now + 0.05;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(phone ? 0.5 : 0.3, now + (phone ? 0.12 : 0.22));
    pump();
  }

  resumePromise.then(begin);
  window.setTimeout(begin, 280);

  return () => {
    if (stopped) return;
    stopped = true;
    window.clearTimeout(timer);
    const time = ctx.currentTime;
    master.gain.cancelScheduledValues(time);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), time);
    master.gain.linearRampToValueAtTime(0, time + 0.45);
    window.setTimeout(() => ctx.close(), 560);
  };
}
