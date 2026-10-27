/** Tabletop-controller and irrigation steps. Inputs are the visitor's settings, not sensor feeds. */
import { lungLoad } from "./simModels.js";

export function brainDecide({
  temp = 36,
  moisture = 30,
  shadeAt = 34,
  dryAt = 35,
  target = 55,
  mode = "auto",
  manualShade = false,
  manualPump = false,
  pumpWas = false,
}) {
  const reasons = [];
  if (mode !== "auto") {
    return {
      shade: Boolean(manualShade),
      pump: Boolean(manualPump),
      reasons: ["Manual mode follows the switches. The thresholds are not applied."],
    };
  }
  const shade = temp >= shadeAt;
  reasons.push(shade
    ? `Temperature ${temp} has reached ${shadeAt}, so the shade deploys.`
    : `Temperature ${temp} is below ${shadeAt}, so the shade stays retracted.`);
  let pump = pumpWas;
  if (moisture < dryAt) {
    pump = true;
    reasons.push(`Soil moisture ${moisture}% is below ${dryAt}%, so the pump starts.`);
  } else if (moisture >= target) {
    pump = false;
    reasons.push(`Soil moisture ${moisture}% has reached ${target}%, so the pump stops.`);
  } else {
    reasons.push(pump
      ? `Soil moisture ${moisture}% is between ${dryAt}% and ${target}%, so the pump stays on.`
      : `Soil moisture ${moisture}% is between ${dryAt}% and ${target}%, so the pump stays off.`);
  }
  return { shade, pump, reasons };
}

export function brainStep(state) {
  const decision = brainDecide(state);
  const stopped = state.stopped === true;
  const shade = stopped ? false : decision.shade;
  const pump = stopped ? false : decision.pump;
  let temp = state.temp;
  let moisture = state.moisture;
  if (!stopped) {
    temp = shade ? Math.max(20, temp - 0.4) : Math.min(50, temp + 0.5);
    if (pump) moisture = Math.min(100, moisture + 8);
    else moisture = Math.max(0, moisture - 1);
  }
  temp = Math.round(temp * 10) / 10;
  moisture = Math.round(moisture);
  return {
    ...decision,
    shade,
    pump,
    temp,
    moisture,
    reasons: stopped ? ["Emergency stop. Shade retracted, pump off."] : decision.reasons,
  };
}

export function irrigate({
  reservoirL = 20,
  flowLpm = 1,
  minutes = 2,
  moisture = 30,
  leakPct = 0,
  efficiency = 0.9,
  rainL = 0,
  demandL = 1,
}) {
  const reservoir = Math.max(0, reservoirL);
  const requested = Math.max(0, flowLpm) * Math.max(0, minutes);
  const pumped = Math.min(reservoir, requested);
  const leak = Math.min(100, Math.max(0, leakPct)) / 100;
  const leaked = pumped * leak;
  const through = pumped - leaked;
  const eta = Math.min(1, Math.max(0, efficiency));
  const delivered = through * eta;
  const rain = Math.max(0, rainL);
  const demand = Math.max(0, demandL);
  const arrived = delivered + rain;
  const used = Math.min(arrived, demand);
  const runoff = arrived - used;
  const reservoirEnd = reservoir - pumped;
  const moistureNext = Math.max(0, Math.min(100, Math.round(moisture + (arrived - demand) * 4)));
  const balance = reservoirEnd + leaked + used + runoff - (reservoir + rain);
  return {
    pumped: round(pumped),
    leaked: round(leaked),
    delivered: round(delivered),
    used: round(used),
    runoff: round(runoff),
    reservoirEnd: round(reservoirEnd),
    moisture: moistureNext,
    balance: round(balance),
    savedVsFull: round(requested - pumped),
  };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

export const PROTOTYPE_DISTRICTS = [
  { id: "north", name: "North district" },
  { id: "east", name: "East district" },
  { id: "south", name: "South beds" },
];

export function sunHeight(hour) {
  return Math.max(0, Math.sin((Math.PI * (hour - 6)) / 12));
}

/**
 * Roof louvres. Auto closes in proportion to heat above the threshold, follow-the-sun also tracks the sun's height,
 * and every mode rests open at night so the roof can lose heat. Without power the slats rest open.
 * Roof surface figures are a model index for the tabletop, not a thermometer reading.
 */
export function louvreState({ mode = "auto", manual = 0, temp, shadeAt, hour, solar }) {
  const sun = sunHeight(hour);
  const powered = solar >= 0.05;
  const heat = Math.min(1, Math.max(0, (temp - shadeAt + 3) / 6));
  let closure = 0;
  if (mode === "manual") closure = Math.min(100, Math.max(0, manual)) / 100;
  else if (mode === "track") closure = sun > 0 ? Math.max(heat, 0.25 + 0.6 * sun) : 0;
  else closure = sun > 0 ? heat * (0.55 + 0.45 * sun) : 0;
  if (!powered) closure = 0;
  closure = Math.round(closure * 100) / 100;
  const gain = 24 * sun;
  const roofOpen = Math.round((sun > 0 ? temp + gain : temp - 3) * 10) / 10;
  const roofTemp = Math.round((sun > 0 ? temp + gain * (1 - 0.75 * closure) : temp - 3) * 10) / 10;
  return { mode, closure, powered, sun, roofTemp, roofOpen, blocked: sun > 0 ? Math.round(75 * closure) : 0 };
}

export const WEATHER = {
  clear: { name: "Clear", sun: 1, heat: 0, dust: null },
  cloudy: { name: "Cloudy", sun: 0.45, heat: -2, dust: null },
  dust: { name: "Dust storm", sun: 0.6, heat: 1, dust: 95 },
  heatwave: { name: "Heatwave", sun: 1, heat: 6, dust: null },
};

/** Sun and outdoor heat for an hour of the model day. Output stops below the horizon; heat peaks mid-afternoon. */
export function dayConditions(hour, capacity, peakHeat, weather = "clear") {
  const sky = WEATHER[weather] || WEATHER.clear;
  const sun = sunHeight(hour);
  const warmth = 0.5 + 0.5 * Math.cos((2 * Math.PI * (hour - 15)) / 24);
  return {
    solar: Math.round(Math.max(0, capacity) * sun * sky.sun * 100) / 100,
    temp: Math.round((peakHeat + sky.heat - 12 + 12 * warmth) * 2) / 2,
  };
}

export function prototypeDefaults() {
  const hour = 11;
  const capacity = 2.4;
  const peakHeat = 42;
  return {
    hour,
    capacity,
    peakHeat,
    ...dayConditions(hour, capacity, peakHeat),
    moisture: 28,
    shadeAt: 34,
    dryAt: 35,
    target: 55,
    pumpWas: false,
    fan: true,
    demands: { north: 0.7, east: 0.8, south: 0.5 },
    roads: { north: true, east: true, south: true },
    reservoir: 18,
    particles: 40,
    growth: 1,
    louvreMode: "auto",
    louvreManual: 60,
    weather: "clear",
  };
}

export function advanceHour(state) {
  const next = prototypeStep(state);
  const hour = (state.hour + 1) % 24;
  return {
    ...state,
    hour,
    ...dayConditions(hour, state.capacity, state.peakHeat, state.weather),
    moisture: next.moisture,
    pumpWas: next.pumpWas,
    reservoir: next.reservoir,
    growth: next.growth,
  };
}

export function prototypeStep(state) {
  const decision = brainDecide({
    temp: state.temp,
    moisture: state.moisture,
    shadeAt: state.shadeAt,
    dryAt: state.dryAt,
    target: state.target,
    mode: "auto",
    pumpWas: state.pumpWas,
  });
  let left = Math.max(0, state.solar);
  const solar = left;
  const servoOn = decision.shade && left >= 0.05;
  if (servoOn) left -= 0.05;
  const pumpOn = decision.pump && left >= 0.2;
  if (pumpOn) left -= 0.2;
  const fanOn = state.fan && left >= 0.1;
  if (fanOn) left -= 0.1;
  const served = {};
  let unmet = 0;
  PROTOTYPE_DISTRICTS.forEach((district) => {
    const need = Math.max(0, state.demands[district.id] || 0);
    if (!state.roads[district.id]) {
      served[district.id] = 0;
      unmet += need;
      return;
    }
    const give = Math.min(need, left);
    served[district.id] = round(give);
    left = round(left - give);
    unmet += need - give;
  });
  const roadOpen = state.roads.south !== false;
  const water = irrigate({
    reservoirL: state.reservoir,
    flowLpm: pumpOn ? 0.8 : 0,
    minutes: 1,
    moisture: state.moisture,
    leakPct: pumpOn && !roadOpen ? 100 : 0,
    efficiency: 1,
    rainL: 0,
    demandL: pumpOn && roadOpen ? 0.4 : 0,
  });
  const delivered = pumpOn && roadOpen ? water.delivered : 0;
  const moisture = pumpOn && !roadOpen ? state.moisture : water.moisture;
  const air = fanOn
    ? lungLoad({ particles: state.particles, efficiency: 70, fan: 70, condition: 85, tick: 10 })
    : { removed: 0, entered: 0 };
  let growth = state.growth;
  if (delivered > 0 && moisture >= 25 && moisture <= 85) growth = Math.min(8, growth + 0.25);
  else if (moisture < 20) growth = Math.max(0, Math.round((growth - 0.1) * 100) / 100);
  const temp = Math.round(Math.max(20, Math.min(50, state.temp + (servoOn ? -0.4 : 0.5))) * 10) / 10;
  const reasons = [...decision.reasons];
  if (decision.pump && !pumpOn) reasons.push("The pump stayed off. The hub did not have 0.2 kW left after the shade.");
  if (pumpOn && !roadOpen) reasons.push("The south road is cut, so the water left the reservoir and did not reach the bed.");
  if (!fanOn && state.fan) reasons.push("The fan stayed off. The hub did not have 0.1 kW left.");
  PROTOTYPE_DISTRICTS.forEach((district) => {
    if (!state.roads[district.id]) reasons.push(`${district.name} is dark because its road is closed.`);
  });
  return {
    temp,
    moisture,
    shadeAt: state.shadeAt,
    dryAt: state.dryAt,
    target: state.target,
    pumpWas: pumpOn,
    solar: state.solar,
    fan: state.fan,
    demands: state.demands,
    roads: state.roads,
    reservoir: water.reservoirEnd,
    particles: state.particles,
    growth: Math.round(growth * 100) / 100,
    served,
    unmet: round(unmet),
    spare: round(left),
    used: round(solar - left),
    shade: servoOn,
    pump: pumpOn,
    fanOn,
    delivered,
    caught: air.removed,
    reasons,
  };
}
