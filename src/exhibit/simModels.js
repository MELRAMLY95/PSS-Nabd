const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

export function heartHour({ solar, demand, capacity, charge, priority }) {
  const balance = solar - demand;
  const surplus = Math.max(0, balance);
  const deficit = Math.max(0, -balance);
  const ratio = priority === "critical" ? 1 : priority === "even" ? 0.6 : 0.3;
  const fromBattery = Math.min(charge, deficit * ratio);
  const unmet = deficit - fromBattery;
  const nextCharge = Math.max(0, Math.min(capacity, charge + surplus * 0.5 - fromBattery));
  return {
    balance: Math.round(balance),
    unmet: Math.round(unmet),
    charge: Math.round(nextCharge),
    fromBattery: Math.round(fromBattery),
  };
}

export const EMERGENCIES = {
  heat: { label: "Heat wave", heat: 78, water: 28, energy: 52, air: 18 },
  water: { label: "Water shortage", heat: 24, water: 86, energy: 36, air: 12 },
  dust: { label: "Dust", heat: 20, water: 16, energy: 22, air: 90 },
  grid: { label: "Grid strain", heat: 34, water: 18, energy: 88, air: 14 },
  combined: { label: "All at once", heat: 70, water: 68, energy: 72, air: 54 },
};

export const RESPONSE_KEYS = ["heat", "water", "energy", "air"];

export function brainModel({ emergency, severity, alloc }) {
  const base = EMERGENCIES[emergency];
  const factor = 0.5 + severity * 0.14;
  const risks = {};
  RESPONSE_KEYS.forEach((key) => {
    risks[key] = clamp(base[key] * factor - alloc[key] * 7);
  });
  const spent = RESPONSE_KEYS.reduce((sum, key) => sum + alloc[key], 0);
  const outcome = clamp(100 - RESPONSE_KEYS.reduce((sum, key) => sum + risks[key], 0) / RESPONSE_KEYS.length);
  return { risks, remaining: 12 - spent, outcome, spent };
}

export function kidneyModel({ stages, flow, condition }) {
  const stageFactor = [0.34, 0.6, 0.82][stages - 1];
  const contact = clamp(100 - flow * 0.55);
  const quality = clamp(condition * 0.5 + contact * 0.3 + stages * 6);
  const recovery = clamp(flow * stageFactor * (condition / 100) * (0.45 + contact / 180));
  const time = Math.max(1, Math.round((stages * 48) / Math.max(flow, 8)));
  return { recovery, time, quality };
}

export const LIVER_TOKENS = [
  { id: "plastic", label: "Clean plastic" },
  { id: "metal", label: "Metal" },
  { id: "paper", label: "Dry paper" },
  { id: "food", label: "Leftover food" },
  { id: "plant", label: "Plant cuttings" },
  { id: "battery", label: "Battery" },
  { id: "chemical", label: "Solvent bottle" },
  { id: "mixed", label: "Soiled mix" },
];

export const LIVER_KEY = {
  plastic: "recover",
  metal: "recover",
  paper: "recover",
  food: "organic",
  plant: "organic",
  battery: "hazard",
  chemical: "hazard",
  mixed: "remainder",
};

export const LIVER_STREAMS = [
  ["recover", "Recover"],
  ["organic", "Organic"],
  ["hazard", "Hazardous"],
  ["remainder", "Remainder"],
];

export function liverScore(placed) {
  const ids = Object.keys(placed);
  const usefulTotal = Object.values(LIVER_KEY).filter((answer) => answer === "recover" || answer === "organic").length;
  if (ids.length === 0) return { accuracy: 0, contamination: 0, recovery: 0, placed: 0 };
  let correct = 0;
  let dirty = 0;
  let inUseful = 0;
  let recoveredUseful = 0;
  ids.forEach((id) => {
    const answer = LIVER_KEY[id];
    const choice = placed[id];
    if (choice === answer) correct += 1;
    if (choice === "recover" || choice === "organic") {
      inUseful += 1;
      if (choice !== answer) dirty += 1;
      else recoveredUseful += 1;
    }
  });
  return {
    placed: ids.length,
    accuracy: Math.round((100 * correct) / ids.length),
    contamination: inUseful === 0 ? 0 : Math.round((100 * dirty) / inUseful),
    recovery: Math.round((100 * recoveredUseful) / usefulTotal),
  };
}

export function skinModel({ sun, angle, insulation, vent }) {
  const shade = Math.min(1, Math.max(0, angle) / 75);
  const fixed = sun * (1 - insulation / 320);
  const adaptive = sun * (1 - shade * 0.7) * (1 - insulation / 200) * (1 - vent / 280);
  return {
    fixed: Math.round(fixed),
    adaptive: Math.round(adaptive),
  };
}

export const NOURISH_BATCHES = [
  { id: "buffet", label: "Hotel buffet", meals: 18, hours: 3 },
  { id: "market", label: "Market produce", meals: 14, hours: 6 },
  { id: "canteen", label: "Canteen surplus", meals: 10, hours: 2 },
  { id: "bakery", label: "Bakery", meals: 8, hours: 5 },
  { id: "catering", label: "Catering", meals: 16, hours: 1 },
];

export function nourishRun({ storage, move }) {
  let held = [];
  let rescued = 0;
  let waste = 0;
  const frames = [];
  for (let hour = 1; hour <= 8; hour += 1) {
    if (hour === 1) {
      NOURISH_BATCHES.forEach((batch) => {
        const used = held.reduce((sum, item) => sum + item.meals, 0);
        const room = Math.max(0, storage - used);
        if (room <= 0) {
          waste += batch.meals;
          return;
        }
        if (batch.meals <= room) held.push({ ...batch });
        else {
          held.push({ ...batch, meals: room });
          waste += batch.meals - room;
        }
      });
    }
    held.sort((a, b) => a.hours - b.hours);
    let left = move;
    const next = [];
    held.forEach((batch) => {
      if (left <= 0) {
        next.push(batch);
        return;
      }
      if (batch.meals <= left) {
        rescued += batch.meals;
        left -= batch.meals;
        return;
      }
      rescued += left;
      next.push({ ...batch, meals: batch.meals - left });
      left = 0;
    });
    const aged = [];
    next.forEach((batch) => {
      const hours = batch.hours - 1;
      if (hours <= 0) waste += batch.meals;
      else aged.push({ ...batch, hours });
    });
    held = aged;
    frames.push({
      hour,
      rescued,
      waste,
      stored: held.reduce((sum, batch) => sum + batch.meals, 0),
    });
  }
  const end = frames[frames.length - 1];
  return { frames, rescued: end.rescued, waste: end.waste };
}

const GROUND_GAIN = { low: 1, terrace: 0.62, high: 0.3 };
const DRAIN_GAIN = { low: 0.32, terrace: 0.55, high: 0.75 };

export function skeletonModel({ rain, drainage, grounds, shared }) {
  let exposure = grounds.map((ground) => Math.max(0, rain * GROUND_GAIN[ground] - drainage * DRAIN_GAIN[ground]));
  if (shared) {
    const average = exposure.reduce((sum, value) => sum + value, 0) / exposure.length;
    exposure = exposure.map((value) => value * 0.62 + average * 0.38);
  }
  return exposure.map((value) => {
    const index = Math.round(Math.min(100, value));
    const label = index < 25 ? "Protected" : index < 50 ? "Strain" : "Flood";
    return { exposure: index, label };
  });
}

export function lungModel({ particles, efficiency, fan, condition }) {
  const airflow = Math.round(fan * (condition / 100));
  const capture = (efficiency / 100) * (condition / 100) * (fan / 100);
  const removed = Math.round(Math.min(particles, particles * capture));
  return { airflow, removed, remaining: Math.round(particles - removed) };
}
