/** Concept model for the Living Oman 2040 exhibition.
 * Indices are unitless 0–100 outputs of these rules. They are not field measurements.
 */

export const clamp = (n, a = 0, b = 100) => Math.min(b, Math.max(a, Number(n) || 0));

export const BASELINE = {
  waterDemand: 46,
  energyDemand: 44,
  heat: 40,
  wasteIn: 36,
  recovery: 42,
  renewable: 34,
  storage: 28,
  distribution: 38,
  efficiency: 40,
  consumptionCut: 0,
  innovation: 18,
};

export const ACTION_EFFECTS = {
  recovery: (s) => ({ ...s, recovery: clamp(s.recovery + 26) }),
  renewable: (s) => ({ ...s, renewable: clamp(s.renewable + 26) }),
  reduce: (s) => ({ ...s, consumptionCut: clamp(s.consumptionCut + 22) }),
  efficiency: (s) => ({ ...s, efficiency: clamp(s.efficiency + 18) }),
  storage: (s) => ({ ...s, storage: clamp(s.storage + 24) }),
  distribution: (s) => ({ ...s, distribution: clamp(s.distribution + 22) }),
  innovation: (s) => ({
    ...s,
    innovation: clamp(s.innovation + 20),
    energyDemand: clamp(s.energyDemand + 8),
  }),
};

export function withScenario(inputs, shock) {
  if (!shock) return { ...inputs };
  const next = { ...inputs };
  for (const [key, delta] of Object.entries(shock)) {
    next[key] = clamp((next[key] ?? 0) + delta);
  }
  return next;
}

export function withActions(inputs, ids) {
  return ids.reduce((state, id) => {
    const apply = ACTION_EFFECTS[id];
    return apply ? apply(state) : state;
  }, { ...inputs });
}

export function derive(inputs) {
  const demandWater = inputs.waterDemand * (1 - inputs.consumptionCut / 165);
  const demandEnergy = inputs.energyDemand * (1 - inputs.consumptionCut / 200);

  const recoveredWater = inputs.recovery * 0.46;
  const recoveryEnergyCost = inputs.recovery * 0.22;

  const heatWater = Math.max(0, inputs.heat - 32) * 0.48;
  const heatEnergy = Math.max(0, inputs.heat - 32) * 0.62;

  const buffer = inputs.storage * 0.18;

  const water = clamp(
    86 - demandWater * 0.74 + recoveredWater - heatWater + buffer * 0.85 + inputs.efficiency * 0.05,
  );

  const energy = clamp(
    90 -
      demandEnergy * 0.7 +
      inputs.renewable * 0.46 -
      recoveryEnergyCost -
      heatEnergy +
      inputs.efficiency * 0.12 +
      inputs.distribution * 0.06 -
      inputs.storage * 0.045,
  );

  const waste = clamp(
    16 +
      inputs.wasteIn * 0.9 -
      inputs.recovery * 0.34 -
      inputs.innovation * 0.16 -
      inputs.efficiency * 0.07,
  );

  const materials = clamp(
    46 +
      inputs.recovery * 0.26 +
      inputs.innovation * 0.18 +
      inputs.efficiency * 0.07 -
      inputs.wasteIn * 0.2 -
      demandWater * 0.05,
  );

  const air = clamp(
    84 -
      inputs.wasteIn * 0.34 -
      Math.max(0, inputs.heat - 36) * 0.32 +
      inputs.efficiency * 0.1 +
      inputs.distribution * 0.05,
  );

  const shortage =
    Math.max(0, 60 - water) * 0.5 +
    Math.max(0, 58 - energy) * 0.42 +
    Math.max(0, waste - 58) * 0.22;

  const service = clamp(
    93 -
      inputs.consumptionCut * 0.78 -
      shortage +
      inputs.distribution * 0.08 +
      inputs.efficiency * 0.04,
  );

  const pressure = {
    water: Math.max(0, 76 - water),
    energy: Math.max(0, 72 - energy),
    air: Math.max(0, 70 - air) * 0.9,
    materials: Math.max(0, 56 - materials) * 0.85,
    service: Math.max(0, 78 - service) * 0.85,
    waste: Math.max(0, waste - 36) * 1.2,
    heat: Math.max(0, inputs.heat - 42) * 0.9,
  };
  const worst = Math.max(...Object.values(pressure));
  const load = Object.values(pressure).reduce((sum, value) => sum + value, 0);
  const stress = clamp(
    worst * 0.82 + load * 0.26 - inputs.distribution * 0.04 - inputs.innovation * 0.03,
  );

  const resilience = clamp(
    inputs.recovery * 0.16 +
      inputs.storage * 0.13 +
      inputs.renewable * 0.16 +
      inputs.distribution * 0.13 +
      inputs.efficiency * 0.11 +
      inputs.innovation * 0.15 +
      (100 - stress) * 0.2,
  );

  return {
    water,
    energy,
    air,
    materials,
    waste,
    service,
    stress,
    resilience,
    heat: inputs.heat,
    phase: phaseFor(stress, resilience, inputs, worst),
    recovery: inputs.recovery,
    renewable: inputs.renewable,
  };
}

export function phaseFor(stress, resilience, inputs, worst = 0) {
  const effort =
    (inputs?.recovery ?? 0) +
    (inputs?.efficiency ?? 0) +
    (inputs?.renewable ?? 0) +
    (inputs?.innovation ?? 0);
  const acting = effort > 42 + 40 + 34 + 18 + 12;
  if (stress >= 78 || worst >= 50) return "critical";
  if (worst >= 24 || stress >= 56) return "stressed";
  if (acting && (worst >= 14 || stress >= 38)) return "recovering";
  if (stress <= 30 && worst <= 12 && resilience >= 58) return "thriving";
  return "resilient";
}

const TRACKED = ["water", "energy", "air", "materials", "waste", "service", "stress", "resilience", "heat"];

export function approach(current, target, rate, inputs) {
  const next = { ...target };
  for (const key of TRACKED) {
    const from = current?.[key];
    next[key] = from == null ? target[key] : from + (target[key] - from) * rate;
  }
  next.phase = phaseFor(next.stress, next.resilience, inputs, 0);
  return next;
}

export function organLoads(state, inputs) {
  return {
    brain: clamp(26 + state.stress * 0.48),
    heart: clamp(20 + (100 - state.energy) * 0.38 + Math.max(0, state.heat - 36) * 0.45),
    lungs: clamp(16 + (100 - state.air) * 0.72),
    kidneys: clamp(18 + (100 - state.water) * 0.42 + (inputs?.recovery ?? 0) * 0.28),
    liver: clamp(14 + state.waste * 0.7),
    skin: clamp(state.heat),
  };
}

export function pulse(state, tick) {
  const wobble = (amp, phase) => Math.sin(tick * 0.65 + phase) * amp;
  return {
    ...state,
    water: clamp(state.water + wobble(1.35, 0.2)),
    energy: clamp(state.energy + wobble(1.2, 1.1)),
    air: clamp(state.air + wobble(0.9, 2)),
    materials: clamp(state.materials + wobble(0.75, 2.5)),
    waste: clamp(state.waste + wobble(0.65, 0.5)),
    heat: clamp(state.heat + wobble(0.55, 1.6)),
  };
}

export function sameInputs(a, b) {
  return Object.keys(BASELINE).every((key) => a[key] === b[key]);
}

export function narrate(before, after, actionIds) {
  if (!actionIds.length) {
    return ["No intervention yet. The figures show the scenario acting on the current reference."];
  }

  const lines = [];
  const water = after.water - before.water;
  const energy = after.energy - before.energy;
  const waste = after.waste - before.waste;
  const service = after.service - before.service;
  const stress = after.stress - before.stress;
  const resilience = after.resilience - before.resilience;

  if (water > 3) lines.push("Water availability rises. More of the flow stays in circulation.");
  if (water < -3) lines.push("Water availability falls. The response asks more of the reserve than it returns.");
  if (energy > 3) lines.push("Energy available to run the system increases.");
  if (energy < -3) lines.push("Energy available falls. Some other part of the system is drawing on it.");
  if (waste < -3) lines.push("Waste burden eases. Material that would have been discarded stays useful.");
  if (waste > 3) lines.push("Waste burden grows. This choice does not transform what the system throws off.");
  if (service < -4) lines.push("Less of the demand is met. Reserves are protected by asking people to take less.");
  if (stress > 4) lines.push("Stress rises. The choice does not match the pressure in front of you.");
  if (stress < -4) lines.push("Stress eases. The balance is moving back into a range the model can hold.");
  if (Math.abs(stress) <= 4) lines.push("Stress barely moves. Against this pressure, the choice is doing little.");
  if (actionIds.includes("recovery") && energy < -1) {
    lines.push("Recovery returns what is useful, and filtration draws energy to do it.");
  }
  if (actionIds.includes("storage") && waste > -2 && before.waste > 48) {
    lines.push("Storage can hold a resource. It does not turn waste back into something useful.");
  }
  if (actionIds.includes("innovation") && resilience > 2 && energy <= 1) {
    lines.push("Innovation lifts the capacity to adapt. The energy cost arrives before the ease does.");
  }
  if (actionIds.includes("renewable") && before.heat > 60 && after.heat > 60 && stress > -6) {
    lines.push("Added renewable energy feeds circulation. It does not remove the heat load itself.");
  }

  return lines.slice(0, 4);
}

export function couplingLine(state) {
  if (state.heat > 62 && state.energy < 62) {
    return "Heat is pulling energy out of circulation.";
  }
  if (state.recovery > 62 && state.energy < 60 && state.water > 62) {
    return "Recovery is holding water in the system, and the energy cost is visible.";
  }
  if (state.waste > 55 && state.materials < 52) {
    return "Waste is holding value the system has not yet recovered.";
  }
  if (state.service < 68 && state.water > 64) {
    return "Reserves look steadier because the system is meeting less demand.";
  }
  if (state.phase === "thriving" || state.phase === "resilient") {
    return "Circulation, recovery, and demand are inside a range this model can hold.";
  }
  if (state.phase === "recovering") {
    return "Pathways are working back toward balance. The load has not cleared.";
  }
  return "A change in one flow is moving the others.";
}

export function warnings(state) {
  const list = [];
  if (state.water < 58) list.push({ id: "water", text: "Water reserve is thin" });
  if (state.energy < 58) list.push({ id: "energy", text: "Energy circulation is short" });
  if (state.heat > 60) list.push({ id: "heat", text: "Heat load is high" });
  if (state.waste > 52) list.push({ id: "waste", text: "Waste is outrunning recovery" });
  if (state.air < 60) list.push({ id: "air", text: "Exchange is falling" });
  if (state.service < 66) list.push({ id: "service", text: "Demand is being met less fully" });
  return list;
}
