import { ACTIONS, PHASES, SCENARIOS, SKILLS } from "../data/content.js";
import { narrate } from "../simulation/model.js";
import { useSystem } from "../simulation/SystemContext.jsx";
import { ModelStatus } from "./ModelStatus.jsx";

const ORGAN_FOR = {
  water: "kidneys",
  heat: "skin",
  energy: "heart",
  waste: "liver",
  limited: "brain",
  recovery: "kidneys",
  renewable: "heart",
  reduce: "brain",
  efficiency: "lungs",
  storage: "heart",
  distribution: "heart",
  innovation: "brain",
};

const DELTAS = [
  ["water", "Water"],
  ["energy", "Energy"],
  ["waste", "Waste"],
  ["service", "Demand met"],
  ["stress", "Stress"],
];

export function Challenge() {
  const {
    scenario,
    actions,
    untouched,
    steady,
    chooseScenario,
    toggleAction,
    notice,
    skillId,
    reset,
    setOrganId,
    sim,
  } = useSystem();
  const skill = SKILLS.find((item) => item.id === skillId);
  const lines = scenario || actions.length ? narrate(untouched, steady, actions) : [];

  return (
    <section id="challenge" className="section" aria-labelledby="challenge-title">
      <p className="kicker">
        <span>07</span>
        <span>The 2040 challenge</span>
      </p>
      <h2 id="challenge-title">You are the brain.</h2>
      <p className="prose">
        Water demand has increased while energy is under pressure. Improve water security without an unsustainable rise in energy use. There is no single perfect action. Two choices at a time, and the second problem is yours to face.
      </p>
      <ModelStatus />

      <div className="challenge-grid">
        <div>
          <h3>Scenario</h3>
          <ul className="choice-list">
            {SCENARIOS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={scenario?.id === item.id ? "is-active" : ""}
                  aria-pressed={scenario?.id === item.id}
                  onClick={() => {
                    chooseScenario(item.id);
                    setOrganId(ORGAN_FOR[item.id]);
                  }}
                >
                  <span>{item.code}</span>
                  <strong>{item.title}</strong>
                  <em>{item.detail}</em>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Intervention</h3>
          <ul className="choice-list">
            {ACTIONS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={actions.includes(item.id) ? "is-active" : ""}
                  aria-pressed={actions.includes(item.id)}
                  onClick={() => {
                    toggleAction(item.id);
                    setOrganId(ORGAN_FOR[item.id]);
                  }}
                >
                  <strong>{item.label}</strong>
                  <em>{item.note}</em>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="consequence" aria-live="polite">
        <h3>Consequence</h3>
        {notice && <p className="notice">{notice}</p>}
        {skill && (
          <p className="lens">
            Lens · {skill.name}. {skill.effect}
          </p>
        )}
        {!scenario && actions.length === 0 ? (
          <p>Choose a scenario. The model will show the pressure before you answer it.</p>
        ) : (
          <>
            <dl className="deltas">
              {DELTAS.map(([key, label]) => {
                const delta = Math.round(steady[key] - untouched[key]);
                return (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>
                      {Math.round(steady[key])}
                      <span>{delta > 0 ? `+${delta}` : delta}</span>
                    </dd>
                  </div>
                );
              })}
              <div>
                <dt>Health</dt>
                <dd>
                  {PHASES[untouched.phase].label}
                  <span>to {PHASES[steady.phase].label}</span>
                </dd>
              </div>
            </dl>
            {Math.abs(sim.stress - steady.stress) > 4 && (
              <p>The body is still settling toward this outcome.</p>
            )}
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </>
        )}
        <button type="button" onClick={reset}>
          Reset the decision
        </button>
      </div>
    </section>
  );
}
