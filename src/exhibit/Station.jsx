import { useMemo } from "react";
import { Invention, Slider } from "../lab/Scenes.jsx";
import { INITIAL, simulate } from "../lab/engine.js";

const MODES = [
  ["biology", "Biology"],
  ["principle", "Principle"],
  ["innovation", "Innovation"],
];

export function Station({ station, mode, onMode, bench, onBench, onClose }) {
  const withConcept = useMemo(
    () => simulate({ ...bench, systems: { ...INITIAL.systems, [station.id]: true } }),
    [bench, station.id],
  );
  const without = useMemo(
    () => simulate({ ...bench, systems: { ...INITIAL.systems, [station.id]: false } }),
    [bench, station.id],
  );
  const live = bench.systems[station.id] ? withConcept : without;

  return (
    <aside className="nil-board" aria-label={`${station.name} exhibition`}>
      <div className="nil-board-top">
        <p className="nil-kicker">{station.index} · {station.name}</p>
        <button type="button" className="nil-back" onClick={onClose}>Return to the hall</button>
      </div>
      <h2>{station.title}</h2>
      <div className="nil-modes" role="tablist" aria-label="View">
        {MODES.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} className={mode === id ? "is-on" : ""} onClick={() => onMode(id)}>
            {label}
          </button>
        ))}
      </div>

      {mode === "biology" && (
        <div className="nil-copy">
          <p className="nil-kicker">Biological system</p>
          <p className="nil-lead">{station.system}</p>
          <p>{station.observe}</p>
          <p className="nil-quiet">The organ is the inspiration. It is not the invention.</p>
        </div>
      )}

      {mode === "principle" && (
        <div className="nil-copy">
          <p className="nil-kicker">Biological principle</p>
          <p className="nil-lead">{station.principleName}</p>
          <p>{station.principle}</p>
          <ol className="nil-path">
            {station.path.map(([label, text]) => (
              <li key={label}>
                <span>{label}</span>
                <b>{text}</b>
              </li>
            ))}
          </ol>
        </div>
      )}

      {mode === "innovation" && (
        <div className="nil-copy">
          <p className="nil-kicker">Oman challenge · {station.challengeName}</p>
          <p className="nil-lead">{station.question}</p>
          {station.beyond && <p>{station.beyond}</p>}
          <div className="nil-compare">
            {station.readings.slice(0, 2).map(([key, label]) => (
              <div key={key}>
                <span>{label}</span>
                <b>{withConcept[key]}</b>
                <em>without the concept {without[key]}</em>
              </div>
            ))}
          </div>
          <div className="nil-sim">
            <div className="nil-sim-head">
              <p className="nil-kicker">Simulation</p>
              <button
                type="button"
                className={bench.systems[station.id] ? "is-on" : ""}
                aria-pressed={bench.systems[station.id]}
                onClick={() => onBench((state) => ({
                  ...state,
                  systems: { ...state.systems, [station.id]: !state.systems[station.id] },
                }))}
              >
                {bench.systems[station.id] ? "Concept running" : "Concept off"}
              </button>
            </div>
            <Invention organ={{ id: station.id }} result={live} local={{ ...bench, systems: { ...INITIAL.systems, [station.id]: bench.systems[station.id] } }} />
            <div className="nil-readings">
              {station.readings.map(([key, label]) => (
                <p key={key}><span>{label}</span><b>{live[key]}</b></p>
              ))}
            </div>
            <div className="nil-sliders">
              {station.controls.map((field) => (
                <Slider key={field} field={field} value={bench[field]} onChange={(key, value) => onBench((state) => ({ ...state, [key]: value }))} />
              ))}
            </div>
            <p className="nil-quiet">{station.limit}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
