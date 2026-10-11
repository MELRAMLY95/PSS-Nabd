import { useEffect, useMemo, useState } from "react";
import { BOARDS } from "./boardCopy.js";
import {
  EMERGENCIES,
  LIVER_KEY,
  LIVER_STREAMS,
  LIVER_TOKENS,
  NOURISH_BATCHES,
  RESPONSE_KEYS,
  brainModel,
  heartHour,
  kidneyModel,
  liverScore,
  lungModel,
  nourishRun,
  skeletonModel,
  skinModel,
} from "./simModels.js";

const RESPONSE_LABEL = {
  heat: "Cooling",
  water: "Water",
  energy: "Energy",
  air: "Air",
};

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

function Choices({ label, value, options, onChange }) {
  return (
    <div className="lab-choice" role="group" aria-label={label}>
      {options.map(([id, text]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{text}</button>
      ))}
    </div>
  );
}

function HeartSim() {
  const [solar, setSolar] = useState(62);
  const [demand, setDemand] = useState(70);
  const [capacity, setCapacity] = useState(50);
  const [priority, setPriority] = useState("critical");
  const [model, setModel] = useState({ charge: 40, unmet: 0, hours: 0 });
  const [running, setRunning] = useState(false);
  const now = heartHour({ solar, demand, capacity, charge: Math.min(model.charge, capacity), priority });

  useEffect(() => {
    if (!running || model.hours >= 8) return undefined;
    const id = setInterval(() => {
      setModel((current) => {
        if (current.hours >= 8) return current;
        const step = heartHour({
          solar,
          demand,
          capacity,
          charge: Math.min(current.charge, capacity),
          priority,
        });
        return { charge: step.charge, unmet: current.unmet + step.unmet, hours: current.hours + 1 };
      });
    }, 700);
    return () => clearInterval(id);
  }, [running, solar, demand, capacity, priority, model.hours]);

  useEffect(() => {
    if (model.hours >= 8) setRunning(false);
  }, [model.hours]);

  function reset() {
    setRunning(false);
    setSolar(62);
    setDemand(70);
    setCapacity(50);
    setPriority("critical");
    setModel({ charge: 40, unmet: 0, hours: 0 });
  }

  return (
    <div className={`lab-sim${running ? " is-on" : ""}`}>
      <div className="lab-sim-controls">
        <Range label="Solar generation" value={solar} min={0} max={100} unit="" onChange={setSolar} />
        <Range label="Electricity demand" value={demand} min={0} max={100} unit="" onChange={setDemand} />
        <Range label="Battery capacity" value={capacity} min={10} max={100} unit="" onChange={setCapacity} />
        <Choices
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={[["critical", "Critical loads"], ["even", "Even share"], ["storage", "Protect storage"]]}
        />
        <TestBar running={running} onStart={() => setRunning((value) => !value)} onReset={reset} />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <svg className="lab-circuit" viewBox="0 0 260 72" aria-hidden="true">
          <path className="lab-flow" d="M16 36 H244" />
          <circle cx="16" cy="36" r="6" />
          <circle cx="244" cy="36" r="6" />
        </svg>
        <Meter label="Energy balance" value={now.balance} max={100} note="Supply minus demand this hour" />
        <Meter label="Battery charge" value={Math.min(model.charge, capacity)} max={capacity} note="Index, of the capacity set above" />
        <Meter label="Unmet this hour" value={now.unmet} note="Deficit the battery does not cover" />
        <Meter label="Unmet over the test" value={model.unmet} note={`${model.hours} of 8 modelled hours`} />
      </div>
    </div>
  );
}

function BrainSim() {
  const [emergency, setEmergency] = useState("heat");
  const [severity, setSeverity] = useState(3);
  const [alloc, setAlloc] = useState({ heat: 0, water: 0, energy: 0, air: 0 });
  const [running, setRunning] = useState(false);
  const result = brainModel({ emergency, severity, alloc });

  function setOne(key, value) {
    setAlloc((current) => {
      const others = RESPONSE_KEYS.reduce((sum, item) => sum + (item === key ? 0 : current[item]), 0);
      return { ...current, [key]: Math.max(0, Math.min(value, 12 - others)) };
    });
  }

  function reset() {
    setRunning(false);
    setEmergency("heat");
    setSeverity(3);
    setAlloc({ heat: 0, water: 0, energy: 0, air: 0 });
  }

  return (
    <div className={`lab-sim${running ? " is-on" : ""}`}>
      <div className="lab-sim-controls">
        <Choices
          label="Environmental emergency"
          value={emergency}
          onChange={setEmergency}
          options={Object.entries(EMERGENCIES).map(([id, item]) => [id, item.label])}
        />
        <Range label="Severity" value={severity} min={1} max={5} unit="" onChange={setSeverity} />
        {RESPONSE_KEYS.map((key) => (
          <Range
            key={key}
            label={`${RESPONSE_LABEL[key]} response`}
            value={alloc[key]}
            min={0}
            max={alloc[key] + result.remaining}
            unit=""
            onChange={(value) => setOne(key, value)}
          />
        ))}
        <TestBar running={running} onStart={() => setRunning((value) => !value)} onReset={reset} />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        {RESPONSE_KEYS.map((key) => (
          <Meter key={key} label={`${RESPONSE_LABEL[key]} risk`} value={result.risks[key]} note="Higher means more strain in the model" />
        ))}
        <Meter label="Resources left" value={result.remaining} max={12} note="Of 12 exhibit units" />
        <Meter label="Outcome score" value={result.outcome} note="Rises when the severe risks fall" />
      </div>
    </div>
  );
}

function KidneySim() {
  const [stages, setStages] = useState(2);
  const [flow, setFlow] = useState(55);
  const [condition, setCondition] = useState(80);
  const [running, setRunning] = useState(false);
  const result = kidneyModel({ stages, flow, condition });

  function reset() {
    setRunning(false);
    setStages(2);
    setFlow(55);
    setCondition(80);
  }

  return (
    <div className={`lab-sim${running ? " is-on" : ""}`}>
      <div className="lab-sim-controls">
        <Choices
          label="Filtration stages"
          value={String(stages)}
          onChange={(value) => setStages(Number(value))}
          options={[["1", "1 stage"], ["2", "2 stages"], ["3", "3 stages"]]}
        />
        <Range label="Flow rate" value={flow} min={15} max={100} unit="" onChange={setFlow} />
        <Range label="Filter condition" value={condition} min={0} max={100} unit="" onChange={setCondition} />
        <TestBar running={running} onStart={() => setRunning((value) => !value)} onReset={reset} />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <div className="lab-stages" aria-hidden="true">
          {[1, 2, 3].map((stage) => (
            <i key={stage} className={stage <= stages ? "is-on" : ""} style={{ "--fill": `${result.quality}%` }} />
          ))}
        </div>
        <Meter label="Recovery" value={result.recovery} note="Index, not a volume" />
        <Meter label="Pass time" value={result.time} max={20} note="Relative steps" />
        <Meter label="Water quality" value={result.quality} note="Falls when flow is too fast or the filter is worn" />
      </div>
    </div>
  );
}

function LiverSim() {
  const [placed, setPlaced] = useState({});
  const [picked, setPicked] = useState(null);
  const [audited, setAudited] = useState(false);
  const [running, setRunning] = useState(false);
  const score = liverScore(placed);
  const loose = LIVER_TOKENS.filter((token) => !placed[token.id]);

  function assign(stream) {
    if (!picked) return;
    setPlaced((current) => ({ ...current, [picked]: stream }));
    setPicked(null);
  }

  function reset() {
    setRunning(false);
    setAudited(false);
    setPlaced({});
    setPicked(null);
  }

  return (
    <div className={`lab-sim lab-sim-stack${running ? " is-on" : ""}`}>
      <p className="lab-hint">{picked ? "Now choose the stream for that token." : "Select a token, then a stream. Hazardous material is not a recovery."}</p>
      <div className="lab-tokens" role="list">
        {loose.map((token) => (
          <button key={token.id} type="button" role="listitem" aria-pressed={picked === token.id} onClick={() => setPicked(token.id)}>{token.label}</button>
        ))}
        {loose.length === 0 ? <p>Every token is in a stream.</p> : null}
      </div>
      <div className="lab-bins">
        {LIVER_STREAMS.map(([id, label]) => (
          <div key={id} className="lab-bin">
            <button type="button" onClick={() => assign(id)} disabled={!picked}>{label}</button>
            {LIVER_TOKENS.filter((token) => placed[token.id] === id).map((token) => (
              <button key={token.id} type="button" className={audited ? (LIVER_KEY[token.id] === id ? "is-placed is-right" : "is-placed is-wrong") : "is-placed"} onClick={() => {
                setPlaced((current) => {
                  const next = { ...current };
                  delete next[token.id];
                  return next;
                });
              }}
              >{token.label}</button>
            ))}
          </div>
        ))}
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <Meter label="Sorting accuracy" value={score.accuracy} note={`${score.placed} of 8 tokens placed`} />
        <Meter label="Contamination" value={score.contamination} note="Wrong tokens inside the useful streams" />
        <Meter label="Recovery" value={score.recovery} note="Correct useful tokens, out of all useful tokens" />
      </div>
      <TestBar running={running} onStart={() => { setAudited(true); setRunning((value) => !value); }} onReset={reset} startLabel="Run audit" />
    </div>
  );
}

function SkinSim() {
  const [sun, setSun] = useState(80);
  const [angle, setAngle] = useState(20);
  const [insulation, setInsulation] = useState(40);
  const [vent, setVent] = useState(30);
  const [running, setRunning] = useState(false);
  const result = skinModel({ sun, angle, insulation, vent });

  function reset() {
    setRunning(false);
    setSun(80);
    setAngle(20);
    setInsulation(40);
    setVent(30);
  }

  return (
    <div className={`lab-sim${running ? " is-on" : ""}`}>
      <div className="lab-sim-controls">
        <Range label="Sunlight" value={sun} min={0} max={100} unit="" onChange={setSun} />
        <Range label="Shading angle" value={angle} min={0} max={75} unit="°" onChange={setAngle} />
        <Range label="Insulation" value={insulation} min={0} max={100} unit="" onChange={setInsulation} />
        <Range label="Ventilation" value={vent} min={0} max={100} unit="" onChange={setVent} />
        <TestBar running={running} onStart={() => setRunning((value) => !value)} onReset={reset} />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <div className="lab-houses" aria-hidden="true">
          <div><b style={{ height: `${8 + result.fixed * 0.7}%` }} /><span>Fixed shell</span></div>
          <div><b className="is-adaptive" style={{ height: `${8 + result.adaptive * 0.7}%` }} /><span>THERMOSKIN</span></div>
        </div>
        <Meter label="Fixed shell heat" value={result.fixed} note="Ignores shade angle and ventilation" />
        <Meter label="THERMOSKIN heat" value={result.adaptive} note="Same sun. Shade, insulation and ventilation apply." />
      </div>
    </div>
  );
}

function DigestiveSim() {
  const [storage, setStorage] = useState(30);
  const [move, setMove] = useState(8);
  const [hour, setHour] = useState(0);
  const [running, setRunning] = useState(false);
  const run = useMemo(() => nourishRun({ storage, move }), [storage, move]);
  const frame = run.frames[Math.min(hour, run.frames.length - 1)];

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
  }

  return (
    <div className={`lab-sim${running ? " is-on" : ""}`}>
      <div className="lab-sim-controls">
        <ul className="lab-batches">
          {NOURISH_BATCHES.map((batch) => (
            <li key={batch.id}><b>{batch.label}</b><span>{batch.meals} meals · {batch.hours}h</span></li>
          ))}
        </ul>
        <Range label="Storage" value={storage} min={0} max={80} unit="" onChange={setStorage} />
        <Range label="Redistribution each hour" value={move} min={0} max={30} unit="" onChange={setMove} />
        <TestBar running={running} onStart={() => {
          if (running) setRunning(false);
          else {
            if (hour >= 7) setHour(0);
            setRunning(true);
          }
        }} onReset={reset} />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <p className="lab-hour">Hour {frame.hour} of 8 · {frame.stored} meals still held</p>
        <Meter label="Rescued by this hour" value={frame.rescued} max={70} note="Exhibit meals moved before the deadline" />
        <Meter label="Avoidable waste" value={frame.waste} max={70} note="Overflow plus meals that expired" />
        <Meter label="Rescued by hour 8" value={run.rescued} max={70} note="The full test, from the settings above" />
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
  const [running, setRunning] = useState(false);
  const plots = skeletonModel({ rain, drainage, grounds, shared });

  function cycle(index) {
    setGrounds((current) => current.map((ground, item) => {
      if (item !== index) return ground;
      return GROUNDS[(GROUNDS.indexOf(ground) + 1) % GROUNDS.length];
    }));
  }

  function reset() {
    setRunning(false);
    setRain(70);
    setDrainage(35);
    setGrounds(["low", "terrace", "high"]);
    setShared(false);
  }

  return (
    <div className={`lab-sim${running ? " is-on" : ""}`}>
      <div className="lab-sim-controls">
        <Range label="Rainfall" value={rain} min={0} max={100} unit="" onChange={setRain} />
        <Range label="Drainage" value={drainage} min={0} max={100} unit="" onChange={setDrainage} />
        <div className="lab-choice" role="group" aria-label="Plot ground">
          {grounds.map((ground, index) => (
            <button key={index} type="button" onClick={() => cycle(index)}>Plot {index + 1}: {GROUND_LABEL[ground]}</button>
          ))}
        </div>
        <Choices label="Layout" value={shared ? "shared" : "isolated"} onChange={(value) => setShared(value === "shared")} options={[["isolated", "Isolated plots"], ["shared", "Shared drainage"]]} />
        <TestBar running={running} onStart={() => setRunning((value) => !value)} onReset={reset} />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <div className="lab-plots" aria-hidden="true">
          {plots.map((plot, index) => (
            <div key={index}><b style={{ height: `${plot.exposure}%` }} /><span>{plot.label}</span></div>
          ))}
        </div>
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
  const [running, setRunning] = useState(false);
  const result = lungModel({ particles, efficiency, fan, condition });
  const dots = 12;
  const removedDots = Math.round((result.removed / Math.max(particles, 1)) * dots);

  function reset() {
    setRunning(false);
    setParticles(70);
    setEfficiency(65);
    setFan(50);
    setCondition(80);
  }

  return (
    <div className={`lab-sim${running ? " is-on" : ""}`}>
      <div className="lab-sim-controls">
        <Range label="Particle concentration" value={particles} min={0} max={100} unit="" onChange={setParticles} />
        <Range label="Filter efficiency" value={efficiency} min={0} max={100} unit="" onChange={setEfficiency} />
        <Range label="Fan speed" value={fan} min={0} max={100} unit="" onChange={setFan} />
        <Range label="Filter condition" value={condition} min={0} max={100} unit="" onChange={setCondition} />
        <TestBar running={running} onStart={() => setRunning((value) => !value)} onReset={reset} />
      </div>
      <div className="lab-sim-read" aria-live="polite">
        <div className="lab-particles" aria-hidden="true">
          {Array.from({ length: dots }, (_, index) => (
            <i key={index} className={index < removedDots ? "is-caught" : ""} />
          ))}
        </div>
        <Meter label="Particles removed" value={result.removed} note="Cannot exceed what entered" />
        <Meter label="Particles remaining" value={result.remaining} note="What the filter did not catch" />
        <Meter label="Airflow" value={result.airflow} note="Fan speed reduced by a worn filter" />
      </div>
    </div>
  );
}

const SIMS = {
  heart: HeartSim,
  brain: BrainSim,
  kidneys: KidneySim,
  liver: LiverSim,
  skin: SkinSim,
  digestive: DigestiveSim,
  skeleton: SkeletonSim,
  lungs: LungSim,
};

export function OrganBoard({ id, name }) {
  const copy = BOARDS[id];
  const Sim = SIMS[id];

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
      <Fold title="Biological inspiration">{copy.inspiration}</Fold>
      <Fold title="Principle">{copy.principle}</Fold>
      <Fold title="Oman problem">{copy.problem}</Fold>
      <Fold title="Oman solution">{copy.solution}</Fold>
      <section id="lab-sim" className="lab-sim-block" aria-label="Interactive simulation">
        <h3>Interactive simulation</h3>
        <p className="lab-sim-flag">Simulation assumption. Every figure is an exhibit index, not a measurement.</p>
        <Sim />
      </section>
      <Fold title="Working-model assumptions">{copy.assumptions}</Fold>
    </article>
  );
}
