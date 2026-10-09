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

function strings(ctx, dest, freq, start, duration, level) {
  voice(ctx, dest, freq, start, duration, level, {
    attack: 0.22,
    release: 0.55,
    vibrato: 4.6,
    depth: 0.004,
    partials: [[1, 1], [2, 0.42], [3, 0.16], [4, 0.06]],
    spread: [-8, 0, 8],
  });
}

function violin(ctx, dest, freq, start, duration, level) {
  voice(ctx, dest, freq, start, duration, level, {
    attack: 0.05,
    release: 0.28,
    vibrato: 5.3,
    depth: 0.007,
    partials: [[1, 1], [2, 0.55], [3, 0.22], [4, 0.08], [5, 0.03]],
    spread: [-5, 0, 5],
  });
}

function pluck(ctx, dest, freq, start, level) {
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0.0001, start);
  bus.gain.exponentialRampToValueAtTime(level, start + 0.012);
  bus.gain.exponentialRampToValueAtTime(0.0001, start + 1.25);
  bus.connect(dest);
  [1, 2, 3].forEach((partial, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * partial;
    gain.gain.value = [1, 0.4, 0.14][index];
    osc.connect(gain);
    gain.connect(bus);
    osc.start(start);
    osc.stop(start + 1.3);
  });
}

function hall(ctx) {
  const input = ctx.createGain();
  const wet = ctx.createGain();
  wet.gain.value = 0.42;
  [0.029, 0.041, 0.059, 0.083, 0.113].forEach((time, index) => {
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
  const ctx = new AudioContext();
  const stringsBus = ctx.createGain();
  const melodyBus = ctx.createGain();
  const harpBus = ctx.createGain();
  const mix = ctx.createGain();
  const stringsTone = ctx.createBiquadFilter();
  const melodyTone = ctx.createBiquadFilter();
  const comp = ctx.createDynamicsCompressor();
  const master = ctx.createGain();
  const room = hall(ctx);

  stringsTone.type = "lowpass";
  stringsTone.frequency.value = 2800;
  melodyTone.type = "lowpass";
  melodyTone.frequency.value = 5200;
  stringsBus.connect(stringsTone);
  melodyBus.connect(melodyTone);
  stringsTone.connect(mix);
  melodyTone.connect(mix);
  harpBus.connect(mix);
  mix.connect(room.input);
  mix.connect(comp);
  room.wet.connect(comp);
  comp.threshold.value = -16;
  comp.knee.value = 18;
  comp.ratio.value = 2.2;
  comp.attack.value = 0.012;
  comp.release.value = 0.28;
  master.gain.value = 0;
  comp.connect(master);
  master.connect(ctx.destination);

  const opened = ctx.currentTime;
  master.gain.linearRampToValueAtTime(0.3, opened + 0.22);

  let when = opened + 0.04;
  let index = 0;
  let stopped = false;
  let timer = 0;

  function schedule(bar, step, time) {
    if (step === 0) {
      const held = BEAT * 4.2;
      bar.chord.forEach((note) => strings(ctx, stringsBus, hz(note), time, held, 0.11));
      strings(ctx, stringsBus, hz(bar.bass), time, held, 0.07);
      strings(ctx, stringsBus, hz(bar.bass + 12), time, held, 0.12);
    }
    const note = bar.melody[step];
    violin(ctx, melodyBus, hz(note), time, BEAT * 1.12, 0.28);
    violin(ctx, melodyBus, hz(thirdBelow(note)), time, BEAT * 1.12, 0.12);
    violin(ctx, melodyBus, hz(note + 12), time, BEAT * 0.96, 0.045);
    const harpNotes = [...bar.chord, ...[...bar.chord].reverse()];
    pluck(ctx, harpBus, hz(harpNotes[step * 2] + 12), time, 0.09);
    pluck(ctx, harpBus, hz(harpNotes[step * 2 + 1] + 12), time + BEAT * 0.5, 0.07);
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
    timer = window.setTimeout(pump, 180);
  }

  pump();
  ctx.resume();

  return () => {
    if (stopped) return;
    stopped = true;
    window.clearTimeout(timer);
    const time = ctx.currentTime;
    master.gain.cancelScheduledValues(time);
    master.gain.setValueAtTime(master.gain.value, time);
    master.gain.linearRampToValueAtTime(0, time + 0.7);
    window.setTimeout(() => ctx.close(), 800);
  };
}
