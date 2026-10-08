import { clamp } from "./model.js";

const BASE_METRICS = {
  water: 74,
  energy: 71,
  air: 76,
  circulation: 73,
  waste: 69,
  heat: 72,
  infrastructure: 75,
  pressure: 27,
};

export const BASE_ORGANS = {
  brain: 78,
  heart: 76,
  lungs: 75,
  kidneys: 74,
  liver: 73,
  digestive: 75,
  skin: 74,
  skeleton: 78,
};

const BASE_SKILLS = {
  critical: 42,
  systems: 42,
  problem: 40,
  adapt: 40,
  innovation: 36,
  decision: 42,
};

function applyMap(target, delta = {}) {
  Object.entries(delta).forEach(([key, value]) => {
    target[key] = clamp((target[key] ?? 0) + value);
  });
}

export const DECISION_SCENARIOS = [
  {
    id: "water",
    organ: "kidneys",
    title: "Water stress",
    problem: "Freshwater is under pressure. Consumption is rising faster than recovery.",
    shock: { metrics: { water: -12, heat: -4 }, organs: { kidneys: -8, skin: -4 } },
    choices: [
      {
        id: "water-recover",
        title: "Invest in advanced water recovery",
        note: "Cost: high. Long-term resilience: high. Treatment draws energy.",
        role: "restore",
        effects: { water: 16, waste: 6, energy: -8, circulation: 5, heat: 3 },
        organs: { kidneys: 12, heart: -3, brain: 4, skin: 3 },
        skills: { systems: 8, critical: 6, innovation: 4, decision: 5, adapt: 4 },
        chain: ["kidneys", "heart", "skin", "brain"],
        steps: ["Kidneys recover more water", "Circulation spends energy to move it", "Heat stress eases", "The brain records a steadier system"],
        because: "Recovery keeps water in the system. The cost appears in the energy circulation, not as a hidden success.",
      },
      {
        id: "water-hold",
        title: "Maintain current consumption",
        note: "Cost: low. Long-term resilience: limited. A reserve delays the shortage. It does not restore recovery.",
        role: "hold",
        effects: { water: 6, energy: -3, circulation: 2 },
        organs: { kidneys: 2, heart: 2, skeleton: 2 },
        skills: { critical: 3, decision: 3, systems: 2 },
        chain: ["kidneys", "heart"],
        steps: ["Storage buffers the shortage", "Circulation is unchanged in character"],
        because: "A reserve delays the shortage. It does not restore what the kidneys are failing to recover.",
      },
      {
        id: "water-consume",
        title: "Increase extraction and cut recovery",
        note: "Short-term output: high. Long-term stress: very high. The loss is pushed onto the reserve.",
        role: "extract",
        effects: { water: -14, heat: -7, circulation: -6, energy: -4, pressure: 8 },
        organs: { kidneys: -12, skin: -7, heart: -5, brain: -3 },
        skills: { systems: -6, critical: -4, decision: -3 },
        chain: ["kidneys", "skin", "heart", "brain"],
        steps: ["Kidney stress rises", "Heat has less water to draw on", "Circulation is asked for more", "The brain records a warning"],
        because: "Using more without recovery loads the kidneys and then the cooling and circulation that depend on them.",
      },
    ],
  },
  {
    id: "heat",
    organ: "skin",
    title: "Extreme heat",
    problem: "Temperature rises. Cooling demand pulls on water and energy together.",
    shock: { metrics: { heat: -14, water: -6, energy: -6 }, organs: { skin: -10, heart: -4, kidneys: -4 } },
    choices: [
      {
        id: "heat-adapt",
        title: "Adaptive cooling",
        note: "Cooling rises only as far as the heat requires. Comfort is not maximised.",
        role: "restore",
        effects: { heat: 14, energy: 4, water: 3, circulation: 3 },
        organs: { skin: 12, heart: 3, kidneys: 3, brain: 4 },
        skills: { adapt: 8, systems: 6, critical: 5, decision: 4 },
        chain: ["skin", "brain", "heart", "kidneys"],
        steps: ["Skin demand is matched to the heat", "The brain limits cooling", "Energy circulation steadies", "Water demand eases"],
        because: "The outer layer answers the climate instead of running at full load.",
      },
      {
        id: "heat-store",
        title: "Store energy for later peaks",
        note: "A buffer helps the next peak. It does not lower the heat load itself.",
        role: "hold",
        effects: { energy: 5, heat: 3, circulation: 2 },
        organs: { heart: 4, skin: 2, skeleton: 2 },
        skills: { problem: 4, decision: 3 },
        chain: ["heart", "skin"],
        steps: ["Stored energy covers part of the peak", "The heat on the skin remains"],
        because: "Storage shifts when energy is available. The climate load is still there.",
      },
      {
        id: "heat-max",
        title: "Cool at maximum, continuously",
        note: "Immediate relief. Water and energy are spent whether or not the peak requires it.",
        role: "extract",
        effects: { heat: 4, water: -12, energy: -14, circulation: -5, pressure: 6 },
        organs: { skin: 3, kidneys: -8, heart: -9, brain: -3 },
        skills: { systems: -5, critical: -4, adapt: -4 },
        chain: ["skin", "kidneys", "heart", "brain"],
        steps: ["Cooling relieves the surface", "Water recovery falls behind", "Circulation overloads", "The warning reaches the brain"],
        because: "Maximum cooling treats a changing climate as a constant emergency.",
      },
    ],
  },
  {
    id: "energy",
    organ: "heart",
    title: "Energy demand",
    problem: "Movement, treatment, and cooling ask more of the same circulation.",
    shock: { metrics: { energy: -12, circulation: -6 }, organs: { heart: -9, brain: -3 } },
    choices: [
      {
        id: "energy-renew",
        title: "Shift circulation toward renewable supply",
        note: "The mix changes. It does not remove heat or create water.",
        role: "restore",
        effects: { energy: 14, air: 6, circulation: 6, pressure: -4 },
        organs: { heart: 10, lungs: 5, brain: 3 },
        skills: { innovation: 5, systems: 6, decision: 5, critical: 4 },
        chain: ["heart", "lungs", "brain"],
        steps: ["Circulation carries a cleaner supply", "Air burden eases", "The brain has more room to plan"],
        because: "A renewable share changes how long circulation can continue. It does not solve a water shortage.",
      },
      {
        id: "energy-eff",
        title: "Do the same work with less throughput",
        note: "The gain is modest. Service is mostly kept.",
        role: "hold",
        effects: { energy: 7, circulation: 4, air: 2 },
        organs: { heart: 5, lungs: 2 },
        skills: { problem: 5, critical: 4, decision: 3 },
        chain: ["heart", "lungs"],
        steps: ["Less energy is asked of the same circulation", "Exchange improves slightly"],
        because: "Efficiency lowers the load. It does not add a new source.",
      },
      {
        id: "energy-burn",
        title: "Meet demand by increasing combustion",
        note: "Supply rises now. Emissions and heat rise with it.",
        role: "extract",
        effects: { energy: 6, air: -14, heat: -6, pressure: 10, circulation: -3 },
        organs: { heart: 2, lungs: -12, skin: -4, brain: -3 },
        skills: { systems: -6, critical: -5, innovation: -3 },
        chain: ["heart", "lungs", "skin", "brain"],
        steps: ["Circulation is fed", "Lung burden rises", "Heat load increases", "The brain inherits a dirtier system"],
        because: "More combustion feeds the heart of the system and injures the lungs.",
      },
    ],
  },
  {
    id: "waste",
    organ: "liver",
    title: "Waste",
    problem: "More material is leaving use than is being recovered.",
    shock: { metrics: { waste: -12, pressure: 8 }, organs: { liver: -9, digestive: -4 } },
    choices: [
      {
        id: "waste-return",
        title: "Sort and return useful material",
        note: "High effort. Energy is spent. Less leaves as waste.",
        role: "restore",
        effects: { waste: 15, circulation: 4, energy: -6, pressure: -5 },
        organs: { liver: 12, digestive: 5, heart: -2, kidneys: 2 },
        skills: { systems: 7, innovation: 6, problem: 5, decision: 4 },
        chain: ["liver", "digestive", "heart", "kidneys"],
        steps: ["The liver separates what can return", "Digestion keeps more of the input", "Circulation carries the recovered share", "Water recovery sees a cleaner stream"],
        because: "Waste is asked whether it can become a resource before it leaves.",
      },
      {
        id: "waste-hold",
        title: "Store waste for later treatment",
        note: "The stream is delayed, not transformed.",
        role: "hold",
        effects: { waste: 4, pressure: 2, infrastructure: -2 },
        organs: { liver: 1, skeleton: -2 },
        skills: { critical: 2, decision: 2 },
        chain: ["liver", "skeleton"],
        steps: ["Waste is held", "The structure carries a load it has not transformed"],
        because: "Storage is not recovery. The material is still waste.",
      },
      {
        id: "waste-dump",
        title: "Discard the stream",
        note: "Immediate relief for the process. The loss leaves the system.",
        role: "extract",
        effects: { waste: -10, pressure: 12, air: -4, water: -3 },
        organs: { liver: -10, lungs: -4, kidneys: -4, digestive: -5 },
        skills: { systems: -6, critical: -4, problem: -3 },
        chain: ["liver", "lungs", "kidneys"],
        steps: ["The liver passes the stream on", "Air and water receive what was not recovered"],
        because: "Discarding removes the problem from view and moves it into air, water, and land.",
      },
    ],
  },
  {
    id: "air",
    organ: "lungs",
    title: "Air and emissions",
    problem: "Urban emissions are rising. Exchange with the air is under load.",
    shock: { metrics: { air: -14, pressure: 6 }, organs: { lungs: -10, heart: -3 } },
    choices: [
      {
        id: "air-exchange",
        title: "Clean the exchange",
        note: "Emissions are limited at the source. Output may grow more slowly.",
        role: "restore",
        effects: { air: 15, pressure: -4, energy: -3, circulation: 2 },
        organs: { lungs: 12, heart: 3, brain: 3 },
        skills: { systems: 6, critical: 5, problem: 4, decision: 4 },
        chain: ["lungs", "heart", "brain"],
        steps: ["Exchange clears", "Circulation carries cleaner air", "Planning is less occupied by warnings"],
        because: "The lung principle is exchange, not isolation. The air has to be able to leave and return.",
      },
      {
        id: "air-monitor",
        title: "Monitor, and delay the limit",
        note: "The system sees the problem. The burden is not yet reduced.",
        role: "hold",
        effects: { air: 2 },
        organs: { lungs: 1, brain: 4 },
        skills: { critical: 4, decision: 2 },
        chain: ["lungs", "brain"],
        steps: ["The brain receives a clearer signal", "The air itself is barely changed"],
        because: "Information without a response leaves the lungs under the same load.",
      },
      {
        id: "air-ignore",
        title: "Keep emitting to protect output",
        note: "Short-term output holds. The air burden compounds.",
        role: "extract",
        effects: { air: -12, pressure: 10, heat: -3, energy: 3 },
        organs: { lungs: -12, skin: -3, brain: -4, heart: -2 },
        skills: { systems: -6, critical: -5, adapt: -3 },
        chain: ["lungs", "skin", "brain"],
        steps: ["Lung performance falls", "Heat and air pressure rise together", "The brain is managing warnings instead of plans"],
        because: "Output bought with emissions comes back as a load on exchange and climate.",
      },
    ],
  },
  {
    id: "food",
    organ: "digestive",
    title: "Food and water demand",
    problem: "More food and water are being asked of the system than it can absorb usefully.",
    shock: { metrics: { water: -6, waste: -6, circulation: -3 }, organs: { digestive: -8, kidneys: -4, liver: -3 } },
    choices: [
      {
        id: "food-recover",
        title: "Recover useful input before it becomes waste",
        note: "Less is discarded. The process is slower and costs energy.",
        role: "restore",
        effects: { waste: 10, water: 6, energy: -5, circulation: 3 },
        organs: { digestive: 11, liver: 5, kidneys: 4, heart: -2 },
        skills: { systems: 6, problem: 6, innovation: 3, decision: 4 },
        chain: ["digestive", "liver", "kidneys"],
        steps: ["Useful input is absorbed", "The liver transforms what remains", "Less water is lost with the waste"],
        because: "Nothing useful should leave just because the first pass is finished.",
      },
      {
        id: "food-import",
        title: "Bring in more supply",
        note: "The shortage eases now. Waste and transport demand rise.",
        role: "hold",
        effects: { water: 2, waste: -4, energy: -4, circulation: -2 },
        organs: { digestive: 2, liver: -2, heart: -3 },
        skills: { critical: 2, systems: -2 },
        chain: ["digestive", "liver", "heart"],
        steps: ["Supply arrives", "More waste follows", "Circulation works harder to move it"],
        because: "More input without recovery moves the problem from hunger to waste.",
      },
      {
        id: "food-waste",
        title: "Accept the loss",
        note: "The simplest path. Useful material leaves with the waste.",
        role: "extract",
        effects: { waste: -12, water: -8, pressure: 8 },
        organs: { digestive: -10, liver: -8, kidneys: -6 },
        skills: { systems: -5, problem: -4, critical: -3 },
        chain: ["digestive", "liver", "kidneys"],
        steps: ["Input is only partly used", "The liver receives a heavier stream", "Water leaves with the waste"],
        because: "A system that discards useful material has to extract more to stand still.",
      },
    ],
  },
  {
    id: "infrastructure",
    organ: "skeleton",
    title: "Infrastructure under weather",
    problem: "Extreme weather is loading the structures that carry every other flow.",
    shock: { metrics: { infrastructure: -14, circulation: -5, heat: -4 }, organs: { skeleton: -10, heart: -4 } },
    choices: [
      {
        id: "infra-reinforce",
        title: "Reinforce the structures that carry the flows",
        note: "High cost now. Circulation and recovery keep a path when weather hits.",
        role: "restore",
        effects: { infrastructure: 16, circulation: 6, heat: 3, energy: -5 },
        organs: { skeleton: 12, heart: 4, brain: 2 },
        skills: { systems: 7, problem: 5, decision: 5, adapt: 4 },
        chain: ["skeleton", "heart", "brain"],
        steps: ["The structure holds", "Circulation keeps its routes", "The brain can plan instead of reroute"],
        because: "Infrastructure is the skeleton. If it fails, every other system loses its support.",
      },
      {
        id: "infra-patch",
        title: "Repair only what has already failed",
        note: "Cheaper. The next failure is not anticipated.",
        role: "hold",
        effects: { infrastructure: 5, circulation: 1 },
        organs: { skeleton: 3, heart: 1 },
        skills: { problem: 2, adapt: -1, critical: 1 },
        chain: ["skeleton", "heart"],
        steps: ["The break is closed", "The rest of the structure is unchanged"],
        because: "Repair after failure restores a piece. It does not raise the resilience of the frame.",
      },
      {
        id: "infra-defer",
        title: "Defer maintenance",
        note: "Spending falls now. The next shock has less structure to land on.",
        role: "extract",
        effects: { infrastructure: -12, circulation: -8, energy: 2, pressure: 4 },
        organs: { skeleton: -12, heart: -6, kidneys: -3, lungs: -2 },
        skills: { systems: -6, critical: -5, adapt: -4 },
        chain: ["skeleton", "heart", "kidneys", "lungs"],
        steps: ["Support weakens", "Circulation loses routes", "Recovery and exchange lose their paths"],
        because: "Deferred maintenance saves money by borrowing against every system the structure carries.",
      },
    ],
  },
  {
    id: "circular",
    organ: "liver",
    title: "Circular materials",
    problem: "Large quantities of materials are being discarded instead of recovered.",
    shock: { metrics: { waste: -8, circulation: -4, pressure: 6 }, organs: { liver: -6, digestive: -4, heart: -2 } },
    choices: [
      {
        id: "circular-loop",
        title: "Close the loop",
        note: "Recovered material re-enters circulation. The loop costs energy to run.",
        role: "restore",
        effects: { waste: 12, circulation: 8, energy: -7, pressure: -6 },
        organs: { liver: 8, heart: 4, digestive: 4, kidneys: 2 },
        skills: { innovation: 8, systems: 7, decision: 4 },
        chain: ["liver", "heart", "digestive"],
        steps: ["Material is transformed", "It re-enters circulation", "Less new input is required"],
        because: "Circularity is a loop, not a bin. What returns has to be carried by the heart of the system.",
      },
      {
        id: "circular-partial",
        title: "Recover only the easiest fraction",
        note: "Some value returns. Most of the stream still leaves.",
        role: "hold",
        effects: { waste: 5, energy: -2, circulation: 2 },
        organs: { liver: 3, heart: 1 },
        skills: { critical: 2, innovation: 1 },
        chain: ["liver", "heart"],
        steps: ["An easy fraction returns", "The rest still leaves"],
        because: "A partial loop is real, and it is not yet a circular system.",
      },
      {
        id: "circular-linear",
        title: "Keep the linear path",
        note: "Simple operations. Materials leave after one use.",
        role: "extract",
        effects: { waste: -11, pressure: 9, circulation: -4, water: -3 },
        organs: { liver: -8, digestive: -5, kidneys: -3, heart: -3 },
        skills: { systems: -5, innovation: -4, critical: -3 },
        chain: ["digestive", "liver", "heart"],
        steps: ["Input is used once", "The liver has nothing to return", "Circulation only carries the loss outward"],
        because: "A linear path makes every new need into a new extraction.",
      },
    ],
  },
];

export function evaluateDecisions(shockIds, choiceMap) {
  const metrics = { ...BASE_METRICS };
  const organs = { ...BASE_ORGANS };
  const skills = { ...BASE_SKILLS };
  const events = [];

  shockIds.forEach((id) => {
    const scenario = DECISION_SCENARIOS.find((item) => item.id === id);
    if (!scenario) return;
    applyMap(metrics, scenario.shock.metrics);
    applyMap(organs, scenario.shock.organs);
    events.push({ id: `${id}-shock`, scenario: id, chain: [scenario.organ, "brain"] });
  });

  DECISION_SCENARIOS.forEach((scenario) => {
    const choice = scenario.choices.find((item) => item.id === choiceMap[scenario.id]);
    if (!choice) return;
    applyMap(metrics, choice.effects);
    applyMap(organs, choice.organs);
    applyMap(skills, choice.skills);
    if (choice.role === "restore" && shockIds.includes(scenario.id)) {
      skills.adapt = clamp(skills.adapt + 4);
      skills.problem = clamp(skills.problem + 3);
    }
    events.push({ id: choice.id, scenario: scenario.id, chain: choice.chain, because: choice.because, steps: choice.steps, title: choice.title, role: choice.role });
  });

  if (organs.kidneys < 62) {
    const gap = 62 - organs.kidneys;
    organs.skin = clamp(organs.skin - gap * 0.35);
    organs.heart = clamp(organs.heart - gap * 0.22);
    metrics.heat = clamp(metrics.heat - gap * 0.25);
  }
  if (organs.lungs < 62) {
    const gap = 62 - organs.lungs;
    organs.heart = clamp(organs.heart - gap * 0.2);
    organs.brain = clamp(organs.brain - gap * 0.18);
    metrics.circulation = clamp(metrics.circulation - gap * 0.15);
  }
  if (organs.liver < 60) {
    const gap = 60 - organs.liver;
    organs.digestive = clamp(organs.digestive - gap * 0.3);
    organs.kidneys = clamp(organs.kidneys - gap * 0.16);
  }
  if (organs.skeleton < 60) {
    const gap = 60 - organs.skeleton;
    organs.heart = clamp(organs.heart - gap * 0.25);
    organs.kidneys = clamp(organs.kidneys - gap * 0.12);
    organs.lungs = clamp(organs.lungs - gap * 0.12);
    metrics.circulation = clamp(metrics.circulation - gap * 0.3);
  }
  if (metrics.heat < 58) {
    const gap = 58 - metrics.heat;
    organs.skin = clamp(organs.skin - gap * 0.35);
    organs.kidneys = clamp(organs.kidneys - gap * 0.2);
    organs.heart = clamp(organs.heart - gap * 0.18);
    organs.brain = clamp(organs.brain - gap * 0.1);
  }

  const resilience = clamp(
    metrics.water * 0.16 +
      metrics.energy * 0.13 +
      metrics.air * 0.12 +
      metrics.circulation * 0.14 +
      metrics.waste * 0.12 +
      metrics.heat * 0.12 +
      metrics.infrastructure * 0.11 +
      (100 - metrics.pressure) * 0.1,
  );

  let phase = "resilient";
  const last = events.filter((item) => item.role).at(-1);
  if (resilience >= 80) phase = "thriving";
  else if (resilience < 48) phase = "critical";
  else if (last?.role === "restore") phase = "recovering";
  else if (resilience < 70 || last?.role === "extract") phase = "stressed";

  const verdict =
    resilience >= 78
      ? "Your decisions created a resilient system. The organs are carrying the load together."
      : resilience >= 62
        ? "The system is holding. Some costs are still moving between organs."
        : resilience >= 48
          ? "Your decisions placed several organs under stress. The load is spreading."
          : "Your decisions placed the system under severe environmental stress.";

  return { metrics, organs, skills, resilience, phase, verdict, events };
}

export const METRIC_LABELS = [
  ["water", "Water security"],
  ["energy", "Energy efficiency"],
  ["air", "Air quality"],
  ["circulation", "Resource circulation"],
  ["waste", "Waste recovery"],
  ["heat", "Heat resilience"],
  ["infrastructure", "Infrastructure resilience"],
  ["pressure", "Ecosystem pressure"],
];

export const SKILL_LABELS = [
  ["critical", "Critical thinking"],
  ["systems", "Systems thinking"],
  ["problem", "Problem solving"],
  ["adapt", "Adaptability"],
  ["innovation", "Innovation"],
  ["decision", "Decision making"],
];
