import { useEffect, useMemo, useState } from "react";
import { Face, LabViewport } from "./LabViewport.jsx";
import {
  BUILDINGS,
  LOADS,
  PRESETS,
  STEP_COUNT,
  buildingServedKwh,
  cableCatalog,
  compare,
  csvFor,
  dayAccount,
  defaultScenario,
  normalize,
  stepLabel,
} from "./nabdGrid.js";

function kw(value) {
  return `${Number(value).toFixed(2)} kW`;
}

function kwh(value) {
  return `${Number(value).toFixed(1)} kWh`;
}

function Chart({ series, step, label }) {
  const width = 320;
  const height = 78;
  const max = Math.max(0.2, ...series.flatMap((item) => item.values));
  const xAt = (index) => 4 + (index / Math.max(1, (series[0]?.values.length || 1) - 1)) * (width - 8);
  return (
    <figure className="grid-chart">
      <figcaption>{label}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        <line x1={xAt(step)} y1="4" x2={xAt(step)} y2={height - 4} stroke="#e6d3a4" strokeWidth="1" />
        {series.map((item) => (
          <polyline
            key={item.name}
            fill="none"
            stroke={item.color}
            strokeWidth="1.7"
            points={item.values.map((value, index) => `${xAt(index)},${height - 8 - (value / max) * (height - 18)}`).join(" ")}
          />
        ))}
      </svg>
      <p>
        {series.map((item) => (
          <span key={item.name}><i style={{ background: item.color }} />{item.name}</span>
        ))}
      </p>
    </figure>
  );
}

export function NabdGridPanel() {
  const [scenario, setScenario] = useState(defaultScenario);
  const [step, setStep] = useState(48);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState("clinic");
  const [view, setView] = useState("coordinated");
  const [preset, setPreset] = useState("");
  const [runs, setRuns] = useState([]);
  const result = useMemo(() => compare(scenario), [scenario]);
  const sharedAccount = dayAccount(result.coordinated);
  const aloneAccount = dayAccount(result.independent);
  const frame = result[view].frames[Math.min(step, STEP_COUNT - 1)];
  const faultBuilding = BUILDINGS.find((item) => scenario.fault === `artery-${item.id}`);
  const node = frame.buildings.find((item) => item.id === selected);
  const building = node || frame.buildings[0];
  const activePreset = PRESETS.find((item) => item.id === preset);

  useEffect(() => {
    if (!playing) return undefined;
    const delay = speed >= 12 ? 80 : speed >= 4 ? 200 : 600;
    const jump = speed >= 12 ? 2 : 1;
    const id = setInterval(() => {
      setStep((current) => Math.min(STEP_COUNT - 1, current + jump));
    }, delay);
    return () => clearInterval(id);
  }, [playing, speed]);

  useEffect(() => {
    if (playing && step >= STEP_COUNT - 1) setPlaying(false);
  }, [playing, step]);

  function patch(partial) {
    setScenario((current) => normalize({
      ...current,
      ...partial,
      demand: partial.demand ? { ...current.demand, ...partial.demand } : current.demand,
      gen: partial.gen ? { ...current.gen, ...partial.gen } : current.gen,
      loads: partial.loads ? { ...current.loads, ...partial.loads } : current.loads,
    }));
  }

  function applyPreset(id) {
    const item = PRESETS.find((entry) => entry.id === id);
    if (!item) return;
    setPlaying(false);
    setPreset(id);
    setView("coordinated");
    setScenario(normalize({ ...defaultScenario(), ...item.patch }));
    setStep(item.step);
  }

  function reset() {
    setPlaying(false);
    setSpeed(1);
    setPreset("");
    setView("coordinated");
    setSelected("clinic");
    setScenario(defaultScenario());
    setStep(48);
  }

  function saveRun() {
    const item = activePreset;
    setRuns((current) => [...current, {
      id: `${Date.now()}`,
      name: item ? item.name : "Custom day",
      unmet: result.coordinated.totals.unmetKwh,
      alone: result.independent.totals.unmetKwh,
      essential: result.coordinated.totals.essentialUnmetKwh,
      curtail: result.coordinated.totals.curtailKwh,
      backup: result.coordinated.totals.backupKwh,
      shared: result.coordinated.totals.sharedKwh,
    }].slice(-6));
  }

  function download() {
    const file = new Blob([csvFor(result.coordinated)], { type: "text/csv" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nabdgrid-run.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const shared = result.coordinated.totals;
  const alone = result.independent.totals;
  const search = result.search;
  let batteryText = "On this modelled day the coordinated network did not stay within the independent unmet energy at any battery size up to the one being tested.";
  if (search.needed === 0) {
    batteryText = `Coordination stayed within the independent unmet energy on this day even with no shared battery. Unmet energy is still ${kwh(shared.unmetKwh)}. The battery size is not what closed that gap, and this is not a field result.`;
  } else if (search.needed != null) {
    batteryText = `The smallest shared battery that stayed within the independent unmet energy on this day was ${search.needed} kWh, ${search.percent}% of the ${search.comparedWith} kWh being tested. Unmet energy at the tested size is still ${kwh(shared.unmetKwh)}. One day is not a sizing study.`;
  }
  const modeName = frame.flow === "charge" ? "Charging"
    : frame.flow === "discharge" ? "Discharging"
    : frame.flow === "backup" ? "Backup"
    : frame.flow === "share" ? "Sharing"
    : frame.curtailKw > 0.08 ? "Curtailing"
    : "Local supply";
  const flowId = scenario.fault || `artery-${building.id}`;
  const flowCable = cableCatalog(scenario).find((cable) => cable.id === flowId);
  const transfers = frame.transfers.filter((item) => node && (item.to === node.id || item.from === node.id));
  const cableName = cableCatalog(scenario).find((cable) => cable.id === scenario.fault)?.name;
  const note = node
    ? `${frame.label}. ${view === "coordinated" ? "Coordinated network" : "Independent roofs"}. ${node.name} generates ${kw(node.gen)} and uses ${kw(node.dem)}. Served ${kw(node.self + node.imported + node.fromBattery + node.fromBackup)}.${node.unmet > 0.05 ? ` Short by ${kw(node.unmet)}.` : ""}${cableName ? ` ${cableName} is open.` : ""}`
    : `${frame.label}. Core reserve ${kwh(frame.socKwh)} (${Math.round(frame.soc * 100)}%). Charge ${kw(frame.chargeKw)}, discharge ${kw(frame.dischargeKw)}. The core coordinates storage. It does not generate electricity.${cableName ? ` ${cableName} is open.` : ""}`;

  return (
    <div className={`lab-sim${playing ? " is-on" : ""}`}>
      <LabViewport
        kind="heart"
        hint="Drag the core up or down to move through the day. Click a building or a cable. Packets move only where the model sends power."
        meters={[
          { label: "Solar", value: kw(frame.solarKw) },
          { label: "Demand", value: kw(frame.demandKw) },
          { label: "Reserve", value: `${Math.round(frame.soc * 100)}%` },
          { label: "Unmet", value: kw(frame.unmetKw) },
          { label: "State", value: modeName },
        ]}
        views={[["overview", "Topology"], ["detail", "Engineering"], ["side", "Profile"]]}
        note={activePreset ? `${activePreset.question} ${note}` : note}
        state={{
          sky: frame.sky,
          hour: frame.hour,
          sunrise: scenario.sunrise,
          sunset: scenario.sunset,
          dust: scenario.dust > 0 && step >= scenario.dustFrom && step < scenario.dustTo ? scenario.dust : 0,
          fault: view === "coordinated" ? scenario.fault : "",
          tie: view === "coordinated" && scenario.tie,
          linkDown: view === "coordinated" && scenario.linkDown,
          unmetKw: frame.unmetKw,
          solarKw: frame.solarKw,
          demandKw: frame.demandKw,
          curtailKw: frame.curtailKw,
          hubFill: frame.soc,
          backup: frame.backupKw > 0.08,
          flow: frame.flow,
          view,
          step,
          selected: selected,
          buildings: frame.buildings,
          cables: frame.cables,
        }}
        onAction={(action) => {
          if (action.type === "drag" && action.key === "step") { setPlaying(false); setStep(action.value); return; }
          if (action.type === "hub") setSelected("hub");
          if (action.type === "building") setSelected(action.id);
          if (action.type === "cable" && view === "coordinated") {
            setView("coordinated");
            patch({ fault: scenario.fault === action.id ? "" : action.id });
          }
        }}
      />
      <div className="lab-sim-controls">
        <div className="lab-choice" role="group" aria-label="Experiments">
          {PRESETS.map((item) => (
            <button key={item.id} type="button" aria-pressed={preset === item.id} onClick={() => applyPreset(item.id)}>
              {item.code} · {item.name}
            </button>
          ))}
        </div>
        <div className="lab-choice" role="group" aria-label="Clock">
          <button type="button" onClick={() => { setPlaying(false); setStep((current) => Math.max(0, current - 1)); }}>Back</button>
          <button type="button" aria-pressed={playing} onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : "Run the day"}</button>
          <button type="button" onClick={() => { setPlaying(false); setStep((current) => Math.min(STEP_COUNT - 1, current + 1)); }}>Forward</button>
          <button type="button" onClick={reset}>Reset</button>
        </div>
        <label className="lab-range">
          <span>Time<b>{stepLabel(step)}</b></span>
          <input type="range" min={0} max={STEP_COUNT - 1} value={step} aria-valuetext={stepLabel(step)} onChange={(event) => { setPlaying(false); setStep(Number(event.target.value)); }} />
        </label>
        <div className="lab-choice" role="group" aria-label="Speed">
          {[1, 4, 12].map((value) => (
            <button key={value} type="button" aria-pressed={speed === value} onClick={() => setSpeed(value)}>{value}×</button>
          ))}
        </div>
        <div className="lab-choice" role="group" aria-label="Layout">
          <button type="button" aria-pressed={view === "coordinated"} onClick={() => setView("coordinated")}>Coordinated</button>
          <button type="button" aria-pressed={view === "independent"} onClick={() => setView("independent")}>Independent</button>
        </div>
        <div className="lab-choice" role="group" aria-label="Allocation">
          <button type="button" aria-pressed={scenario.policy === "priority"} onClick={() => patch({ policy: "priority" })}>Essential first</button>
          <button type="button" aria-pressed={scenario.policy === "fair"} onClick={() => patch({ policy: "fair" })}>Fair share</button>
          <button type="button" aria-pressed={scenario.policy === "floor"} onClick={() => patch({ policy: "floor" })}>Minimum service</button>
        </div>
        <div className="lab-choice" role="group" aria-label="Network options">
          <button type="button" aria-pressed={scenario.tie} onClick={() => patch({ tie: !scenario.tie })}>Homes–school route</button>
          <button type="button" aria-pressed={scenario.linkDown} onClick={() => patch({ linkDown: !scenario.linkDown })}>Hub link down</button>
          <button type="button" aria-pressed={scenario.backupOn} onClick={() => patch({ backupOn: !scenario.backupOn })}>{scenario.backupOn ? "Backup on" : "Backup off"}</button>
        </div>
        <label className="grid-select">
          Isolate a cable
          <select value={scenario.fault} onChange={(event) => patch({ fault: event.target.value })}>
            <option value="">All cables closed</option>
            {cableCatalog(scenario).map((cable) => (
              <option key={cable.id} value={cable.id}>{cable.name}</option>
            ))}
          </select>
        </label>
        <label className="lab-range"><span>Sunlight<b>{Math.round(scenario.sun * 100)}%</b></span><input type="range" min={0} max={130} value={Math.round(scenario.sun * 100)} onChange={(event) => patch({ sun: Number(event.target.value) / 100 })} /></label>
        <label className="lab-range"><span>Solar reduction<b>{Math.round(scenario.dust * 100)}%</b></span><input type="range" min={0} max={90} value={Math.round(scenario.dust * 100)} onChange={(event) => patch({ dust: Number(event.target.value) / 100 })} /></label>
        <label className="lab-range"><span>Reduction from<b>{stepLabel(scenario.dustFrom)}</b></span><input type="range" min={0} max={STEP_COUNT - 1} value={scenario.dustFrom} onChange={(event) => patch({ dustFrom: Math.min(Number(event.target.value), scenario.dustTo) })} /></label>
        <label className="lab-range"><span>Reduction until<b>{stepLabel(scenario.dustTo)}</b></span><input type="range" min={0} max={STEP_COUNT - 1} value={scenario.dustTo} onChange={(event) => patch({ dustTo: Math.max(Number(event.target.value), scenario.dustFrom) })} /></label>
        <label className="lab-range"><span>Sunrise<b>{scenario.sunrise.toFixed(1)}</b></span><input type="range" min={40} max={90} value={Math.round(scenario.sunrise * 10)} onChange={(event) => patch({ sunrise: Number(event.target.value) / 10 })} /></label>
        <label className="lab-range"><span>Sunset<b>{scenario.sunset.toFixed(1)}</b></span><input type="range" min={160} max={210} value={Math.round(scenario.sunset * 10)} onChange={(event) => patch({ sunset: Number(event.target.value) / 10 })} /></label>
        <label className="lab-range"><span>Air conditioners<b>{scenario.acCount}</b></span><input type="range" min={0} max={6} value={scenario.acCount} onChange={(event) => patch({ acCount: Number(event.target.value), loads: { "homes-ac": true } })} /></label>
        <label className="lab-range"><span>Extra cooling each<b>{scenario.acKw.toFixed(1)} kW</b></span><input type="range" min={0} max={40} value={Math.round(scenario.acKw * 10)} onChange={(event) => patch({ acKw: Number(event.target.value) / 10 })} /></label>
        {node ? (
          <>
            <label className="lab-range"><span>{node.short} generation<b>{Math.round((scenario.gen[node.id] ?? 1) * 100)}%</b></span><input type="range" min={0} max={160} value={Math.round((scenario.gen[node.id] ?? 1) * 100)} onChange={(event) => patch({ gen: { [node.id]: Number(event.target.value) / 100 } })} /></label>
            <label className="lab-range"><span>{node.short} demand<b>{Math.round((scenario.demand[node.id] ?? 1) * 100)}%</b></span><input type="range" min={20} max={300} value={Math.round((scenario.demand[node.id] ?? 1) * 100)} onChange={(event) => patch({ demand: { [node.id]: Number(event.target.value) / 100 } })} /></label>
            <div className="lab-choice" role="group" aria-label="Loads">
              {LOADS.filter((load) => load.building === node.id).map((load) => (
                <button key={load.id} type="button" aria-pressed={scenario.loads[load.id] !== false} onClick={() => patch({ loads: { [load.id]: scenario.loads[load.id] === false } })}>
                  {load.name}
                </button>
              ))}
            </div>
          </>
        ) : <p className="lab-compare">The core coordinates the battery and the routes. It does not generate electricity.</p>}
        <label className="lab-range"><span>Minimum non-critical service<b>{Math.round(scenario.minService * 100)}%</b></span><input type="range" min={0} max={100} value={Math.round(scenario.minService * 100)} onChange={(event) => patch({ minService: Number(event.target.value) / 100 })} /></label>
        <label className="lab-range"><span>Shared battery<b>{scenario.batteryKwh} kWh</b></span><input type="range" min={0} max={120} value={scenario.batteryKwh} onChange={(event) => patch({ batteryKwh: Number(event.target.value) })} /></label>
        <label className="lab-range"><span>Battery power<b>{scenario.batteryKw} kW</b></span><input type="range" min={0} max={40} value={scenario.batteryKw} onChange={(event) => patch({ batteryKw: Number(event.target.value) })} /></label>
        <label className="lab-range"><span>Battery reserve<b>{Math.round(scenario.soc0 * 100)}%</b></span><input type="range" min={0} max={100} value={Math.round(scenario.soc0 * 100)} onChange={(event) => patch({ soc0: Number(event.target.value) / 100 })} /></label>
        <label className="lab-range"><span>Reserve floor<b>{Math.round(scenario.socMin * 100)}%</b></span><input type="range" min={0} max={50} value={Math.round(scenario.socMin * 100)} onChange={(event) => patch({ socMin: Number(event.target.value) / 100 })} /></label>
        <label className="lab-range"><span>Flexible demand<b>{Math.round(scenario.flexDemand * 100)}%</b></span><input type="range" min={0} max={300} value={Math.round(scenario.flexDemand * 100)} onChange={(event) => patch({ flexDemand: Number(event.target.value) / 100 })} /></label>
        <label className="lab-range"><span>Artery capacity<b>{scenario.arteryKw} kW</b></span><input type="range" min={1} max={20} value={scenario.arteryKw} onChange={(event) => patch({ arteryKw: Number(event.target.value) })} /></label>
        <label className="lab-range"><span>Homes–school route<b>{scenario.tieKw} kW</b></span><input type="range" min={1} max={12} value={scenario.tieKw} onChange={(event) => patch({ tieKw: Number(event.target.value) })} /></label>
        <button type="button" className="lab-text-button" onClick={() => { applyPreset("sunset"); setSpeed(4); setPlaying(true); }}>Walk through sunset for judges</button>
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <Face kicker={stepLabel(step)} value={kw(frame.unmetKw)} detail={`Coordinated unmet this day ${kwh(sharedAccount.unmetKwh)}. Independent ${kwh(aloneAccount.unmetKwh)}.`} />
        <div className="district-leds" aria-label="District lamps for this step">
          {frame.buildings.map((item) => {
            const served = item.self + item.imported + item.fromBattery + item.fromBackup;
            const lit = item.dem < 0.05 || served + 0.05 >= item.dem;
            return (
              <div key={item.id} className={lit ? "is-on" : ""}>
                <i />
                <span><b>{item.short}</b> · {kw(served)} served{item.unmet > 0.05 ? ` · short ${kw(item.unmet)}` : ""}</span>
              </div>
            );
          })}
        </div>
        <p className="lab-compare">The lamps stand for the prototype district LEDs. Lit means this step's demand is met in the calculated day. It is not a measured voltage from a solar panel.</p>
        <table className="lab-sheet">
          <caption className="lab-compare">Same roofs, same loads, same battery size and the same starting charge. Independent buildings cannot exchange.</caption>
          <thead>
            <tr><th>This day</th><th>Coordinated</th><th>Independent</th></tr>
          </thead>
          <tbody>
            <tr><td>Essential served</td><td>{kwh(sharedAccount.essentialServedKwh)}</td><td>{kwh(aloneAccount.essentialServedKwh)}</td></tr>
            <tr><td>Demand served</td><td>{kwh(sharedAccount.servedKwh)}</td><td>{kwh(aloneAccount.servedKwh)}</td></tr>
            <tr><td>Unmet demand</td><td>{kwh(sharedAccount.unmetKwh)}</td><td>{kwh(aloneAccount.unmetKwh)}</td></tr>
            <tr><td>Battery now</td><td>{kwh(result.coordinated.frames[step].socKwh)}</td><td>{kwh(result.independent.frames[step].socKwh)}</td></tr>
            <tr><td>Battery at 00:00</td><td>{kwh(result.coordinated.frames[0].socKwh)}</td><td>{kwh(result.independent.frames[0].socKwh)}</td></tr>
            <tr><td>Battery after 24 h</td><td>{kwh(sharedAccount.socEndKwh)}</td><td>{kwh(aloneAccount.socEndKwh)}</td></tr>
            <tr>
              <td>{faultBuilding ? `${faultBuilding.short} still served` : "Fault recovery"}</td>
              <td>{faultBuilding ? kwh(buildingServedKwh(result.coordinated, faultBuilding.id)) : "No cable is isolated."}</td>
              <td>{faultBuilding ? kwh(buildingServedKwh(result.independent, faultBuilding.id)) : "No cable is isolated."}</td>
            </tr>
          </tbody>
        </table>
        <p className="lab-compare">Essential served counts the clinic and the water pump. A higher number is not a win on every row: coordination can use more backup, and an open clinic or water artery has no second cable. Homes and the school can use the spare route only while it is in service and inside its limit. On a sunny day the battery can finish on the reserve floor either way, so the starting reserve shows up at 00:00 and in the backup figure.</p>
        <p className="lab-compare">Shared between buildings {kwh(shared.sharedKwh)}. Curtailed solar {kwh(shared.curtailKwh)} coordinated, {kwh(alone.curtailKwh)} independent. Backup {kwh(shared.backupKwh)} over {shared.backupHours.toFixed(1)} h, against {kwh(alone.backupKwh)} over {alone.backupHours.toFixed(1)} h. Distribution loss {kwh(shared.lossKwh)}. A coordinated backup can run longer because it can reach more buildings.</p>
        <p className="lab-compare">{batteryText}</p>
        <p className="lab-compare">{node ? `${node.name}: solar ${kw(node.gen)}, demand ${kw(node.dem)}, critical ${kw(node.critical)}, non-critical ${kw(node.flex)}, used on site ${kw(node.self)}, imported ${kw(node.imported)}, exported ${kw(node.exported)}, from battery ${kw(node.fromBattery)}, from backup ${kw(node.fromBackup)}, managed ${kw(node.managed)}, unmet ${kw(node.unmet)}. Critical still short ${kw(node.criticalUnmet)}. ${node.connected ? "Connected to the hub." : "Not connected to the hub."}` : `Core: reserve ${kwh(frame.socKwh)}, ${kw(frame.chargeKw)} charging, ${kw(frame.dischargeKw)} discharging, backup ${kw(frame.backupKw)}. Electricity is not blood. The core only coordinates what the cables and the battery can carry.`}</p>
        {transfers.length ? (
          <p className="lab-compare">
            Transfers this step: {transfers.map((item) => `${BUILDINGS.find((entry) => entry.id === item.from)?.name || "Hub"} to ${BUILDINGS.find((entry) => entry.id === item.to)?.name || "Hub"} ${kw(item.kw)}`).join(". ")}.
          </p>
        ) : null}
        <div className="grid-charts">
          <Chart
            label="Power through the day"
            step={step}
            series={[
              { name: "Solar kW", color: "#e6d3a4", values: result[view].frames.map((item) => item.solarKw) },
              { name: "Demand kW", color: "#efe8dc", values: result[view].frames.map((item) => item.demandKw) },
              { name: "Unmet kW", color: "#d4656a", values: result[view].frames.map((item) => item.unmetKw) },
            ]}
          />
          <Chart
            label="Storage and exchange"
            step={step}
            series={[
              { name: "Battery kWh", color: "#7ec8c3", values: result[view].frames.map((item) => item.socKwh) },
              { name: "Shared kW", color: "#9fd7c8", values: result[view].frames.map((item) => item.sharedKw) },
              { name: "Curtailed kW", color: "#8f897e", values: result[view].frames.map((item) => item.curtailKw) },
            ]}
          />
          <Chart
            label={`${flowCable?.name || "Cable"} power`}
            step={step}
            series={[
              { name: "Flow kW", color: "#7ec8c3", values: result[view].frames.map((item) => item.cables.find((cable) => cable.id === flowId)?.kw || 0) },
              { name: "Loss kW", color: "#d4656a", values: result[view].frames.map((item) => item.cables.find((cable) => cable.id === flowId)?.loss || 0) },
            ]}
          />
        </div>
        <div className="grid-log">
          <h4>This step</h4>
          <ul>
            {frame.messages.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
        <div className="grid-evidence">
          <h4>The evidence lab</h4>
          <p>{activePreset ? activePreset.proves : "Save two runs, such as a clear day and a reduced-solar day, then read the difference. A lower unmet figure is the result for that day only."} These rows are simulated. They are not measurements from Oman. Assumed backup fuel is {scenario.fuelPerKwh} litres per kWh and {scenario.fuelPrice} cost units per litre. Battery price is {scenario.batteryPrice} cost units per kWh. Upkeep adds {scenario.maintPerDay} cost units for the day. None of these is a tariff.</p>
          <div className="lab-choice">
            <button type="button" onClick={saveRun}>Save this run</button>
            <button type="button" onClick={download}>Export CSV</button>
            <button type="button" onClick={() => setRuns([])}>Clear saved runs</button>
          </div>
        <label className="lab-range"><span>Fuel price assumption<b>{scenario.fuelPrice.toFixed(2)}</b></span><input type="range" min={0} max={100} value={Math.round(scenario.fuelPrice * 20)} onChange={(event) => patch({ fuelPrice: Number(event.target.value) / 20 })} /></label>
        <label className="lab-range"><span>Battery price assumption<b>{scenario.batteryPrice}</b></span><input type="range" min={0} max={200} value={scenario.batteryPrice} onChange={(event) => patch({ batteryPrice: Number(event.target.value) })} /></label>
        <label className="lab-range"><span>Day upkeep assumption<b>{scenario.maintPerDay.toFixed(1)}</b></span><input type="range" min={0} max={40} value={Math.round(scenario.maintPerDay * 2)} onChange={(event) => patch({ maintPerDay: Number(event.target.value) / 2 })} /></label>
          {runs.length ? (
            <table>
              <thead>
                <tr><th>Run</th><th>Unmet</th><th>Alone</th><th>Essential</th><th>Shared</th><th>Curtailed</th><th>Backup</th></tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td>{run.name}</td>
                    <td>{run.unmet.toFixed(1)}</td>
                    <td>{run.alone.toFixed(1)}</td>
                    <td>{run.essential.toFixed(1)}</td>
                    <td>{run.shared.toFixed(1)}</td>
                    <td>{run.curtail.toFixed(1)}</td>
                    <td>{run.backup.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>Save two different days, then read the table. A lower unmet figure is the reliability result for that day only.</p>}
        </div>
        <p className="lab-compare">Operating cost index this day, from the assumptions above: coordinated {shared.operating.toFixed(1)}, independent {alone.operating.toFixed(1)}. Battery capital for the tested {scenario.batteryKwh} kWh is {shared.batteryCost.toFixed(0)} in both layouts because the total storage is the same. Ageing and replacement are not included.</p>
        <p className="lab-compare">Sunset check from 16:00: {result.sunset.hours == null ? "the clinic and water pump have no essential shortage later in this modelled day." : `essential unmet energy appears after ${result.sunset.hours} hours, at ${result.sunset.at}.`}</p>
        <p className="lab-compare">
          Sources for the policy context, not for these kilowatt figures: <a href="https://www.oman2040.om/" target="_blank" rel="noreferrer">Oman Vision 2040</a>, <a href="https://mem.gov.om/" target="_blank" rel="noreferrer">Ministry of Energy and Minerals</a>, <a href="https://apsr.om/" target="_blank" rel="noreferrer">Authority for Public Services Regulation</a>. A table model, if you build one, should use a current-limited low-voltage supply. Do not connect it to household mains. The digital run is the quantitative experiment.
        </p>
      </div>
    </div>
  );
}
