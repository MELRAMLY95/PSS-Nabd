import {
  AQUA_SOURCES,
  CASCADE_ITEMS,
  aquaLoop,
  atmosSense,
  crisisRun,
  harvestLoop,
  harvestTry,
  regenCascade,
  resiliaPlan,
  resiliaScene,
  thermoShield,
} from "./labScience.js";
import { kidneyPass, lungLoad, skeletonModel, skinHour, stormFrame } from "./simModels.js";

function assert(condition, message) {
  if (!condition) {
    console.error("FAIL", message);
    process.exitCode = 1;
  }
}

const gated = aquaLoop({ sources: AQUA_SOURCES, capacity: 10, salinityMax: 0.45, mode: "gated" });
const volume = aquaLoop({ sources: AQUA_SOURCES, capacity: 10, salinityMax: 0.45, mode: "volume" });
assert(gated.imbalance < 1e-9, "gated water balances");
assert(volume.imbalance < 1e-9, "volume water balances");
assert(gated.rows.every((row) => row.id !== "black" || row.to === "reject"), "sanitary flow is rejected");
assert(gated.violations === 0, "gated rule records no forbidden irrigation");
assert(volume.violations > 0, "volume-only irrigation breaks the quality rule");
assert(gated.irrigation + gated.further + gated.rejected === gated.input, "every litre is assigned");

const dirty = regenCascade({ items: CASCADE_ITEMS, capacity: 12, mode: "category" });
const clean = regenCascade({ items: CASCADE_ITEMS, capacity: 12, mode: "gated" });
assert(dirty.imbalance < 1e-9 && clean.imbalance < 1e-9, "material mass balances");
assert(dirty.contaminationIn > 0, "category sorting admits contaminated mass");
assert(clean.contaminationIn === 0, "the gate keeps contamination out of recovery");
assert(clean.hazard === 2, "hazard is not recovered");
assert(clean.recovered + clean.residual + clean.hazard === clean.input, "cascade accounts for every kilogram");

const full = regenCascade({ items: CASCADE_ITEMS, capacity: 0, mode: "gated" });
assert(full.recovered === 0 && full.imbalance < 1e-9, "a full line recovers nothing and still balances");

const hotOut = thermoShield({ outdoor: 42, sun: 80, powerAvailable: 1, mode: "adaptive" });
assert(hotOut.vent === false, "ventilation stays shut when outdoor air is hotter");
const coolOut = thermoShield({ outdoor: 24, sun: 10, powerAvailable: 0, mode: "adaptive" });
assert(coolOut.shade === false, "low sun does not force shade");

const salty = harvestLoop({ water: 20, salinity: 0.5, mode: "feasible" });
const forced = harvestLoop({ water: 20, salinity: 0.5, mode: "fixed" });
assert(salty.crop === "barley" && salty.violation === false, "feasible crop respects salinity and water");
assert(forced.violation === true, "fixed tomato violates the salinity limit");
assert(harvestLoop({ water: 0, salinity: 0.1, mode: "feasible" }).unmet === true, "no water means no crop");

const cheap = resiliaPlan({ budget: 5, mode: "count" });
const clinicFirst = resiliaPlan({ budget: 5, mode: "essential" });
assert(cheap.access.clinic === false, "cheap roads leave the clinic cut off");
assert(clinicFirst.access.clinic === true, "essential rule reaches the clinic");
assert(clinicFirst.cost <= 5, "essential rule stays inside the budget");
assert(resiliaPlan({ budget: 0, mode: "essential" }).access.clinic === false, "no budget means no protected path");

const wide = atmosSense({ pm: 120, wind: "desert", spread: "wide", mode: "context" });
const blind = atmosSense({ pm: 120, wind: "desert", spread: "wide", mode: "threshold" });
const missing = atmosSense({ pm: 120, wind: "calm", spread: "unknown", mode: "context" });
assert(wide.claim === "dust", "wide desert wind is a dust hypothesis");
assert(blind.claim === "local alert", "a threshold calls the same reading local");
assert(missing.uncertain === true && missing.claim === "hold", "missing spread does not name a source");
const forcedTomato = harvestTry({ water: 10, salinity: 0.1, id: "tomato" });
const fittedBarley = harvestTry({ water: 20, salinity: 0.5, id: "barley" });
assert(forcedTomato.violation === true && forcedTomato.yieldIndex === 0, "a clicked tomato that lacks water does not grow");
assert(fittedBarley.violation === false && fittedBarley.yieldIndex === 5, "a clicked barley that fits keeps its yield index");
const shutClinic = resiliaScene({ budget: 5, mode: "essential", closed: ["junction-clinic"] });
const openClinic = resiliaScene({ budget: 5, mode: "essential", closed: [] });
assert(openClinic.access.clinic === true, "the budget still reaches the clinic before a click");
assert(shutClinic.access.clinic === false, "clicking the clinic road closed cuts that path");
assert(shutClinic.open.includes("junction-clinic") === false, "a closed road leaves the open set");

const passStart = kidneyPass({ stages: 3, flow: 40, condition: 90, tick: 0 });
const passEnd = kidneyPass({ stages: 3, flow: 40, condition: 90, tick: 12 });
assert(passStart.outlet === passStart.inlet && passStart.caught === 0, "a kidney pass starts with all the silt still in the water");
assert(Math.abs(passEnd.inlet - (passEnd.outlet + passEnd.caught)) < 0.2, "silt caught plus silt leaving equals silt that entered");
assert(passEnd.outlet < passEnd.inlet, "three healthy stages remove silt");
assert(passEnd.columns.filter((column) => column.open).length === 3, "the finished pass opened every stage");

const sample = lungLoad({ particles: 80, efficiency: 70, fan: 60, condition: 90, tick: 10 });
const emptyAir = lungLoad({ particles: 80, efficiency: 70, fan: 60, condition: 90, tick: 0 });
assert(emptyAir.entered === 0 && emptyAir.removed === 0, "no air has entered at the start of a filter run");
assert(sample.removed + sample.remaining === sample.entered, "caught particles plus the ones still in the air equal the ones that entered");
assert(sample.removed <= sample.entered && sample.entered === 80, "the filter cannot catch particles that never entered");

const noon = skinHour({ sun: 80, angle: 20, insulation: 40, vent: 30, hour: 3 });
const morning = skinHour({ sun: 80, angle: 20, insulation: 40, vent: 30, hour: 0 });
assert(noon.sunNow === 80, "the middle of the skin day uses the noon sun setting");
assert(morning.sunNow < noon.sunNow && morning.outdoor < noon.outdoor, "morning is cooler than noon under the same setting");

const grounds = ["low", "terrace", "high"];
const crest = stormFrame({ rain: 70, drainage: 35, grounds, shared: false, bridge: "low", minute: 8 });
const peak = skeletonModel({ rain: 70, drainage: 35, grounds, shared: false, bridge: "low" });
assert(crest.every((plot, index) => plot.exposure === peak[index].exposure), "the storm crest matches the plot model");
const after = stormFrame({ rain: 70, drainage: 35, grounds, shared: false, bridge: "low", minute: 16 });
assert(after.every((plot) => plot.exposure === 0), "the storm has drained by the last minute");

const base = { heat: 2, solar: 0.2, soc: 0.1, batteryKwh: 10, batteryKw: 4, water: 0.5, budget: 5, air: { pm: 120, wind: "desert", spread: "wide" } };
const fixed = crisisRun({ ...base, mode: "fixed" });
const coordinated = crisisRun({ ...base, mode: "coordinated" });
assert(coordinated.aqua.imbalance < 1e-9 && fixed.aqua.imbalance < 1e-9, "crisis water balances");
assert(coordinated.materials.imbalance < 1e-9, "crisis materials balance");
assert(coordinated.roads.access.clinic === true && fixed.roads.access.clinic === false, "same budget, different clinic access");
assert(Math.abs(fixed.heart.solarKwh - coordinated.heart.solarKwh) < 0.001, "both energy columns use the same solar day");
assert(fixed.heart.maxImbalance < 0.02 && coordinated.heart.maxImbalance < 0.02, "heart day balances inside the crisis");
assert(fixed.heart.backupKwh === 0 && coordinated.heart.backupKwh === 0, "the crisis day does not add backup");
const dark = crisisRun({ ...base, heat: 0, solar: 0, soc: 0, mode: "coordinated" });
assert(dark.heart.solarKwh === 0, "no sun means no solar energy");
assert(dark.heart.unmetKwh > 1, "empty roofs and an empty battery leave demand unmet");

if (process.exitCode) process.exit(process.exitCode);
console.log("lab science tests passed");
console.log(JSON.stringify({
  fixedEssentialUnmet: fixed.heart.essentialUnmetKwh,
  sharedEssentialUnmet: coordinated.heart.essentialUnmetKwh,
  fixedUnmet: fixed.heart.unmetKwh,
  sharedUnmet: coordinated.heart.unmetKwh,
  fixedSolar: fixed.heart.solarKwh,
  fixedViolations: fixed.violations.length,
  sharedViolations: coordinated.violations.length,
}, null, 2));
