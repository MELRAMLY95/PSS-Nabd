import { useMemo, useState } from "react";
import {
  AQUA_SOURCES,
  CASCADE_ITEMS,
  CROPS,
  PLANS,
  RESILIA_ROADS,
  aquaLoop,
  atmosSense,
  crisisPair,
  harvestLoop,
  regenCascade,
  resiliaPlan,
  thermoShield,
} from "./labScience.js";

function Fold({ title, children }) {
  return (
    <details className="lab-fold">
      <summary>{title}</summary>
      <div className="lab-plan">{children}</div>
    </details>
  );
}

function Line({ label, value }) {
  return <p className="lab-compare"><b>{label}. </b>{value}</p>;
}

export function JudgeBrief({ id, onCrisis }) {
  const plan = PLANS[id];
  return (
    <div className="lab-plan">
      <p>{plan.judge.opening}</p>
      <Line label="Being tested" value={plan.feature} />
      <Line label="Limit" value={plan.limits} />
      {plan.judge.questions.map(([question, answer]) => (
        <p key={question}><b>{question} </b>{answer}</p>
      ))}
      {id === "brain" && onCrisis ? (
        <button type="button" className="lab-text-button" onClick={onCrisis}>Open the crisis challenge</button>
      ) : null}
    </div>
  );
}

export function PlanFolds({ id }) {
  const plan = PLANS[id];
  const physical = plan.physical;
  const experiment = plan.experiment;
  return (
    <>
      <Fold title="What is being tested">{plan.feature}</Fold>
      <Fold title="Physical demonstration">
        <Line label="Name" value={physical.name} />
        <Line label="Purpose" value={physical.purpose} />
        <Line label="What a judge sees" value={physical.see} />
        <table className="lab-sheet">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Purpose</th><th>Need</th><th>Alternative</th><th>Cost</th></tr>
          </thead>
          <tbody>
            {physical.materials.map((row) => (
              <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
        <p>Construction</p>
        <ol>{physical.build.map((step) => <li key={step}>{step}</li>)}</ol>
        <p>Demonstration</p>
        <ol>{physical.procedure.map((step) => <li key={step}>{step}</li>)}</ol>
        <Line label="Judge can" value={physical.judge.join(" ")} />
        <Line label="Safety" value={physical.safety.join(" ")} />
        <Line label="If parts are missing" value={physical.fallback} />
        <p>This is a proposed build. It is not a prototype already on the table unless you have built it.</p>
      </Fold>
      <Fold title="Experiment sheet">
        <Line label="Question" value={experiment.question} />
        <Line label="Independent variable" value={experiment.independent} />
        <Line label="Dependent variables" value={experiment.dependent} />
        <Line label="Controlled" value={experiment.controlled} />
        <Line label="Baseline" value={experiment.baseline} />
        <Line label="Proposed" value={experiment.proposed} />
        <Line label="Success" value={experiment.success} />
        <Line label="Error sources" value={experiment.errors} />
        <table className="lab-sheet">
          <thead>
            <tr><th>Trial</th><th>Condition</th><th>Measurement</th><th>Observation</th><th>Note</th></tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((trial) => (
              <tr key={trial}><td>{trial}</td><td /><td /><td /><td>Empty until a trial is run.</td></tr>
            ))}
          </tbody>
        </table>
        <p>No measured exhibition trial is stored in this build. Digital outputs above are simulated.</p>
      </Fold>
      <Fold title="Limitations">{plan.limits}</Fold>
    </>
  );
}

function AquaExtra() {
  const [capacity, setCapacity] = useState(10);
  const [salinity, setSalinity] = useState(45);
  const gated = aquaLoop({ sources: AQUA_SOURCES, capacity, salinityMax: salinity / 100, mode: "gated" });
  const volume = aquaLoop({ sources: AQUA_SOURCES, capacity, salinityMax: salinity / 100, mode: "volume" });
  return (
    <div className="lab-extra">
      <h4>Quality gate</h4>
      <p className="lab-compare">Litres are a scenario, not a plant record. Sanitary flow is never irrigation. High salinity is held only up to the treatment capacity, and that hold is not called reuse.</p>
      <label className="lab-range"><span>Treatment hold<b>{capacity} L</b></span><input type="range" min={0} max={40} value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} /></label>
      <label className="lab-range"><span>Irrigation salinity limit<b>{(salinity / 100).toFixed(2)}</b></span><input type="range" min={10} max={90} value={salinity} onChange={(event) => setSalinity(Number(event.target.value))} /></label>
      <ul>{gated.rows.map((row) => <li key={row.id}>{row.name}: {row.litres} L to {row.to}.</li>)}</ul>
      <p className="lab-compare">Gated irrigation {gated.irrigation} L, hold {gated.further} L, reject {gated.rejected} L. Volume-only sends {volume.irrigation} L to irrigation and breaks the rule for {volume.violations} L. Balance error {gated.imbalance.toFixed(2)} L.</p>
    </div>
  );
}

function CascadeExtra() {
  const [capacity, setCapacity] = useState(12);
  const [dirt, setDirt] = useState(55);
  const items = CASCADE_ITEMS.map((item) => (item.id === "plastic" ? { ...item, contamination: dirt / 100 } : item));
  const gated = regenCascade({ items, capacity, mode: "gated" });
  const category = regenCascade({ items, capacity, mode: "category" });
  return (
    <div className="lab-extra">
      <h4>Contamination gate</h4>
      <p className="lab-compare">Kilograms are a teaching set. Recovery is not the same as sorting. The solvent bottle never enters recovery.</p>
      <label className="lab-range"><span>Recovery capacity<b>{capacity} kg</b></span><input type="range" min={0} max={20} value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} /></label>
      <label className="lab-range"><span>Plastic contamination<b>{dirt}%</b></span><input type="range" min={0} max={100} value={dirt} onChange={(event) => setDirt(Number(event.target.value))} /></label>
      <p className="lab-compare">Gate recovers {gated.recovered} kg with {gated.contaminationIn} kg contaminated. Category sort recovers {category.recovered} kg and lets {category.contaminationIn} kg of contaminated material in. Hazard {gated.hazard} kg. Unaccounted {gated.imbalance.toFixed(2)} kg.</p>
    </div>
  );
}

function ThermoExtra() {
  const [outdoor, setOutdoor] = useState(38);
  const [sun, setSun] = useState(70);
  const [power, setPower] = useState(1);
  const adaptive = thermoShield({ outdoor, sun, powerAvailable: power, mode: "adaptive" });
  const fixed = thermoShield({ outdoor, sun, powerAvailable: power, mode: "fixed" });
  return (
    <div className="lab-extra">
      <h4>Passive-first shell</h4>
      <p className="lab-compare">The indoor number is a model index, not a measured room. Ventilation is used only when outdoor air is 30 or below and cooler than the model.</p>
      <label className="lab-range"><span>Outdoor<b>{outdoor}</b></span><input type="range" min={20} max={48} value={outdoor} onChange={(event) => setOutdoor(Number(event.target.value))} /></label>
      <label className="lab-range"><span>Sun<b>{sun}</b></span><input type="range" min={0} max={100} value={sun} onChange={(event) => setSun(Number(event.target.value))} /></label>
      <label className="lab-range"><span>Power available<b>{power} kW</b></span><input type="range" min={0} max={3} value={power} onChange={(event) => setPower(Number(event.target.value))} /></label>
      <p className="lab-compare">Adaptive indoor {adaptive.indoor}, shade {adaptive.shade ? "on" : "off"}, vent {adaptive.vent ? "on" : "off"}, power {adaptive.powered} kW. Fixed indoor {fixed.indoor}, power {fixed.powered} kW, no shade.</p>
    </div>
  );
}

function HarvestExtra() {
  const [water, setWater] = useState(20);
  const [salinity, setSalinity] = useState(50);
  const feasible = harvestLoop({ water, salinity: salinity / 100, mode: "feasible" });
  const fixed = harvestLoop({ water, salinity: salinity / 100, mode: "fixed" });
  return (
    <div className="lab-extra">
      <h4>Crop constraint</h4>
      <p className="lab-compare">Three assumed crops. Yield is an index, not a harvest. {CROPS.map((crop) => `${crop.name} needs ${crop.water} L and salinity at or below ${crop.salinityMax}`).join(". ")}.</p>
      <label className="lab-range"><span>Water<b>{water} L</b></span><input type="range" min={0} max={40} value={water} onChange={(event) => setWater(Number(event.target.value))} /></label>
      <label className="lab-range"><span>Salinity<b>{(salinity / 100).toFixed(2)}</b></span><input type="range" min={0} max={90} value={salinity} onChange={(event) => setSalinity(Number(event.target.value))} /></label>
      <p className="lab-compare">Feasible choice: {feasible.name}, water used {feasible.waterUsed} L, yield index {feasible.yieldIndex}. Fixed tomato {fixed.violation ? "breaks a limit" : "fits"} and would use {fixed.waterUsed} L.</p>
    </div>
  );
}

function RoadExtra() {
  const [budget, setBudget] = useState(5);
  const cheap = resiliaPlan({ budget, mode: "count" });
  const essential = resiliaPlan({ budget, mode: "essential" });
  return (
    <div className="lab-extra">
      <h4>Essential access</h4>
      <p className="lab-compare">Links: {RESILIA_ROADS.map((road) => `${road.id} ${road.vulnerable ? `vulnerable ${road.cost}` : "stays open"}`).join("; ")}. Costs are teaching units.</p>
      <label className="lab-range"><span>Budget<b>{budget}</b></span><input type="range" min={0} max={13} value={budget} onChange={(event) => setBudget(Number(event.target.value))} /></label>
      <p className="lab-compare">Cheapest roads protect {cheap.protected.join(", ") || "nothing"} and the clinic is {cheap.access.clinic ? "reachable" : "cut off"}. Essential rule protects {essential.protected.join(", ") || "nothing"} and the clinic is {essential.access.clinic ? "reachable" : "cut off"}. Water is {essential.access.water ? "reachable" : "cut off"} under that rule.</p>
    </div>
  );
}

function AirExtra() {
  const [pm, setPm] = useState(120);
  const [wind, setWind] = useState("desert");
  const [spread, setSpread] = useState("wide");
  const context = atmosSense({ pm, wind, spread, mode: "context" });
  const threshold = atmosSense({ pm, wind, spread, mode: "threshold" });
  return (
    <div className="lab-extra">
      <h4>Reading and hypothesis</h4>
      <p className="lab-compare">80 is a model threshold, not an air-quality standard. A claim of dust or a nearby source is a hypothesis.</p>
      <label className="lab-range"><span>Reading<b>{pm}</b></span><input type="range" min={0} max={200} value={pm} onChange={(event) => setPm(Number(event.target.value))} /></label>
      <div className="lab-choice" role="group" aria-label="Wind">
        {["desert", "calm", "sea"].map((item) => (
          <button key={item} type="button" aria-pressed={wind === item} onClick={() => setWind(item)}>{item}</button>
        ))}
      </div>
      <div className="lab-choice" role="group" aria-label="Spread">
        {["wide", "local", "unknown"].map((item) => (
          <button key={item} type="button" aria-pressed={spread === item} onClick={() => setSpread(item)}>{item}</button>
        ))}
      </div>
      <p className="lab-compare">Context says {context.claim}. {context.hypothesis} Threshold says {threshold.claim}.</p>
    </div>
  );
}

const EXTRAS = {
  kidneys: AquaExtra,
  liver: CascadeExtra,
  skin: ThermoExtra,
  digestive: HarvestExtra,
  skeleton: RoadExtra,
  lungs: AirExtra,
};

export function ExtraSim({ id }) {
  const Panel = EXTRAS[id];
  return Panel ? <Panel /> : null;
}

export function useCrisisState() {
  const [heat, setHeat] = useState(2);
  const [solar, setSolar] = useState(20);
  const [soc, setSoc] = useState(10);
  const [water, setWater] = useState(50);
  const [budget, setBudget] = useState(5);
  const [spread, setSpread] = useState("wide");
  const pair = useMemo(() => crisisPair({
    heat,
    solar: solar / 100,
    soc: soc / 100,
    water: water / 100,
    budget,
    air: { pm: 120, wind: "desert", spread },
  }), [heat, solar, soc, water, budget, spread]);
  function reset() {
    setHeat(2);
    setSolar(20);
    setSoc(10);
    setWater(50);
    setBudget(5);
    setSpread("wide");
  }
  return { heat, setHeat, solar, setSolar, soc, setSoc, water, setWater, budget, setBudget, spread, setSpread, pair, reset };
}

export function CrisisControls({ crisis }) {
  return (
    <>
      <div className="lab-choice" role="group" aria-label="Heat">
        {[0, 1, 2].map((value) => (
          <button key={value} type="button" aria-pressed={crisis.heat === value} onClick={() => crisis.setHeat(value)}>{value === 0 ? "Mild" : value === 1 ? "Hot" : "Heatwave"}</button>
        ))}
      </div>
      <label className="lab-range"><span>Solar<b>{crisis.solar}%</b></span><input type="range" min={0} max={100} value={crisis.solar} onChange={(event) => crisis.setSolar(Number(event.target.value))} /></label>
      <label className="lab-range"><span>Battery reserve<b>{crisis.soc}%</b></span><input type="range" min={0} max={100} value={crisis.soc} onChange={(event) => crisis.setSoc(Number(event.target.value))} /></label>
      <label className="lab-range"><span>Water available<b>{crisis.water}%</b></span><input type="range" min={0} max={100} value={crisis.water} onChange={(event) => crisis.setWater(Number(event.target.value))} /></label>
      <label className="lab-range"><span>Road budget<b>{crisis.budget}</b></span><input type="range" min={0} max={13} value={crisis.budget} onChange={(event) => crisis.setBudget(Number(event.target.value))} /></label>
      <div className="lab-choice" role="group" aria-label="Air pattern">
        {["wide", "local", "unknown"].map((item) => (
          <button key={item} type="button" aria-pressed={crisis.spread === item} onClick={() => crisis.setSpread(item)}>{item}</button>
        ))}
      </div>
    </>
  );
}

export function CrisisTable({ pair }) {
  const fixed = pair.fixed;
  const coordinated = pair.coordinated;
  return (
    <>
      <table className="lab-sheet">
        <thead>
          <tr><th>Result</th><th>Independent roofs</th><th>Coordinated heart</th></tr>
        </thead>
        <tbody>
          <tr><td>Solar generated</td><td>{fixed.heart.solarKwh.toFixed(1)} kWh</td><td>{coordinated.heart.solarKwh.toFixed(1)} kWh</td></tr>
          <tr><td>Unmet energy</td><td>{fixed.heart.unmetKwh.toFixed(1)} kWh</td><td>{coordinated.heart.unmetKwh.toFixed(1)} kWh</td></tr>
          <tr><td>Essential unmet</td><td>{fixed.heart.essentialUnmetKwh.toFixed(1)} kWh</td><td>{coordinated.heart.essentialUnmetKwh.toFixed(1)} kWh</td></tr>
          <tr><td>Irrigation</td><td>{fixed.aqua.irrigation} L</td><td>{coordinated.aqua.irrigation} L</td></tr>
          <tr><td>Quality-rule litres</td><td>{fixed.aqua.violations} L broken</td><td>{coordinated.aqua.violations} L broken</td></tr>
          <tr><td>Crop</td><td>{fixed.harvest.name}</td><td>{coordinated.harvest.name}</td></tr>
          <tr><td>Clinic road</td><td>{fixed.roads.access.clinic ? "Reachable" : "Cut off"}</td><td>{coordinated.roads.access.clinic ? "Reachable" : "Cut off"}</td></tr>
          <tr><td>Recovered material</td><td>{fixed.materials.recovered} kg</td><td>{coordinated.materials.recovered} kg</td></tr>
          <tr><td>Contamination in recovery</td><td>{fixed.materials.contaminationIn} kg</td><td>{coordinated.materials.contaminationIn} kg</td></tr>
          <tr><td>Air reading</td><td>{fixed.air.claim}</td><td>{coordinated.air.claim}</td></tr>
          <tr><td>Model indoor</td><td>{fixed.thermal.indoor}</td><td>{coordinated.thermal.indoor}</td></tr>
        </tbody>
      </table>
      <p className="lab-compare">Independent notes: {fixed.violations.join(" ") || "No stated rule was broken."}</p>
      <p className="lab-compare">Coordinated notes: {coordinated.violations.join(" ") || "No stated rule was broken."}</p>
      <p className="lab-compare">Energy is the heart’s 24-hour account with backup off, a 28 kWh battery, and cooling units equal to twice the heat level. Both columns use that same day. Shade and the indoor figure stay a separate model, not extra electricity.</p>
    </>
  );
}

export function CrisisPanel({ crisis }) {
  return (
    <article className="lab-board">
      <p className="lab-board-kicker">Shared test</p>
      <h2>NABD crisis challenge</h2>
      <p className="lab-board-note">The same constraints as the brain board. Not a forecast, and not a measured emergency. The heart does not create electricity. Water, material and roads are not created either.</p>
      <CrisisControls crisis={crisis} />
      <button type="button" className="lab-text-button" onClick={crisis.reset}>Reset</button>
      <CrisisTable pair={crisis.pair} />
    </article>
  );
}
