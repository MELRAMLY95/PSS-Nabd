import { PHASES, READOUTS } from "../data/content.js";
import { couplingLine, organLoads } from "../simulation/model.js";
import { useSystem } from "../simulation/SystemContext.jsx";
import { IndexReadout, ModelStatus } from "./ModelStatus.jsx";

export function DigitalTwin() {
  const { live, sim, inputs, running, setRunning } = useSystem();
  const phase = PHASES[sim.phase];
  const loads = organLoads(sim, inputs);

  return (
    <section id="twin" className="section" aria-labelledby="twin-title">
      <p className="kicker">
        <span>06</span>
        <span>Digital twin</span>
      </p>
      <h2 id="twin-title">Watch the chain settle.</h2>
      <p className="prose">
        These are model indices, not measurements from Oman and not a medical reading. Change a demand and the parts settle together. Recovery can hold water and spend energy at the same time.
      </p>
      <ModelStatus />
      <div className="twin">
        <div className={`twin-figure phase-${sim.phase}`}>
          <ul className="load-row">
            <li>Brain {Math.round(loads.brain)}</li>
            <li>Heart {Math.round(loads.heart)}</li>
            <li>Lungs {Math.round(loads.lungs)}</li>
            <li>Kidneys {Math.round(loads.kidneys)}</li>
            <li>Liver {Math.round(loads.liver)}</li>
            <li>Skin {Math.round(loads.skin)}</li>
          </ul>
        </div>
        <div className="twin-readouts">
          {READOUTS.map((item) => (
            <IndexReadout
              key={item.key}
              label={item.label}
              hint={item.hint}
              tone={item.tone}
              value={live[item.key]}
            />
          ))}
          <div className="readout tone-health">
            <div className="readout-top">
              <span>System health</span>
              <strong>{phase.label}</strong>
            </div>
            <p>{phase.line}</p>
          </div>
        </div>
      </div>
      <div className="twin-foot">
        <p>{couplingLine(sim)}</p>
        <button type="button" aria-pressed={running} onClick={() => setRunning((value) => !value)}>
          {running ? "Pause the model" : "Run the model"}
        </button>
      </div>
    </section>
  );
}
