/** Documented exhibit models. Results are simulated, not measurements from Oman. */
import { simulate } from "./nabdGrid.js";

export const AQUA_SOURCES = [
  { id: "grey", name: "Wash water", litres: 40, quality: "grey", salinity: 0.15 },
  { id: "saline", name: "Brackish rinse", litres: 20, quality: "saline", salinity: 0.72 },
  { id: "storm", name: "Collected rain", litres: 12, quality: "storm", salinity: 0.08 },
  { id: "black", name: "Sanitary flow", litres: 18, quality: "black", salinity: 0.3 },
];

export function aquaLoop({ sources, capacity, salinityMax, mode }) {
  let input = 0;
  let irrigation = 0;
  let further = 0;
  let rejected = 0;
  let violations = 0;
  let room = Math.max(0, capacity);
  const rows = [];
  sources.forEach((source) => {
    input += source.litres;
    const irrigable = source.quality !== "black" && source.salinity <= salinityMax;
    if (mode === "volume") {
      irrigation += source.litres;
      if (!irrigable) violations += source.litres;
      rows.push({ id: source.id, name: source.name, to: "irrigation", litres: source.litres, allowed: irrigable });
      return;
    }
    if (source.quality === "black" || source.salinity > salinityMax) {
      const held = source.quality === "black" ? 0 : Math.min(source.litres, room);
      room -= held;
      further += held;
      rejected += source.litres - held;
      rows.push({ id: source.id, name: source.name, to: held > 0 ? "further treatment" : "reject", litres: source.litres, allowed: true });
      return;
    }
    irrigation += source.litres;
    rows.push({ id: source.id, name: source.name, to: "irrigation", litres: source.litres, allowed: true });
  });
  const accounted = mode === "volume" ? irrigation : irrigation + further + rejected;
  return {
    input,
    irrigation,
    further,
    rejected,
    violations,
    imbalance: Math.abs(input - accounted),
    rows,
    capacityUsed: Math.max(0, capacity) - room,
  };
}

export const CASCADE_ITEMS = [
  { id: "paper", name: "Paper", kg: 8, kind: "paper", contamination: 0.1 },
  { id: "plastic", name: "Plastic", kg: 6, kind: "plastic", contamination: 0.55 },
  { id: "metal", name: "Metal", kg: 4, kind: "metal", contamination: 0.05 },
  { id: "organic", name: "Organic", kg: 7, kind: "organic", contamination: 0.2 },
  { id: "hazard", name: "Solvent bottle", kg: 2, kind: "hazard", contamination: 1 },
];

export function regenCascade({ items, capacity, mode, dirtyAt = 0.4 }) {
  let input = 0;
  let recovered = 0;
  let residual = 0;
  let hazard = 0;
  let contaminationIn = 0;
  let room = Math.max(0, capacity);
  items.forEach((item) => {
    input += item.kg;
    if (item.kind === "hazard") {
      hazard += item.kg;
      return;
    }
    if (item.kind === "organic") {
      residual += item.kg;
      return;
    }
    const dirty = item.contamination > dirtyAt;
    if (mode === "gated" && dirty) {
      residual += item.kg;
      return;
    }
    const take = Math.min(item.kg, room);
    room -= take;
    recovered += take;
    residual += item.kg - take;
    if (dirty) contaminationIn += take;
  });
  return {
    input,
    recovered,
    residual,
    hazard,
    contaminationIn,
    imbalance: Math.abs(input - (recovered + residual + hazard)),
    capacityUsed: Math.max(0, capacity) - room,
  };
}

export function thermoShield({ outdoor, sun, powerAvailable, mode }) {
  const gain = outdoor + sun * 0.12;
  const shade = mode === "adaptive" && sun >= 40;
  let indoor = gain - (shade ? 4 : 0);
  const vent = mode === "adaptive" && outdoor <= 30 && outdoor + 1 < indoor;
  if (vent) indoor = outdoor + 1;
  let powered = 0;
  const limit = mode === "fixed" ? 26 : 28;
  if (indoor > limit && powerAvailable > 0) {
    powered = Math.min(powerAvailable, 1.5);
    indoor -= powered * 3;
  }
  return {
    indoor: Math.round(indoor * 10) / 10,
    powered: Math.round(powered * 100) / 100,
    shade,
    vent,
    above: indoor > 28,
  };
}

export const CROPS = [
  { id: "tomato", name: "Tomato", water: 30, salinityMax: 0.3, yield: 8, cost: 4 },
  { id: "barley", name: "Barley", water: 12, salinityMax: 0.6, yield: 5, cost: 2 },
  { id: "date", name: "Date palm", water: 18, salinityMax: 0.8, yield: 4, cost: 3 },
];

export function harvestLoop({ water, salinity, mode }) {
  if (mode === "fixed") {
    const crop = CROPS[0];
    const short = Math.max(0, crop.water - water);
    const violation = short > 0 || salinity > crop.salinityMax;
    return {
      crop: crop.id,
      name: crop.name,
      waterUsed: Math.min(water, crop.water),
      short,
      violation,
      unmet: short > 0,
      yieldIndex: violation ? 0 : crop.yield,
    };
  }
  const feasible = CROPS.filter((crop) => crop.water <= water && crop.salinityMax >= salinity);
  if (!feasible.length) return { crop: null, name: "none", waterUsed: 0, short: 0, violation: false, unmet: true, yieldIndex: 0 };
  feasible.sort((a, b) => b.yield / b.water - a.yield / a.water);
  const crop = feasible[0];
  return { crop: crop.id, name: crop.name, waterUsed: crop.water, short: 0, violation: false, unmet: false, yieldIndex: crop.yield };
}

export function harvestTry({ water, salinity, id }) {
  const crop = CROPS.find((item) => item.id === id) || CROPS[0];
  const short = Math.max(0, crop.water - water);
  const violation = short > 0 || salinity > crop.salinityMax;
  return {
    crop: crop.id,
    name: crop.name,
    waterUsed: Math.min(water, crop.water),
    short,
    violation,
    unmet: short > 0,
    yieldIndex: violation ? 0 : crop.yield,
  };
}

export const RESILIA_ROADS = [
  { id: "gate-junction", a: "gate", b: "junction", vulnerable: true, cost: 2 },
  { id: "junction-clinic", a: "junction", b: "clinic", vulnerable: true, cost: 3 },
  { id: "junction-school", a: "junction", b: "school", vulnerable: false, cost: 1 },
  { id: "school-homes", a: "school", b: "homes", vulnerable: true, cost: 2 },
  { id: "homes-clinic", a: "homes", b: "clinic", vulnerable: true, cost: 4 },
  { id: "junction-water", a: "junction", b: "water", vulnerable: true, cost: 2 },
];

export const RESILIA_ESSENTIAL = ["clinic", "water"];

function reachable(openIds, target) {
  const open = new Set(openIds);
  const seen = new Set(["gate"]);
  const queue = ["gate"];
  while (queue.length) {
    const node = queue.shift();
    if (node === target) return true;
    RESILIA_ROADS.forEach((road) => {
      if (!open.has(road.id)) return;
      const next = road.a === node ? road.b : road.b === node ? road.a : null;
      if (next && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    });
  }
  return false;
}

function accessFor(protectedIds) {
  const open = RESILIA_ROADS.filter((road) => !road.vulnerable || protectedIds.includes(road.id)).map((road) => road.id);
  const access = {};
  RESILIA_ESSENTIAL.forEach((node) => {
    access[node] = reachable(open, node);
  });
  return { open, access, essential: RESILIA_ESSENTIAL.filter((node) => access[node]).length };
}

export function resiliaPlan({ budget, mode }) {
  const vulnerable = RESILIA_ROADS.filter((road) => road.vulnerable);
  let chosen = [];
  if (mode === "count") {
    let left = budget;
    [...vulnerable].sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id)).forEach((road) => {
      if (road.cost <= left) {
        chosen.push(road.id);
        left -= road.cost;
      }
    });
  } else {
    let best = null;
    const size = vulnerable.length;
    for (let mask = 0; mask < 2 ** size; mask += 1) {
      const pick = [];
      let cost = 0;
      vulnerable.forEach((road, index) => {
        if (mask & (2 ** index)) {
          pick.push(road.id);
          cost += road.cost;
        }
      });
      if (cost > budget) continue;
      const score = accessFor(pick);
      const rank = (score.access.clinic ? 2 : 0) * 1000 + (score.access.water ? 1 : 0) * 100 - cost;
      if (!best || rank > best.rank) best = { pick, rank };
    }
    chosen = best ? best.pick : [];
  }
  const score = accessFor(chosen);
  const cost = RESILIA_ROADS.filter((road) => chosen.includes(road.id)).reduce((sum, road) => sum + road.cost, 0);
  return { protected: chosen, cost, ...score };
}

export function resiliaScene({ budget, mode, closed = [] }) {
  const plan = resiliaPlan({ budget, mode });
  const shut = new Set(closed);
  const open = plan.open.filter((id) => !shut.has(id));
  const access = {};
  RESILIA_ESSENTIAL.forEach((node) => {
    access[node] = reachable(open, node);
  });
  return { ...plan, open, access, closed: [...shut] };
}

export function atmosSense({ pm, wind, spread, mode }) {
  const high = pm >= 80;
  if (mode === "threshold") {
    return {
      claim: high ? "local alert" : "clear",
      uncertain: false,
      hypothesis: high ? "A threshold treats every high reading as a nearby source." : "The reading is under the modelled threshold.",
    };
  }
  if (!high) return { claim: "clear", uncertain: false, hypothesis: "The reading is under the modelled threshold." };
  if (spread === "unknown") return { claim: "hold", uncertain: true, hypothesis: "The reading is high. The spread is missing, so the source is not identified." };
  if (spread === "wide" && wind === "desert") return { claim: "dust", uncertain: false, hypothesis: "A wide rise with desert wind fits a dust hypothesis better than one local source." };
  if (spread === "local" && wind === "calm") return { claim: "local", uncertain: false, hypothesis: "One high sensor in calm air makes a nearby source plausible. It does not prove it." };
  return { claim: "hold", uncertain: true, hypothesis: "The pattern does not separate dust from a nearby source. More evidence is required." };
}

export function heartScenario(input) {
  return {
    sun: input.solar,
    soc0: input.soc,
    acCount: input.heat * 2,
    acKw: 1.2,
    loads: { "homes-ac": input.heat > 0 },
    backupOn: false,
    batteryKwh: 28,
    batteryKw: 10,
  };
}

function heartSide(run) {
  const midday = run.frames[52] || run.frames[0];
  return {
    solarKwh: run.totals.solarKwh,
    demandKwh: run.totals.demandKwh,
    unmetKwh: run.totals.unmetKwh,
    essentialUnmetKwh: run.totals.essentialUnmetKwh,
    backupKwh: run.totals.backupKwh,
    maxImbalance: run.totals.maxImbalance,
    middayCurtailKw: midday?.curtailKw || 0,
  };
}

export function heartPair(input) {
  const scenario = heartScenario(input);
  return {
    coordinated: heartSide(simulate(scenario, "coordinated")),
    independent: heartSide(simulate(scenario, "independent")),
  };
}

export function crisisRun(input) {
  const heat = input.heat;
  const heart = (input.heart || heartPair(input))[input.mode === "coordinated" ? "coordinated" : "independent"];
  const sources = AQUA_SOURCES.map((source) => ({ ...source, litres: Math.round(source.litres * input.water) }));
  const aqua = aquaLoop({
    sources,
    capacity: 30,
    salinityMax: 0.45,
    mode: input.mode === "coordinated" ? "gated" : "volume",
  });
  const harvest = harvestLoop({
    water: aqua.irrigation,
    salinity: input.mode === "coordinated" ? 0.15 : 0.72,
    mode: input.mode === "coordinated" ? "feasible" : "fixed",
  });
  const roads = resiliaPlan({ budget: input.budget, mode: input.mode === "coordinated" ? "essential" : "count" });
  const air = atmosSense({ ...input.air, mode: input.mode === "coordinated" ? "context" : "threshold" });
  const thermal = thermoShield({
    outdoor: 30 + heat * 4,
    sun: 40 + heat * 25,
    powerAvailable: Math.min(1.5, heart.middayCurtailKw),
    mode: input.mode === "coordinated" ? "adaptive" : "fixed",
  });
  const materials = regenCascade({
    items: CASCADE_ITEMS,
    capacity: 12,
    mode: input.mode === "coordinated" ? "gated" : "category",
  });
  const violations = [];
  if (aqua.violations > 0) violations.push(`${aqua.violations} L routed to irrigation against the quality rule.`);
  if (harvest.violation) violations.push("The fixed crop does not fit the water or the salinity.");
  if (!roads.access.clinic) violations.push("The clinic is not reachable from the gate.");
  if (air.claim === "local alert" && input.air.spread === "wide") violations.push("A threshold called a wide dust pattern a local source.");
  if (heart.maxImbalance > 0.02) violations.push("The heart day did not balance.");
  return {
    heart,
    aqua,
    harvest,
    roads,
    air,
    thermal,
    materials,
    violations,
  };
}

export function crisisPair(input) {
  const heart = heartPair(input);
  return {
    fixed: crisisRun({ ...input, mode: "fixed", heart }),
    coordinated: crisisRun({ ...input, mode: "coordinated", heart }),
  };
}

const cost = "Estimate category, not a quotation.";

export const PLANS = {
  brain: {
    feature: "A constraint check that names what is binding, instead of a single sustainability score.",
    limits: "The brain board and the crisis challenge use one rule set. Energy figures are the heart's 24-hour account: backup is off, the battery is 28 kWh, and cooling units are twice the heat level. It is not an optimiser and it does not know prices, laws or measured demand.",
    judge: {
      opening: "Heat, water, power and access use one rule set. Energy is the heart's full day, not a separate score.",
      questions: [
        ["Is this running a city?", "No. It is a proposed rule set for an exhibition model."],
        ["Why can the coordinated plan look worse on one number?", "It may spend the budget on the clinic road and leave another road open. That trade-off is the point."],
      ],
    },
    physical: {
      name: "Resource-token table",
      purpose: "Show that a response cannot be spent twice.",
      see: "Tokens for water, electricity and budget move only when the rule allows.",
      materials: [
        ["Tokens", "30", "Stand in for litres, kilowatt-hours and budget", "Essential", "Paper slips", `Low. ${cost}`],
        ["Labelled cups", "8", "One cup per system", "Essential", "Reused containers", `Low. ${cost}`],
      ],
      build: ["Label the cups with the eight systems.", "Start each round with the token counts written on the sheet.", "Move a token only when the crisis rule says the transfer is allowed."],
      procedure: ["Set the crisis.", "Try the fixed order, then the coordinated order, with the same starting tokens.", "Write what could not be served."],
      judge: ["Change the budget.", "Remove the clinic road.", "Ask which constraint stopped an action."],
      safety: ["No mains power.", "Tokens are not a claim about real infrastructure."],
      fallback: "Paper tokens and the digital crisis panel. No microcontroller.",
    },
    experiment: {
      question: "Under the same shortage, which rule keeps the clinic supplied without breaking a stated limit?",
      independent: "Fixed order versus coordinated order.",
      dependent: "Essential kilowatts served, quality-rule violations, clinic reachable.",
      controlled: "Solar, battery, water factor, budget, air scenario.",
      baseline: "Cooling first, all water to irrigation, cheapest roads, particulate threshold.",
      proposed: "Essential power first, quality gate, clinic road first, context before an air claim.",
      success: "Fewer stated-rule violations at the same starting resources. Not a required percentage.",
      errors: "Cooling units and the clear-sky curve are assumptions. Shade is assumed, not measured. The heart backup is switched off in this comparison so it is not a hidden source.",
    },
  },
  heart: {
    feature: "Priority, cable limits and a real alternate route. Energy is never created to fill a gap.",
    limits: "The day model is synthetic. Cable loss is a simple square term. There is no local battery when the hub link fails. Prices are assumptions. A physical table must stay on a current-limited low-voltage supply.",
    judge: {
      opening: "Four modelled roofs, one shared battery, and cables that stop at their rating.",
      questions: [
        ["Does coordination always use less backup?", "No. On the default day it can use more backup because the shared backup reaches more buildings."],
        ["What if the water cable opens?", "There is no second path. The pump stays on its own roof."],
      ],
    },
    physical: {
      name: "Low-voltage route board",
      purpose: "Show a switch opening a path and another path carrying only what its limit allows.",
      see: "Small lamps for four loads, switches for cables, a labelled battery pack only if it is a protected low-voltage module.",
      materials: [
        ["LEDs and resistors", "8", "Loads and path indicators", "Essential", "Torch bulbs on a battery pack", `Low. ${cost}`],
        ["Toggle switches", "5", "Cable and fault switches", "Essential", "Paper clips as temporary switches", `Low. ${cost}`],
        ["Current-limited supply", "1", "Safe source under 12 V", "Essential", "AA battery pack", `Low to moderate. ${cost}`],
      ],
      build: ["Wire each lamp through its own switch back to the supply.", "Add the homes-school jumper as a second switch.", "Do not connect the board to household mains.", "Label the clinic and water paths as having no jumper."],
      procedure: ["Close all switches and note which lamps light.", "Open the homes path and close the jumper.", "Open the water path and show that no jumper exists."],
      judge: ["Open one switch.", "Ask which lamp can still be fed.", "Compare with the digital kilowatt run."],
      safety: ["No mains.", "No bare lithium cells.", "Disconnect the pack when the table is unattended."],
      fallback: "The digital Nabd Heart day is the quantitative test. The lamp board is only the path logic.",
    },
    experiment: {
      question: "With the same roofs and the same total battery, what changes when buildings can exchange?",
      independent: "Coordinated sharing versus four isolated roofs.",
      dependent: "Unmet kilowatt-hours, essential unmet, backup, curtailment, cable flow.",
      controlled: "Roof sizes, load shapes, loss setting, battery rating, fault.",
      baseline: "Independent roofs. The same totals, split, and no exchange.",
      proposed: "Share surplus only along a cable that is in service and inside its rating.",
      success: "The account balances, including losses. A lower unmet figure is reported for that day only.",
      errors: "Invented sky and load shapes. Not a protection study and not a tariff.",
    },
  },
  kidneys: {
    feature: "Water is routed only when the quality rule for that use is met. Volume alone is the baseline.",
    limits: "Salinity and quality classes are scenario labels, not laboratory tests. Nothing here is drinking water. A turbidity reading would not make it drinkable.",
    judge: {
      opening: "Used water is not one liquid. Wash water, brackish rinse and sanitary flow do not go to the same place.",
      questions: [
        ["Can the judge drink the demo?", "No. Demonstration water stays in the containers."],
        ["Does treatment make it potable?", "No. Further treatment in this model is a hold, not a validated drinking-water process."],
      ],
    },
    physical: {
      name: "Three-jar quality gate",
      purpose: "Show acceptance and rejection without treating the water as safe to drink.",
      see: "Coloured safe water moves only into the jar whose label matches the rule.",
      materials: [
        ["Clear jars", "4", "Sources and destinations", "Essential", "Bottles", `Low. ${cost}`],
        ["Food colouring", "3", "Distinguish the streams", "Essential", "Labelled cards if colour is unavailable", `Low. ${cost}`],
        ["Tubing and a small pump", "1", "Optional flow", "Optional", "Pour by hand", `Moderate if bought. ${cost}`],
      ],
      build: ["Fill jars with tap water and food colouring. Do not use wastewater.", "Label irrigation, further treatment and reject.", "Write the salinity rule on the table."],
      procedure: ["Pour each source only where the rule allows.", "Run the volume-only pour, which ignores the labels, and mark the violations.", "Record litres in and litres out."],
      judge: ["Swap a source card.", "Ask why sanitary flow never reaches irrigation."],
      safety: ["No drinking.", "No real wastewater.", "Keep any pump on low voltage and dry connections."],
      fallback: "Hand pouring and the digital quality gate.",
    },
    experiment: {
      question: "How many litres does a volume-only rule send to a use the quality rule forbids?",
      independent: "Volume-only versus quality gate.",
      dependent: "Litres to irrigation, litres rejected, rule violations, balance.",
      controlled: "Source volumes, salinity labels, treatment capacity.",
      baseline: "Send every litre to irrigation.",
      proposed: "Reject sanitary flow. Hold high salinity up to capacity. Irrigate only what the rule allows.",
      success: "Input equals the sum of the outlets, and gated irrigation has no forbidden litre.",
      errors: "Classes are not lab measurements. Capacity is a setting.",
    },
  },
  liver: {
    feature: "Contamination and a full recovery line stop a material from being counted as recovered.",
    limits: "Masses are a teaching set. Sorting is not recycling. Hazardous items are never recovered.",
    judge: {
      opening: "A clean category is not enough if the piece is contaminated or the line is full.",
      questions: [
        ["Is a correct bin recycled material?", "No. This model counts recovery only after the contamination and capacity checks."],
      ],
    },
    physical: {
      name: "Gate and four bins",
      purpose: "Stop a contaminated or hazardous piece before the recovery bin.",
      see: "A piece is refused or accepted against a written rule.",
      materials: [
        ["Sample pieces", "10", "Paper, plastic, metal, food waste, a labelled hazard card", "Essential", "Pictures of the pieces", `Low. ${cost}`],
        ["Bins", "4", "Recovery, organic, hazard, residual", "Essential", "Boxes", `Low. ${cost}`],
        ["Servo gate", "1", "Optional motion", "Optional", "A hand gate", `Moderate if bought. ${cost}`],
      ],
      build: ["Mark contamination on two pieces.", "Set a recovery-bin limit, such as four pieces.", "Keep the hazard card out of recovery even if the category looks recyclable."],
      procedure: ["Sort by category only and count dirty pieces that entered recovery.", "Repeat with the contamination rule and the same pieces."],
      judge: ["Add a dirty plastic piece.", "Fill the recovery bin and show the leftover mass."],
      safety: ["Clean materials only.", "No real hazardous waste.", "Low voltage only if a servo is used."],
      fallback: "Hand sort. The digital cascade does the accounting.",
    },
    experiment: {
      question: "How much contaminated mass enters recovery if the rule ignores contamination?",
      independent: "Category sort versus contamination gate.",
      dependent: "Recovered kilograms, contamination in recovery, residual, hazard, balance.",
      controlled: "The same pieces and the same capacity.",
      baseline: "Category only, until the line is full.",
      proposed: "Hazard aside, dirty inputs aside, then capacity.",
      success: "Mass in equals mass out, and dirty mass in recovery is zero under the gate.",
      errors: "The contamination fractions are settings, not lab assays.",
    },
  },
  skin: {
    feature: "Shade first, ventilate only when outside air is cooler, then use electricity if any remains.",
    limits: "The indoor figure is a model index with a degree label, not a measured room. Ventilation is allowed only when the outdoor value is 30 or below and cooler than the model indoor air. The shade drop of 4 is an assumption.",
    judge: {
      opening: "The shell tries shade and ventilation before it spends electricity.",
      questions: [
        ["Does ventilation always help in Oman?", "Not in this model. It is allowed only when outdoor air is cooler than the model indoor air."],
      ],
    },
    physical: {
      name: "Two boxes, one sun",
      purpose: "Compare a fixed box with a box that can be shaded.",
      see: "Two thermometers under the same lamp or the same outdoor shade.",
      materials: [
        ["Card boxes", "2", "The two shells", "Essential", "Two similar rooms of card", `Low. ${cost}`],
        ["Thermometers", "2", "Read both", "Essential", "One thermometer moved between boxes", `Low to moderate. ${cost}`],
        ["Foil or card shade", "1", "Removable shade", "Essential", "A book as shade", `Low. ${cost}`],
        ["Low-voltage fan", "1", "Optional powered cooling", "Optional", "No fan. Record passive only.", `Low. ${cost}`],
      ],
      build: ["Make the boxes the same size.", "Cut one roof so a shade card can cover it.", "Keep the lamp stable and supervised."],
      procedure: ["Record both temperatures at the start.", "Shade only one box.", "If a fan is used, run it for a timed minute and record the supply voltage."],
      judge: ["Remove the shade.", "Ask whether the fan was needed."],
      safety: ["No open flames.", "Lamp stays attended.", "Do not enclose a hot lamp with no air gap."],
      fallback: "Shade cards and thermometers only.",
    },
    experiment: {
      question: "Under the same outdoor assumption, when does the adaptive rule use less electrical cooling?",
      independent: "Fixed cooling versus passive-first.",
      dependent: "Model indoor value, electrical kilowatts, whether shade or vent was used.",
      controlled: "Outdoor value, sun, power available.",
      baseline: "Powered cooling whenever the model is above 26, no shade.",
      proposed: "Shade if the sun is high. Vent only if outside is cooler. Power last.",
      success: "The sheet shows which action fired and the electrical kilowatts. Not a comfort guarantee.",
      errors: "The 4-unit shade drop and the 3-unit drop per kilowatt are assumptions.",
    },
  },
  digestive: {
    feature: "A crop is chosen only if water and salinity allow it. The fixed rule always picks tomato.",
    limits: "Yield numbers are indexes, not harvested kilograms. A short pot trial cannot prove a season. The meal-rescue model above this panel is a separate holding-step exhibit.",
    judge: {
      opening: "The planner refuses a thirsty crop when the water or the salt says no.",
      questions: [
        ["Is barley claimed to be the best crop for Oman?", "No. It is the feasible option inside this three-crop assumption set."],
      ],
    },
    physical: {
      name: "Two pots, measured water",
      purpose: "Compare a fixed pour with a pour that stops at a moisture mark.",
      see: "Equal pots, a measuring cup, and a written stop rule.",
      materials: [
        ["Pots and soil", "2", "The comparison", "Essential", "Cups", `Low. ${cost}`],
        ["Measuring cup", "1", "The water account", "Essential", "A marked bottle", `Low. ${cost}`],
        ["Moisture meter", "1", "Optional stop rule", "Optional", "A finger test written as qualitative only", `Moderate if bought. ${cost}`],
      ],
      build: ["Fill both pots the same way.", "Write the fixed volume and the stop rule.", "Do not claim a yield from a few days."],
      procedure: ["Give both pots the same starting moisture.", "Apply the fixed volume to one and the stop rule to the other.", "Record millilitres, not a yield, unless plants are actually weighed later."],
      judge: ["Change the allowed volume.", "Ask which rule would have over-watered."],
      safety: ["Fresh water only.", "No electrical sensor left in a wet pot overnight."],
      fallback: "Measuring cup and a written rule. The digital crop check is the constraint test.",
    },
    experiment: {
      question: "Which crop rule stays inside the water and salinity limits?",
      independent: "Always tomato versus the feasible crop.",
      dependent: "Water used, shortfall, violation, yield index.",
      controlled: "Available litres and salinity.",
      baseline: "Tomato every time.",
      proposed: "The feasible crop with the higher yield per litre.",
      success: "No violation under the proposed rule when a feasible crop exists.",
      errors: "Three invented crops. Yield is not a field result.",
    },
  },
  skeleton: {
    feature: "The budget is spent to keep essential places reachable, not to protect the largest number of cheap roads.",
    limits: "Five vulnerable links and one gate. The clinic is ranked ahead of the water facility when the budget cannot keep both. This is not a flood map and not a forecast. A protected road is only a road the model leaves open.",
    judge: {
      opening: "A cheap road can be protected while the clinic is still cut off.",
      questions: [
        ["Why not protect every road?", "The budget is smaller than the sum of the vulnerable links."],
        ["Is the clinic connected because its picture is still there?", "No. Reachability is recalculated from the gate."],
      ],
    },
    physical: {
      name: "Tray network",
      purpose: "Close a road and see which building can still be reached.",
      see: "A shallow tray, roads that lift out, and a dry electronics zone.",
      materials: [
        ["Waterproof tray", "1", "The site", "Essential", "A baking tray", `Low. ${cost}`],
        ["Removable road cards", "6", "The links", "Essential", "Card strips", `Low. ${cost}`],
        ["Building markers", "4", "Clinic, school, homes, water", "Essential", "Labelled blocks", `Low. ${cost}`],
      ],
      build: ["Lay the same links as the digital graph.", "Keep any battery outside the tray.", "Mark the gate."],
      procedure: ["Leave all roads in and trace a path to the clinic.", "Remove the unprotected vulnerable cards for a chosen budget.", "Trace again. If no path exists, say the clinic is cut off."],
      judge: ["Remove the junction-to-clinic card.", "Ask whether the homes-to-clinic card is an alternate, and whether the budget bought it."],
      safety: ["Electronics stay dry.", "A cup of water is enough. No flood tank.", "This is not a rainfall forecast."],
      fallback: "Cards on a table, no water.",
    },
    experiment: {
      question: "For the same budget, which rule keeps the clinic reachable?",
      independent: "Cheapest roads versus essential access.",
      dependent: "Clinic reachable, water reachable, roads protected, cost.",
      controlled: "The same graph and the same budget.",
      baseline: "Buy the cheapest vulnerable roads until the budget is spent.",
      proposed: "Search the affordable sets and keep the most essential places reachable.",
      success: "At a budget of 5 the essential rule reaches the clinic and the cheap-road rule does not.",
      errors: "Costs are invented units. The graph is a teaching network.",
    },
  },
  lungs: {
    feature: "A high reading is not called a local source until the spread and the wind agree. Otherwise the model waits.",
    limits: "No sensor in this build proves a source. Dust and a nearby source can look alike. Do not burn anything to make a demonstration.",
    judge: {
      opening: "AtmosSense separates a reading from a hypothesis.",
      questions: [
        ["Can it name the polluter?", "No. It can say the pattern fits dust, fits a nearby source, or is not enough."],
      ],
    },
    physical: {
      name: "Reading card, or a sensor if one is already owned",
      purpose: "Show that the same high number can lead to different responses.",
      see: "Three written scenarios, or a live number labelled as a reading only.",
      materials: [
        ["Scenario cards", "3", "Dust, local, unknown", "Essential", "Slides", `Low. ${cost}`],
        ["Particulate sensor", "1", "Optional live reading", "Optional", "The cards", `Moderate to high if bought. ${cost}`],
      ],
      build: ["Print the three patterns.", "If a sensor is used, log the number and do not invent a cause for it."],
      procedure: ["Show a high wide reading with desert wind.", "Show the same number with unknown spread.", "Compare with a threshold that alarms either way."],
      judge: ["Hide the spread.", "Ask what the model refuses to claim."],
      safety: ["No smoke.", "No burning.", "Do not open a sensor near water."],
      fallback: "Cards only.",
    },
    experiment: {
      question: "When does a threshold name a source that the context rule refuses to name?",
      independent: "Threshold versus context.",
      dependent: "Claim, uncertainty, whether a wide dust case was called local.",
      controlled: "The same particulate number.",
      baseline: "Alarm local if the number is at least 80.",
      proposed: "Use wind and spread. Hold when either is missing or they disagree.",
      success: "Unknown spread returns hold. Wide dust is not labelled a local source.",
      errors: "The threshold of 80 is a model setting, not an air-quality standard.",
    },
  },
};
