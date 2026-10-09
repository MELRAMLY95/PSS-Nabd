const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

export const SYSTEMS = ["brain", "heart", "lungs", "kidneys", "liver", "skin", "digestive", "skeleton", "blood"];

export const INITIAL = {
  temperature: 74,
  sun: 62,
  waterDemand: 64,
  energyDemand: 58,
  airQuality: 46,
  dust: 42,
  humidity: 34,
  contamination: 48,
  wasteMix: 60,
  structuralLoad: 40,
  airflow: 48,
  hour: 14,
  orientation: 68,
  systems: Object.fromEntries(SYSTEMS.map((id) => [id, false])),
};

export function simulate(input) {
  const systems = { ...INITIAL.systems, ...input.systems };
  const temperature = input.temperature;
  const sun = input.sun;
  const hour = input.hour;
  const day = hour >= 10 && hour <= 16 ? 1.12 : hour <= 6 || hour >= 19 ? 0.78 : 1;
  const exposure = 0.55 + input.orientation / 220;

  let heatLoad = temperature * 0.62 + sun * exposure * 0.38 * day;
  if (systems.skin) heatLoad *= temperature >= 60 ? 0.58 : 0.84;
  heatLoad = clamp(heatLoad);

  let coolingDemand = clamp(heatLoad * 0.78 + Math.max(0, temperature - 45) * 0.22);
  let energyNeed = input.energyDemand * 0.62 + coolingDemand * 0.55;
  if (systems.kidneys) energyNeed += 8;
  if (systems.brain) {
    energyNeed *= 0.86;
    coolingDemand = clamp(coolingDemand * 0.9);
  }
  energyNeed = clamp(energyNeed);

  const generation = clamp(20 + sun * 0.52);
  let shortage = Math.max(0, energyNeed - generation);
  const surplus = Math.max(0, generation - energyNeed);
  let storage = 0;
  if (systems.heart) {
    storage = clamp(surplus * 0.75);
    const relief = Math.min(shortage, 12 + surplus * 0.45);
    shortage = clamp(shortage - relief);
  } else {
    shortage = clamp(shortage);
  }
  if (systems.blood) {
    shortage = clamp(shortage - Math.min(shortage, 10));
  }

  const selectivity = systems.kidneys ? 0.42 + (100 - input.contamination) / 280 : 0.1;
  const recoveredWater = clamp(input.waterDemand * selectivity);
  const waterGap = clamp(input.waterDemand - recoveredWater);

  let exchange = input.airQuality * 0.45 + input.airflow * 0.4 - input.dust * 0.32 - Math.max(0, input.humidity - 40) * 0.15;
  if (systems.lungs) exchange += 16;
  exchange = clamp(exchange);

  let recoveredMaterial = systems.liver ? input.wasteMix * 0.58 : input.wasteMix * 0.12;
  if (systems.digestive) recoveredMaterial += input.wasteMix * 0.16;
  recoveredMaterial = clamp(recoveredMaterial);
  const disposed = clamp(input.wasteMix - recoveredMaterial);

  let structuralStress = input.structuralLoad * (1 + temperature / 260);
  if (systems.skeleton) structuralStress *= 0.7;
  structuralStress = clamp(structuralStress);

  const resilience = clamp(
    ((100 - heatLoad) + (100 - shortage) + (100 - waterGap) + exchange + (100 - disposed) + (100 - structuralStress)) / 6,
  );

  let state = "STRESSED";
  if (resilience >= 76) state = "RESILIENT";
  else if (resilience >= 64) state = "RECOVERING";
  else if (resilience >= 52) state = "ADAPTING";
  else if (resilience >= 42) state = "STABLE";

  const chain = [];
  if (temperature >= 65) chain.push("Heat in this scenario is high, so thermal stress rises before any invention is credited.");
  if (systems.skin && temperature >= 60) chain.push("The adaptive-skin concept is on, so less of that heat is treated as indoor cooling load.");
  else if (temperature >= 65) chain.push("The façade concept is off, so heat passes through into cooling demand.");
  if (coolingDemand >= 48) chain.push("Cooling demand is now pulling on the energy network.");
  if (systems.brain) chain.push("The intelligence concept anticipates the spike and softens peak demand. It does not create energy.");
  if (generation >= energyNeed && sun >= 55) chain.push("In this sunny scenario the model has more supply than immediate demand.");
  if (systems.heart && shortage <= 18) chain.push("Circulation stores surplus and shifts it toward the stressed demand.");
  if (systems.heart && shortage > 18) chain.push("Circulation prioritises critical demand, and a gap still remains.");
  if (!systems.heart && shortage >= 20) chain.push("Without a circulation concept, the shortage stays where it appears.");
  if (systems.blood) chain.push("Blood-inspired circulation treats water, energy and recovered material as one flow toward the stressed demand. It does not create the resource.");
  else if (shortage >= 24) chain.push("The streams are still planned apart, so a shortage in one place does not call on the others.");
  if (systems.kidneys) chain.push("Selective recovery returns water in the model, and it spends a little energy to do so.");
  else if (waterGap >= 40) chain.push("Most of the water demand is still unmet by recovery.");
  if (systems.lungs) chain.push("The exchange concept uses more surface and flow, so fouled air is handled more readily in the model.");
  else if (input.dust >= 50 || input.airQuality <= 40) chain.push("Dust and poor air are left to a passive exchange.");
  if (systems.liver) chain.push("The waste stream is split: some is routed to recovery, the rest stays a disposal stream.");
  if (systems.digestive) chain.push("Organic material is pulled into a second recovery loop instead of leaving with the mixed waste.");
  if (systems.skeleton) chain.push("Structural load is spread, so the same stress reads lower in the model.");
  else if (structuralStress >= 55) chain.push("Load is concentrating. The model has no strategy yet for sharing it.");

  return {
    heatLoad,
    coolingDemand,
    energyNeed,
    generation,
    shortage,
    flow: clamp(100 - shortage),
    surplus: clamp(surplus),
    storage,
    recoveredWater,
    waterGap,
    exchange,
    recoveredMaterial,
    disposed,
    structuralStress,
    resilience,
    state,
    chain,
  };
}
