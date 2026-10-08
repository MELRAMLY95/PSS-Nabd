const clamp = (value) => Math.max(6, Math.min(98, value));

export const BASE = {
  water: 72,
  energy: 70,
  air: 76,
  recovery: 68,
  heat: 71,
  infrastructure: 74,
  food: 73,
  pressure: 30,
};

export const READINGS = [
  ["water", "Water security"],
  ["energy", "Energy efficiency"],
  ["air", "Air quality"],
  ["recovery", "Resource recovery"],
  ["heat", "Heat resilience"],
  ["infrastructure", "Infrastructure resilience"],
];

export const MAP = [
  { id: "brain", env: "Intelligence", x: 110, y: 42, line: "Decisions, signals, and green skills." },
  { id: "lungs", env: "Air", x: 96, y: 128, line: "Air quality and carbon, carried by the rest of the system." },
  { id: "heart", env: "Distribution", x: 126, y: 146, line: "Resources move to the part of the system under pressure." },
  { id: "skin", env: "Climate", x: 154, y: 128, line: "Heat is answered, instead of cooling at full load all the time." },
  { id: "liver", env: "Materials", x: 124, y: 178, line: "Waste is asked whether it can return as a resource." },
  { id: "kidneys", env: "Water", x: 96, y: 186, line: "Water security: keep what can be used again." },
  { id: "digestive", env: "Food", x: 110, y: 204, line: "Food and materials stay in circulation after the first use." },
  { id: "skeleton", env: "Infrastructure", x: 110, y: 270, line: "The structures that carry every other flow." },
];

const LINKS = [
  ["kidneys", "heart", "water"],
  ["heart", "lungs", "energy"],
  ["lungs", "skin", "air"],
  ["liver", "heart", "materials"],
  ["digestive", "liver", "food"],
  ["kidneys", "brain", "info"],
  ["heart", "brain", "info"],
  ["skin", "brain", "info"],
];

export const FLOWS = ["water", "energy", "air", "materials", "food", "info"];

export function linksFor(flow) {
  if (!flow) return LINKS;
  return LINKS.filter((item) => item[2] === flow);
}

function add(metrics, effects = {}) {
  const next = { ...metrics };
  Object.entries(effects).forEach(([key, value]) => {
    next[key] = clamp((next[key] ?? 0) + value);
  });
  return next;
}

function couple(metrics) {
  const next = { ...metrics };
  if (next.water < 62) {
    const gap = 62 - next.water;
    next.heat = clamp(next.heat - gap * 0.45);
    next.energy = clamp(next.energy - gap * 0.28);
  }
  if (next.energy < 60) {
    const gap = 60 - next.energy;
    next.water = clamp(next.water - gap * 0.22);
    next.infrastructure = clamp(next.infrastructure - gap * 0.2);
    next.air = clamp(next.air - gap * 0.12);
  }
  if (next.air < 62) {
    const gap = 62 - next.air;
    next.heat = clamp(next.heat - gap * 0.3);
    next.pressure = clamp(next.pressure + gap * 0.35);
  }
  if (next.recovery < 60) {
    const gap = 60 - next.recovery;
    next.food = clamp(next.food - gap * 0.3);
    next.energy = clamp(next.energy - gap * 0.16);
    next.pressure = clamp(next.pressure + gap * 0.28);
  }
  if (next.heat < 58) {
    const gap = 58 - next.heat;
    next.water = clamp(next.water - gap * 0.24);
    next.energy = clamp(next.energy - gap * 0.2);
  }
  if (next.infrastructure < 60) {
    const gap = 60 - next.infrastructure;
    next.energy = clamp(next.energy - gap * 0.18);
    next.water = clamp(next.water - gap * 0.12);
  }
  return next;
}

export const SCENARIOS = [
  {
    id: "water",
    kicker: "Water stress",
    title: "How should we respond to increasing water stress?",
    oman: "Responsible use of a scarce resource, toward 2040.",
    system: "kidneys",
    choices: [
      {
        id: "water-recover",
        mark: "A",
        title: "Invest heavily in water recovery",
        note: "More water stays in use. Treatment draws energy and needs new infrastructure.",
        role: "restore",
        effects: { water: 16, recovery: 10, heat: 6, energy: -8, infrastructure: -3 },
        cascade: [
          ["Your decision", "Recovery is expanded"],
          ["Primary effect", "Water security rises"],
          ["Secondary effect", "Energy demand rises with treatment"],
          ["System response", "Heat has more water to draw on"],
          ["Resilience", "The gain is real, and it is not free"],
        ],
      },
      {
        id: "water-supply",
        mark: "B",
        title: "Increase supply capacity",
        note: "More water is produced now. Energy, heat, and air carry the cost.",
        role: "strain",
        effects: { water: 4, energy: -14, heat: -10, air: -8, pressure: 10, infrastructure: -2 },
        cascade: [
          ["Your decision", "Supply is expanded"],
          ["Primary effect", "A short-term gain in water"],
          ["Secondary effect", "Energy demand and heat rise together"],
          ["System response", "Air quality takes part of the load"],
          ["Resilience", "Pressure spreads beyond water"],
        ],
      },
      {
        id: "water-demand",
        mark: "C",
        title: "Reduce demand through efficiency",
        note: "Use falls. The shortage shrinks, but it is not replaced with new supply.",
        role: "trade",
        effects: { water: 9, energy: 5, heat: 4, recovery: 2, pressure: 3 },
        cascade: [
          ["Your decision", "Demand is lowered"],
          ["Primary effect", "Water stress eases"],
          ["Secondary effect", "Energy and heat loads fall with it"],
          ["System response", "The reserve is spared, not rebuilt"],
          ["Resilience", "A quieter system, with less surplus"],
        ],
      },
      {
        id: "water-hold",
        mark: "D",
        title: "Maintain the current strategy",
        note: "Nothing new is built. The shortage continues and moves into heat.",
        role: "strain",
        effects: { water: -16, heat: -10, energy: -6, pressure: 10 },
        cascade: [
          ["Your decision", "The current path continues"],
          ["Primary effect", "Water security falls"],
          ["Secondary effect", "Heat has less water to use"],
          ["System response", "Energy is pulled into coping"],
          ["Resilience", "The pressure remains in the system"],
        ],
      },
    ],
  },
  {
    id: "energy",
    kicker: "Energy demand",
    title: "How should the extra demand be met?",
    oman: "An energy system that can keep running as demand changes.",
    system: "heart",
    choices: [
      {
        id: "energy-renew",
        mark: "A",
        title: "Increase renewable generation",
        note: "A cleaner supply. It takes infrastructure, and it does not create water.",
        role: "restore",
        effects: { energy: 12, air: 9, heat: 4, infrastructure: -6, water: -3 },
        cascade: [
          ["Your decision", "Renewable supply is expanded"],
          ["Primary effect", "Energy efficiency and air improve"],
          ["Secondary effect", "Construction presses on infrastructure"],
          ["System response", "Water is not added by a cleaner current"],
          ["Resilience", "The mix is lighter, the build is not"],
        ],
      },
      {
        id: "energy-burn",
        mark: "B",
        title: "Increase conventional generation",
        note: "Demand is met quickly. Emissions, heat, and pressure rise with it.",
        role: "strain",
        effects: { energy: 8, air: -14, heat: -9, pressure: 10, recovery: -3 },
        cascade: [
          ["Your decision", "Conventional generation rises"],
          ["Primary effect", "Supply catches the demand"],
          ["Secondary effect", "Air quality falls"],
          ["System response", "Heat and recovery take the exhaust"],
          ["Resilience", "Today’s supply becomes tomorrow’s load"],
        ],
      },
      {
        id: "energy-eff",
        mark: "C",
        title: "Invest in efficiency",
        note: "The same work uses less. The new demand is not fully met.",
        role: "trade",
        effects: { energy: 8, air: 4, heat: 5, water: 2, recovery: 1 },
        cascade: [
          ["Your decision", "Throughput is reduced"],
          ["Primary effect", "Energy demand eases"],
          ["Secondary effect", "Air and heat improve modestly"],
          ["System response", "No new source comes online"],
          ["Resilience", "A smaller load, not a larger system"],
        ],
      },
      {
        id: "energy-mix",
        mark: "D",
        title: "Combine several strategies",
        note: "Effort is split. No single pressure is solved, and none is ignored.",
        role: "trade",
        effects: { energy: 7, air: 4, heat: 2, water: -2, infrastructure: -4, recovery: 2 },
        cascade: [
          ["Your decision", "The response is divided"],
          ["Primary effect", "Energy improves on several fronts"],
          ["Secondary effect", "Infrastructure and water share the cost"],
          ["System response", "No one system receives the full effort"],
          ["Resilience", "A broader change, with a thinner result"],
        ],
      },
    ],
  },
  {
    id: "waste",
    kicker: "Material waste",
    title: "What should happen to the material leaving use?",
    oman: "A circular use of materials, aligned with a sustainable environment.",
    system: "liver",
    choices: [
      {
        id: "waste-recover",
        mark: "A",
        title: "Resource recovery",
        note: "Useful material returns. The process spends energy and needs works.",
        role: "restore",
        effects: { recovery: 13, water: 3, energy: -7, infrastructure: -3, air: 2 },
        cascade: [
          ["Your decision", "Recovery is built into the stream"],
          ["Primary effect", "Resource recovery rises"],
          ["Secondary effect", "Energy is spent to run the return"],
          ["System response", "Less new material has to be extracted"],
          ["Resilience", "Waste becomes part of supply"],
        ],
      },
      {
        id: "waste-reduce",
        mark: "B",
        title: "Reduce what is used",
        note: "Less enters, so less leaves. The cut is felt by current use.",
        role: "trade",
        effects: { recovery: 6, pressure: -6, energy: 4, food: 3, water: 2 },
        cascade: [
          ["Your decision", "Input is reduced"],
          ["Primary effect", "Pressure from waste falls"],
          ["Secondary effect", "Energy and water demand ease"],
          ["System response", "Food and materials are used more carefully"],
          ["Resilience", "A smaller stream, not a closed loop"],
        ],
      },
      {
        id: "waste-landfill",
        mark: "C",
        title: "Expand disposal",
        note: "The stream leaves quickly. Air, water, and recovery inherit it.",
        role: "strain",
        effects: { recovery: -14, air: -8, water: -6, pressure: 12, energy: 2 },
        cascade: [
          ["Your decision", "Disposal is expanded"],
          ["Primary effect", "Material leaves the system"],
          ["Secondary effect", "Air and water receive what was not recovered"],
          ["System response", "New extraction has to replace what left"],
          ["Resilience", "The problem has moved, not ended"],
        ],
      },
      {
        id: "waste-circular",
        mark: "D",
        title: "Circular manufacturing",
        note: "Products are designed to return. The loop is slow and costs energy to start.",
        role: "restore",
        effects: { recovery: 11, air: 4, food: 4, energy: -6, infrastructure: -5 },
        cascade: [
          ["Your decision", "Manufacturing is closed into a loop"],
          ["Primary effect", "Materials and food streams return"],
          ["Secondary effect", "Energy and infrastructure pay to start the loop"],
          ["System response", "Air improves as less is discarded"],
          ["Resilience", "A loop, with an opening cost"],
        ],
      },
    ],
  },
  {
    id: "repair",
    kicker: "Recovery",
    title: "The system can still be repaired. Where should the effort go?",
    oman: "A future that can absorb the next shock, not only survive this one.",
    system: "brain",
    choices: [
      {
        id: "repair-water",
        mark: "A",
        title: "Rebuild water recovery",
        note: "Water and heat improve. Treatment still asks for energy.",
        role: "restore",
        effects: { water: 12, heat: 7, recovery: 4, energy: -4 },
        cascade: [
          ["Your decision", "Recovery effort returns to water"],
          ["Primary effect", "Water security climbs"],
          ["Secondary effect", "Heat resilience follows"],
          ["System response", "Energy gives up a share"],
          ["Resilience", "The damaged reserve begins to fill"],
        ],
      },
      {
        id: "repair-energy",
        mark: "B",
        title: "Shift the energy mix",
        note: "Air and energy ease. The shift does not, by itself, restore water.",
        role: "restore",
        effects: { energy: 10, air: 7, heat: 3, infrastructure: -3 },
        cascade: [
          ["Your decision", "The mix is shifted"],
          ["Primary effect", "Energy and air recover"],
          ["Secondary effect", "Heat eases with a lighter supply"],
          ["System response", "Water is unchanged by the current itself"],
          ["Resilience", "One load lifts, others remain"],
        ],
      },
      {
        id: "repair-materials",
        mark: "C",
        title: "Return materials to use",
        note: "Recovery rises. Running the return spends energy.",
        role: "restore",
        effects: { recovery: 12, food: 4, air: 3, energy: -5 },
        cascade: [
          ["Your decision", "Material is brought back"],
          ["Primary effect", "Resource recovery rises"],
          ["Secondary effect", "Food and air benefit from less waste"],
          ["System response", "Energy is the cost of the return"],
          ["Resilience", "A discarded stream re-enters"],
        ],
      },
      {
        id: "repair-heat",
        mark: "D",
        title: "Ease the heat load",
        note: "Cooling is matched to the heat. It trims water and energy use.",
        role: "trade",
        effects: { heat: 10, water: 4, energy: 3, air: 1 },
        cascade: [
          ["Your decision", "Cooling is matched to conditions"],
          ["Primary effect", "Heat resilience rises"],
          ["Secondary effect", "Water and energy are no longer spent blindly"],
          ["System response", "The saving is limited to the climate load"],
          ["Resilience", "The system stops overworking"],
        ],
      },
    ],
  },
];

export const ORDER = SCENARIOS.map((item) => item.id);

function resilienceOf(metrics) {
  return clamp(
    metrics.water * 0.18 +
      metrics.energy * 0.14 +
      metrics.air * 0.14 +
      metrics.recovery * 0.14 +
      metrics.heat * 0.14 +
      metrics.infrastructure * 0.12 +
      metrics.food * 0.06 +
      (100 - metrics.pressure) * 0.08,
  );
}

function healthOf(metrics, resilience) {
  return {
    kidneys: metrics.water,
    lungs: metrics.air,
    heart: clamp(metrics.energy * 0.55 + metrics.infrastructure * 0.25 + (100 - metrics.pressure) * 0.2),
    skin: metrics.heat,
    liver: metrics.recovery,
    digestive: metrics.food,
    skeleton: metrics.infrastructure,
    brain: resilience,
  };
}

export function evaluate(choiceMap = {}) {
  let metrics = { ...BASE };
  const applied = [];
  ORDER.forEach((id) => {
    const scenario = SCENARIOS.find((item) => item.id === id);
    const choice = scenario.choices.find((item) => item.id === choiceMap[id]);
    if (!choice) return;
    metrics = add(metrics, choice.effects);
    metrics = couple(metrics);
    applied.push({ scenario, choice });
  });
  const resilience = resilienceOf(metrics);
  const last = applied.at(-1)?.choice;
  let phase = "Balanced";
  if (!applied.length) phase = "Balanced";
  else if (resilience >= 80) phase = "Thriving";
  else if (resilience < 48) phase = "Critical";
  else if (last?.role === "restore" && resilience >= 66) phase = "Recovering";
  else if (resilience < 68 || last?.role === "strain") phase = "Stressed";
  else if (resilience >= 76) phase = "Resilient";
  else phase = "Balanced";

  const strained = applied.filter((item) => item.choice.role === "strain").length;
  const restored = applied.filter((item) => item.choice.role === "restore").length;
  const skills = [];
  if (applied.length) skills.push("Decision-making");
  if (applied.length > 1) skills.push("Systems thinking");
  if (strained && restored) skills.push("Adaptability");
  if (applied.some((item) => item.choice.role === "trade")) skills.push("Critical thinking");
  if (restored) skills.push("Problem solving");

  const verdict = !applied.length
    ? "No future has been decided. The system is still at its opening balance."
    : resilience >= 76
      ? "These decisions left a system that can carry the next shock."
      : resilience >= 66
        ? "The system is holding. Costs are still moving between water, energy, air, and materials."
        : resilience >= 52
          ? "The decisions pushed several parts of the system into stress. The load is spreading."
          : "The decisions left the system under severe pressure. Recovery is still possible.";

  return {
    metrics,
    resilience,
    phase,
    health: healthOf(metrics, resilience),
    applied,
    skills,
    verdict,
  };
}

export function opening() {
  return evaluate({});
}
