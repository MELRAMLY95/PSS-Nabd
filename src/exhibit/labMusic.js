const FIGURES = [
  { pad: [43, 50, 59], notes: [67, 71, 74, 76, 74, 71] },
  { pad: [48, 52, 55], notes: [64, 67, 71, 72, 71, 67] },
  { pad: [38, 45, 54], notes: [66, 69, 74, 76, 74, 69] },
  { pad: [43, 50, 64], notes: [71, 74, 76, 79, 76, 74] },
];

const NOTE = 0.48;

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

function piano(ctx, dest, midi, time, duration, level, light) {
  const freq = hz(midi);
  const partials = light ? [1, 2, 3] : [1, 2, 3, 4, 5];
  const weights = partials.map((n) => 1 / (n ** 1.3));
  const sum = weights.reduce((total, weight) => total + weight, 0);
  partials.forEach((n, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * n * Math.sqrt(1 + 0.0001 * n * n);
    const amp = (level * weights[index]) / sum;
    const attack = 0.03 + index * 0.008;
    const end = time + Math.max(0.4, duration * (1.02 - index * 0.1));
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(amp, 0.0002), time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(end + 0.04);
  });
}

function makePad(ctx, dest, midi) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = hz(midi);
  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(dest);
  return { osc, gain, midi };
}

function glide(voice, midi, at, seconds) {
  const from = hz(voice.midi);
  const to = hz(midi);
  voice.osc.frequency.cancelScheduledValues(at);
  voice.osc.frequency.setValueAtTime(from, at);
  if (Math.abs(to - from) > 0.4) voice.osc.frequency.exponentialRampToValueAtTime(to, at + seconds);
  voice.midi = midi;
}

function hall(ctx, light) {
  const input = ctx.createGain();
  const wet = ctx.createGain();
  wet.gain.value = light ? 0.12 : 0.18;
  const delay = ctx.createDelay(0.5);
  const feedback = ctx.createGain();
  const tone = ctx.createBiquadFilter();
  delay.delayTime.value = light ? 0.11 : 0.18;
  feedback.gain.value = 0.22;
  tone.type = "lowpass";
  tone.frequency.value = 2200;
  input.connect(delay);
  delay.connect(tone);
  tone.connect(feedback);
  feedback.connect(delay);
  tone.connect(wet);
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

  const padBus = ctx.createGain();
  const pianoBus = ctx.createGain();
  const mix = ctx.createGain();
  const padTone = ctx.createBiquadFilter();
  const pianoTone = ctx.createBiquadFilter();
  const master = ctx.createGain();
  const room = hall(ctx, phone);
  const padCount = phone ? 2 : 3;
  const pads = FIGURES[0].pad.slice(0, padCount).map((midi) => makePad(ctx, padBus, midi));

  padTone.type = "lowpass";
  padTone.frequency.value = phone ? 1400 : 900;
  pianoTone.type = "lowpass";
  pianoTone.frequency.value = phone ? 4200 : 3000;
  padBus.connect(padTone);
  pianoBus.connect(pianoTone);
  padTone.connect(mix);
  pianoTone.connect(mix);
  mix.connect(room.input);
  master.gain.value = 0;
  master.connect(ctx.destination);

  if (phone) {
    mix.connect(master);
    room.wet.connect(master);
  } else {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 16;
    comp.ratio.value = 2;
    comp.attack.value = 0.03;
    comp.release.value = 0.4;
    mix.connect(comp);
    room.wet.connect(comp);
    comp.connect(master);
  }

  let when = 0;
  let index = 0;
  let figure = 0;
  let stopped = false;
  let started = false;
  let timer = 0;

  function schedule(time, place) {
    const pattern = FIGURES[figure % FIGURES.length];
    if (place === 0) {
      pattern.pad.slice(0, padCount).forEach((midi, padIndex) => glide(pads[padIndex], midi, time, NOTE * 4));
    }
    const level = (phone ? 0.3 : 0.22) * (place === 0 ? 1.12 : 1);
    piano(ctx, pianoBus, pattern.notes[place], time, NOTE * 2.4, level, phone);
  }

  function pump() {
    if (stopped) return;
    const horizon = ctx.currentTime + 1.6;
    while (when < horizon) {
      const place = index % 6;
      if (place === 0) figure = Math.floor(index / 6);
      schedule(when, place);
      when += NOTE;
      index += 1;
    }
    timer = window.setTimeout(pump, phone ? 220 : 160);
  }

  function begin() {
    if (started || stopped || ctx.state !== "running") return;
    started = true;
    const now = ctx.currentTime;
    pads.forEach((voice) => {
      voice.osc.start(now);
      voice.gain.gain.setValueAtTime(0.0001, now);
      voice.gain.gain.exponentialRampToValueAtTime(phone ? 0.07 : 0.05, now + 1.8);
    });
    when = now + 0.12;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(phone ? 0.5 : 0.44, now + (phone ? 0.4 : 0.8));
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
    master.gain.linearRampToValueAtTime(0, time + 1.3);
    window.setTimeout(() => ctx.close(), 1500);
  };
}
