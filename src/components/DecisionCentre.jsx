import { useState } from "react";
import { DECISION_SCENARIOS, METRIC_LABELS, SKILL_LABELS } from "../simulation/decisions.js";
import { useSystem } from "../simulation/SystemContext.jsx";

export function DecisionCentre() {
  const { shocks, choiceMap, decision, lastEvent, openStress, commitChoice, reset } = useSystem();
  const [openId, setOpenId] = useState(DECISION_SCENARIOS[0].id);
  const open = DECISION_SCENARIOS.find((item) => item.id === openId) ?? DECISION_SCENARIOS[0];
  const chosen = choiceMap[open.id];

  return (
    <section id="decide" className="section" aria-labelledby="decide-title">
      <p className="kicker">
        <span>07</span>
        <span>Decision centre</span>
      </p>
      <h2 id="decide-title">You are responsible for the organism.</h2>
      <p className="prose">
        Each choice stays. A later choice does not erase an earlier one, unless you replace the choice inside the same scenario. Nothing here is marked correct.
      </p>

      <p className="resilience-read">
        System resilience <strong>{Math.round(decision.resilience)}</strong>
      </p>

      <div className="metric-grid">
        {METRIC_LABELS.map(([key, label]) => (
          <p key={key}>
            <span>{label}</span>
            <strong>{Math.round(decision.metrics[key])}</strong>
          </p>
        ))}
      </div>

      <div className="decide-layout">
        <ul className="choice-list">
          {DECISION_SCENARIOS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={open.id === item.id ? "is-active" : ""}
                aria-pressed={open.id === item.id}
                onClick={() => {
                  setOpenId(item.id);
                  openStress(item.id);
                }}
              >
                <strong>{item.title}</strong>
                <em>{shocks.includes(item.id) ? "Pressure is on the body" : "Not yet applied"}</em>
              </button>
            </li>
          ))}
        </ul>
        <div>
          <h3>{open.title}</h3>
          <p className="prose">{open.problem}</p>
          <ul className="choice-list">
            {open.choices.map((choice) => (
              <li key={choice.id}>
                <button
                  type="button"
                  className={chosen === choice.id ? "is-active" : ""}
                  aria-pressed={chosen === choice.id}
                  onClick={() => commitChoice(open.id, choice.id)}
                >
                  <strong>{choice.title}</strong>
                  <em>{choice.note}</em>
                </button>
              </li>
            ))}
          </ul>
          {lastEvent?.because && <p className="prose">{lastEvent.because}</p>}
        </div>
      </div>

      <h3>Your Oman 2040</h3>
      <p className="prose">{decision.verdict}</p>
      <ul className="skill-bars">
        {SKILL_LABELS.map(([key, label]) => (
          <li key={key}>
            <span>{label}</span>
            <span>
              <i style={{ width: `${decision.skills[key]}%` }} />
            </span>
            <strong>{Math.round(decision.skills[key])}</strong>
          </li>
        ))}
      </ul>
      <button type="button" onClick={reset}>
        Clear the record
      </button>
    </section>
  );
}
