import { BUILDINGS, buildingServedKwh, compare, dayAccount, defaultScenario, normalize, powerAt, simulate } from "./nabdGrid.js";

const TOLERANCE = 0.02;

function assert(condition, message) {
  if (!condition) {
    console.error("FAIL", message);
    process.exitCode = 1;
  }
}

function maxFlow(run, id) {
  return Math.max(...run.frames.map((frame) => frame.cables.find((cable) => cable.id === id)?.kw || 0));
}

const base = compare({});
assert(base.coordinated.totals.maxImbalance < TOLERANCE, `coordinated balance ${base.coordinated.totals.maxImbalance}`);
assert(base.independent.totals.maxImbalance < TOLERANCE, `independent balance ${base.independent.totals.maxImbalance}`);
assert(base.coordinated.frames.every((frame) => frame.socKwh >= -0.001 && frame.socKwh <= base.scenario.batteryKwh + 0.001), "soc bounds");
assert(base.coordinated.frames.every((frame) => frame.chargeKw < 0.05 || frame.dischargeKw < 0.05), "no simultaneous charge and discharge");
assert(maxFlow(base.coordinated, "artery-clinic") <= base.scenario.arteryKw + 0.001, "clinic artery capacity");
assert(base.coordinated.totals.solarKwh > 0 && base.independent.totals.solarKwh === base.coordinated.totals.solarKwh, "same solar");
assert(JSON.stringify(compare({}).coordinated.totals.unmetKwh) === JSON.stringify(base.coordinated.totals.unmetKwh), "same input, same unmet");
const noon = base.coordinated.frames[48];
assert(noon.curtailKw > 1, "noon curtails surplus once the battery is full");
assert(noon.cables.every((cable) => cable.kw < 0.05), "a full battery does not invent cable flow");
assert(noon.messages.some((line) => line.includes("energy limit")), "noon log names the full battery");
const morning = base.coordinated.frames[36];
assert(morning.chargeKw > 1 && morning.cables.some((cable) => cable.kw > 0.5 && cable.dir !== 0), "morning charge moves along the arteries");

const tight = simulate({ arteryKw: 1, tieKw: 1, batteryKwh: 8, backupOn: false }, "coordinated");
assert(tight.totals.maxImbalance < TOLERANCE, `tight balance ${tight.totals.maxImbalance}`);
["artery-clinic", "artery-homes", "artery-school", "artery-water", "tie-hs"].forEach((id) => {
  assert(maxFlow(tight, id) <= 1.001, `${id} stayed within 1 kW`);
});

const waterFault = simulate({ fault: "artery-water", tie: true, sun: 0.25, backupOn: true, batteryKwh: 40, soc0: 1 }, "coordinated");
const water = waterFault.frames[40].buildings.find((building) => building.id === "water");
assert(water.fromBattery === 0 && water.fromBackup === 0 && water.imported === 0, "faulted water receives nothing from the network");
assert(water.connected === false, "faulted water is disconnected");
assert(waterFault.frames[40].messages.some((line) => line.includes("no suitable alternative")), "water fault explains the missing route");
assert(waterFault.frames[40].buildings.find((building) => building.id === "clinic").connected, "clinic stays connected");

const routeCase = { sun: 1, backupOn: false, batteryKwh: 0, acCount: 0, gen: { homes: 0.1, school: 1.2 }, demand: { homes: 2.2, school: 0.3 } };
const homesOff = simulate({ ...routeCase, fault: "artery-homes", tie: false }, "coordinated");
const homesOn = simulate({ ...routeCase, fault: "artery-homes", tie: true }, "coordinated");
const offSupply = homesOff.frames[48].buildings.find((building) => building.id === "homes");
const onSupply = homesOn.frames[48].buildings.find((building) => building.id === "homes");
assert(offSupply.imported + offSupply.fromBattery < 0.05, `homes isolated without the route (${offSupply.imported})`);
assert(onSupply.imported + onSupply.fromBattery > offSupply.imported + offSupply.fromBattery + 0.05, `route restores some homes supply (${onSupply.imported + onSupply.fromBattery})`);
assert(maxFlow(homesOn, "tie-hs") <= 3.001, "route capacity");

const surplus = compare({
  backupOn: false,
  tie: true,
  acCount: 0,
  demand: { school: 0.35, homes: 2.6 },
  gen: { school: 1.15, homes: 0.15 },
  loads: { "homes-ac": false },
});
const noonShare = surplus.coordinated.frames[40];
const school = noonShare.buildings.find((building) => building.id === "school");
const homes = noonShare.buildings.find((building) => building.id === "homes");
const aloneHomes = surplus.independent.frames[40].buildings.find((building) => building.id === "homes");
assert(school.gen > school.dem, `school has surplus (${school.gen} vs ${school.dem})`);
assert(homes.imported > 0.05, `homes receive a transfer (${homes.imported})`);
const tieFlow = noonShare.cables.find((cable) => cable.id === "tie-hs");
if (tieFlow.kw > 0.05) assert(tieFlow.dir === 1 || tieFlow.dir === -1, "the homes–school transfer has a direction");
assert(aloneHomes.imported === 0, "independent homes cannot import");
assert(aloneHomes.unmet + 0.05 >= homes.unmet, "sharing does not increase the homes shortage at this step");
assert(noonShare.messages.some((line) => line.startsWith("School has")), "the largest surplus is named");
assert(noonShare.buildings.every((building) => building.short === BUILDINGS.find((item) => item.id === building.id).short), "short names stay attached to buildings");

const medicalOff = powerAt(BUILDINGS.find((building) => building.id === "clinic"), 48, surplus.scenario);
const medicalOn = powerAt(BUILDINGS[0], 48, base.scenario);
const switched = simulate({ loads: { "clinic-medical": false } }, "coordinated");
const clinicOn = base.coordinated.frames[48].buildings.find((building) => building.id === "clinic");
const clinicOff = switched.frames[48].buildings.find((building) => building.id === "clinic");
assert(clinicOff.dem < clinicOn.dem - 0.5, `switching medical equipment off lowers demand (${clinicOff.dem} vs ${clinicOn.dem})`);
assert(medicalOff.dem <= medicalOn.dem, "powerAt agrees");

const first = simulate({
  sun: 1,
  batteryKwh: 0,
  backupOn: false,
  policy: "priority",
  arteryKw: 1.2,
  tie: false,
  acCount: 0,
  gen: { clinic: 0, homes: 0, water: 0, school: 1 },
}, "coordinated");
const firstClinic = first.frames[48].buildings.find((building) => building.id === "clinic");
const firstHomes = first.frames[48].buildings.find((building) => building.id === "homes");
assert(firstClinic.imported > 0.7, `clinic is served before ordinary loads (${firstClinic.imported})`);
assert(firstHomes.imported < 0.25, `homes ordinary load waits (${firstHomes.imported})`);

const shedCase = simulate({
  sun: 0,
  batteryKwh: 0,
  backupOn: false,
  policy: "priority",
  minService: 0.4,
  shed: 1,
  acCount: 0,
}, "coordinated");
const shedHomes = shedCase.frames[48].buildings.find((building) => building.id === "homes");
assert(shedHomes.managed > 0.15, "priority sets aside some non-critical demand");
assert(shedHomes.managed < shedHomes.flex * 0.75, "the minimum service level keeps part of the ordinary load");
assert(shedHomes.flexUnmet > 0.1, "the protected share stays visible as unmet when nothing can supply it");

const link = simulate({ linkDown: true, sun: 1 }, "coordinated");
assert(link.frames.every((frame) => frame.sharedKw < 0.02 && frame.chargeKw < 0.02 && frame.dischargeKw < 0.02), "link down stops sharing and the hub battery");
assert(link.totals.maxImbalance < TOLERANCE, "link-down balance");
assert(link.frames[48].messages.some((line) => line.includes("own roof")), "link-down message");

const dust = compare({ dust: 0.7, dustFrom: 0, dustTo: 96 });
assert(dust.coordinated.totals.solarKwh < base.coordinated.totals.solarKwh, "dust reduces solar");
assert(dust.coordinated.totals.solarKwh === dust.independent.totals.solarKwh, "dust is the same in both layouts");

const peak = simulate({ acCount: 4, acKw: 1.3, loads: { "homes-ac": true } }, "coordinated");
const quiet = simulate({ acCount: 0 }, "coordinated");
assert(peak.frames[52].buildings.find((building) => building.id === "homes").dem > quiet.frames[52].buildings.find((building) => building.id === "homes").dem + 3, "four air conditioners raise residential demand");

const schoolBuilding = BUILDINGS.find((item) => item.id === "school");
const clinicBuilding = BUILDINGS.find((item) => item.id === "clinic");
const ordinary = powerAt(schoolBuilding, 32, normalize({}));
const doubled = powerAt(schoolBuilding, 32, normalize({ flexDemand: 2 }));
const clinicBase = powerAt(clinicBuilding, 32, normalize({}));
const clinicFlex = powerAt(clinicBuilding, 32, normalize({ flexDemand: 2 }));
assert(doubled.flex > ordinary.flex + 0.4, "flexible demand raises ordinary school load");
assert(Math.abs(doubled.critical - ordinary.critical) < 1e-9, "flexible demand leaves essential school lighting unchanged");
assert(Math.abs(clinicFlex.critical - clinicBase.critical) < 1e-9, "flexible demand leaves clinic essential loads unchanged");

const held = simulate({ sun: 0, soc0: 0.4, socMin: 0.4, backupOn: false }, "coordinated");
const drawn = simulate({ sun: 0, soc0: 0.4, socMin: 0, backupOn: false }, "coordinated");
assert(held.frames.every((frame) => frame.socKwh >= 0.4 * 28 - 0.05), "reserve floor holds the battery");
assert(held.totals.dischargeKwh < 0.05, "a full reserve floor blocks discharge");
assert(drawn.totals.dischargeKwh > 1, "lowering the floor allows discharge of stored energy");

const dark = simulate({ sun: 0, soc0: 0, backupOn: false, flexDemand: 1 }, "coordinated");
assert(dark.totals.maxImbalance < TOLERANCE, "an empty supply still balances");
assert(dark.totals.solarKwh === 0 && dark.totals.backupKwh === 0 && dark.totals.dischargeKwh < 0.05, "no sun, no reserve and no backup create no supply");
assert(dark.totals.unmetKwh > 10, "demand stays unmet when nothing can supply it");
assert(dark.frames.every((frame) => frame.cables.every((cable) => cable.kw < 0.05)), "empty supply does not animate cable flow");

const account = dayAccount(base.coordinated);
assert(Math.abs(account.essentialServedKwh + account.essentialUnmetKwh - account.essentialDemandKwh) < 0.02, "essential served plus essential unmet is the essential demand");
assert(Math.abs(account.servedKwh + base.coordinated.totals.unmetKwh - base.coordinated.totals.demandKwh) < 0.02, "served plus unmet is the demand");

const waterCut = simulate({ fault: "artery-water", tie: true, sun: 0.4, backupOn: false }, "coordinated");
assert(waterCut.frames.every((frame) => {
  const cable = frame.cables.find((item) => item.id === "artery-water");
  return cable.kw === 0 && cable.dir === 0 && cable.faulted === true;
}), "an isolated water artery carries no power");
assert(buildingServedKwh(waterCut, "water") > 0, "the water facility can still use its own roof");
const homesCut = simulate({ fault: "artery-homes", tie: true, sun: 0.4, soc0: 0.8, backupOn: false }, "coordinated");
const homesAlone = simulate({ fault: "artery-homes", tie: true, sun: 0.4, soc0: 0.8, backupOn: false }, "independent");
assert(homesCut.frames.some((frame) => frame.cables.find((cable) => cable.id === "tie-hs").kw > 0.2), "the spare route carries power after the homes artery opens");
assert(buildingServedKwh(homesCut, "homes") > 0 && buildingServedKwh(homesAlone, "homes") > 0, "both strategies still serve some homes energy from the same starting charge");

const restored = normalize(defaultScenario());
const edited = normalize({ fault: "artery-clinic", soc0: 0.15, flexDemand: 2.2, sun: 0.25, socMin: 0.35 });
assert(restored.fault === "" && restored.soc0 === 0.55 && restored.flexDemand === 1 && restored.sun === 1 && restored.socMin === 0.1, "reset returns the documented starting day");
assert(edited.fault === "artery-clinic" && edited.flexDemand === 2.2 && edited.soc0 === 0.15 && edited.socMin === 0.35, "the fault, reserve and flexible-demand controls reach the model");

if (process.exitCode) process.exit(process.exitCode);
console.log("nabd heart tests passed");
console.log(JSON.stringify({
  solar: base.coordinated.totals.solarKwh,
  shared: base.coordinated.totals.sharedKwh,
  unmetShared: base.coordinated.totals.unmetKwh,
  unmetAlone: base.independent.totals.unmetKwh,
  essentialShared: base.coordinated.totals.essentialUnmetKwh,
  essentialAlone: base.independent.totals.essentialUnmetKwh,
  backupShared: base.coordinated.totals.backupKwh,
  backupAlone: base.independent.totals.backupKwh,
  search: base.search,
  balance: base.coordinated.totals.maxImbalance,
}, null, 2));
