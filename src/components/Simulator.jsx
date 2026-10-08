import { useEffect, useMemo, useRef, useState } from "react";
import { evaluate, FLOWS, MAP, opening, READINGS, SCENARIOS } from "../simulation/living.js";
import { SystemMap } from "./SystemMap.jsx";

const OPENING = opening();

function useCount(target) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = valueRef.current;
    if (reduce || from === target) {
      valueRef.current = target;
      setValue(target);
      return undefined;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 700);
      const next = from + (target - from) * (1 - (1 - t) ** 3);
      valueRef.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

export function Simulator() {
  const [choices, setChoices] = useState({});
  const [focus, setFocus] = useState("kidneys");
  const [flow, setFlow] = useState(null);
  const [scenarioId, setScenarioId] = useState("water");
  const [beat, setBeat] = useState(-1);
  const [revised, setRevised] = useState(false);
  const result = useMemo(() => evaluate(choices), [choices]);
  const shown = useCount(result.resilience);
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0];
  const chosen = scenario.choices.find((item) => item.id === choices[scenario.id]);
  const playing = chosen && !revised;
  const focused = MAP.find((item) => item.id === focus) ?? MAP[5];
  const nextId = SCENARIOS.find((item) => !choices[item.id])?.id;

  useEffect(() => {
    if (!playing) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setBeat(chosen.cascade.length - 1);
      return undefined;
    }
    setBeat(0);
    const timers = chosen.cascade.map((_, index) => window.setTimeout(() => setBeat(index), index * 850));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [playing, chosen]);

  const commit = (choiceId) => {
    setChoices((current) => ({ ...current, [scenario.id]: choiceId }));
    setFocus(scenario.system);
    setRevised(false);
    setBeat(0);
  };

  return (
    <div className="oman">
      <header className="top">
        <a href="#hero">Living Oman 2040</a>
        <nav>
          <a href="#problem">Problem</a>
          <a href="#blueprint">Blueprint</a>
          <a href="#living">System</a>
          <a href="#decide">Decide</a>
          <a href="#outcome">2040</a>
        </nav>
        <a className="go" href="#decide">Become the decision-maker</a>
      </header>

      <section className="hero" id="hero">
        <div>
          <p className="kicker">Oman Vision 2040</p>
          <h1>What if the systems of Oman could think, adapt, circulate resources and recover like a living organism?</h1>
          <div className="actions">
            <a className="go" href="#decide">Enter the decision centre</a>
            <a className="text" href="#problem">Why a living system</a>
          </div>
          <p className="lede">
            This is a sustainability simulator. You are the decision-maker. The figure is only the map.
          </p>
        </div>
        <SystemMap health={OPENING.health} active={focus} onPick={setFocus} />
      </section>

      <section className="chapter" id="problem">
        <p className="kicker">The problem</p>
        <h2>Most systems take, use, and throw away.</h2>
        <div className="paths">
          <p className="struck"><span>Extract</span><span>Consume</span><span>Discard</span></p>
          <p className="living-path"><span>Sense</span><span>Decide</span><span>Distribute</span><span>Recover</span><span>Adapt</span></p>
        </div>
        <p className="lede">A living system does not end at the discard. It notices the shortage, moves resources, recovers what it can, and changes when conditions change.</p>
      </section>

      <section className="chapter split" id="blueprint">
        <div>
          <p className="kicker">The biological blueprint</p>
          <h2>Nature already runs this kind of system.</h2>
          <p className="lede">{focused.line}</p>
          <ul className="index">
            {MAP.map((item) => (
              <li key={item.id}>
                <button type="button" className={focus === item.id ? "is-on" : ""} onClick={() => setFocus(item.id)}>
                  {item.env}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <SystemMap health={result.health} active={focus} onPick={setFocus} />
      </section>

      <section className="chapter" id="living">
        <p className="kicker">The living system</p>
        <h2>The same figure, read as resources.</h2>
        <p className="lede">Water, energy, air, materials, food, and information move through one system. Choose a flow. The map changes. The subject stays the resource.</p>
        <div className="flows" role="group" aria-label="Resource flows">
          {FLOWS.map((item) => (
            <button key={item} type="button" aria-pressed={flow === item} className={flow === item ? "is-on" : ""} onClick={() => setFlow(flow === item ? null : item)}>
              {item}
            </button>
          ))}
        </div>
        <SystemMap health={result.health} active={focus} flow={flow} onPick={setFocus} />
      </section>

      <section className="chapter" id="twin">
        <p className="kicker">The digital twin</p>
        <h2>The numbers are the system, not a score.</h2>
        <Readings result={result} shown={shown} />
      </section>

      <section className="chapter decide" id="decide">
        <p className="kicker">You are now the decision-maker</p>
        <div className="steps" role="tablist">
          {SCENARIOS.map((item, index) => (
            <button key={item.id} type="button" aria-selected={item.id === scenario.id} onClick={() => { setScenarioId(item.id); setRevised(false); }}>
              <span>0{index + 1}</span>
              {item.kicker}
            </button>
          ))}
        </div>
        <p className="kicker">{scenario.kicker}</p>
        <h2>{scenario.title}</h2>
        <p className="oman-line">{scenario.oman}</p>
        <div className="decide-grid">
          <div>
            {playing ? (
              <div className="response">
                <p className="kicker">The system is responding</p>
                <h3>{chosen.title}</h3>
                <ol className="cascade">
                  {chosen.cascade.map(([kicker, label], index) => (
                    <li key={label} className={index <= beat ? "on" : ""}>
                      <span>{kicker}</span>
                      <strong>{label}</strong>
                    </li>
                  ))}
                </ol>
                <Delta effects={chosen.effects} />
                <div className="actions">
                  <button type="button" className="text" onClick={() => setRevised(true)}>Revise this decision</button>
                  {nextId && (
                    <button type="button" className="go" onClick={() => { setScenarioId(nextId); setRevised(false); }}>
                      {nextId === "repair" ? "Repair the system" : "Face the next pressure"}
                    </button>
                  )}
                  {!nextId && <a className="go" href="#outcome">See the future you created</a>}
                </div>
              </div>
            ) : (
              <div className="options">
                {scenario.choices.map((choice) => (
                  <button key={choice.id} type="button" className="option" onClick={() => commit(choice.id)}>
                    <em>{choice.mark}</em>
                    <strong>{choice.title}</strong>
                    <span>{choice.note}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <SystemMap health={result.health} active={playing ? scenario.system : focus} flow={flow} onPick={setFocus} />
        </div>
      </section>

      <section className="chapter" id="cascade">
        <p className="kicker">The cascade</p>
        <h2>{result.applied.length ? "One decision does not stay in one place." : "A decision has not moved through the system yet."}</h2>
        {result.applied.length > 0 && (
          <ol className="history">
            {result.applied.map(({ scenario: item, choice }) => (
              <li key={choice.id}>
                <span>{item.kicker}</span>
                <strong>{choice.title}</strong>
                <em>{choice.cascade[2][1]}</em>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="chapter outcome" id="outcome">
        <p className="kicker">Your Oman 2040</p>
        <h2>The future you created</h2>
        <p className="lede">{result.verdict}</p>
        <Readings result={result} shown={shown} />
        {result.skills.length > 0 && (
          <p className="skills">Shown through the decisions: {result.skills.join(" · ")}</p>
        )}
        <button
          type="button"
          className="text"
          onClick={() => {
            setChoices({});
            setScenarioId("water");
            setBeat(-1);
            setRevised(false);
          }}
        >
          Begin again
        </button>
        <p className="fine">These figures are the state of this simulator. They are not official statistics for Oman.</p>
      </section>

      <aside className="livebar">
        <span>System resilience <strong>{Math.round(shown)}</strong></span>
        <span>{result.phase}</span>
        <span>{result.applied.length} decision{result.applied.length === 1 ? "" : "s"}</span>
        <a href="#decide">Decide</a>
      </aside>
    </div>
  );
}

function Readings({ result, shown }) {
  const rows = [["resilience", "System resilience", shown], ...READINGS.map(([key, label]) => [key, label, result.metrics[key]])];
  return (
    <ul className="readings">
      {rows.map(([key, label, value]) => (
        <li key={key}>
          <span>{label}</span>
          <strong>{Math.round(value)}</strong>
          <i style={{ width: `${Math.max(6, Math.min(100, value))}%` }} />
        </li>
      ))}
    </ul>
  );
}

function Delta({ effects }) {
  const up = [];
  const down = [];
  Object.entries(effects).forEach(([key, value]) => {
    if (!value) return;
    const name = READINGS.find(([id]) => id === key)?.[1] || (key === "pressure" ? "System pressure" : key);
    const adverse = key === "pressure" ? value > 0 : value < 0;
    const arrow = `${value > 0 ? "up" : "down"}`;
    (adverse ? down : up).push(`${name} ${arrow}`);
  });
  return (
    <p className="delta">
      {up.length > 0 && <span className="up">{up.join(" · ")}</span>}
      {down.length > 0 && <span className="down">{down.join(" · ")}</span>}
    </p>
  );
}
