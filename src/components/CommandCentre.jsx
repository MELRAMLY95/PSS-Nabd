import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_ORGANS, DECISION_SCENARIOS, METRIC_LABELS, SKILL_LABELS } from "../simulation/decisions.js";
import { useSystem } from "../simulation/SystemContext.jsx";
import { AnatomicalViewer } from "./AnatomicalViewer.jsx";

const LEGEND = [
  { id: "heart", system: "Energy", model: "Heart", line: "Renewable energy keeps it strong. Overconsumption is stress." },
  { id: "lungs", system: "Atmosphere", model: "Lungs", line: "Clean air, climate balance, pollution control." },
  { id: "kidneys", system: "Water", model: "Kidneys", line: "Purify, conserve, recover." },
  { id: "brain", system: "Green skills", model: "Brain", line: "Critical thinking, innovation, problem solving, collaboration, adaptability." },
  { id: "skeleton", system: "Infrastructure", model: "Skeleton", line: "Buildings, transport, urban planning, construction." },
  { id: "circulation", system: "Resource circulation", model: "Blood", line: "Water, energy, food, materials, and gases moving together.", organ: "heart" },
  { id: "communities", system: "Communities", model: "The whole body", line: "Individual choices become collective impact." },
];

const SKILL_ACTIONS = [
  { id: "innovate", label: "Innovate", line: "Improve how energy is supplied.", scenario: "energy", choice: "energy-renew", organ: "heart", color: "#e0a23a" },
  { id: "conserve", label: "Conserve", line: "Recover water instead of spending it.", scenario: "water", choice: "water-recover", organ: "kidneys", color: "#3d8bfd" },
  { id: "circularise", label: "Circularise", line: "Return waste to the resource cycle.", scenario: "waste", choice: "waste-return", organ: "liver", color: "#2f9e62" },
  { id: "restore", label: "Restore", line: "Repair the system under the most stress.", scenario: null, choice: null, organ: null, color: "#6fbf73" },
  { id: "collaborate", label: "Collaborate", line: "Combine recovery with what is already working.", scenario: "food", choice: "food-recover", organ: "digestive", color: "#8b6cf6" },
  { id: "adapt", label: "Adapt", line: "Change cooling when the heat changes.", scenario: "heat", choice: "heat-adapt", organ: "skin", color: "#e07a3d" },
];

const PRESSURES = [
  { id: "burn", label: "High energy use", scenario: "energy", choice: "energy-burn", organ: "heart" },
  { id: "waste-water", label: "Water wastage", scenario: "water", choice: "water-consume", organ: "kidneys" },
  { id: "over", label: "Overproduction", scenario: "waste", choice: "waste-dump", organ: "liver" },
  { id: "pollute", label: "Pollution", scenario: "air", choice: "air-ignore", organ: "lungs" },
  { id: "extract", label: "Resource extraction", scenario: "infrastructure", choice: "infra-defer", organ: "skeleton" },
];

const JOURNEY = [
  ["Unsustainable choices", "The body weakens."],
  ["The decision", "The panel chooses a response."],
  ["Restoration begins", "Each action brings part of the body back."],
  ["System rebuilds", "Circulation and the organs take the load together."],
  ["System restored", "The body is stable and connected."],
];

const RESTORE_FOR = [
  ["kidneys", "water", "water-recover"],
  ["lungs", "air", "air-exchange"],
  ["heart", "energy", "energy-renew"],
  ["liver", "waste", "waste-return"],
  ["skin", "heat", "heat-adapt"],
  ["skeleton", "infrastructure", "infra-reinforce"],
  ["digestive", "food", "food-recover"],
];

const MODES = [
  ["decision", "Decision", "You take control. The body answers."],
  ["system", "System", "Water, energy, materials, waste, and warnings move."],
  ["environment", "Environment", "Each part of the body is an environmental system."],
  ["anatomy", "Anatomy", "The same model, before the environmental reading."],
];

const SYSTEMS = {
  brain: {
    system: "Green skills",
    model: "Brain",
    test: "heat",
    testLabel: "Send a heat warning",
    chain: ["skin", "brain", "heart", "kidneys"],
    steps: ["Heat is detected at the surface", "The warning reaches the decision centre", "Cooling, water, and energy are weighed", "Circulation and recovery respond"],
    flow: { label: "A warning moving through the system", left: "Pressure", mid: "Decision", right: "Response", key: "heat" },
  },
  lungs: {
    system: "Atmosphere",
    model: "Lungs",
    test: "air",
    testLabel: "Test air pollution",
    chain: ["lungs", "heart", "brain", "skin"],
    steps: ["Outside air enters", "Exchange", "What remains is carried in circulation", "The decision centre records the burden"],
    flow: { label: "Air moving through exchange", left: "Outside air", mid: "Exchange", right: "What circulation carries", key: "air" },
  },
  heart: {
    system: "Energy",
    model: "Heart",
    test: "energy",
    testLabel: "Test energy demand",
    chain: ["heart", "kidneys", "lungs", "skin"],
    steps: ["Resources enter circulation", "They are sent toward the load", "Some paths crowd", "Other systems wait"],
    flow: { label: "Resources moving through the vessels", left: "Supply", mid: "Distribution", right: "Where the load is", key: "circulation" },
  },
  liver: {
    system: "Circular economy",
    model: "Liver",
    test: "waste",
    testLabel: "Test waste overload",
    chain: ["liver", "digestive", "heart", "kidneys"],
    steps: ["Waste enters", "Processing", "Useful material returns", "What cannot return leaves"],
    flow: { label: "Waste moving through recovery", left: "Waste in", mid: "Process", right: "Recovered material", key: "waste" },
  },
  digestive: {
    system: "Food and materials",
    model: "Digestive system",
    test: "food",
    testLabel: "Test food and material demand",
    chain: ["digestive", "liver", "heart"],
    steps: ["Material enters", "What is useful is absorbed", "The rest goes to recovery", "Circulation carries what returns"],
    flow: { label: "Material moving through the system", left: "Input", mid: "Absorption", right: "What returns", key: "waste" },
  },
  kidneys: {
    system: "Water",
    model: "Kidneys",
    test: "water",
    testLabel: "Test water stress",
    chain: ["kidneys", "heart", "skin", "brain"],
    steps: ["Water enters", "Filtration", "Recovery", "Recovered water returns to circulation", "Heat and the decision centre feel the result"],
    flow: { label: "Water moving through recovery", left: "Water in", mid: "Filtration", right: "Recovered water", key: "water" },
  },
  skin: {
    system: "Heat and climate",
    model: "Skin",
    test: "heat",
    testLabel: "Test extreme heat",
    chain: ["skin", "brain", "heart", "kidneys"],
    steps: ["Heat arrives at the surface", "Cooling demand rises", "Water demand rises", "Energy demand rises", "The decision centre must answer"],
    flow: { label: "Heat pressure at the surface", left: "Outside heat", mid: "Cooling demand", right: "Water and energy", key: "heat" },
  },
  skeleton: {
    system: "Infrastructure",
    model: "Skeleton",
    test: "infrastructure",
    testLabel: "Test infrastructure pressure",
    chain: ["skeleton", "heart", "kidneys", "lungs"],
    steps: ["The structure takes the load", "Circulation needs a path", "Recovery needs a path", "Exchange needs a path"],
    flow: { label: "Whether the structure can carry the flows", left: "Load", mid: "Structure", right: "What still gets through", key: "infrastructure" },
  },
};

function useSmooth(target) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      valueRef.current = target;
      setValue(target);
      return undefined;
    }
    let frame = 0;
    const tick = () => {
      const next = valueRef.current + (target - valueRef.current) * 0.08;
      valueRef.current = Math.abs(target - next) < 0.12 ? target : next;
      setValue(valueRef.current);
      if (valueRef.current !== target) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

function Ring({ value }) {
  const radius = 46;
  const length = 2 * Math.PI * radius;
  const tone = value >= 74 ? "#7eb8b4" : value >= 58 ? "#c4a574" : "#b55248";
  return (
    <svg className="resilience-ring" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r={radius} />
      <circle
        cx="60"
        cy="60"
        r={radius}
        stroke={tone}
        strokeDasharray={`${(value / 100) * length} ${length}`}
      />
      <text x="60" y="64">{Math.round(value)}%</text>
    </svg>
  );
}

function conditionWord(decision) {
  if (decision.phase === "critical" || decision.phase === "stressed") return "Unsustainable";
  if (decision.phase === "recovering") return "Restoring";
  return "Regenerative";
}

function journeyIndex(decision) {
  const restores = decision.events.filter((item) => item.role === "restore").length;
  const extracts = decision.events.filter((item) => item.role === "extract").length;
  if (!extracts && !restores) return -1;
  if (decision.phase === "thriving") return 4;
  if (decision.phase === "recovering" && decision.resilience >= 74) return 3;
  if (restores) return 2;
  if (extracts && restores) return 1;
  return extracts ? 0 : 1;
}

export function CommandCentre() {
  const { organId, setOrganId, choiceMap, decision, lastEvent, openStress, commitChoice, reset } = useSystem();
  const [api, setApi] = useState(null);
  const [mode, setMode] = useState("decision");
  const [scenarioId, setScenarioId] = useState("water");
  const [pending, setPending] = useState(null);
  const [legendId, setLegendId] = useState("kidneys");
  const onReady = useCallback((next) => {
    setApi(next);
    if (next) {
      next.setBackdrop(0x0b1016);
      next.setMode("decision");
    }
  }, []);

  const focusSystem = (id, scenarioOverride) => {
    const system = SYSTEMS[id];
    if (!system) return;
    setOrganId(id);
    setLegendId(id);
    const nextScenario = scenarioOverride ?? system.test;
    setScenarioId(nextScenario);
    setPending(choiceMap[nextScenario] ?? null);
    api?.setMode("decision");
    setMode("decision");
    api?.showPath(system.chain, system.steps);
  };

  const scenario = DECISION_SCENARIOS.find((item) => item.id === scenarioId) ?? DECISION_SCENARIOS[0];
  const system = SYSTEMS[organId] ?? SYSTEMS.kidneys;
  const scenarioIndex = String(DECISION_SCENARIOS.findIndex((item) => item.id === scenario.id) + 1).padStart(2, "0");
  const chosen = choiceMap[scenario.id];
  const state = conditionWord(decision);
  const shown = useSmooth(decision.resilience);
  const cascades = Object.keys(BASE_ORGANS).map((id) => {
    const delta = decision.organs[id] - BASE_ORGANS[id];
    if (Math.abs(delta) < 3) return null;
    const name = SYSTEMS[id]?.system ?? id;
    return {
      id,
      tone: delta < 0 ? "down" : "up",
      title: delta < 0 ? `${name} under stress` : `${name} easing`,
      detail: delta < 0 ? "The pressure has spread here." : "This part of the system is taking load off the rest.",
    };
  }).filter(Boolean);

  const stage = journeyIndex(decision);
  const regenerative = state !== "Unsustainable";

  const runAction = (action) => {
    let scenario = action.scenario;
    let choice = action.choice;
    let organ = action.organ;
    if (action.id === "restore") {
      const ranked = [...RESTORE_FOR].sort((a, b) => decision.organs[a[0]] - decision.organs[b[0]]);
      [organ, scenario, choice] = ranked[0];
    }
    commitChoice(scenario, choice);
    if (SYSTEMS[organ]) focusSystem(organ, scenario);
  };

  return (
    <section className="command" id="command" aria-labelledby="command-title">
      <header className="command-head">
        <p className="command-kicker">Green skills for a sustainable future</p>
        <h1 id="command-title">Humanity: the living planet</h1>
        <p className="command-question">If the planet is our home, why does sustainability look so much like biology?</p>
        <p>The human body is the sustainability project. Living Oman 2040.</p>
      </header>

      <div className="command-top">
        <ul className="organ-rail" aria-label="The body as a sustainability system">
          {LEGEND.map((item) => {
            const health = item.id === "circulation"
              ? decision.metrics.circulation
              : item.id === "communities"
                ? decision.resilience
                : decision.organs[item.id];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={legendId === item.id ? "is-active" : ""}
                  aria-pressed={legendId === item.id}
                  onClick={() => {
                    setLegendId(item.id);
                    if (item.id === "circulation") {
                      setOrganId("heart");
                      setMode("system");
                      api?.setMode("system");
                      api?.showPath(["heart", "kidneys", "lungs", "liver"], ["Water", "Energy", "Materials", "Recovered resources"]);
                      return;
                    }
                    if (item.id === "communities") {
                      setMode("decision");
                      api?.setMode("decision");
                      api?.reset();
                      return;
                    }
                    focusSystem(item.id);
                  }}
                >
                  <strong>{item.system}</strong>
                  <span>{item.model} · {Math.round(health)}%</span>
                  <i style={{ width: `${health}%` }} />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="command-stage">
          <AnatomicalViewer bare onReady={onReady} />
          <p className={`condition-word is-${state.toLowerCase()}`}>{state}</p>
          {lastEvent?.steps?.length > 0 && (
            <ol className="live-chain">
              {lastEvent.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          )}
          <p className="stage-hint">This body is the sustainability system.</p>
          <div className="mode-switch" role="group" aria-label="Views of the same body">
            {[
              ["anatomy", "Anatomy"],
              ["environment", "Environment"],
              ["system", "System"],
              ["decision", "Decision"],
            ].map(([id, label]) => (
              <button key={id} type="button" aria-pressed={mode === id} onClick={() => { setMode(id); api?.setMode(id); }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <aside className="resilience-card" aria-label="Your Oman 2040">
          <p>Your Oman 2040</p>
          <Ring value={shown} />
          <p className="outlook">{state}. {decision.verdict}</p>
          <ul>
            {METRIC_LABELS.map(([key, label]) => (
              <li key={key}>
                <span>{label}</span>
                <strong>{Math.round(decision.metrics[key])}%</strong>
              </li>
            ))}
          </ul>
        </aside>

        <aside className="mode-cards" aria-label="Two modes, one body">
          <p>Two modes, one body</p>
          <div className={regenerative ? "mode-block is-live" : "mode-block"}>
            <h3>Regenerative</h3>
            <ul>
              <li>Atmosphere is exchanging</li>
              <li>Energy is circulating</li>
              <li>Water is being recovered</li>
              <li>The systems stay connected</li>
            </ul>
          </div>
          <div className={!regenerative ? "mode-block is-live" : "mode-block"}>
            <h3>Unsustainable</h3>
            <ul>
              {PRESSURES.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => runAction(item)}>{item.label}</button>
                </li>
              ))}
            </ul>
            <p>The body struggles. The system becomes unstable.</p>
          </div>
        </aside>
      </div>

      <section className="skill-challenge" aria-labelledby="skills-challenge-title">
        <div>
          <p className="kicker"><span>Green skills challenge</span></p>
          <h2 id="skills-challenge-title">The panel chooses the intervention. The body answers.</h2>
        </div>
        <ul>
          {SKILL_ACTIONS.map((item) => (
            <li key={item.id}>
              <button type="button" style={{ "--skill": item.color }} onClick={() => runAction(item)}>
                <strong>{item.label}</strong>
                <span>{item.line}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <ol className="journey" aria-label="From crisis to recovery">
        {JOURNEY.map(([title, line], index) => (
          <li key={title} className={index === stage ? "is-now" : index < stage ? "is-done" : ""}>
            <strong>{index + 1}. {title}</strong>
            <span>{line}</span>
          </li>
        ))}
      </ol>

      <div className="command-bottom">
        <article className="organ-card">
          <p className="kicker"><span>{system.system}</span><span>Seen as the {system.model.toLowerCase()}</span></p>
          <h2>{system.system}</h2>
          <ol className="process-chain">
            {system.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="organ-health">{system.system} {Math.round(decision.organs[organId] ?? decision.organs.kidneys)}%</p>
          <button
            type="button"
            onClick={() => {
              setScenarioId(system.test);
              openStress(system.test);
              api?.setMode("decision");
              setMode("decision");
            }}
          >
            {system.testLabel}
          </button>
          <div className="flow-sim">
            <p>{system.flow.label}</p>
            <div className="flow-track" aria-hidden="true">
              <i style={{ width: `${Math.max(8, Math.min(92, decision.metrics[system.flow.key]))}%` }} />
            </div>
            <ol>
              <li>{system.flow.left}</li>
              <li>{system.flow.mid}</li>
              <li>{system.flow.right}</li>
            </ol>
          </div>
        </article>

        <article className="response-card">
          <p className="kicker"><span>What just moved</span></p>
          {lastEvent?.steps?.length ? (
            <ol className="process-chain">
              {lastEvent.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          ) : (
            <p className="prose">Choose a strategy. One system answers first. The effect then spreads.</p>
          )}
          {lastEvent?.because && <p className="because">{lastEvent.because}</p>}
        </article>

        <article className="cascade-card">
          <p className="kicker"><span>Where the pressure spread</span></p>
          {cascades.length === 0 ? (
            <p className="prose">Nothing has spread yet. Damage one system, and the others will have to carry it.</p>
          ) : (
            <ul>
              {cascades.map((item) => (
                <li key={item.id} className={item.tone}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={reset}>Clear the record</button>
        </article>

        <article className="skill-card">
          <p className="kicker"><span>Shown by your decisions</span></p>
          <ul className="skill-bars">
            {SKILL_LABELS.map(([key, label]) => (
              <li key={key}>
                <span>{label}</span>
                <span><i style={{ width: `${decision.skills[key]}%` }} /></span>
                <strong>{Math.round(decision.skills[key] / 10)}/10</strong>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <footer className="command-foot">
        <p>A sustainable planet does not need humans to stop developing. It needs humans to learn how to develop without destroying the systems that keep us alive.</p>
        <p>Humanity: the living planet</p>
      </footer>
    </section>
  );
}
