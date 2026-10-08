import { LAB_FIELDS, PHASES } from "../data/content.js";
import { couplingLine } from "../simulation/model.js";
import { useSystem } from "../simulation/SystemContext.jsx";
import { IndexReadout, ModelStatus } from "./ModelStatus.jsx";

export function InnovationLab() {
  const { inputs, setReference, steady, reset } = useSystem();
  const phase = PHASES[steady.phase];

  return (
    <section id="lab" className="section" aria-labelledby="lab-title">
      <p className="kicker">
        <span>12</span>
        <span>Innovation lab</span>
      </p>
      <h2 id="lab-title">What if?</h2>
      <p className="prose">
        Move one condition and the rest of the system answers. More recovery can hold water and spend energy. Heat raises both demands. Nothing moves alone.
      </p>
      <ModelStatus />
      <div className="lab">
        <div className="sliders">
          {LAB_FIELDS.map((field) => (
            <label key={field.key}>
              <span className="slider-top">
                <span>{field.label}</span>
                <span>{inputs[field.key]}</span>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={inputs[field.key]}
                style={{ "--p": `${inputs[field.key]}%` }}
                aria-valuetext={`${inputs[field.key]} of 100`}
                onChange={(event) => setReference(field.key, event.target.value)}
              />
              <span className="slider-note">{field.note}</span>
            </label>
          ))}
          <button type="button" onClick={reset}>
            Reset the variables
          </button>
        </div>
        <div className="lab-response">
          <p className="phase-name">{phase.label}</p>
          <p>{couplingLine(steady)}</p>
          <IndexReadout label="Water" hint="Available" tone="water" value={steady.water} />
          <IndexReadout label="Energy" hint="Available" tone="energy" value={steady.energy} />
          <IndexReadout label="Waste" hint="Burden" tone="recovery" value={steady.waste} />
          <IndexReadout label="Demand met" hint="Service" tone="paper" value={steady.service} />
        </div>
      </div>
    </section>
  );
}
