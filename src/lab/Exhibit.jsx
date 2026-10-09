import { Invention, Slider } from "./Scenes.jsx";

const METERS = {
  brain: [["coolingDemand", "Cooling pull"], ["shortage", "Energy gap"], ["waterGap", "Water gap"]],
  heart: [["generation", "Generation"], ["storage", "Storage"], ["shortage", "Energy gap"]],
  lungs: [["exchange", "Exchange"], ["shortage", "Energy gap"]],
  kidneys: [["recoveredWater", "Recovered"], ["waterGap", "Still unmet"], ["shortage", "Energy draw"]],
  liver: [["recoveredMaterial", "Recovered"], ["disposed", "Remainder"]],
  skin: [["heatLoad", "Heat getting in"], ["coolingDemand", "Cooling demand"]],
  digestive: [["recoveredMaterial", "Returned"], ["disposed", "Remainder"]],
  skeleton: [["structuralStress", "Stress"]],
  blood: [["flow", "Circulation"], ["shortage", "Still short"], ["storage", "Held aside"]],
};

const PRESETS = {
  brain: [["Mild day", { temperature: 40, waterDemand: 35, energyDemand: 30, airQuality: 70 }], ["Spike", { temperature: 90, waterDemand: 85, energyDemand: 80, airQuality: 25 }]],
  heart: [["Cloudy, heavy use", { sun: 12, energyDemand: 88, temperature: 80 }], ["Bright surplus", { sun: 92, energyDemand: 28, temperature: 50 }]],
  lungs: [["Dust storm", { dust: 90, humidity: 70, airQuality: 18, airflow: 20 }], ["Clear, moving air", { dust: 10, humidity: 30, airQuality: 85, airflow: 80 }]],
  kidneys: [["Light contamination", { contamination: 12, waterDemand: 40, energyDemand: 40 }], ["Heavy contamination", { contamination: 94, waterDemand: 86, energyDemand: 70 }]],
  liver: [["Light mix", { wasteMix: 25 }], ["Heavy mix", { wasteMix: 90 }]],
  skin: [["Cool night", { temperature: 28, sun: 10, hour: 2, orientation: 20 }], ["Extreme afternoon", { temperature: 92, sun: 90, hour: 14, orientation: 85 }]],
  digestive: [["Light organic load", { wasteMix: 20, waterDemand: 30 }], ["Heavy organic load", { wasteMix: 88, waterDemand: 70 }]],
  skeleton: [["Light load", { structuralLoad: 20, temperature: 30 }], ["Heat and heavy load", { structuralLoad: 90, temperature: 90 }]],
  blood: [["Quiet demand", { energyDemand: 28, waterDemand: 30, sun: 80 }], ["Split shortage", { energyDemand: 92, waterDemand: 84, sun: 18 }]],
};

export function Workbench({ organId, controls, result, bare, local, onChange, onToggle }) {
  const on = local.systems[organId];
  return (
    <div className="nabd-work">
      <div className="nabd-work-head">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sand">Working model · simulation assumption</p>
        <button type="button" className={`nabd-switch ${on ? "is-on" : ""}`} aria-pressed={on} onClick={onToggle}>
          {on ? "Invention on" : "Invention off"}
        </button>
      </div>
      <Invention organ={{ id: organId }} result={result} local={local} />
      <div className="nabd-meters">
        {(METERS[organId] ?? []).map(([key, label]) => (
          <div key={key} className="nabd-meter-row">
            <span>{label}</span>
            <b style={{ "--fill": `${result[key]}%` }} />
            <em>{result[key]}</em>
          </div>
        ))}
      </div>
      <div className="nabd-work-controls">
        {(PRESETS[organId] ?? []).map(([label, patch]) => (
          <button key={label} type="button" className="rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-mist hover:border-bone hover:text-bone" onClick={() => Object.entries(patch).forEach(([key, value]) => onChange(key, value))}>
            {label}
          </button>
        ))}
        {controls.map((field) => (
          <Slider key={field} field={field} value={local[field]} onChange={onChange} />
        ))}
      </div>
      <p className="text-sm text-dim">With this invention the model reads {result.state}. Without it, {bare.state}. Neither number is a measured saving.</p>
    </div>
  );
}
