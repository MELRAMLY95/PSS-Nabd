import { useEffect, useMemo, useState } from "react";
import { BOARDS } from "./boardCopy.js";
import {
  LIVER_KEY,
  LIVER_STREAMS,
  LIVER_TOKENS,
  kidneyModel,
  kidneyPass,
  liverScore,
  lungLoad,
  lungModel,
  nourishRun,
  skeletonModel,
  skinHour,
  skinModel,
  stormFrame,
} from "./simModels.js";
import { Face, LabViewport } from "./LabViewport.jsx";
import { NabdGridPanel } from "./NabdGridPanel.jsx";
import { CrisisControls, CrisisTable, JudgeBrief, PlanFolds } from "./ExhibitExtras.jsx";
import {
  AQUA_SOURCES,
  CASCADE_ITEMS,
  CROPS,
  aquaLoop,
  atmosSense,
  harvestLoop,
  harvestTry,
  regenCascade,
  resiliaScene,
  thermoShield,
} from "./labScience.js";

function Fold({ title, children }) {
  return (
    <details className="lab-fold">
      <summary>{title}</summary>
      <p>{children}</p>
    </details>
  );
}

function Range({ label, value, min, max, unit, onChange }) {
  return (
    <label className="lab-range">
      <span>{label}<b>{value}{unit}</b></span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value}${unit}`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Meter({ label, value, max = 100, note }) {
  const width = Math.max(0, Math.min(100, (Number(value) / max) * 100));
  return (
    <div className="lab-meter">
      <span>{label}</span>
      <b style={{ "--fill": `${width}%` }} />
      <em>{value}</em>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function TestBar({ running, onStart, onReset, startLabel = "Start test" }) {
  return (
    <div className="lab-testbar">
      <button type="button" onClick={onStart} aria-pressed={running}>{running ? "Pause test" : startLabel}</button>
      <button type="button" onClick={onReset}>Reset</button>
    </div>
  );
}

function Delta({ label, value, base }) {
  const diff = value - base;
  const sign = diff > 0 ? "+" : "";
  return <p className="lab-compare">{label} {value}. Standard test {base} ({sign}{diff}).</p>;
}

function useSimClock(length, rest = length) {
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(rest);
  useEffect(() => {
    if (!running || tick >= length) return undefined;
    const id = setInterval(() => setTick((value) => Math.min(length, value + 1)), 480);
    return () => clearInterval(id);
  }, [running, tick, length]);
  useEffect(() => {
    if (running && tick >= length) setRunning(false);
  }, [running, tick, length]);
  function start() {
    if (running) {
      setRunning(false);
      return;
    }
    if (tick >= length || tick === rest) setTick(0);
    setRunning(true);
  }
  function reset() {
    setRunning(false);
    setTick(rest);
  }
  return { running, tick, start, reset };
}

function Choices({ label, value, options, onChange }) {
  return (
    <div className="lab-choice" role="group" aria-label={label}>
      {options.map(([id, text]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{text}</button>
      ))}
    </div>
  );
}

function BrainSim({ crisis }) {
  const [running, setRunning] = useState(false);
  const coordinated = crisis.pair.coordinated;
  const emergency = crisis.spread === "wide" ? "dust" : crisis.heat >= 2 ? "heat" : "water";
  const risks = {
    heat: Math.min(100, crisis.heat * 28 + (coordinated.thermal.above ? 24 : 8)),
    water: Math.min(100, 100 - crisis.water),
    energy: Math.min(100, coordinated.heart.essentialUnmetKwh * 5),
    air: crisis.spread === "unknown" ? 70 : crisis.spread === "wide" ? 55 : 25,
  };
  const alloc = {
    heat: coordinated.thermal.shade ? 4 : 1,
    water: coordinated.aqua.violations > 0 ? 0 : 3,
    energy: coordinated.heart.essentialUnmetKwh < 1 ? 4 : 1,
    air: coordinated.air.uncertain ? 0 : 2,
  };

  return (
    <div className={`lab-sim${running ? " is-on" : ""}`}>
      <LabViewport
        kind="brain"
        note={`Drag the hospital, the substation, the wadi post, or the clinic road. Click the school to change the air claim. Essential unmet ${coordinated.heart.essentialUnmetKwh.toFixed(1)} kWh. The clinic road is ${coordinated.roads.access.clinic ? "reachable" : "cut off"}.`}
        state={{
          emergency,
          severity: crisis.heat + 1,
          risks,
          alloc,
          outcome: Math.max(0, 100 - coordinated.violations.length * 15),
          remaining: crisis.budget,
          roadClosed: !coordinated.roads.access.clinic,
          account: coordinated.heart.essentialUnmetKwh,
          heat: crisis.heat,
          water: crisis.water,
          solar: crisis.solar,
          budget: crisis.budget,
          running,
        }}
        onAction={(action) => {
          if (action.type === "drag") {
            if (action.key === "heat") crisis.setHeat(action.value);
            if (action.key === "water") crisis.setWater(action.value);
            if (action.key === "solar") crisis.setSolar(action.value);
            if (action.key === "budget") crisis.setBudget(action.value);
            return;
          }
          if (action.type !== "give") return;
          if (action.key === "heat") crisis.setHeat((crisis.heat + 1) % 3);
          if (action.key === "water") crisis.setWater(crisis.water < 40 ? 80 : 20);
          if (action.key === "energy") crisis.setSolar(crisis.solar < 40 ? 100 : 15);
          if (action.key === "air") crisis.setSpread(crisis.spread === "wide" ? "local" : crisis.spread === "local" ? "unknown" : "wide");
        }}
      />
      <div className="lab-sim-controls">
        <CrisisControls crisis={crisis} />
        <TestBar running={running} onStart={() => setRunning((value) => !value)} onReset={() => { setRunning(false); crisis.reset(); }} />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <Face kicker="Essential unmet" value={coordinated.heart.essentialUnmetKwh.toFixed(1)} unit="kWh" detail="Same roofs and the same 28 kWh battery. Backup stays off." />
        <p className="lab-compare">This is the crisis account, not a separate score out of 12. Independent roofs are the baseline. Coordinated sharing uses the same roofs, the same 28 kWh battery and the same starting charge.</p>
        <CrisisTable pair={crisis.pair} />
      </div>
    </div>
  );
}

function KidneySim() {
  const [stages, setStages] = useState(2);
  const [flow, setFlow] = useState(55);
  const [condition, setCondition] = useState(80);
  const [scenario, setScenario] = useState("standard");
  const clock = useSimClock(12);
  const [capacity, setCapacity] = useState(30);
  const [salinity, setSalinity] = useState(45);
  const [gateMode, setGateMode] = useState("gated");
  const result = kidneyModel({ stages, flow, condition });
  const baseline = kidneyModel({ stages: 2, flow: 55, condition: 80 });
  const pass = kidneyPass({ stages, flow, condition, tick: clock.tick });
  const aqua = aquaLoop({ sources: AQUA_SOURCES, capacity, salinityMax: salinity / 100, mode: gateMode });
  const volume = aquaLoop({ sources: AQUA_SOURCES, capacity, salinityMax: salinity / 100, mode: "volume" });

  function reset() {
    clock.reset();
    setScenario("standard");
    setStages(2);
    setFlow(55);
    setCondition(80);
    setCapacity(30);
    setSalinity(45);
    setGateMode("gated");
  }

  return (
    <div className={`lab-sim${clock.running ? " is-on" : ""}`}>
      <LabViewport
        kind="kidneys"
        note={`Step ${clock.tick} of 12. Silt index in ${pass.inlet}, caught ${pass.caught}, still in the water ${pass.outlet}. Drag the pump, the inlet, or the cabinet. ${aqua.irrigation} L fit irrigation.`}
        state={{ stages, flow, condition, salinity, recovery: result.recovery, quality: result.quality, time: result.time, running: clock.running, gate: aqua, pass }}
        onAction={(action) => {
          if (action.type === "drag") {
            setScenario("");
            if (action.key === "flow") setFlow(action.value);
            if (action.key === "condition") setCondition(action.value);
            if (action.key === "salinity") setSalinity(action.value);
            return;
          }
          if (action.type === "stage") setStages(action.count);
          if (action.type === "gate") setGateMode(action.mode);
        }}
      />
      <div className="lab-sim-controls">
        <Choices
          label="Scenario"
          value={scenario}
          onChange={(id) => {
            setScenario(id);
            if (id === "standard") { setStages(2); setFlow(55); setCondition(80); }
            if (id === "slow") { setStages(3); setFlow(28); setCondition(95); }
            if (id === "worn") { setStages(1); setFlow(95); setCondition(20); }
          }}
          options={[["standard", "Standard pass"], ["slow", "Slow and clear"], ["worn", "Fast, worn filter"]]}
        />
        <Choices label="Quality rule" value={gateMode} onChange={setGateMode} options={[["gated", "Quality gate"], ["volume", "Volume only"]]} />
        <Choices
          label="Filtration stages"
          value={String(stages)}
          onChange={(value) => setStages(Number(value))}
          options={[["1", "1 stage"], ["2", "2 stages"], ["3", "3 stages"]]}
        />
        <Range label="Flow rate" value={flow} min={15} max={100} unit="" onChange={setFlow} />
        <Range label="Filter condition" value={condition} min={0} max={100} unit="" onChange={setCondition} />
        <Range label="Treatment hold" value={capacity} min={0} max={40} unit=" L" onChange={setCapacity} />
        <Range label="Salinity limit" value={salinity} min={10} max={90} unit="" onChange={setSalinity} />
        <TestBar running={clock.running} onStart={clock.start} onReset={reset} startLabel="Run the pass" />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <Face kicker="Silt still in the water" value={pass.outlet} detail={`Caught ${pass.caught} of ${pass.inlet}. This is an index, not a litre. Irrigation that passes the rule is ${aqua.irrigation} L.`} />
        <Delta label="Recovery" value={result.recovery} base={baseline.recovery} />
        <Meter label="Filter recovery" value={result.recovery} note="Index for the columns, not a volume" />
        <Meter label="Irrigation" value={aqua.irrigation} max={90} note="Litres that pass the quality rule" />
        <Meter label="Not reused" value={aqua.further + aqua.rejected} max={90} note="Held for more treatment, or rejected" />
        <p className="lab-compare">Same sources. Volume-only irrigation {volume.irrigation} L, with {volume.violations} L against the rule. Gated balance error {aqua.imbalance.toFixed(2)} L.</p>
      </div>
    </div>
  );
}

function LiverSim() {
  const [placed, setPlaced] = useState({});
  const [picked, setPicked] = useState(null);
  const [audited, setAudited] = useState(false);
  const [pace, setPace] = useState(40);
  const [capacity, setCapacity] = useState(12);
  const [dirt, setDirt] = useState(55);
  const [route, setRoute] = useState("gated");
  const score = liverScore(placed);
  const items = CASCADE_ITEMS.map((item) => (item.id === "plastic" ? { ...item, contamination: dirt / 100 } : item));
  const cascade = regenCascade({ items, capacity, mode: route });
  const category = regenCascade({ items, capacity, mode: "category" });
  const plastic = items.find((item) => item.id === "plastic");
  const plasticTo = (route === "gated" && plastic.contamination > 0.4) || capacity <= 0 ? "remainder" : "recover";

  function assign(stream) {
    if (!picked) return;
    setPlaced((current) => ({ ...current, [picked]: stream }));
    setPicked(null);
  }

  function reset() {
    setAudited(false);
    setPlaced({});
    setPicked(null);
    setPace(40);
    setCapacity(12);
    setDirt(55);
    setRoute("gated");
  }

  return (
    <div className="lab-sim">
      <LabViewport
        kind="liver"
        note={picked ? "That material is selected. Choose the stream it should enter." : `Plastic lot goes to ${plasticTo}. Recovered ${cascade.recovered} kg. Contamination inside recovery ${cascade.contaminationIn} kg.`}
        state={{ placed, picked, audited, contamination: score.contamination, pace, dirt, running: true, cascade: { plasticTo, contaminationIn: cascade.contaminationIn } }}
        onAction={(action) => {
          if (action.type === "drag" && action.key === "dirt") { setDirt(action.value); return; }
          if (action.type === "pick") setPicked(action.id);
          if (action.type === "assign") assign(action.stream);
          if (action.type === "plastic") setRoute((current) => (current === "gated" ? "category" : "gated"));
        }}
      />
      <div className="lab-sim-controls">
        <p className="lab-hint">{picked ? "Now choose the stream for that token." : "Select a token, then a stream. The pieces on the belt are the same tokens."}</p>
        <Range label="Belt pace" value={pace} min={8} max={80} unit="" onChange={setPace} />
        <Choices label="Plastic rule" value={route} onChange={setRoute} options={[["gated", "Contamination gate"], ["category", "Category only"]]} />
        <Range label="Recovery capacity" value={capacity} min={0} max={20} unit=" kg" onChange={setCapacity} />
        <Range label="Plastic contamination" value={dirt} min={0} max={100} unit="%" onChange={setDirt} />
        <div className="lab-tokens" role="list">
          {LIVER_TOKENS.filter((token) => !placed[token.id]).map((token) => (
            <button key={token.id} type="button" role="listitem" className={`tone-${token.id}`} aria-pressed={picked === token.id} onClick={() => setPicked(token.id)}>{token.label}</button>
          ))}
        </div>
        <div className="lab-bins">
          {LIVER_STREAMS.map(([id, label]) => (
            <div key={id} className="lab-bin" data-stream={id}>
              <button type="button" onClick={() => assign(id)} disabled={!picked}>{label}</button>
              {LIVER_TOKENS.filter((token) => placed[token.id] === id).map((token) => (
                <button
                  key={token.id}
                  type="button"
                  className={`tone-${token.id} ${audited ? (LIVER_KEY[token.id] === id ? "is-placed is-right" : "is-placed is-wrong") : "is-placed"}`}
                  onClick={() => setPlaced((current) => {
                    const next = { ...current };
                    delete next[token.id];
                    return next;
                  })}
                >
                  {token.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <Face kicker="Recovered" value={cascade.recovered} unit="kg" detail={`${cascade.contaminationIn} kg of that is still contaminated.`} />
        <Meter label="Sorting accuracy" value={score.accuracy} note={`${score.placed} of 8 tokens placed`} />
        <Meter label="Contamination" value={score.contamination} note="Wrong tokens inside the useful streams" />
        <Meter label="Recovery" value={score.recovery} note="Correct useful tokens, out of all useful tokens" />
        <p className="lab-compare">The blue lot is the kilogram model. Gate recovers {cascade.recovered} kg with {cascade.contaminationIn} kg contaminated. Category sort recovers {category.recovered} kg and lets {category.contaminationIn} kg of contaminated material in. Hazard stays out. Unaccounted {cascade.imbalance.toFixed(2)} kg.</p>
        <TestBar running={false} onStart={() => setAudited(true)} onReset={reset} startLabel="Run audit" />
      </div>
    </div>
  );
}

function SkinSim() {
  const [sun, setSun] = useState(80);
  const [angle, setAngle] = useState(20);
  const [insulation, setInsulation] = useState(40);
  const [vent, setVent] = useState(30);
  const [power, setPower] = useState(1);
  const [scenario, setScenario] = useState("custom");
  const clock = useSimClock(7, 3);
  const day = skinHour({ sun, angle, insulation, vent, hour: clock.tick });
  const result = skinModel({ sun: day.sunNow, angle, insulation, vent });
  const baseline = skinModel({ sun: 80, angle: 20, insulation: 40, vent: 30 });
  const adaptiveShell = thermoShield({ outdoor: day.outdoor, sun: day.sunNow, powerAvailable: power, mode: "adaptive" });
  const fixedShell = thermoShield({ outdoor: day.outdoor, sun: day.sunNow, powerAvailable: power, mode: "fixed" });

  function reset() {
    clock.reset();
    setScenario("custom");
    setSun(80);
    setAngle(20);
    setInsulation(40);
    setVent(30);
    setPower(1);
  }

  return (
    <div className={`lab-sim${clock.running ? " is-on" : ""}`}>
      <LabViewport
        kind="skin"
        note={`Hour ${day.hour + 1} of 8. Noon sun setting ${sun}. This hour the sun index is ${day.sunNow} and the outdoor index is ${day.outdoor}. Drag the sun, THERMOSKIN, or a vent.`}
        state={{ sun: day.sunNow, angle, insulation, vent, fixed: result.fixed, adaptive: result.adaptive, running: clock.running, thermalFixed: fixedShell.indoor, thermalAdaptive: adaptiveShell.indoor, shade: adaptiveShell.shade, ventOpen: adaptiveShell.vent }}
        onAction={(action) => {
          if (action.type === "drag") {
            setScenario("custom");
            if (action.key === "sun") setSun(action.value);
            if (action.key === "angle") setAngle(action.value);
            if (action.key === "power") setPower(action.value);
            return;
          }
          if (action.type === "shell" && action.id === "fixed") setAngle(8);
        }}
      />
      <div className="lab-sim-controls">
        <Choices
          label="Scenario"
          value={scenario}
          onChange={(id) => {
            setScenario(id);
            if (id === "noon") { setSun(95); setAngle(8); setInsulation(15); setVent(10); }
            if (id === "shaded") { setSun(80); setAngle(70); setInsulation(85); setVent(70); }
            if (id === "night") { setSun(0); setAngle(20); setInsulation(40); setVent(30); }
          }}
          options={[["noon", "Harsh noon"], ["shaded", "Shade and vent"], ["night", "No sun"]]}
        />
        <Range label="Sunlight" value={sun} min={0} max={100} unit="" onChange={(value) => { setScenario("custom"); setSun(value); }} />
        <Range label="Shading angle" value={angle} min={0} max={75} unit="°" onChange={setAngle} />
        <Range label="Insulation" value={insulation} min={0} max={100} unit="" onChange={setInsulation} />
        <Range label="Ventilation" value={vent} min={0} max={100} unit="" onChange={setVent} />
        <Range label="Power available" value={power} min={0} max={3} unit=" kW" onChange={setPower} />
        <TestBar running={clock.running} onStart={clock.start} onReset={reset} startLabel="Run the day" />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <Face kicker={`Hour ${day.hour + 1}`} value={adaptiveShell.indoor} detail={`Adaptive index. Fixed shell ${fixedShell.indoor}. Outdoor index ${day.outdoor}. Not a room temperature.`} />
        <Delta label="THERMOSKIN heat" value={result.adaptive} base={baseline.adaptive} />
        <Meter label="Fixed shell heat" value={result.fixed} note="Ignores shade angle and ventilation" />
        <Meter label="THERMOSKIN heat" value={result.adaptive} note="Shade exhibit index. Not a room temperature." />
        <p className="lab-compare">Window colour uses the thermal model. Adaptive indoor {adaptiveShell.indoor}, powered {adaptiveShell.powered} kW. Fixed indoor {fixedShell.indoor}, powered {fixedShell.powered} kW. Ventilation stays shut when outdoor air is hotter than 30.</p>
      </div>
    </div>
  );
}

function DigestiveSim() {
  const [storage, setStorage] = useState(30);
  const [move, setMove] = useState(8);
  const [hour, setHour] = useState(0);
  const [running, setRunning] = useState(false);
  const [water, setWater] = useState(20);
  const [salinity, setSalinity] = useState(50);
  const [cropMode, setCropMode] = useState("feasible");
  const [prefer, setPrefer] = useState("");
  const run = useMemo(() => nourishRun({ storage, move }), [storage, move]);
  const frame = run.frames[Math.min(hour, run.frames.length - 1)];
  const chosen = prefer
    ? harvestTry({ water, salinity: salinity / 100, id: prefer })
    : harvestLoop({ water, salinity: salinity / 100, mode: cropMode });

  useEffect(() => {
    setHour(0);
  }, [storage, move]);

  useEffect(() => {
    if (!running) return undefined;
    if (hour >= 7) return undefined;
    const id = setInterval(() => setHour((current) => Math.min(7, current + 1)), 700);
    return () => clearInterval(id);
  }, [running, hour]);

  useEffect(() => {
    if (hour >= 7) setRunning(false);
  }, [hour]);

  function reset() {
    setRunning(false);
    setStorage(30);
    setMove(8);
    setHour(0);
    setWater(20);
    setSalinity(50);
    setCropMode("feasible");
    setPrefer("");
  }

  return (
    <div className={`lab-sim${running ? " is-on" : ""}`}>
      <LabViewport
        kind="digestive"
        note={`Drag the cold store or the chiller. Click a crop bed. ${chosen.name} ${chosen.violation || chosen.unmet ? "does not fit this water or salinity" : "fits"}. Yield index ${chosen.yieldIndex}. Hour ${frame.hour}, ${frame.stored} meals still held.`}
        state={{ portrait: frame.portrait, stored: frame.stored, storage, move, hour: frame.hour, rescued: frame.rescued, waste: frame.waste, running, crop: { id: chosen.crop, yieldIndex: chosen.yieldIndex, unmet: chosen.unmet, violation: chosen.violation, salinity: salinity / 100 } }}
        onAction={(action) => {
          if (action.type === "drag" && action.key === "storage") { setStorage(action.value); return; }
          if (action.type === "drag" && action.key === "move") { setMove(action.value); return; }
          if (action.type === "crop") setPrefer(action.id);
        }}
      />
      <div className="lab-sim-controls">
        <Range label="Storage" value={storage} min={0} max={80} unit="" onChange={setStorage} />
        <Range label="Redistribution each hour" value={move} min={0} max={30} unit="" onChange={setMove} />
        <Choices label="Crop rule" value={prefer ? "" : cropMode} onChange={(id) => { setPrefer(""); setCropMode(id); }} options={[["feasible", "Choose a crop that fits"], ["fixed", "Always tomato"]]} />
        <Range label="Irrigation water" value={water} min={0} max={40} unit=" L" onChange={setWater} />
        <Range label="Soil salinity" value={salinity} min={0} max={90} unit="" onChange={setSalinity} />
        <TestBar running={running} onStart={() => {
          if (running) setRunning(false);
          else {
            if (hour >= 7) setHour(0);
            setRunning(true);
          }
        }} onReset={reset} />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <Face kicker={chosen.name} value={chosen.yieldIndex} unit="yield" detail={chosen.violation || chosen.unmet ? "This water or salinity does not fit." : "This crop fits the water and the salinity."} />
        <p className="lab-hour">Hour {frame.hour} of 8 · {frame.stored} meals still held</p>
        <Meter label="Rescued by this hour" value={frame.rescued} max={70} note="Exhibit meals moved before the deadline" />
        <Meter label="Avoidable waste" value={frame.waste} max={70} note="Overflow plus meals that expired" />
        <Meter label="Rescued by hour 8" value={run.rescued} max={70} note="The full meal test, from the settings above" />
        <p className="lab-compare">{CROPS.map((crop) => `${crop.name} needs ${crop.water} L and salinity at or below ${crop.salinityMax}`).join(". ")}. The green canopy is the crop that fits. Yield is an index, not a harvest.</p>
      </div>
    </div>
  );
}

const GROUNDS = ["low", "terrace", "high"];
const GROUND_LABEL = { low: "Low ground", terrace: "Terrace", high: "High ground" };

function SkeletonSim() {
  const [rain, setRain] = useState(70);
  const [drainage, setDrainage] = useState(35);
  const [grounds, setGrounds] = useState(["low", "terrace", "high"]);
  const [shared, setShared] = useState(false);
  const [bridge, setBridge] = useState("low");
  const [budget, setBudget] = useState(5);
  const [roadMode, setRoadMode] = useState("essential");
  const [closed, setClosed] = useState([]);
  const clock = useSimClock(16, 8);
  const plots = stormFrame({ rain, drainage, grounds, shared, bridge, minute: clock.tick });
  const baseline = skeletonModel({ rain: 70, drainage: 35, grounds: ["low", "terrace", "high"], shared: false, bridge: "low" });
  const roads = resiliaScene({ budget, mode: roadMode, closed });
  const openRoads = roads.open;

  function cycle(index) {
    setGrounds((current) => current.map((ground, item) => {
      if (item !== index) return ground;
      return GROUNDS[(GROUNDS.indexOf(ground) + 1) % GROUNDS.length];
    }));
  }

  function reset() {
    clock.reset();
    setRain(70);
    setDrainage(35);
    setGrounds(["low", "terrace", "high"]);
    setShared(false);
    setBridge("low");
    setBudget(5);
    setRoadMode("essential");
    setClosed([]);
  }

  return (
    <div className={`lab-sim${clock.running ? " is-on" : ""}`}>
      <LabViewport
        kind="skeleton"
        note={`Storm minute ${clock.tick} of 16. The crest at minute 8 is the plot model. Drag the rain cloud or the drainage channel. Clinic is ${roads.access.clinic ? "reachable" : "cut off"}.`}
        state={{ plots, grounds, rain, drainage, shared, bridge, running: clock.running, openRoads, reachClinic: roads.access.clinic, reachWater: roads.access.water }}
        onAction={(action) => {
          if (action.type === "drag" && action.key === "rain") { setRain(action.value); return; }
          if (action.type === "drag" && action.key === "drainage") { setDrainage(action.value); return; }
          if (action.type === "plot") cycle(action.index);
          if (action.type === "road") setClosed((current) => (current.includes(action.id) ? current.filter((id) => id !== action.id) : [...current, action.id]));
          if (action.type === "bridge") setBridge((current) => (current === "low" ? "raised" : "low"));
          if (action.type === "shared") setShared((current) => !current);
        }}
      />
      <div className="lab-sim-controls">
        <Range label="Rainfall" value={rain} min={0} max={100} unit="" onChange={setRain} />
        <Range label="Drainage" value={drainage} min={0} max={100} unit="" onChange={setDrainage} />
        <div className="lab-choice" role="group" aria-label="Plot ground">
          {grounds.map((ground, index) => (
            <button key={index} type="button" onClick={() => cycle(index)}>Plot {index + 1}: {GROUND_LABEL[ground]}</button>
          ))}
        </div>
        <Choices label="Layout" value={shared ? "shared" : "isolated"} onChange={(value) => setShared(value === "shared")} options={[["isolated", "Isolated plots"], ["shared", "Shared drainage"]]} />
        <Choices label="Bridge deck" value={bridge} onChange={setBridge} options={[["low", "Low deck"], ["raised", "Raised deck"]]} />
        <Choices label="Road rule" value={roadMode} onChange={setRoadMode} options={[["essential", "Protect the clinic first"], ["count", "Buy the cheapest roads"]]} />
        <Range label="Road budget" value={budget} min={0} max={13} unit="" onChange={setBudget} />
        <TestBar running={clock.running} onStart={clock.start} onReset={reset} startLabel="Run the storm" />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <Face kicker={`Minute ${clock.tick}`} value={plots[1].exposure} detail={`Middle plot. ${plots[1].label}. Clinic road ${roads.access.clinic ? "open" : "cut"}.`} />
        <Delta label="Middle plot" value={plots[1].exposure} base={baseline[1].exposure} />
        {plots.map((plot, index) => (
          <Meter key={index} label={`Plot ${index + 1} exposure`} value={plot.exposure} note={plot.label} />
        ))}
      </div>
    </div>
  );
}

function LungSim() {
  const [particles, setParticles] = useState(70);
  const [efficiency, setEfficiency] = useState(65);
  const [fan, setFan] = useState(50);
  const [condition, setCondition] = useState(80);
  const [pm, setPm] = useState(120);
  const [wind, setWind] = useState("desert");
  const [spread, setSpread] = useState("wide");
  const clock = useSimClock(10);
  const result = lungLoad({ particles, efficiency, fan, condition, tick: clock.tick });
  const baseline = lungModel({ particles: 70, efficiency: 65, fan: 50, condition: 80 });
  const context = atmosSense({ pm, wind, spread, mode: "context" });
  const threshold = atmosSense({ pm, wind, spread, mode: "threshold" });

  function reset() {
    clock.reset();
    setParticles(70);
    setEfficiency(65);
    setFan(50);
    setCondition(80);
    setPm(120);
    setWind("desert");
    setSpread("wide");
  }

  return (
    <div className={`lab-sim${clock.running ? " is-on" : ""}`}>
      <LabViewport
        kind="lungs"
        note={`Sample ${clock.tick} of 10. ${result.entered} particles have entered. ${result.removed} caught. ${result.remaining} still in that sample. Drag the inlet, the fan, or the filter. ${context.hypothesis}`}
        state={{ particles, efficiency, fan, condition, pm, removed: result.removed, remaining: result.remaining, airflow: result.airflow, running: clock.running, claim: context.claim, loaded: result.loaded }}
        onAction={(action) => {
          if (action.type === "drag") {
            if (action.key === "pm") setPm(action.value);
            if (action.key === "fan") setFan(action.value);
            if (action.key === "efficiency") setEfficiency(action.value);
            return;
          }
          if (action.type === "spread") setSpread((current) => (current === "wide" ? "local" : current === "local" ? "unknown" : "wide"));
        }}
      />
      <div className="lab-sim-controls">
        <Choices
          label="Filter type"
          value={String(efficiency)}
          onChange={(value) => setEfficiency(Number(value))}
          options={[["40", "Coarse"], ["65", "Pleated"], ["90", "Fine"]]}
        />
        <Range label="Particle concentration" value={particles} min={0} max={100} unit="" onChange={setParticles} />
        <Range label="Filter efficiency" value={efficiency} min={0} max={100} unit="" onChange={setEfficiency} />
        <Range label="Fan speed" value={fan} min={0} max={100} unit="" onChange={setFan} />
        <Range label="Filter condition" value={condition} min={0} max={100} unit="" onChange={setCondition} />
        <Range label="Outside reading" value={pm} min={0} max={200} unit="" onChange={setPm} />
        <Choices label="Wind" value={wind} onChange={setWind} options={[["desert", "Desert wind"], ["calm", "Calm"], ["sea", "Sea breeze"]]} />
        <Choices label="Spread" value={spread} onChange={setSpread} options={[["wide", "Wide"], ["local", "One sensor"], ["unknown", "Unknown"]]} />
        <TestBar running={clock.running} onStart={clock.start} onReset={reset} startLabel="Run the sample" />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <Face kicker="Caught this sample" value={result.removed} detail={`${result.remaining} of the ${result.entered} that entered are still in the air. Airflow ${result.airflow}.`} />
        <Delta label="Particles removed" value={result.removed} base={baseline.removed} />
        <Meter label="Particles removed" value={result.removed} note="Cannot exceed what entered" />
        <Meter label="Particles remaining" value={result.remaining} note="What the filter did not catch" />
        <Meter label="Airflow" value={result.airflow} note="Fan speed reduced by a worn filter" />
        <p className="lab-compare">Context says {context.claim}. Threshold says {threshold.claim}. {context.uncertain ? "The spread is missing, so the source stays unnamed." : "A dust or local claim is a hypothesis, not a proven source."} 80 is a model threshold, not an air-quality standard.</p>
      </div>
    </div>
  );
}

const SIMS = {
  heart: NabdGridPanel,
  brain: BrainSim,
  kidneys: KidneySim,
  liver: LiverSim,
  skin: SkinSim,
  digestive: DigestiveSim,
  skeleton: SkeletonSim,
  lungs: LungSim,
};

export function OrganBoard({ id, name, onCrisis, crisis }) {
  const copy = BOARDS[id];
  const Sim = SIMS[id];
  const [judge, setJudge] = useState(false);

  function jump(event) {
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("lab-sim")?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <article className="lab-board" data-organ={id}>
      <p className="lab-board-kicker">{name}</p>
      <h2>{copy.invention}</h2>
      <p className="lab-board-note">A design concept for this exhibition. Not a built system, and not a national plan.</p>
      <a className="lab-jump" href="#lab-sim" onClick={jump}>Test the model</a>
      <button type="button" className="lab-jump" aria-pressed={judge} onClick={() => setJudge((value) => !value)}>{judge ? "Full board" : "Judge brief"}</button>
      {judge ? <JudgeBrief id={id} onCrisis={onCrisis} /> : (
        <>
          <Fold title="Biological inspiration">{copy.inspiration}</Fold>
          <Fold title="Principle">{copy.principle}</Fold>
          <Fold title="Oman problem">{copy.problem}</Fold>
          <Fold title="Oman solution">{copy.solution}</Fold>
          <PlanFolds id={id} />
          <Fold title="Working-model assumptions">{copy.assumptions}</Fold>
        </>
      )}
      <section id="lab-sim" className="lab-sim-block" aria-label="Interactive simulation">
        <h3>Interactive simulation</h3>
        <p className="lab-sim-flag">{id === "heart" ? "Simulated kilowatts for one modelled day. Not a measurement from a real community." : "Modelled scenario. Not a measurement, and not a built prototype."}</p>
          <Sim crisis={crisis} />
      </section>
    </article>
  );
}
