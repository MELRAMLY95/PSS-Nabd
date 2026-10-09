export const METRICS = {
  water: { label: "Water availability", short: "Water", inverse: false, organ: "kidneys" },
  energy: { label: "Energy balance", short: "Energy", inverse: false, organ: "heart" },
  heat: { label: "Heat stress", short: "Heat", inverse: true, organ: "skin" },
  air: { label: "Air quality", short: "Air", inverse: false, organ: "lungs" },
  waste: { label: "Waste load", short: "Waste", inverse: true, organ: "liver" },
  food: { label: "Food security", short: "Food", inverse: false, organ: "heart" },
  insight: { label: "System awareness", short: "Insight", inverse: false, organ: "brain" },
};

export const BASE = { water: 56, energy: 60, heat: 52, air: 62, waste: 44, food: 60, insight: 46 };
export const PRECRISIS = { water: 66, energy: 68, heat: 44, air: 68, waste: 38, food: 66, insight: 60 };
export const DRIFT = { heat: 3, water: -3 };

export const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

export function wellness(key, value) {
  return METRICS[key].inverse ? 100 - value : value;
}

export function organHealth(metrics) {
  return {
    brain: metrics.insight,
    heart: clamp(metrics.energy * 0.6 + metrics.food * 0.4),
    lungs: metrics.air,
    kidneys: metrics.water,
    liver: 100 - metrics.waste,
    skin: 100 - metrics.heat,
    blood: clamp(metrics.energy * 0.45 + metrics.water * 0.35 + metrics.food * 0.2),
    skeleton: clamp(metrics.energy * 0.35 + (100 - metrics.heat) * 0.65),
  };
}

export function systemHealth(metrics) {
  const scores = Object.keys(metrics).map((key) => wellness(key, metrics[key]));
  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const lowest = Math.min(...scores);
  return clamp(average * 0.6 + lowest * 0.4);
}

export const STAGES = [
  { min: 80, name: "Thriving", tone: "good", description: "Every organ is supplied, waste is becoming resource, and the system regenerates itself." },
  { min: 68, name: "Recovery", tone: "good", description: "Stressed systems are healing. Flows are strengthening across the body." },
  { min: 58, name: "Resilience", tone: "good", description: "The system can absorb a shock without collapsing." },
  { min: 50, name: "Balance", tone: "warning", description: "Demands are met — just. There is little margin for the next crisis." },
  { min: 42, name: "Stress", tone: "warning", description: "One or more organs are working beyond their capacity." },
  { min: 34, name: "Resource shortage", tone: "serious", description: "Critical resources are running low and flows are weakening." },
  { min: 24, name: "System imbalance", tone: "serious", description: "Organs are competing for resources. Fixing one problem is creating others." },
  { min: 0, name: "Failure", tone: "critical", description: "The system can no longer sustain itself." },
];

export function stageFor(health) {
  return STAGES.find((stage) => health >= stage.min) ?? STAGES[STAGES.length - 1];
}

export function toneClass(tone) {
  if (tone === "good") return "text-bio";
  if (tone === "warning") return "text-sand";
  if (tone === "serious") return "text-ember";
  return "text-blood";
}

export function toneMark(tone) {
  if (tone === "good") return "●";
  if (tone === "warning") return "▲";
  if (tone === "serious") return "◆";
  return "✕";
}

export function colorFor(value) {
  if (value >= 66) return "#e6d3a4";
  if (value >= 50) return "#c6a56a";
  if (value >= 36) return "#b08968";
  if (value >= 22) return "#e08a55";
  return "#d4656a";
}

export const STRATEGIES = [
  { id: "desal", name: "Expand desalination", organ: "kidneys", cost: 1, blurb: "Build more seawater desalination capacity along the coast.", effects: { water: 18, energy: -14, waste: 6 }, consequence: "More water → much higher energy demand and more brine to manage.", skills: ["Decision-making"] },
  { id: "recovery", name: "Kidney-style selective recovery", organ: "kidneys", cost: 2, blurb: "Separate used water into reusable water, recoverable materials and concentrated waste.", effects: { water: 14, energy: -6, waste: -6 }, consequence: "Recovery takes energy, but far less than producing new water.", skills: ["Innovation", "Systems thinking"] },
  { id: "conserve", name: "Smart metering & conservation", organ: "kidneys", cost: 1, blurb: "Leak detection, smart meters and demand-based pricing in every district.", effects: { water: 8, energy: 3, insight: 4 }, consequence: "Saves resources slowly — it cannot close a large gap on its own.", skills: ["Environmental awareness", "Critical thinking"] },
  { id: "solar", name: "Solar fields + storage", organ: "heart", cost: 2, blurb: "Use Oman’s sunlight with solar farms and battery storage feeding the grid.", effects: { energy: 18, air: 6 }, consequence: "Clean power, but land and storage are limited — it supplies, it doesn’t reduce demand.", skills: ["Innovation", "Environmental awareness"] },
  { id: "diesel", name: "Fire up diesel generators", organ: "heart", cost: 1, blurb: "Quick emergency power from fossil-fuel backup generators.", effects: { energy: 16, air: -14, heat: 4 }, consequence: "Fast energy → polluted air and more heat. The lungs pay the price.", skills: ["Decision-making"] },
  { id: "grid", name: "Heart: smart circulation grid", organ: "heart", cost: 2, blurb: "Route water, energy and materials to wherever the system is weakest, like blood flow.", effects: {}, circulate: true, consequence: "Strengthens the weakest system by drawing a little from the strongest.", skills: ["Systems thinking", "Problem solving"] },
  { id: "sensors", name: "Brain: sensor network", organ: "brain", cost: 1, blurb: "Sense water, energy, heat and waste in real time so decisions are based on data.", effects: { insight: 20, energy: -2 }, consequence: "Doesn’t fix anything directly — but makes every future decision smarter.", skills: ["Critical thinking", "Systems thinking"] },
  { id: "ac", name: "Run cooling at maximum", organ: "skin", cost: 1, blurb: "Turn air-conditioning up across every building, all day.", effects: { heat: -14, energy: -18, air: -6 }, consequence: "Cooler buildings → an energy spike and more emissions outside.", skills: ["Decision-making"] },
  { id: "skin", name: "Adaptive skin façades", organ: "skin", cost: 2, blurb: "Shading, cool roofs and responsive building skins that react to sun and temperature.", effects: { heat: -16, energy: 8 }, consequence: "Lower heat and energy use, but takes investment and time to retrofit.", skills: ["Innovation", "Adaptability"] },
  { id: "greening", name: "Lungs: mangroves & green corridors", organ: "lungs", cost: 2, blurb: "Coastal mangroves and shaded green streets that absorb carbon and cool the city.", effects: { air: 14, heat: -6, water: -6 }, consequence: "Cleaner, cooler air → but new plants need irrigation water.", skills: ["Environmental awareness", "Systems thinking"] },
  { id: "biorefinery", name: "Liver: waste-to-resource plant", organ: "liver", cost: 2, blurb: "Turn organic waste into compost and biogas; recover metals and plastics.", effects: { waste: -18, energy: 6, food: 4 }, consequence: "Waste becomes resource — but only if materials are separated well.", skills: ["Innovation", "Problem solving"] },
  { id: "landfill", name: "Expand landfill", organ: "liver", cost: 1, blurb: "Open new landfill sites outside the city.", effects: { waste: -10, air: -6, water: -4 }, consequence: "Waste disappears from view → leachate and methane come back later.", skills: ["Decision-making"] },
  { id: "farms", name: "Closed-loop vertical farms", organ: "liver", cost: 2, blurb: "Indoor farms that grow food with recovered water and compost.", effects: { food: 16, water: -6, energy: -6 }, consequence: "Local food → extra demand for water and electricity.", skills: ["Innovation", "Adaptability"] },
  { id: "imports", name: "Import more food", organ: "heart", cost: 1, blurb: "Increase food shipments from abroad.", effects: { food: 12, air: -4, energy: -4 }, consequence: "Food arrives quickly → but dependence and transport emissions grow.", skills: ["Decision-making"] },
  { id: "rationing", name: "Emergency rationing", organ: "brain", cost: 1, blurb: "Limit water and power use for households and industry.", effects: { water: 6, energy: 6, food: -6, insight: -4 }, consequence: "Buys time → but people and the economy feel the strain.", skills: ["Adaptability"] },
];

export const SYNERGIES = [
  { pair: ["desal", "solar"], title: "Solar-powered desalination cancels most of the energy spike", effects: { energy: 10 }, good: true },
  { pair: ["recovery", "greening"], title: "Recovered water irrigates the green corridors", effects: { water: 6 }, good: true },
  { pair: ["biorefinery", "farms"], title: "Compost and nutrients from waste feed the farms", effects: { food: 6, waste: -4 }, good: true },
  { pair: ["recovery", "farms"], title: "Farms run on recovered water instead of fresh water", effects: { water: 6 }, good: true },
  { pair: ["solar", "farms"], title: "Farms powered by sunlight", effects: { energy: 6 }, good: true },
  { pair: ["ac", "skin"], title: "Adaptive skin means cooling only where needed", effects: { energy: 8, heat: -4 }, good: true },
  { pair: ["sensors", "grid"], title: "Real-time data guides the circulation grid", effects: { insight: 6 }, good: true },
  { pair: ["diesel", "ac"], title: "Fossil feedback loop: more cooling, more pollution, more heat", effects: { air: -6, heat: 4 }, good: false },
  { pair: ["landfill", "desal"], title: "Brine and leachate overload the waste system", effects: { waste: 6 }, good: false },
];

export const JOURNEY = [
  { id: "water", year: 2028, title: "Summer demand surge", brief: "Water demand has increased while energy resources are under pressure. Improve water security without creating an unsustainable increase in energy consumption.", shock: { water: -14, heat: 8 }, budget: 3, slots: null },
  { id: "energy", year: 2032, title: "The energy squeeze", brief: "Peak electricity demand is outgrowing supply and air quality is slipping. Keep the city powered without choking its lungs.", shock: { energy: -14, air: -6 }, budget: 3, slots: null },
  { id: "waste", year: 2036, title: "A growing city, a growing waste stream", brief: "Population growth has pushed waste up and food reserves down. Can waste become a resource rather than an endpoint?", shock: { waste: 16, food: -8 }, budget: 3, slots: null },
];

export const FAILURE = {
  id: "failure",
  year: 2040,
  title: "System failure",
  brief: "A record heatwave hits during a drought. Water is falling, temperatures and energy demand are rising, waste is piling up and food reserves are dropping. The panel has three national-scale decisions to stabilise the system — and must agree on each one.",
  shock: { water: -18, heat: 14, energy: -16, waste: 14, food: -14 },
  budget: 6,
  slots: 3,
  intensity: 1.5,
};

const COLLAPSE = {
  water: { effects: { food: -6 }, text: "Water collapse → crops and farms fail (Food −6)", organ: "kidneys" },
  energy: { effects: { water: -5 }, text: "Power collapse → water pumps and recovery stop (Water −5)", organ: "heart" },
  heat: { effects: { energy: -6 }, text: "Extreme heat → cooling overloads the grid (Energy −6)", organ: "skin" },
  air: { effects: { heat: 5 }, text: "Choked lungs → trapped heat over the city (Heat +5)", organ: "lungs" },
  waste: { effects: { air: -5, water: -3 }, text: "Waste overflow → leachate and methane (Air −5 · Water −3)", organ: "liver" },
  food: { effects: { insight: -6 }, text: "Food shortage → public pressure clouds decisions (Insight −6)", organ: "heart" },
};

export function findStrategy(id) {
  return STRATEGIES.find((item) => item.id === id);
}

export function add(metrics, effects) {
  const next = { ...metrics };
  Object.entries(effects).forEach(([key, value]) => {
    next[key] = clamp(next[key] + value);
  });
  return next;
}

export function formatEffects(effects) {
  return Object.entries(effects)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${METRICS[key].short} ${value > 0 ? "+" : ""}${value}`)
    .join(" · ");
}

export function shockSteps(scenario) {
  return Object.entries(scenario.shock).map(([key, value]) => ({
    phase: "sense",
    organ: METRICS[key].organ,
    text: `${METRICS[key].label} ${value > 0 ? "↑" : "↓"} ${Math.abs(value)}`,
    tone: "bad",
  }));
}

export function resolve(metrics, chosenIds, installedIds, intensity = 1) {
  const steps = [];
  let next = { ...metrics };
  const awareness = 0.85 + metrics.insight / 300;
  steps.push({
    phase: "decide",
    organ: "brain",
    text: `Brain commits ${chosenIds.length} decision${chosenIds.length === 1 ? "" : "s"} — benefits land at ${Math.round(awareness * 100)}%`,
    tone: "neutral",
  });
  chosenIds.forEach((id) => {
    const card = findStrategy(id);
    if (card.circulate) {
      const keys = Object.keys(next).filter((key) => key !== "insight").sort((a, b) => wellness(a, next[a]) - wellness(b, next[b]));
      const weak = keys[0];
      const strong = keys[keys.length - 1];
      const amount = Math.round(14 * awareness * intensity);
      const moved = {
        [weak]: METRICS[weak].inverse ? -amount : amount,
        [strong]: METRICS[strong].inverse ? 4 : -4,
      };
      next = add(next, moved);
      steps.push({
        phase: "distribute",
        organ: "heart",
        text: `Heart reroutes resources to the weakest system (${METRICS[weak].short}) from the strongest (${METRICS[strong].short})`,
        tone: "good",
      });
      return;
    }
    const scaled = {};
    Object.entries(card.effects).forEach(([key, value]) => {
      const helpful = METRICS[key].inverse ? value < 0 : value > 0;
      scaled[key] = Math.round(helpful ? value * awareness * intensity : value * intensity);
    });
    next = add(next, scaled);
    const helpful = Object.entries(scaled).filter(([key, value]) => (METRICS[key].inverse ? value < 0 : value > 0));
    const harmful = Object.entries(scaled).filter(([key, value]) => (METRICS[key].inverse ? value > 0 : value < 0));
    steps.push({
      phase: card.organ === "kidneys" || card.organ === "liver" ? "recover" : "distribute",
      organ: card.organ,
      text: `${card.name}: ${formatEffects(scaled)}`,
      tone: helpful.length && harmful.length ? "neutral" : harmful.length ? "bad" : "good",
    });
  });
  const present = new Set([...installedIds, ...chosenIds]);
  const synergies = SYNERGIES.filter((item) => {
    const bothNow = present.has(item.pair[0]) && present.has(item.pair[1]);
    const touched = chosenIds.includes(item.pair[0]) || chosenIds.includes(item.pair[1]);
    const already = installedIds.includes(item.pair[0]) && installedIds.includes(item.pair[1]);
    return bothNow && touched && !already;
  });
  synergies.forEach((item) => {
    next = add(next, item.effects);
    steps.push({
      phase: "adapt",
      organ: findStrategy(item.pair[0]).organ,
      text: `${item.good ? "Connected solution" : "Chain reaction"}: ${item.title} (${formatEffects(item.effects)})`,
      tone: item.good ? "good" : "bad",
    });
  });
  next = applyStrain(next, steps);
  return { metrics: next, cascade: steps, synergies };
}

function applyStrain(metrics, steps) {
  let next = { ...metrics };
  const fired = new Set();
  const strain = (id, test, effects, organ, text) => {
    if (fired.has(id) || !test(next)) return;
    fired.add(id);
    next = add(next, effects);
    steps.push({ phase: "adapt", organ, text, tone: "bad" });
  };
  for (let pass = 0; pass < 2; pass += 1) {
    if (next.heat > 62) {
      const drain = Math.max(1, Math.round((next.heat - 62) / 5));
      strain("heat", () => true, { energy: -drain }, "skin", `Skin senses heat stress — cooling load drains Energy −${drain}`);
    }
    strain("energy", (state) => state.energy < 48, { water: -2 }, "heart", "Scarce energy slows the water pumps (Water −2)");
    strain("water", (state) => state.water < 40, { food: -2 }, "kidneys", "Irrigation fails where water is scarce (Food −2)");
    strain("waste", (state) => state.waste > 64, { air: -2 }, "liver", "Waste overflow reaches the air (Air −2)");
    strain("air", (state) => state.air < 42, { heat: 2 }, "lungs", "Fouled air traps heat over the city (Heat +2)");
  }
  return next;
}

export function collapses(metrics) {
  let next = { ...metrics };
  const steps = [];
  const seen = new Set();
  for (let pass = 0; pass < 3; pass += 1) {
    let changed = false;
    Object.keys(COLLAPSE).forEach((key) => {
      if (seen.has(key) || wellness(key, next[key]) >= 32) return;
      seen.add(key);
      next = add(next, COLLAPSE[key].effects);
      steps.push({ phase: "adapt", organ: COLLAPSE[key].organ, text: COLLAPSE[key].text, tone: "bad" });
      changed = true;
    });
    if (!changed) break;
  }
  return { metrics: next, cascade: steps };
}

export function forecast(metrics, chosenIds, installedIds, intensity = 1, crisis = false) {
  const result = resolve(metrics, chosenIds, installedIds, intensity);
  if (!crisis) return result;
  const broken = collapses(result.metrics);
  return { metrics: broken.metrics, cascade: [...result.cascade, ...broken.cascade], synergies: result.synergies };
}

export function weakest(metrics) {
  const key = Object.keys(metrics).reduce((previous, current) => (
    wellness(previous, metrics[previous]) <= wellness(current, metrics[current]) ? previous : current
  ));
  return { key, value: wellness(key, metrics[key]) };
}

export const PREVIEW_OFFSET = { brain: 4, heart: 2, lungs: -3, kidneys: -8, liver: 3, skin: -5, blood: 1, skeleton: -2 };

export function previewOrgans(health) {
  return Object.fromEntries(Object.keys(PREVIEW_OFFSET).map((key) => [key, clamp(health + PREVIEW_OFFSET[key])]));
}
