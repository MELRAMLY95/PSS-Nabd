const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

export const PULSE_SUN = [18, 42, 64, 82, 94, 100, 96, 84, 62, 34, 12, 0];
export const PULSE_HOURS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
export const PULSE_STREETS = ["North", "East", "South", "West"];
export const PULSE_RATES = {
  storageKeep: 0.9,
  shareKeep: 0.94,
  shed: 0.4,
  batteryCost: 8,
  equipmentCost: 120,
  fuelPerEnergy: 0.28,
  fuelCost: 3,
};

const HOME_SHAPE = [0.48, 0.52, 0.58, 0.62, 0.66, 0.6, 0.64, 0.78, 1, 1.22, 1.36, 1.08];
const CLINIC_SHAPE = [0.72, 0.86, 0.96, 1, 1, 0.96, 0.92, 0.98, 1.02, 1.08, 1.12, 0.9];
const SCHOOL_SHAPE = [0.28, 0.84, 1.16, 1.22, 1.18, 1.08, 0.86, 0.62, 0.34, 0.24, 0.2, 0.18];

const ROOFS = [5.4, 8.6, 6.4, 7.8, 4.6];
const BASES = [4.2, 3.8, 5.6, 3.4, 6.6];

export const PULSE_HOMES = (() => {
  let houseNumber = 1;
  return Array.from({ length: 20 }, (_, id) => {
    const zone = Math.floor(id / 5);
    const seat = id % 5;
    let role = "home";
    let roof = ROOFS[seat];
    let base = BASES[seat];
    if (zone === 0 && seat === 0) {
      role = "clinic";
      roof = 5.2;
      base = 8.6;
    } else if (zone === 1 && seat === 0) {
      role = "school";
      roof = 6.4;
      base = 7.2;
    } else {
      if (zone === 3) roof += 1.6;
      if (zone === 2) base += 0.9;
    }
    const pattern = role === "home" ? ["steady", "quiet", "cooling", "steady", "cooling"][seat] : "essential";
    return {
      id,
      zone,
      seat,
      role,
      pattern,
      essential: role !== "home",
      roof: Math.round(roof * 10) / 10,
      base: Math.round(base * 10) / 10,
      name: role === "clinic" ? "Clinic" : role === "school" ? "School" : `Home ${houseNumber++}`,
    };
  });
})();

function clampRange(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function sunAt(hour, events, dustFactor) {
  let sun = PULSE_SUN[hour] ?? 0;
  if (events.evening && hour >= 9) sun *= 0.35;
  if (events.dust) sun *= dustFactor;
  return sun;
}

function demandAt(home, hour, events) {
  const shape = home.role === "clinic" ? CLINIC_SHAPE[hour] : home.role === "school" ? SCHOOL_SHAPE[hour] : HOME_SHAPE[hour];
  let load = home.base * shape;
  if (home.pattern === "quiet") load *= 0.62;
  if (home.pattern === "cooling" && hour >= 4 && hour <= 8) load *= 1.25;
  if (events.unequal && home.pattern === "quiet") load *= 0.5;
  if (events.unequal && home.pattern === "cooling") load *= 1.45;
  if (events.surge && home.pattern === "cooling" && hour >= 6 && hour <= 8) load *= 1.85;
  if (events.evening && hour >= 9 && home.role !== "school") load *= 1.28;
  return load;
}

function blankTotals() {
  return {
    generated: 0,
    solarUsed: 0,
    local: 0,
    shared: 0,
    stored: 0,
    curtailed: 0,
    managed: 0,
    unmet: 0,
    shortfall: 0,
    essentialUnmet: 0,
    unmetAfter: 0,
    essentialAfter: 0,
    outageHours: 0,
    dieselEnergy: 0,
    dieselHours: 0,
    distributionLoss: 0,
    storageLoss: 0,
  };
}

function addTotals(totals, home) {
  totals.generated += home.gen;
  totals.solarUsed += home.solarUsed;
  totals.shared += home.received;
  totals.curtailed += home.curtailed;
  totals.unmet += home.unmetBefore;
  totals.unmetAfter += home.unmetAfter;
  if (home.essential) {
    totals.essentialUnmet += home.unmetBefore;
    totals.essentialAfter += home.unmetAfter;
  }
  if (home.unmetAfter > 0.2) totals.outageHours += 1;
}

function finish(totals, capacity, equipment) {
  const fuel = totals.dieselEnergy * PULSE_RATES.fuelPerEnergy;
  const round = (value) => Math.round(value);
  return {
    capacity: round(capacity),
    generated: round(totals.generated),
    solarUsed: round(totals.solarUsed),
    local: round(totals.local),
    shared: round(totals.shared),
    stored: round(totals.stored),
    curtailed: round(totals.curtailed),
    managed: round(totals.managed),
    unmet: round(totals.unmet),
    shortfall: round(totals.shortfall),
    essentialUnmet: round(totals.essentialUnmet),
    unmetAfter: round(totals.unmetAfter),
    essentialAfter: round(totals.essentialAfter),
    outageHours: totals.outageHours,
    dieselEnergy: round(totals.dieselEnergy),
    dieselHours: totals.dieselHours,
    fuel: Math.round(fuel * 10) / 10,
    distributionLoss: round(totals.distributionLoss),
    storageLoss: round(totals.storageLoss),
    batteryCost: round(capacity * PULSE_RATES.batteryCost),
    equipmentCost: equipment,
    fuelCost: round(fuel * PULSE_RATES.fuelCost),
    cost: round(capacity * PULSE_RATES.batteryCost + equipment + fuel * PULSE_RATES.fuelCost),
  };
}

function normalise(options = {}) {
  const events = options.events ?? {};
  const homeBattery = clampRange(options.homeBattery, 0, 20, 6);
  const sharedPercent = clampRange(options.sharedPercent, 0, 150, 100);
  return {
    events: {
      unequal: Boolean(events.unequal),
      surge: Boolean(events.surge),
      evening: Boolean(events.evening),
      dust: Boolean(events.dust),
      fault: Boolean(events.fault),
      link: Boolean(events.link),
    },
    faultZone: clampRange(options.faultZone, 0, 3, 0),
    dustFactor: clampRange(options.dustFactor, 0.15, 0.9, 0.45),
    homeBattery,
    sharedPercent,
    sharedCapacity: (homeBattery * PULSE_HOMES.length * sharedPercent) / 100,
    backup: options.backup !== false,
    dieselRating: clampRange(options.dieselRating, 0, 40, 8),
    loads: PULSE_HOMES.map((_, index) => (options.loads?.[index] && !PULSE_HOMES[index].essential ? 1 : 0)),
    initialSoc: 0.4,
  };
}

function dayRecords(setup) {
  return PULSE_HOURS.map((_, hour) => {
    const sun = sunAt(hour, setup.events, setup.dustFactor);
    return {
      sun,
      homes: PULSE_HOMES.map((home) => ({
        ...home,
        gen: home.roof * (sun / 100),
        dem: demandAt(home, hour, setup.events) * (setup.loads[home.id] ? 1.35 : 1),
      })),
    };
  });
}

function giveInOrder(homes, amount, write) {
  let left = amount;
  const order = [...homes].sort((a, b) => Number(b.essential) - Number(a.essential) || b.gap - a.gap);
  order.forEach((home) => {
    if (left <= 0 || home.gap <= 0) return;
    const take = Math.min(home.gap, left);
    write(home, take);
    home.gap -= take;
    left -= take;
  });
  return amount - left;
}

function playIsolated(records, setup) {
  const capacity = setup.homeBattery;
  const charges = PULSE_HOMES.map(() => capacity * setup.initialSoc);
  const totals = blankTotals();
  const frames = records.map((record) => {
    let acceptedHour = 0;
    let drawnHour = 0;
    const homes = record.homes.map((rec, index) => {
      const self = Math.min(rec.gen, rec.dem);
      const surplus = rec.gen - self;
      const gap = rec.dem - self;
      const room = Math.max(0, capacity - charges[index]);
      const accepted = Math.min(surplus, room);
      const stored = accepted * PULSE_RATES.storageKeep;
      const drawn = Math.min(charges[index], gap);
      charges[index] = charges[index] - drawn + stored;
      acceptedHour += accepted;
      drawnHour += drawn;
      const solarUsed = self + drawn;
      const unmet = Math.max(0, rec.dem - solarUsed);
      totals.local += self;
      totals.shortfall += unmet;
      totals.stored += stored;
      const home = {
        id: rec.id,
        zone: rec.zone,
        essential: rec.essential,
        gen: rec.gen,
        dem: rec.dem,
        local: self,
        solarUsed,
        received: 0,
        managed: 0,
        curtailed: Math.max(0, surplus - accepted),
        unmetBefore: unmet,
        unmetAfter: unmet,
        diesel: 0,
        localFill: capacity > 0 ? charges[index] / capacity : 0,
        lit: rec.dem <= 0.05 ? 1 : solarUsed / rec.dem,
        short: unmet > 0.25,
        surplus: surplus > 0.2,
      };
      totals.storageLoss += accepted - stored;
      addTotals(totals, home);
      return home;
    });
    return {
      sun: record.sun,
      hubFill: 0,
      diesel: false,
      flow: "idle",
      homes,
      accepted: acceptedHour,
      drawn: drawnHour,
    };
  });
  return { totals: finish(totals, capacity * PULSE_HOMES.length, 0), frames };
}

function playShared(records, setup, capacity) {
  let charge = capacity * setup.initialSoc;
  const totals = blankTotals();
  const frames = records.map((record) => {
    const controller = !setup.events.link;
    let drawn = 0;
    let accepted = 0;
    const homes = record.homes.map((rec) => {
      const connected = !(setup.events.fault && rec.zone === setup.faultZone);
      const self = Math.min(rec.gen, rec.dem);
      return {
        id: rec.id,
        zone: rec.zone,
        essential: rec.essential,
        connected,
        gen: rec.gen,
        dem: rec.dem,
        surplus: rec.gen - self,
        gap: rec.dem - self,
        self,
        sent: 0,
        received: 0,
        fromBattery: 0,
        managed: 0,
        diesel: 0,
        curtailed: 0,
      };
    });
    const linked = homes.filter((home) => home.connected);
    let sent = 0;
    let delivered = 0;
    if (controller) {
      const surplus = linked.reduce((sum, home) => sum + home.surplus, 0);
      const deficit = linked.reduce((sum, home) => sum + home.gap, 0);
      const deliverable = surplus * PULSE_RATES.shareKeep;
      delivered = Math.min(deliverable, deficit);
      sent = delivered === 0 ? 0 : delivered / PULSE_RATES.shareKeep;
      if (surplus > 0 && sent > 0) {
        linked.forEach((home) => {
          const give = home.surplus * (sent / surplus);
          home.surplus -= give;
          home.sent = give;
        });
      }
      giveInOrder(linked, delivered, (home, take) => {
        home.received += take;
      });
      drawn = Math.min(charge, linked.reduce((sum, home) => sum + home.gap, 0));
      giveInOrder(linked, drawn, (home, take) => {
        home.fromBattery += take;
      });
      charge -= drawn;
      const leftover = linked.reduce((sum, home) => sum + home.surplus, 0);
      accepted = Math.min(leftover, Math.max(0, capacity - charge));
      const stored = accepted * PULSE_RATES.storageKeep;
      charge += stored;
      totals.stored += stored;
      totals.storageLoss += accepted - stored;
      totals.distributionLoss += sent - delivered;
      linked.forEach((home) => {
        if (home.essential || home.gap <= 0) return;
        const shed = home.gap * PULSE_RATES.shed;
        home.gap -= shed;
        home.managed = shed;
      });
      if (leftover > 0 && accepted < leftover) {
        linked.forEach((home) => {
          home.curtailed = home.surplus * ((leftover - accepted) / leftover);
        });
      }
    } else {
      linked.forEach((home) => {
        home.curtailed = home.surplus;
        home.surplus = 0;
      });
    }
    homes.forEach((home) => {
      if (!home.connected) home.curtailed = home.surplus;
    });
    const dieselEnergy = setup.backup
      ? giveInOrder(linked, setup.dieselRating, (home, take) => {
        home.diesel += take;
      })
      : 0;
    if (dieselEnergy > 0.2) totals.dieselHours += 1;
    totals.dieselEnergy += dieselEnergy;
    let flow = "idle";
    if (drawn > 0.3) flow = "discharge";
    else if (accepted > 0.3) flow = "charge";
    else if (sent > 0.3) flow = "share";
    const frameHomes = homes.map((home) => {
      const solarUsed = home.self + home.received + home.fromBattery;
      totals.shortfall += Math.max(0, home.dem - solarUsed);
      const unmetBefore = Math.max(0, home.dem - solarUsed - home.managed);
      const unmetAfter = Math.max(0, unmetBefore - home.diesel);
      totals.local += home.self;
      totals.managed += home.managed;
      const row = {
        id: home.id,
        zone: home.zone,
        essential: home.essential,
        gen: home.gen,
        dem: home.dem,
        local: home.self,
        solarUsed,
        managed: home.managed,
        received: home.received,
        fromBattery: home.fromBattery,
        curtailed: home.curtailed,
        unmetBefore,
        unmetAfter,
        diesel: home.diesel,
        localFill: 0,
        lit: home.dem <= 0.05 ? 1 : (solarUsed + home.diesel) / home.dem,
        short: unmetAfter > 0.25,
        surplus: home.sent > 0.15 || (home.connected && home.curtailed > 0.15),
      };
      addTotals(totals, row);
      return row;
    });
    return {
      sun: record.sun,
      hubFill: capacity > 0 ? charge / capacity : 0,
      diesel: dieselEnergy > 0.2,
      flow: dieselEnergy > 0.2 && flow === "idle" ? "backup" : flow,
      homes: frameHomes,
    };
  });
  return { totals: finish(totals, capacity, PULSE_RATES.equipmentCost), frames };
}

function matched(shared, isolated) {
  return shared.shortfall <= isolated.shortfall && shared.essentialUnmet <= isolated.essentialUnmet;
}

function streetsOf(frames) {
  return PULSE_STREETS.map((name, zone) => {
    let unmet = 0;
    let after = 0;
    let outage = 0;
    frames.forEach((frame) => {
      frame.homes.forEach((home) => {
        if (home.zone !== zone) return;
        unmet += home.unmetBefore;
        after += home.unmetAfter;
        if (home.unmetAfter > 0.2) outage += 1;
      });
    });
    return { name, unmet: Math.round(unmet), after: Math.round(after), outage };
  });
}

export function pulseModel(options = {}) {
  const setup = normalise(options);
  const records = dayRecords(setup);
  const isolated = playIsolated(records, setup);
  const shared = playShared(records, setup, setup.sharedCapacity);
  const isolatedTotal = setup.homeBattery * PULSE_HOMES.length;
  let needed = null;
  if (matched(playShared(records, setup, isolatedTotal).totals, isolated.totals)) {
    let low = 0;
    let high = Math.ceil(isolatedTotal);
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (matched(playShared(records, setup, mid).totals, isolated.totals)) high = mid;
      else low = mid + 1;
    }
    needed = low;
  }
  const percent = isolatedTotal > 0 && needed != null ? Math.round((100 * needed) / isolatedTotal) : null;
  return {
    isolated: isolated.totals,
    shared: shared.totals,
    frames: { isolated: isolated.frames, shared: shared.frames },
    isolatedTotal: Math.round(isolatedTotal),
    needed,
    percent,
    streets: {
      isolated: streetsOf(isolated.frames),
      shared: streetsOf(shared.frames),
    },
    setup,
  };
}

export const EMERGENCIES = {
  heat: { label: "Heat wave", heat: 78, water: 28, energy: 52, air: 18 },
  water: { label: "Water shortage", heat: 24, water: 86, energy: 36, air: 12 },
  dust: { label: "Dust", heat: 20, water: 16, energy: 22, air: 90 },
  grid: { label: "Grid strain", heat: 34, water: 18, energy: 88, air: 14 },
  combined: { label: "All at once", heat: 70, water: 68, energy: 72, air: 54 },
  flood: { label: "Flash flood", heat: 26, water: 90, energy: 44, air: 22 },
};

export const RESPONSE_KEYS = ["heat", "water", "energy", "air"];

export function brainModel({ emergency, severity, alloc, roadClosed = false }) {
  const base = EMERGENCIES[emergency];
  const factor = 0.5 + severity * 0.14;
  const risks = {};
  RESPONSE_KEYS.forEach((key) => {
    risks[key] = clamp(base[key] * factor - alloc[key] * 7);
  });
  if (roadClosed) {
    risks.energy = clamp(risks.energy + 12);
    risks.air = clamp(risks.air + 8);
  }
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

export function kidneyPass({ stages = 2, flow = 55, condition = 80, tick = 12 }) {
  const count = Math.max(1, Math.min(3, Math.round(stages)));
  const step = Math.max(0, Math.min(12, tick));
  const progress = step / 12;
  const contact = Math.max(0.2, 1 - flow / 200);
  const media = Math.max(0.08, condition / 100);
  const inlet = 30 + (100 - condition) * 0.4;
  let dirt = inlet;
  const columns = [0, 1, 2].map((index) => {
    const open = index < count && progress * count > index * 0.85;
    const share = open ? [0.34, 0.26, 0.18][index] * contact * media : 0;
    const caught = dirt * share;
    dirt -= caught;
    const fill = open ? Math.max(0.12, Math.min(1, progress * count - index)) : 0;
    return { open, caught, fill };
  });
  const outlet = Math.max(0, dirt);
  return {
    inlet: Math.round(inlet * 10) / 10,
    outlet: Math.round(outlet * 10) / 10,
    caught: Math.round((inlet - outlet) * 10) / 10,
    columns,
    done: step >= 12,
  };
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
  ["recover", "Recyclable"],
  ["organic", "Organic"],
  ["hazard", "Keep out"],
  ["remainder", "General waste"],
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

const SKIN_DAY = [0.35, 0.55, 0.75, 1, 0.95, 0.7, 0.45, 0.3];

export function skinHour({ sun, angle, insulation, vent, hour = 3 }) {
  const mark = Math.max(0, Math.min(7, Math.round(hour)));
  const sunNow = sun * SKIN_DAY[mark];
  const shell = skinModel({ sun: sunNow, angle, insulation, vent });
  return {
    hour: mark,
    sunNow: Math.round(sunNow),
    outdoor: Math.round(24 + sunNow * 0.22),
    fixed: shell.fixed,
    adaptive: shell.adaptive,
    done: mark >= 7,
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
  const rescuedById = {};
  const wasteById = {};
  const frames = [];
  const add = (map, id, meals) => {
    map[id] = (map[id] || 0) + meals;
  };
  for (let hour = 1; hour <= 8; hour += 1) {
    if (hour === 1) {
      NOURISH_BATCHES.forEach((batch) => {
        const used = held.reduce((sum, item) => sum + item.meals, 0);
        const room = Math.max(0, storage - used);
        if (room <= 0) {
          waste += batch.meals;
          add(wasteById, batch.id, batch.meals);
          return;
        }
        if (batch.meals <= room) held.push({ ...batch });
        else {
          held.push({ ...batch, meals: room });
          waste += batch.meals - room;
          add(wasteById, batch.id, batch.meals - room);
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
        add(rescuedById, batch.id, batch.meals);
        left -= batch.meals;
        return;
      }
      rescued += left;
      add(rescuedById, batch.id, left);
      next.push({ ...batch, meals: batch.meals - left });
      left = 0;
    });
    const aged = [];
    next.forEach((batch) => {
      const hours = batch.hours - 1;
      if (hours <= 0) {
        waste += batch.meals;
        add(wasteById, batch.id, batch.meals);
      } else aged.push({ ...batch, hours });
    });
    held = aged;
    frames.push({
      hour,
      rescued,
      waste,
      stored: held.reduce((sum, batch) => sum + batch.meals, 0),
      portrait: NOURISH_BATCHES.map((batch) => ({
        id: batch.id,
        label: batch.label,
        meals: batch.meals,
        held: held.filter((item) => item.id === batch.id).reduce((sum, item) => sum + item.meals, 0),
        rescued: rescuedById[batch.id] || 0,
        waste: wasteById[batch.id] || 0,
      })),
    });
  }
  const end = frames[frames.length - 1];
  return { frames, rescued: end.rescued, waste: end.waste };
}

const GROUND_GAIN = { low: 1, terrace: 0.62, high: 0.3 };
const DRAIN_GAIN = { low: 0.32, terrace: 0.55, high: 0.75 };

export function skeletonModel({ rain, drainage, grounds, shared, bridge = "low" }) {
  let exposure = grounds.map((ground) => Math.max(0, rain * GROUND_GAIN[ground] - drainage * DRAIN_GAIN[ground]));
  if (shared) {
    const average = exposure.reduce((sum, value) => sum + value, 0) / exposure.length;
    exposure = exposure.map((value) => value * 0.62 + average * 0.38);
  }
  if (bridge === "raised") exposure[1] *= 0.72;
  return exposure.map((value) => {
    const index = Math.round(Math.min(100, value));
    const label = index < 25 ? "Protected" : index < 50 ? "Strain" : "Flood";
    return { exposure: index, label };
  });
}

export function stormFrame({ rain, drainage, grounds, shared, bridge = "low", minute = 8 }) {
  const peak = skeletonModel({ rain, drainage, grounds, shared, bridge });
  const mark = Math.max(0, Math.min(16, minute));
  const rise = mark <= 8 ? mark / 8 : (16 - mark) / 8;
  const draining = mark <= 8 ? 1 : 0.45 + drainage / 180;
  return peak.map((plot) => {
    const exposure = Math.round(Math.min(100, plot.exposure * rise * draining));
    const label = exposure < 25 ? "Protected" : exposure < 50 ? "Strain" : "Flood";
    return { exposure, label };
  });
}

export function lungModel({ particles, efficiency, fan, condition }) {
  const airflow = Math.round(fan * (condition / 100));
  const capture = (efficiency / 100) * (condition / 100) * (fan / 100);
  const removed = Math.round(Math.min(particles, particles * capture));
  return { airflow, removed, remaining: Math.round(particles - removed) };
}

export function lungLoad({ particles, efficiency, fan, condition, tick = 10 }) {
  const step = Math.max(0, Math.min(10, tick));
  const entered = Math.round(particles * (step / 10));
  const capture = (efficiency / 100) * (condition / 100) * (fan / 100);
  const removed = Math.min(entered, Math.round(entered * capture));
  const airflow = Math.round(fan * (condition / 100) * (1 - (step / 10) * (100 - condition) / 220));
  return {
    airflow,
    entered,
    removed,
    remaining: entered - removed,
    loaded: removed,
    done: step >= 10,
  };
}
