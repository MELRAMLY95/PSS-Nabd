import { advanceHour, brainDecide, brainStep, dayConditions, irrigate, louvreState, prototypeDefaults, prototypeStep } from "./citySims.js";

function assert(condition, message) {
  if (!condition) {
    console.error("FAIL", message);
    process.exitCode = 1;
  }
}

const hot = brainDecide({ temp: 40, moisture: 50, shadeAt: 34, dryAt: 35, target: 55, pumpWas: false });
assert(hot.shade === true && hot.pump === false, "heat deploys the shade without watering moist soil");
const dry = brainDecide({ temp: 28, moisture: 20, shadeAt: 34, dryAt: 35, target: 55, pumpWas: false });
assert(dry.shade === false && dry.pump === true, "dry soil starts the pump while the shade stays back");
const hold = brainDecide({ temp: 28, moisture: 40, shadeAt: 34, dryAt: 35, target: 55, pumpWas: true });
assert(hold.pump === true, "between the dry mark and the target the pump stays on");
const done = brainDecide({ temp: 28, moisture: 55, shadeAt: 34, dryAt: 35, target: 55, pumpWas: true });
assert(done.pump === false, "reaching the target stops the pump");
const hands = brainDecide({ temp: 40, moisture: 10, mode: "manual", manualShade: false, manualPump: false });
assert(hands.shade === false && hands.pump === false, "manual mode ignores the thresholds");

const stepped = brainStep({ temp: 36, moisture: 20, shadeAt: 34, dryAt: 35, target: 55, mode: "auto", pumpWas: false });
assert(stepped.pump === true && stepped.moisture === 28 && stepped.moisture <= 100, "a watering step raises moisture and stays in range");
const stopped = brainStep({ temp: 40, moisture: 10, shadeAt: 34, dryAt: 35, mode: "auto", stopped: true });
assert(stopped.pump === false && stopped.shade === false && stopped.moisture === 10, "emergency stop does not water or shade");

const full = irrigate({ reservoirL: 20, flowLpm: 2, minutes: 3, moisture: 40, leakPct: 0, efficiency: 1, rainL: 0, demandL: 4 });
assert(full.pumped === 6 && full.reservoirEnd === 14, "the pump takes only the minutes requested");
assert(Math.abs(full.balance) < 1e-9, "a leak-free step conserves volume");
const limited = irrigate({ reservoirL: 1, flowLpm: 4, minutes: 5, moisture: 10, leakPct: 0, efficiency: 1, rainL: 0, demandL: 3 });
assert(limited.pumped === 1 && limited.reservoirEnd === 0, "the pump cannot empty more than the reservoir");
const leaking = irrigate({ reservoirL: 10, flowLpm: 1, minutes: 4, moisture: 50, leakPct: 25, efficiency: 1, rainL: 1, demandL: 1 });
assert(leaking.leaked > 0 && leaking.delivered < leaking.pumped && Math.abs(leaking.balance) < 1e-9, "a leak is lost before the bed and the volumes still balance");
assert(leaking.moisture >= 0 && leaking.moisture <= 100, "soil moisture stays within 0 to 100");
const dryBed = irrigate({ reservoirL: 0, flowLpm: 3, minutes: 5, moisture: 5, leakPct: 10, efficiency: 0.8, rainL: 0, demandL: 2 });
assert(dryBed.pumped === 0 && dryBed.reservoirEnd === 0, "an empty reservoir pumps nothing");

const dark = prototypeStep({ ...prototypeDefaults(), solar: 0.12, temp: 38, moisture: 20 });
assert(dark.pump === false && dark.used + dark.spare === 0.12, "a small solar supply cannot run the pump, and the kilowatts still add up");
const city = prototypeStep(prototypeDefaults());
assert(city.pump === true && city.shade === true && city.delivered > 0, "the default hour shades the civic roof and waters the bed");
assert(Math.abs(city.used + city.spare - city.solar) < 1e-6, "solar used plus spare equals the supply");
assert(city.reservoir < 18 && city.reservoir >= 0, "the reservoir falls and does not go below zero");
const cut = prototypeStep({ ...prototypeDefaults(), roads: { north: true, east: true, south: false } });
assert(cut.served.south === 0 && cut.delivered === 0 && cut.reservoir < 18, "a cut south road keeps the lamp dark and the bed dry");

const night = dayConditions(22, 3, 42);
const noon = dayConditions(12, 3, 42);
const afternoon = dayConditions(15, 3, 42);
assert(night.solar === 0 && noon.solar === 3, "panels give nothing at night and their full capacity at noon");
assert(afternoon.temp === 42 && night.temp < afternoon.temp, "the heat peaks mid-afternoon and is cooler at night");
const nightCity = prototypeStep({ ...prototypeDefaults(), hour: 22, ...dayConditions(22, 2.4, 42), moisture: 10 });
assert(nightCity.pump === false && nightCity.served.north === 0, "without sun the pump and the district lamps have no power");
let clock = prototypeDefaults();
for (let i = 0; i < 24; i += 1) clock = advanceHour(clock);
assert(clock.hour === prototypeDefaults().hour && clock.reservoir >= 0 && clock.reservoir <= 18, "a full day returns to the same hour and the reservoir stays in range");

const cloudyNoon = dayConditions(12, 3, 42, "cloudy");
const heatwave = dayConditions(15, 3, 42, "heatwave");
assert(cloudyNoon.solar < noon.solar && heatwave.temp > afternoon.temp, "cloud cuts solar output and a heatwave raises the peak");

const hotNoon = louvreState({ mode: "auto", temp: 42, shadeAt: 34, hour: 13, solar: 2 });
const mildNoon = louvreState({ mode: "auto", temp: 31, shadeAt: 34, hour: 13, solar: 2 });
assert(hotNoon.closure > mildNoon.closure && hotNoon.closure <= 1, "louvres close further as the heat rises past the threshold");
assert(hotNoon.roofTemp < hotNoon.roofOpen, "closed louvres keep the roof cooler than an open roof");
const louvreNight = louvreState({ mode: "track", temp: 36, shadeAt: 34, hour: 22, solar: 0 });
assert(louvreNight.closure === 0 && louvreNight.blocked === 0, "at night the louvres rest open so the roof can cool");
const manual = louvreState({ mode: "manual", manual: 60, temp: 30, shadeAt: 34, hour: 10, solar: 1 });
const unpowered = louvreState({ mode: "manual", manual: 60, temp: 30, shadeAt: 34, hour: 10, solar: 0.01 });
assert(manual.closure === 0.6 && unpowered.closure === 0, "manual angle needs power to move the slats");
const tracking = louvreState({ mode: "track", temp: 30, shadeAt: 34, hour: 12, solar: 2 });
assert(tracking.closure > mildNoon.closure, "following the sun closes the slats even before the heat threshold");

if (process.exitCode) console.error("city sim tests failed");
else console.log("city sim tests passed");
