const CHORDS = [
  [87.31, 110, 130.81, 164.81],
  [130.81, 164.81, 196, 246.94],
  [116.54, 146.83, 174.61, 220],
  [87.31, 110, 130.81, 146.83],
];

const MELODY = [349.23, 329.63, 293.66, 261.63, 293.66, 329.63, 349.23, 392];

function tone(ctx, destination, freq, start, duration, level) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const attack = Math.min(2.6, duration * 0.24);
  const release = Math.min(3.2, duration * 0.32);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(level, start + attack);
  gain.gain.setValueAtTime(level, start + Math.max(attack + 0.2, duration - release));
  gain.gain.linearRampToValueAtTime(0, start + duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export function startLabMusic() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContext();
  const filter = ctx.createBiquadFilter();
  const master = ctx.createGain();
  filter.type = "lowpass";
  filter.frequency.value = 680;
  filter.Q.value = 0.45;
  master.gain.value = 0;
  filter.connect(master);
  master.connect(ctx.destination);
  const opened = ctx.currentTime;
  master.gain.linearRampToValueAtTime(0.09, opened + 2.4);

  let chord = 0;
  let step = 0;
  let stopped = false;

  function phrase() {
    if (stopped) return;
    const start = ctx.currentTime + 0.05;
    CHORDS[chord % CHORDS.length].forEach((freq, index) => {
      tone(ctx, filter, freq, start, 14.5, index === 0 ? 0.05 : 0.022);
    });
    const note = MELODY[step % MELODY.length];
    tone(ctx, filter, note, start + 2.8, 8.2, 0.014);
    tone(ctx, filter, note * 0.8, start + 5.4, 6.4, 0.01);
    chord += 1;
    step += 1;
  }

  phrase();
  const timer = window.setInterval(phrase, 12000);
  ctx.resume();

  return () => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(timer);
    const time = ctx.currentTime;
    master.gain.cancelScheduledValues(time);
    master.gain.setValueAtTime(master.gain.value, time);
    master.gain.linearRampToValueAtTime(0, time + 0.9);
    window.setTimeout(() => ctx.close(), 1000);
  };
}
