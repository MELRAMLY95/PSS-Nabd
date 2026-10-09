import { useMemo, useState } from "react";
import { INITIAL, simulate } from "../lab/engine.js";
import { SCENARIOS, STATIONS } from "./copy.js";

export function Research({ onOpen }) {
  const [id, setId] = useState(STATIONS[3].id);
  const station = STATIONS.find((item) => item.id === id);
  return (
    <div className="nil-wing">
      <div className="nil-index" aria-label="Research subjects">
        {STATIONS.map((item) => (
          <button key={item.id} type="button" aria-pressed={item.id === id} onClick={() => setId(item.id)}>
            <span>{item.index}</span>{item.name}
          </button>
        ))}
      </div>
      <article className="nil-dossier">
        <p className="nil-kicker">Innovation lab · {station.name}</p>
        <h2>{station.title}</h2>
        <section>
          <p className="nil-kicker">What nature does</p>
          <p className="nil-lead">{station.system}</p>
        </section>
        <section>
          <p className="nil-kicker">What we observed</p>
          <p>{station.observe}</p>
        </section>
        <section>
          <p className="nil-kicker">Principle extracted</p>
          <p className="nil-lead">{station.principleName}</p>
          <p>{station.principle}</p>
        </section>
        <section>
          <p className="nil-kicker">Engineering question</p>
          <p>{station.question}</p>
        </section>
        <section>
          <p className="nil-kicker">Concept for Oman</p>
          <p>{station.challengeName}. {station.path[5][1]}.</p>
        </section>
        <section>
          <p className="nil-kicker">Prototype status</p>
          <p>Working exhibition model. The controls change a calculated state. Nothing here is a built national system.</p>
        </section>
        <section>
          <p className="nil-kicker">Limitation</p>
          <p>{station.limit}</p>
        </section>
        <button type="button" className="nil-enter" onClick={() => onOpen(station.id)}>Approach this system</button>
      </article>
    </div>
  );
}

export function Oman({ onOpen }) {
  return (
    <div className="nil-wing nil-oman">
      <div>
        <p className="nil-kicker">Oman 2040</p>
        <h2>Separate inventions, one metabolism.</h2>
        <p className="nil-lead">Each system answers a different biological lesson. None of them is enough alone. Heat changes cooling. Cooling spends energy. Recovery spends energy. Exchange and structure feel the same day.</p>
      </div>
      <ol>
        {STATIONS.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onOpen(item.id)}>
              <span>{item.name}</span>
              <b>{item.title}</b>
              <em>{item.principleName}</em>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Prototypes({ onOpen }) {
  return (
    <div className="nil-wing nil-proto">
      <div>
        <p className="nil-kicker">Prototypes</p>
        <h2>Models in the lab. Not systems in the country.</h2>
      </div>
      <ul>
        {STATIONS.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onOpen(item.id)}>
              <span>{item.index} {item.name}</span>
              <b>{item.title}</b>
              <em>{item.limit}</em>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const TOGGLES = STATIONS.map((item) => [item.id, item.title]);

export function Build() {
  const [world, setWorld] = useState(() => ({ ...INITIAL, systems: { ...INITIAL.systems } }));
  const [scenario, setScenario] = useState("heat");
  const result = useMemo(() => simulate(world), [world]);

  function choose(next) {
    const found = SCENARIOS.find((item) => item.id === next);
    setScenario(next);
    setWorld((state) => ({ ...state, ...found.patch }));
  }

  return (
    <div className="nil-wing nil-build">
      <div>
        <p className="nil-kicker">Build Oman 2040</p>
        <h2>Set the day. Turn inventions on. Watch the chain.</h2>
        <div className="nil-scenarios">
          {SCENARIOS.map((item) => (
            <button key={item.id} type="button" aria-pressed={scenario === item.id} onClick={() => choose(item.id)}>{item.name}</button>
          ))}
        </div>
        <p className={`nil-state is-${result.state.toLowerCase()}`}>{result.state}</p>
        <p className="nil-quiet">Calculated from heat, energy gap, unmet water, exchange, remainder and structural stress. Not a random label.</p>
        <ol className="nil-chain">
          {result.chain.map((line) => <li key={line}>{line}</li>)}
        </ol>
      </div>
      <div>
        <p className="nil-kicker">Inventions in the model</p>
        <div className="nil-toggles">
          {TOGGLES.map(([id, title]) => (
            <button
              key={id}
              type="button"
              aria-pressed={world.systems[id]}
              onClick={() => setWorld((state) => ({ ...state, systems: { ...state.systems, [id]: !state.systems[id] } }))}
            >
              <b>{title}</b>
              <span>{world.systems[id] ? "On" : "Off"}</span>
            </button>
          ))}
        </div>
        <div className="nil-readings">
          {[
            ["heatLoad", "Heat getting in"],
            ["coolingDemand", "Cooling demand"],
            ["shortage", "Energy gap"],
            ["waterGap", "Water unmet"],
            ["exchange", "Air exchange"],
            ["structuralStress", "Structural stress"],
          ].map(([key, label]) => (
            <p key={key}><span>{label}</span><b>{result[key]}</b></p>
          ))}
        </div>
      </div>
    </div>
  );
}
