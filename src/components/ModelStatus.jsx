import { ACTIONS } from "../data/content.js";
import { useSystem } from "../simulation/SystemContext.jsx";

export function ModelStatus() {
  const { isReference, scenario, actions, reset } = useSystem();
  const chosen = actions
    .map((id) => ACTIONS.find((item) => item.id === id)?.label)
    .filter(Boolean);

  return (
    <div className="status">
      <p>
        <span>Model</span>
        {isReference ? "Reference condition" : "Adjusted condition"}
        {scenario ? ` · Scenario ${scenario.code}` : ""}
        {chosen.length ? ` · ${chosen.join(" · ")}` : ""}
      </p>
      <button type="button" onClick={reset}>
        Reset the model
      </button>
    </div>
  );
}

export function IndexReadout({ label, hint, value, tone = "paper", note = "Model index" }) {
  const safe = Math.round(value);
  return (
    <div className={`readout tone-${tone}`}>
      <div className="readout-top">
        <span>{label}</span>
        <strong>{safe}</strong>
      </div>
      <div className="meter" aria-hidden="true">
        <i style={{ width: `${safe}%` }} />
      </div>
      <div className="readout-foot">
        <span>{hint}</span>
        <span>{note}</span>
      </div>
    </div>
  );
}
