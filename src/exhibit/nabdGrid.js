export const STEP_HOURS = 0.25;
export const STEP_COUNT = 96;

export const BUILDINGS = [
  { id: "clinic", name: "Clinic", short: "Clinic", role: "clinic", essential: true, kwp: 6.2, x: 0, z: -2.55 },
  { id: "homes", name: "Residential cluster", short: "Homes", role: "homes", essential: false, kwp: 9.4, x: 2.7, z: 0.15 },
  { id: "school", name: "School", short: "School", role: "school", essential: false, kwp: 12.5, x: 0.05, z: 2.6 },
  { id: "water", name: "Water facility", short: "Water", role: "water", essential: true, kwp: 5.4, x: -2.7, z: 0.05 },
];

export const LOADS = [
  { id: "clinic-medical", building: "clinic", name: "Medical equipment", critical: true, kw: 1.7, shape: "flat" },
  { id: "clinic-light", building: "clinic", name: "Essential lighting", critical: true, kw: 0.4, shape: "flat" },
  { id: "clinic-comfort", building: "clinic", name: "Clinic cooling", critical: false, kw: 0.85, shape: "day" },
  { id: "homes-cold", building: "homes", name: "Refrigeration", critical: true, kw: 0.65, shape: "flat" },
  { id: "homes-daily", building: "homes", name: "Home appliances", critical: false, kw: 1.8, shape: "home" },
  { id: "homes-ac", building: "homes", name: "Air conditioning", critical: false, kw: 0, shape: "ac" },
  { id: "school-night", building: "school", name: "Emergency lighting", critical: true, kw: 0.15, shape: "flat" },
  { id: "school-class", building: "school", name: "Classroom lighting", critical: false, kw: 1.5, shape: "school" },
  { id: "school-equip", building: "school", name: "School equipment", critical: false, kw: 0.7, shape: "school" },
  { id: "water-pump", building: "water", name: "Water pump", critical: true, kw: 2.1, shape: "pump" },
  { id: "water-yard", building: "water", name: "Yard lighting", critical: false, kw: 0.22, shape: "evening" },
];

export function stepLabel(step) {
  const minutes = Math.round(step * STEP_HOURS * 60);
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function defaultScenario() {
  return {
    sun: 1,
    dust: 0,
    dustFrom: 32,
    dustTo: 64,
    sunrise: 6,
    sunset: 18.5,
    acCount: 0,
    acKw: 1.2,
    acFromHour: 12,
    acToHour: 17,
    batteryKwh: 28,
    batteryKw: 10,
    eta: 0.9,
    soc0: 0.55,
    socMin: 0.1,
    arteryKw: 6,
    tieKw: 3,
    lossAtRated: 0.04,
    backupKw: 4,
    backupOn: true,
    tie: true,
    fault: "",
    linkDown: false,
    policy: "priority",
    shed: 1,
    minService: 0.4,
    flexDemand: 1,
    demand: {},
    gen: {},
    loads: {},
    fuelPerKwh: 0.28,
    fuelPrice: 0.25,
    batteryPrice: 80,
    maintPerDay: 0,
  };
}

export const PRESETS = [
  {
    id: "surplus",
    code: "A",
    name: "Solar-surplus exchange",
    question: "How much of the school surplus can reach the homes once the cable limit and the loss are counted?",
    proves: "It shows a transfer on this modelled hour. It does not show that sharing always reduces the battery or the bill.",
    step: 40,
    patch: {
      sun: 1, dust: 0, acCount: 0, fault: "", linkDown: false, tie: true, backupOn: false,
      demand: { school: 0.35, homes: 2.6, clinic: 1, water: 0.8 },
      gen: { school: 1.15, homes: 0.15, clinic: 1, water: 1 },
      loads: { "homes-ac": false },
    },
  },
  {
    id: "peak",
    code: "B",
    name: "Summer peak",
    question: "When the residential air conditioners switch on, what is still supplied, and what is still short?",
    proves: "The controller sees the extra kilowatts. It does not know why the meters rose, and this is not a measured heatwave.",
    step: 52,
    patch: { sun: 1, dust: 0, acCount: 4, acKw: 1.3, fault: "", linkDown: false, tie: true, backupOn: true, demand: {}, gen: {}, loads: { "homes-ac": true } },
  },
  {
    id: "sunset",
    code: "C",
    name: "Sunset and essential loads",
    question: "After the roofs fade, how long do the clinic and the water pump stay supplied?",
    proves: "One evening and one battery size. A shared battery is not assumed to need less capacity than four separate ones.",
    step: 64,
    patch: { sun: 1, dust: 0, acCount: 2, acKw: 1.1, batteryKwh: 22, backupOn: true, fault: "", linkDown: false, tie: true, demand: {}, gen: {} },
  },
  {
    id: "dust",
    code: "D",
    name: "Reduced solar",
    question: "What changes if solar output is lower for part of the day? The reduction is a scenario setting, not a measured dust loss.",
    proves: "Sensitivity to the slider you set. It is not an Omani soiling measurement.",
    step: 44,
    patch: { sun: 1, dust: 0.55, dustFrom: 28, dustTo: 52, acCount: 1, fault: "", linkDown: false, tie: true, demand: {}, gen: {} },
  },
  {
    id: "fault",
    code: "E",
    name: "Fault isolation",
    question: "When the homes artery opens, can the homes–school route carry supply, and what happens if you open the water artery instead?",
    proves: "Restoration follows the cables in this drawing. Opening the water artery has no second path, so the pump stays on its own roof.",
    step: 48,
    patch: { sun: 0.4, dust: 0, fault: "artery-homes", tie: true, linkDown: false, backupOn: true, batteryKwh: 28, soc0: 0.8, demand: {}, gen: {} },
  },
];

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function cableCatalog(scenario) {
  const cables = BUILDINGS.map((building) => ({
    id: `artery-${building.id}`,
    name: `${building.short} artery`,
    kind: "artery",
    building: building.id,
  }));
  cables.push({ id: "tie-hs", name: "Homes–school route", kind: "tie" });
  return cables.map((cable) => ({ ...cable, faulted: scenario?.fault === cable.id }));
}

export function normalize(input = {}) {
  const base = defaultScenario();
  const demand = {};
  const gen = {};
  const loads = {};
  BUILDINGS.forEach((building) => {
    demand[building.id] = input.demand?.[building.id] == null ? 1 : clamp(input.demand[building.id], 0.2, 3, 1);
    gen[building.id] = input.gen?.[building.id] == null ? 1 : clamp(input.gen[building.id], 0, 1.6, 1);
  });
  LOADS.forEach((load) => {
    loads[load.id] = input.loads?.[load.id] !== false;
  });
  const fault = cableCatalog(base).some((cable) => cable.id === input.fault) ? input.fault : "";
  const policy = input.policy === "fair" || input.policy === "floor" ? input.policy : "priority";
  let sunrise = clamp(input.sunrise ?? base.sunrise, 4, 9, 6);
  let sunset = clamp(input.sunset ?? base.sunset, 16, 21, 18.5);
  if (sunset < sunrise + 4) sunset = sunrise + 4;
  return {
    sun: clamp(input.sun ?? base.sun, 0, 1.3, 1),
    dust: clamp(input.dust ?? base.dust, 0, 0.9, 0),
    dustFrom: clamp(input.dustFrom ?? base.dustFrom, 0, 95, 32),
    dustTo: clamp(input.dustTo ?? base.dustTo, 0, 96, 64),
    sunrise,
    sunset,
    acCount: clamp(input.acCount ?? base.acCount, 0, 6, 0),
    acKw: clamp(input.acKw ?? base.acKw, 0, 3, 1.2),
    acFromHour: clamp(input.acFromHour ?? base.acFromHour, 0, 23, 12),
    acToHour: clamp(input.acToHour ?? base.acToHour, 0, 24, 17),
    batteryKwh: clamp(input.batteryKwh ?? base.batteryKwh, 0, 160, 28),
    batteryKw: clamp(input.batteryKw ?? base.batteryKw, 0, 60, 10),
    eta: clamp(input.eta ?? base.eta, 0.7, 0.98, 0.9),
    soc0: clamp(input.soc0 ?? base.soc0, 0, 1, 0.55),
    socMin: clamp(input.socMin ?? base.socMin, 0, 0.5, 0.1),
    arteryKw: clamp(input.arteryKw ?? base.arteryKw, 0.2, 30, 6),
    tieKw: clamp(input.tieKw ?? base.tieKw, 0.2, 20, 3),
    lossAtRated: clamp(input.lossAtRated ?? base.lossAtRated, 0, 0.2, 0.04),
    backupKw: clamp(input.backupKw ?? base.backupKw, 0, 30, 4),
    backupOn: input.backupOn !== false,
    tie: input.tie !== false,
    fault,
    linkDown: Boolean(input.linkDown),
    policy,
    shed: clamp(input.shed ?? base.shed, 0, 1, 1),
    minService: clamp(input.minService ?? base.minService, 0, 1, 0.4),
    flexDemand: clamp(input.flexDemand ?? base.flexDemand, 0, 3, 1),
    demand,
    gen,
    loads,
    fuelPerKwh: clamp(input.fuelPerKwh ?? base.fuelPerKwh, 0, 1, 0.28),
    fuelPrice: clamp(input.fuelPrice ?? base.fuelPrice, 0, 5, 0.25),
    batteryPrice: clamp(input.batteryPrice ?? base.batteryPrice, 0, 500, 80),
    maintPerDay: clamp(input.maintPerDay ?? base.maintPerDay, 0, 50, 0),
  };
}

function skyAt(step, scenario) {
  const hour = step * STEP_HOURS;
  const span = Math.max(0.5, scenario.sunset - scenario.sunrise);
  let sky = 0;
  if (hour > scenario.sunrise && hour < scenario.sunset) sky = Math.sin(Math.PI * (hour - scenario.sunrise) / span);
  sky *= scenario.sun;
  if (step >= scenario.dustFrom && step < scenario.dustTo) sky *= 1 - scenario.dust;
  return Math.max(0, sky);
}

function shapeOf(shape, hour) {
  if (shape === "flat") return 1;
  if (shape === "day") return hour >= 8 && hour < 18 ? 1 : 0.3;
  if (shape === "home") {
    if (hour < 5) return 0.35;
    if (hour < 9) return 0.7;
    if (hour < 16) return 0.55;
    if (hour < 23) return 1;
    return 0.45;
  }
  if (shape === "school") {
    if (hour >= 7 && hour < 14) return 1;
    if (hour < 16) return 0.3;
    return 0.08;
  }
  if (shape === "pump") return (hour >= 9 && hour < 11) || (hour >= 16 && hour < 18) ? 1 : 0.22;
  if (shape === "evening") return hour >= 18 && hour < 23 ? 1 : 0.05;
  return 1;
}

export function powerAt(building, step, scenario) {
  const hour = step * STEP_HOURS;
  const scale = scenario.demand[building.id] ?? 1;
  const loads = LOADS.filter((load) => load.building === building.id).map((load) => {
    const on = scenario.loads[load.id] !== false;
    let kw = 0;
    if (on && load.id === "homes-ac") {
      if (hour >= scenario.acFromHour && hour < scenario.acToHour) kw = scenario.acCount * scenario.acKw;
    } else if (on) kw = load.kw * shapeOf(load.shape, hour);
    if (!load.critical) kw *= scenario.flexDemand ?? 1;
    kw *= scale;
    return { id: load.id, name: load.name, critical: load.critical, kw, on };
  });
  const critical = loads.filter((load) => load.critical).reduce((sum, load) => sum + load.kw, 0);
  const flex = loads.filter((load) => !load.critical).reduce((sum, load) => sum + load.kw, 0);
  const gen = building.kwp * skyAt(step, scenario) * (scenario.gen[building.id] ?? 1);
  return { gen, dem: critical + flex, critical, flex, hour, sky: skyAt(step, scenario), loads };
}

function makeEdges(scenario) {
  const edges = [];
  const add = (edge) => {
    if (scenario.fault === edge.id) return;
    if (edge.kind === "tie" && !scenario.tie) return;
    const capacity = Math.max(0.05, edge.capacity);
    edges.push({
      ...edge,
      capacity,
      residual: capacity,
      entered: 0,
      flowAB: 0,
      loss: 0,
      r: scenario.lossAtRated / capacity,
    });
  };
  BUILDINGS.forEach((building) => {
    add({
      id: `artery-${building.id}`,
      name: `${building.short} artery`,
      kind: "artery",
      a: "hub",
      b: building.id,
      capacity: scenario.arteryKw,
    });
  });
  add({
    id: "tie-hs",
    name: "Homes–school route",
    kind: "tie",
    a: "homes",
    b: "school",
    capacity: scenario.tieKw,
  });
  return edges;
}

function findPath(edges, from, to) {
  if (from === to) return [];
  const adj = new Map();
  edges.forEach((edge) => {
    if (edge.residual <= 1e-4) return;
    if (!adj.has(edge.a)) adj.set(edge.a, []);
    if (!adj.has(edge.b)) adj.set(edge.b, []);
    adj.get(edge.a).push({ edge, to: edge.b });
    adj.get(edge.b).push({ edge, to: edge.a });
  });
  const queue = [from];
  const prev = new Map([[from, null]]);
  while (queue.length) {
    const node = queue.shift();
    if (node === to) break;
    for (const link of adj.get(node) || []) {
      if (prev.has(link.to)) continue;
      prev.set(link.to, { node, edge: link.edge });
      queue.push(link.to);
    }
  }
  if (!prev.has(to)) return null;
  const path = [];
  let cursor = to;
  while (cursor !== from) {
    const previous = prev.get(cursor);
    path.push(previous.edge);
    cursor = previous.node;
  }
  path.reverse();
  return path;
}

function preview(path, sent) {
  let power = sent;
  let loss = 0;
  const used = [];
  for (const edge of path) {
    if (power > edge.residual + 1e-6) return null;
    const drop = Math.min(power, edge.r * power * power);
    used.push({ edge, enter: power, loss: drop });
    loss += drop;
    power -= drop;
  }
  return { sent, delivered: power, loss, used };
}

function transmit(edges, from, to, offerKw, needKw) {
  if (offerKw <= 1e-5 || needKw <= 1e-5) return null;
  const path = findPath(edges, from, to);
  if (!path) return null;
  let low = 0;
  let high = offerKw;
  let best = null;
  for (let pass = 0; pass < 18; pass += 1) {
    const mid = (low + high) / 2;
    const walked = preview(path, mid);
    if (!walked) {
      high = mid;
      continue;
    }
    if (walked.delivered <= needKw + 1e-5) {
      best = walked;
      low = mid;
    } else high = mid;
  }
  if (!best || best.delivered <= 1e-5) return null;
  let cursor = from;
  best.used.forEach((item) => {
    const forward = item.edge.a === cursor;
    item.edge.flowAB += (forward ? 1 : -1) * item.enter;
    cursor = forward ? item.edge.b : item.edge.a;
    item.edge.residual -= item.enter;
    item.edge.entered += item.enter;
    item.edge.loss += item.loss;
  });
  return best;
}

function pull(needs, offers, edges, mode, transfers, minService) {
  const drain = (need, target) => {
    let got = 0;
    const queue = offers.filter((offer) => offer.left > 1e-5).sort((a, b) => b.left - a.left);
    for (const offer of queue) {
      if (got >= target - 1e-5) break;
      const moved = transmit(edges, offer.rec.id, need.rec.id, offer.left, target - got);
      if (!moved) continue;
      offer.left -= moved.sent;
      offer.rec.exported += moved.sent;
      need.left -= moved.delivered;
      need.rec.imported += moved.delivered;
      got += moved.delivered;
      transfers.push({ from: offer.rec.id, to: need.rec.id, kw: moved.delivered, sent: moved.sent, kind: need.kind });
    }
    return got;
  };
  const active = () => needs.filter((need) => need.left > 1e-4);
  if (mode === "fair" || mode === "floor") {
    if (mode === "floor") {
      active().forEach((need) => {
        const floorLeft = Math.max(0, need.left - (1 - minService) * need.rec.flex);
        drain(need, Math.min(need.left, floorLeft));
      });
    }
    for (let pass = 0; pass < 6; pass += 1) {
      const open = active();
      const offerSum = offers.reduce((sum, offer) => sum + offer.left, 0);
      if (!open.length || offerSum <= 1e-5) break;
      const needSum = open.reduce((sum, need) => sum + need.left, 0);
      let moved = 0;
      open.forEach((need) => {
        moved += drain(need, Math.min(need.left, (need.left / needSum) * offerSum));
      });
      if (moved < 1e-4) break;
    }
    return;
  }
  [...needs].sort((a, b) => b.left - a.left).forEach((need) => drain(need, need.left));
}

function blankTotals() {
  return {
    solarKwh: 0,
    demandKwh: 0,
    selfKwh: 0,
    sharedKwh: 0,
    chargeKwh: 0,
    dischargeKwh: 0,
    curtailKwh: 0,
    lossKwh: 0,
    unmetKwh: 0,
    essentialUnmetKwh: 0,
    criticalUnmetKwh: 0,
    managedKwh: 0,
    backupKwh: 0,
    backupHours: 0,
    storageLossKwh: 0,
    maxImbalance: 0,
  };
}

function costOf(totals, scenario) {
  const fuel = totals.backupKwh * scenario.fuelPerKwh;
  return {
    fuel,
    fuelCost: fuel * scenario.fuelPrice,
    batteryCost: scenario.batteryKwh * scenario.batteryPrice,
    operating: fuel * scenario.fuelPrice + scenario.maintPerDay,
  };
}

function finishTotals(totals, scenario) {
  const rounded = {};
  Object.entries(totals).forEach(([key, value]) => {
    rounded[key] = key === "backupHours" || key === "maxImbalance" ? value : Math.round(value * 1000) / 1000;
  });
  rounded.backupHours = Math.round(totals.backupHours * 100) / 100;
  rounded.maxImbalance = totals.maxImbalance;
  return { ...rounded, ...costOf(totals, scenario) };
}

function reachable(edges, id) {
  return findPath(edges, id, "hub") !== null;
}

function cableSnapshot(scenario, edges) {
  return cableCatalog(scenario).map((cable) => {
    const live = edges.find((edge) => edge.id === cable.id);
    const inService = cable.kind !== "tie" ? scenario.fault !== cable.id : scenario.tie && scenario.fault !== cable.id;
    return {
      ...cable,
      kw: live ? live.entered : 0,
      dir: live && live.flowAB < -0.02 ? -1 : live && live.flowAB > 0.02 ? 1 : 0,
      loss: live ? live.loss : 0,
      capacity: cable.kind === "tie" ? scenario.tieKw : scenario.arteryKw,
      inService,
      faulted: scenario.fault === cable.id,
    };
  });
}

function narrate(scenario, records, edges, transfers, charge, discharge, backup, managed, soc, capacity) {
  const lines = [];
  if (scenario.linkDown) {
    lines.push("Communication lost. Each building uses its own roof. The hub battery stays idle because these buildings have no separate local battery.");
  }
  if (scenario.fault) {
    const cable = cableCatalog(scenario).find((item) => item.id === scenario.fault);
    lines.push(`${cable?.name || "A cable"} has been isolated following a simulated fault.`);
    const alternate = scenario.tie && scenario.fault !== "tie-hs" && (scenario.fault === "artery-homes" || scenario.fault === "artery-school");
    if (scenario.fault === "tie-hs") {
      lines.push("The spare route is open. Each building still has its own artery to the hub.");
    } else if (!alternate) {
      lines.push("Restoration is unavailable: no suitable alternative route.");
    } else {
      const tie = edges.find((edge) => edge.id === "tie-hs");
      lines.push(tie && tie.entered > 0.05
        ? `The homes–school route is carrying ${tie.entered.toFixed(2)} kW of its ${scenario.tieKw.toFixed(1)} kW capacity.`
        : "The homes–school route is in service. It carries power only while capacity remains.");
    }
  }
  const homes = records.find((record) => record.id === "homes");
  const ac = homes?.loads?.find((load) => load.id === "homes-ac");
  if (ac && ac.kw > 0.05) lines.push(`Residential cluster air conditioning is drawing ${ac.kw.toFixed(2)} kW.`);
  edges.filter((edge) => edge.entered >= edge.capacity - 0.05 && edge.capacity > 0).slice(0, 1).forEach((edge) => {
    lines.push(`A transfer is limited because ${edge.name} is at its ${edge.capacity.toFixed(1)} kW capacity.`);
  });
  const moved = transfers.find((item) => item.kw > 0.05);
  if (moved) {
    const from = BUILDINGS.find((item) => item.id === moved.from)?.short || "Hub";
    const to = BUILDINGS.find((item) => item.id === moved.to)?.short || "Hub";
    lines.push(`${from} is sending ${moved.kw.toFixed(2)} kW to ${to}.`);
  }
  const richest = records
    .map((record) => ({ record, extra: record.gen - record.self }))
    .filter((item) => item.extra > 0.08)
    .sort((a, b) => b.extra - a.extra)[0];
  if (richest) lines.push(`${richest.record.short} has ${richest.extra.toFixed(2)} kW of surplus solar generation.`);
  const spilled = records.reduce((sum, record) => sum + (record.curtailed || 0), 0);
  if (spilled > 0.08) {
    const why = soc >= capacity - 0.05
      ? "The battery is at its energy limit."
      : charge >= scenario.batteryKw - 0.05
        ? "The battery is at its charge-power limit."
        : "The remaining route cannot carry it.";
    lines.push(`${spilled.toFixed(2)} kW of surplus solar is curtailed. ${why}`);
  }
  const shortest = records
    .filter((record) => record.unmet > 0.08)
    .sort((a, b) => b.unmet - a.unmet)[0];
  if (shortest) lines.push(`${shortest.short} has an unmet demand of ${shortest.unmet.toFixed(2)} kW.`);
  if (charge > 0.08) lines.push("The community battery is charging because surplus energy remains.");
  if (discharge > 0.08) lines.push("The community battery is discharging because generation is short of demand.");
  if (soc <= scenario.socMin * capacity + 0.02 && discharge <= 0.05 && records.some((record) => record.unmet > 0.08)) {
    lines.push("The battery has reached its minimum permitted state of charge.");
  }
  if (managed > 0.08) {
    const sky = records[0]?.sky ?? 1;
    lines.push(sky < 0.45
      ? "Renewable supply is low at this step, so flexible loads above the minimum service level were reduced."
      : "Essential-load priority has reduced non-critical demand above the minimum service level.");
  }
  if (backup > 0.08) lines.push(`Backup is supplying ${backup.toFixed(2)} kW. It does not cover a shortage beyond its rating.`);
  return lines.slice(0, 8);
}

function frameFrom(input) {
  const capacity = Math.max(input.capacity, 0.001);
  return {
    step: input.step,
    label: stepLabel(input.step),
    hour: input.step * STEP_HOURS,
    sky: input.sky,
    solarKw: input.solar,
    demandKw: input.demand,
    servedKw: input.served,
    sharedKw: input.shared,
    chargeKw: input.charge,
    dischargeKw: input.discharge,
    curtailKw: input.curtail,
    lossKw: input.loss,
    unmetKw: input.unmet,
    essentialUnmetKw: input.essentialUnmet,
    criticalUnmetKw: input.criticalUnmet,
    backupKw: input.backup,
    managedKw: input.managed,
    socKwh: input.socKwh,
    soc: input.socKwh / capacity,
    imbalance: input.imbalance,
    buildings: input.buildings,
    cables: cableSnapshot(input.scenario, input.edges),
    transfers: input.transfers,
    messages: input.messages,
    linkDown: input.linkDown,
    flow: input.backup > 0.08 ? "backup" : input.discharge > 0.08 ? "discharge" : input.charge > 0.08 ? "charge" : input.shared > 0.08 ? "share" : "idle",
  };
}

function rowFrom(record, reaches) {
  return {
    ...record,
    connected: reaches,
    isShort: record.unmet > 0.05,
    criticalShort: record.criticalUnmet > 0.05,
    surplus: record.gen > record.dem + 0.05,
  };
}

function simulateIndependent(scenario) {
  const count = BUILDINGS.length;
  const capEach = scenario.batteryKwh / count;
  const kwEach = scenario.batteryKw / count;
  const backupEach = scenario.backupOn ? scenario.backupKw / count : 0;
  const etaC = Math.sqrt(scenario.eta);
  const etaD = etaC;
  const soc = BUILDINGS.map(() => scenario.soc0 * capEach);
  const floor = scenario.socMin * capEach;
  const totals = blankTotals();
  const frames = [];
  for (let step = 0; step < STEP_COUNT; step += 1) {
    let solar = 0;
    let demand = 0;
    let selfSum = 0;
    let charge = 0;
    let discharge = 0;
    let backup = 0;
    let curtail = 0;
    let unmet = 0;
    let essentialUnmet = 0;
    let criticalUnmet = 0;
    let served = 0;
    const buildings = BUILDINGS.map((building, index) => {
      const power = powerAt(building, step, scenario);
      const selfCritical = Math.min(power.gen, power.critical);
      const selfFlex = Math.min(Math.max(0, power.gen - selfCritical), power.flex);
      const self = selfCritical + selfFlex;
      let surplus = power.gen - self;
      let criticalLeft = power.critical - selfCritical;
      let flexLeft = power.flex - selfFlex;
      const roomKw = Math.min(kwEach, Math.max(0, capEach - soc[index]) / (etaC * STEP_HOURS));
      const take = Math.min(surplus, roomKw);
      soc[index] += take * etaC * STEP_HOURS;
      surplus -= take;
      const availableKw = Math.min(kwEach, Math.max(0, soc[index] - floor) * etaD / STEP_HOURS);
      const giveCritical = Math.min(criticalLeft, availableKw);
      const giveFlex = Math.min(flexLeft, Math.max(0, availableKw - giveCritical));
      const give = giveCritical + giveFlex;
      soc[index] -= (give / etaD) * STEP_HOURS;
      criticalLeft -= giveCritical;
      flexLeft -= giveFlex;
      const backupCritical = Math.min(criticalLeft, backupEach);
      const backupFlex = Math.min(flexLeft, Math.max(0, backupEach - backupCritical));
      const support = backupCritical + backupFlex;
      criticalLeft -= backupCritical;
      flexLeft -= backupFlex;
      const row = rowFrom({
        ...building,
        ...power,
        self,
        imported: 0,
        exported: 0,
        fromBattery: give,
        fromBackup: support,
        managed: 0,
        curtailed: surplus,
        unmet: criticalLeft + flexLeft,
        criticalUnmet: criticalLeft,
        flexUnmet: flexLeft,
        soc: capEach > 0 ? soc[index] / capEach : 0,
      }, false);
      solar += power.gen;
      demand += power.dem;
      selfSum += self;
      charge += take;
      discharge += give;
      backup += support;
      curtail += surplus;
      unmet += row.unmet;
      criticalUnmet += criticalLeft;
      served += self + give + support;
      if (building.essential) essentialUnmet += criticalLeft;
      return row;
    });
    const imbalance = Math.abs(solar + discharge + backup - (served + charge + curtail));
    totals.maxImbalance = Math.max(totals.maxImbalance, imbalance);
    totals.solarKwh += solar * STEP_HOURS;
    totals.demandKwh += demand * STEP_HOURS;
    totals.selfKwh += selfSum * STEP_HOURS;
    totals.chargeKwh += charge * STEP_HOURS;
    totals.dischargeKwh += discharge * STEP_HOURS;
    totals.curtailKwh += curtail * STEP_HOURS;
    totals.unmetKwh += unmet * STEP_HOURS;
    totals.essentialUnmetKwh += essentialUnmet * STEP_HOURS;
    totals.criticalUnmetKwh += criticalUnmet * STEP_HOURS;
    totals.backupKwh += backup * STEP_HOURS;
    if (backup > 0.05) totals.backupHours += STEP_HOURS;
    totals.storageLossKwh += charge * (1 - etaC) * STEP_HOURS + discharge * (1 / etaD - 1) * STEP_HOURS;
    frames.push(frameFrom({
      step,
      scenario,
      sky: skyAt(step, scenario),
      solar,
      demand,
      served,
      shared: 0,
      charge,
      discharge,
      curtail,
      loss: 0,
      unmet,
      essentialUnmet,
      criticalUnmet,
      backup,
      managed: 0,
      socKwh: soc.reduce((sum, value) => sum + value, 0),
      capacity: scenario.batteryKwh,
      imbalance,
      buildings,
      edges: [],
      transfers: [],
      messages: ["Independent roofs and batteries. No building can take electricity from another."],
      linkDown: false,
    }));
  }
  return { frames, totals: finishTotals(totals, scenario), socEnd: soc.reduce((sum, value) => sum + value, 0) };
}

function simulateCoordinated(scenario) {
  const etaC = Math.sqrt(scenario.eta);
  const etaD = etaC;
  let soc = scenario.soc0 * scenario.batteryKwh;
  const floor = scenario.socMin * scenario.batteryKwh;
  const totals = blankTotals();
  const frames = [];
  for (let step = 0; step < STEP_COUNT; step += 1) {
    const edges = makeEdges(scenario);
    const records = BUILDINGS.map((building) => {
      const power = powerAt(building, step, scenario);
      const selfCritical = Math.min(power.gen, power.critical);
      const selfFlex = Math.min(Math.max(0, power.gen - selfCritical), power.flex);
      return {
        ...building,
        ...power,
        self: selfCritical + selfFlex,
        surplus: power.gen - selfCritical - selfFlex,
        imported: 0,
        exported: 0,
        fromBattery: 0,
        fromBackup: 0,
        managed: 0,
        curtailed: 0,
        unmet: 0,
        criticalUnmet: 0,
        flexUnmet: 0,
      };
    });
    const transfers = [];
    const offers = records.filter((record) => record.surplus > 1e-5).map((record) => ({ rec: record, left: record.surplus }));
    const needs = [];
    records.forEach((record) => {
      const criticalLeft = record.critical - Math.min(record.gen, record.critical);
      const flexLeft = record.flex - (record.self - Math.min(record.gen, record.critical));
      if (criticalLeft > 1e-5) {
        needs.push({
          rec: record,
          left: criticalLeft,
          kind: "critical",
          rank: record.essential ? 0 : 1,
        });
      }
      if (flexLeft > 1e-5) needs.push({ rec: record, left: flexLeft, kind: "flex", rank: 2 });
    });
    let charge = 0;
    let discharge = 0;
    let backup = 0;
    let managed = 0;

    const serveHub = (list, room, sink) => {
      let left = room;
      [...list].sort((a, b) => a.rank - b.rank || b.left - a.left).forEach((need) => {
        if (left <= 1e-4 || need.left <= 1e-4) return;
        if (!reachable(edges, need.rec.id)) return;
        const moved = transmit(edges, "hub", need.rec.id, left, need.left);
        if (!moved) return;
        left -= moved.sent;
        sink.sent += moved.sent;
        need.left -= moved.delivered;
        need.rec[sink.field] += moved.delivered;
      });
      return left;
    };

    if (!scenario.linkDown) {
      [0, 1].forEach((rank) => {
        pull(needs.filter((need) => need.rank === rank), offers, edges, "priority", transfers, scenario.minService);
      });
      pull(
        needs.filter((need) => need.rank === 2),
        offers,
        edges,
        scenario.policy === "priority" ? "priority" : scenario.policy,
        transfers,
        scenario.minService,
      );
      let chargeRoom = Math.min(scenario.batteryKw, Math.max(0, scenario.batteryKwh - soc) / (etaC * STEP_HOURS));
      offers.filter((offer) => offer.left > 1e-4 && reachable(edges, offer.rec.id))
        .sort((a, b) => b.left - a.left)
        .forEach((offer) => {
          if (chargeRoom <= 1e-4) return;
          const moved = transmit(edges, offer.rec.id, "hub", offer.left, chargeRoom);
          if (!moved) return;
          offer.left -= moved.sent;
          offer.rec.exported += moved.sent;
          charge += moved.delivered;
          chargeRoom -= moved.delivered;
        });
      if (charge <= 0.02) {
        const sink = { sent: 0, field: "fromBattery" };
        const room = Math.min(scenario.batteryKw, Math.max(0, soc - floor) * etaD / STEP_HOURS);
        if (scenario.policy === "fair" || scenario.policy === "floor") {
          serveHub(needs.filter((need) => need.rank < 2), room, sink);
          const flex = needs.filter((need) => need.rank === 2 && reachable(edges, need.rec.id));
          let remain = room - sink.sent;
          if (scenario.policy === "floor") {
            flex.forEach((need) => {
              if (remain <= 1e-4) return;
              const floorLeft = Math.max(0, need.left - (1 - scenario.minService) * need.rec.flex);
              const before = need.left;
              const moved = transmit(edges, "hub", need.rec.id, remain, Math.min(need.left, floorLeft));
              if (!moved) return;
              remain -= moved.sent;
              sink.sent += moved.sent;
              need.left -= moved.delivered;
              need.rec.fromBattery += moved.delivered;
              if (need.left > before) need.left = before;
            });
          }
          for (let pass = 0; pass < 4; pass += 1) {
            const open = flex.filter((need) => need.left > 1e-4);
            if (!open.length || remain <= 1e-4) break;
            const needSum = open.reduce((sum, need) => sum + need.left, 0);
            let movedSum = 0;
            open.forEach((need) => {
              const moved = transmit(edges, "hub", need.rec.id, remain, Math.min(need.left, (need.left / needSum) * remain));
              if (!moved) return;
              remain -= moved.sent;
              sink.sent += moved.sent;
              need.left -= moved.delivered;
              need.rec.fromBattery += moved.delivered;
              movedSum += moved.delivered;
            });
            if (movedSum < 1e-4) break;
          }
        } else serveHub(needs, room, sink);
        discharge = sink.sent;
      }
      if (scenario.policy === "priority" && scenario.shed > 0) {
        needs.filter((need) => need.rank === 2 && need.left > 1e-4 && reachable(edges, need.rec.id)).forEach((need) => {
          const canManage = Math.min(need.left, (1 - scenario.minService) * need.rec.flex);
          const cut = Math.max(0, canManage) * scenario.shed;
          need.left -= cut;
          need.rec.managed += cut;
          managed += cut;
        });
      }
      if (scenario.backupOn && scenario.backupKw > 0) {
        const sink = { sent: 0, field: "fromBackup" };
        serveHub(needs.filter((need) => need.rank < 2), scenario.backupKw, sink);
        serveHub(needs.filter((need) => need.rank === 2), scenario.backupKw - sink.sent, sink);
        backup = sink.sent;
      }
    }

    let solar = 0;
    let demand = 0;
    let self = 0;
    let shared = 0;
    let curtail = 0;
    let unmet = 0;
    let essentialUnmet = 0;
    let criticalUnmet = 0;
    let served = 0;
    const offerLeft = new Map(offers.map((offer) => [offer.rec.id, offer.left]));
    const buildings = records.map((record) => {
      const leftOffer = offerLeft.has(record.id) ? offerLeft.get(record.id) : record.surplus;
      const criticalLeft = needs.filter((need) => need.rec.id === record.id && need.kind === "critical").reduce((sum, need) => sum + need.left, 0);
      const flexLeft = needs.filter((need) => need.rec.id === record.id && need.kind === "flex").reduce((sum, need) => sum + need.left, 0);
      record.curtailed = Math.max(0, leftOffer);
      record.criticalUnmet = Math.max(0, criticalLeft);
      record.flexUnmet = Math.max(0, flexLeft);
      record.unmet = record.criticalUnmet + record.flexUnmet;
      const rowServed = record.self + record.imported + record.fromBattery + record.fromBackup;
      solar += record.gen;
      demand += record.dem;
      self += record.self;
      shared += record.imported;
      curtail += record.curtailed;
      unmet += record.unmet;
      criticalUnmet += record.criticalUnmet;
      served += rowServed;
      if (record.essential) essentialUnmet += record.criticalUnmet;
      const reaches = !scenario.linkDown && reachable(makeEdges(scenario), record.id);
      return rowFrom(record, reaches);
    });
    const loss = edges.reduce((sum, edge) => sum + edge.loss, 0);
    const imbalance = Math.abs(solar + discharge + backup - (served + charge + loss + curtail));
    soc += charge * etaC * STEP_HOURS - (discharge / etaD) * STEP_HOURS;
    soc = Math.min(scenario.batteryKwh, Math.max(0, soc));
    totals.maxImbalance = Math.max(totals.maxImbalance, imbalance);
    totals.solarKwh += solar * STEP_HOURS;
    totals.demandKwh += demand * STEP_HOURS;
    totals.selfKwh += self * STEP_HOURS;
    totals.sharedKwh += shared * STEP_HOURS;
    totals.chargeKwh += charge * STEP_HOURS;
    totals.dischargeKwh += discharge * STEP_HOURS;
    totals.curtailKwh += curtail * STEP_HOURS;
    totals.lossKwh += loss * STEP_HOURS;
    totals.unmetKwh += unmet * STEP_HOURS;
    totals.essentialUnmetKwh += essentialUnmet * STEP_HOURS;
    totals.criticalUnmetKwh += criticalUnmet * STEP_HOURS;
    totals.managedKwh += managed * STEP_HOURS;
    totals.backupKwh += backup * STEP_HOURS;
    if (backup > 0.05) totals.backupHours += STEP_HOURS;
    totals.storageLossKwh += charge * (1 - etaC) * STEP_HOURS + discharge * (1 / etaD - 1) * STEP_HOURS;
    frames.push(frameFrom({
      step,
      scenario,
      sky: skyAt(step, scenario),
      solar,
      demand,
      served,
      shared,
      charge,
      discharge,
      curtail,
      loss,
      unmet,
      essentialUnmet,
      criticalUnmet,
      backup,
      managed,
      socKwh: soc,
      capacity: scenario.batteryKwh,
      imbalance,
      buildings,
      edges,
      transfers,
      messages: narrate(scenario, buildings, edges, transfers, charge, discharge, backup, managed, soc, scenario.batteryKwh),
      linkDown: scenario.linkDown,
    }));
  }
  return { frames, totals: finishTotals(totals, scenario), socEnd: soc };
}

export function simulate(input, mode = "coordinated") {
  const scenario = normalize(input);
  return mode === "independent" ? simulateIndependent(scenario) : simulateCoordinated(scenario);
}

export function hoursUntilEssentialShortage(frames, fromStep) {
  const start = frames[fromStep];
  if (!start) return null;
  const hit = frames.find((frame, index) => index >= fromStep && frame.essentialUnmetKw > 0.08);
  if (!hit) return { hours: null, at: null };
  return { hours: Math.round((hit.hour - start.hour) * 100) / 100, at: hit.label };
}

export function findSharedBattery(input, independentTotals) {
  const scenario = normalize(input);
  const cap = scenario.batteryKwh;
  let needed = null;
  for (let size = 0; size <= cap + 1e-6; size += 2) {
    const run = simulateCoordinated({ ...scenario, batteryKwh: size });
    if (run.totals.unmetKwh <= independentTotals.unmetKwh + 0.05
      && run.totals.essentialUnmetKwh <= independentTotals.essentialUnmetKwh + 0.05) {
      needed = size;
      break;
    }
  }
  return {
    needed,
    comparedWith: Math.round(cap * 10) / 10,
    percent: needed == null || cap <= 0 ? null : Math.round((100 * needed) / cap),
  };
}

export function dayAccount(run) {
  let essentialDemand = 0;
  run.frames.forEach((frame) => {
    frame.buildings.forEach((building) => {
      if (building.essential) essentialDemand += building.critical * STEP_HOURS;
    });
  });
  const essentialDemandKwh = Math.round(essentialDemand * 1000) / 1000;
  return {
    essentialDemandKwh,
    essentialServedKwh: Math.round((essentialDemandKwh - run.totals.essentialUnmetKwh) * 1000) / 1000,
    servedKwh: Math.round((run.totals.demandKwh - run.totals.unmetKwh) * 1000) / 1000,
    unmetKwh: run.totals.unmetKwh,
    essentialUnmetKwh: run.totals.essentialUnmetKwh,
    socEndKwh: Math.round(run.socEnd * 1000) / 1000,
  };
}

export function buildingServedKwh(run, id) {
  const total = run.frames.reduce((sum, frame) => {
    const building = frame.buildings.find((item) => item.id === id);
    if (!building) return sum;
    return sum + Math.max(0, building.dem - building.unmet) * STEP_HOURS;
  }, 0);
  return Math.round(total * 1000) / 1000;
}

export function compare(input) {
  const scenario = normalize(input);
  const coordinated = simulateCoordinated(scenario);
  const independent = simulateIndependent(scenario);
  return {
    scenario,
    coordinated,
    independent,
    search: findSharedBattery(scenario, independent.totals),
    sunset: hoursUntilEssentialShortage(coordinated.frames, 64),
  };
}

export function csvFor(run) {
  const header = [
    "time",
    "solar_kw",
    "demand_kw",
    "served_kw",
    "shared_kw",
    "battery_charge_kw",
    "battery_discharge_kw",
    "battery_soc_kwh",
    "curtailed_kw",
    "distribution_loss_kw",
    "unmet_kw",
    "essential_unmet_kw",
    "critical_unmet_kw",
    "backup_kw",
    "managed_kw",
    "balance_kw",
  ];
  const lines = run.frames.map((frame) => [
    frame.label,
    frame.solarKw,
    frame.demandKw,
    frame.servedKw,
    frame.sharedKw,
    frame.chargeKw,
    frame.dischargeKw,
    frame.socKwh,
    frame.curtailKw,
    frame.lossKw,
    frame.unmetKw,
    frame.essentialUnmetKw,
    frame.criticalUnmetKw,
    frame.backupKw,
    frame.managedKw,
    frame.imbalance,
  ].map((value) => (typeof value === "number" ? value.toFixed(4) : value)).join(","));
  return `${header.join(",")}\n${lines.join("\n")}\n`;
}
