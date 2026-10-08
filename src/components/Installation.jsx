import { useCallback, useEffect, useRef, useState } from "react";
import { AnatomicalViewer } from "./AnatomicalViewer.jsx";
import { DECISION_SCENARIOS, SKILL_LABELS } from "../simulation/decisions.js";
import { useSystem } from "../simulation/SystemContext.jsx";

const SYSTEMS = [
  { id: "brain", env: "Intelligence", organ: "Brain", principle: "Signals are compared before anything is moved.", system: "Environmental intelligence. You will take this role.", vision: "Future-ready judgement under changing conditions.", scenario: null },
  { id: "heart", env: "Circulation", organ: "Heart", principle: "Resources are sent to the place under load.", system: "Resource circulation — water, energy, and recovered material.", vision: "Energy that keeps moving instead of being spent once.", scenario: "energy" },
  { id: "kidneys", env: "Water", organ: "Kidneys", principle: "Keep what can return. Release only what cannot.", system: "Water recovery and conservation.", vision: "Responsible use of a scarce resource.", scenario: "water" },
  { id: "lungs", env: "Atmosphere", organ: "Lungs", principle: "Exchange, not isolation. What enters must be carried.", system: "Air quality and carbon exchange.", vision: "A livable atmosphere as the economy changes.", scenario: "air" },
  { id: "skin", env: "Climate", organ: "Skin", principle: "The outer layer answers heat instead of running at full load.", system: "Heat and climate adaptation.", vision: "Infrastructure that responds to a hotter climate.", scenario: "heat" },
  { id: "liver", env: "Materials", organ: "Liver", principle: "A discarded stream is asked if it can become a resource.", system: "Waste processing and resource recovery.", vision: "A circular use of materials.", scenario: "waste" },
  { id: "digestive", env: "Food", organ: "Digestive system", principle: "Useful input should not leave after one pass.", system: "Food and material circularity.", vision: "Food security without a larger waste stream.", scenario: "food" },
  { id: "skeleton", env: "Infrastructure", organ: "Skeleton", principle: "If the structure fails, every flow loses its path.", system: "Infrastructure and resilience.", vision: "Systems that still function when conditions change.", scenario: "infrastructure" },
];

const CRISES = [
  { id: "water", label: "Water availability", mark: "↓" },
  { id: "heat", label: "Extreme heat", mark: "↑" },
  { id: "energy", label: "Energy demand", mark: "↑" },
  { id: "waste", label: "Waste", mark: "↑" },
  { id: "air", label: "Air quality", mark: "↓" },
  { id: "food", label: "Food pressure", mark: "↑" },
];

const FLOWS = [
  ["water", "Water"],
  ["energy", "Energy"],
  ["materials", "Materials"],
  ["waste", "Waste"],
  ["info", "Information"],
];

const FOLLOW = {
  water: "energy",
  heat: "water",
  energy: "air",
  waste: "water",
  air: "heat",
  food: "waste",
  infrastructure: "energy",
  circular: "water",
};

const EFFECT_LABEL = {
  water: "Water security",
  energy: "Energy efficiency",
  air: "Air quality",
  waste: "Resource recovery",
  heat: "Heat resilience",
  circulation: "Circulation",
  infrastructure: "Infrastructure",
  pressure: "System pressure",
};

const READINGS = [
  ["resilience", "System resilience"],
  ["water", "Water security"],
  ["energy", "Energy efficiency"],
  ["air", "Air quality"],
  ["waste", "Resource recovery"],
  ["heat", "Heat resilience"],
];

function consequences(effects) {
  return Object.entries(effects)
    .filter(([, value]) => value)
    .slice(0, 3)
    .map(([key, value]) => {
      const heavy = Math.abs(value) >= 10;
      const arrow = `${value > 0 ? "↑" : "↓"}${heavy ? (value > 0 ? "↑" : "↓") : ""}`;
      const adverse = key === "pressure" ? value > 0 : value < 0;
      return { adverse, text: `${EFFECT_LABEL[key] || key} ${arrow}` };
    });
}

function phaseName(decision) {
  if (!decision.events.length) return "Balanced";
  return {
    thriving: "Thriving",
    resilient: "Resilient",
    recovering: "Recovering",
    stressed: "Stressed",
    critical: "Critical",
  }[decision.phase] || "Balanced";
}

export function Installation() {
  const { organId, setOrganId, decision, lastEvent, choiceMap, openStress, commitChoice, reset } = useSystem();
  const [api, setApi] = useState(null);
  const [status, setStatus] = useState("Initialising the system");
  const [stage, setStage] = useState("boot");
  const [bootLabel, setBootLabel] = useState("Silhouette");
  const [online, setOnline] = useState(false);
  const [flow, setFlow] = useState(null);
  const [activeId, setActiveId] = useState("water");
  const [beat, setBeat] = useState(-1);
  const [after, setAfter] = useState("recovery");
  const [log, setLog] = useState([]);
  const booted = useRef(false);
  const round = useRef(0);
  const onReady = useCallback((next) => setApi(next), []);
  const onStatus = useCallback((message) => setStatus(message), []);
  const system = SYSTEMS.find((item) => item.id === organId) ?? SYSTEMS[2];
  const scenario = DECISION_SCENARIOS.find((item) => item.id === activeId) ?? DECISION_SCENARIOS[0];
  const phase = phaseName(decision);
  const decided = Object.keys(choiceMap).length > 0;

  useEffect(() => {
    if (!api || status !== "" || booted.current) return undefined;
    booted.current = true;
    api.setBackdrop(0x07080a);
    api.playBoot((label, done) => {
      setBootLabel(label);
      if (done) setOnline(true);
    });
    return undefined;
  }, [api, status]);

  useEffect(() => {
    if (!api || stage !== "mechanisms") return undefined;
    api.setEmphasis(null);
    api.explore(system.id);
    return undefined;
  }, [api, stage, system.id]);

  useEffect(() => {
    if (!api || !lastEvent) return undefined;
    if (stage !== "shock" && stage !== "responding") return undefined;
    api.showPath(lastEvent.chain, lastEvent.steps);
    if (stage !== "responding") return undefined;
    const steps = lastEvent.steps || [];
    const timers = steps.map((_, index) => window.setTimeout(() => setBeat(index), index * 1400));
    const finish = window.setTimeout(() => setStage(after), steps.length * 1400 + 700);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(finish);
    };
  }, [api, stage, lastEvent, after]);

  const enter = () => {
    setStage("living");
    api?.setMode("system");
    api?.setEmphasis(null);
  };

  const showFlow = (channel) => {
    const next = flow === channel ? null : channel;
    setFlow(next);
    if (next) api?.setEmphasis(next);
    else {
      api?.setEmphasis(null);
      if (stage !== "mechanisms") api?.setMode("system");
    }
  };

  const openSystem = (id) => {
    setOrganId(id);
    setFlow(null);
    api?.setEmphasis(null);
    api?.explore(id);
    if (stage !== "decision" && stage !== "responding" && stage !== "shock" && stage !== "outcome") {
      setStage("mechanisms");
    }
  };

  const runCrisis = (id) => {
    setActiveId(id);
    const item = SYSTEMS.find((entry) => entry.scenario === id);
    if (item) setOrganId(item.id);
    openStress(id);
    setStage("shock");
  };

  const choose = (scenarioId, choiceId) => {
    const scenarioItem = DECISION_SCENARIOS.find((item) => item.id === scenarioId);
    const choice = scenarioItem?.choices.find((item) => item.id === choiceId);
    if (choice) {
      setLog((current) => [...current, { scenario: scenarioItem.title, title: choice.title, because: choice.because }]);
    }
    commitChoice(scenarioId, choiceId);
    const nextRound = round.current + 1;
    round.current = nextRound;
    setBeat(-1);
    setAfter(nextRound >= 2 ? "outcome" : "recovery");
    setStage("responding");
  };

  const followUp = () => {
    const choice = scenario.choices.find((item) => item.id === choiceMap[scenario.id]);
    if (choice && choice.role !== "restore") {
      setStage("recovery");
      return;
    }
    const preferred = FOLLOW[scenario.id] || "energy";
    const unused = DECISION_SCENARIOS.find((item) => item.id === preferred && !choiceMap[item.id])
      || DECISION_SCENARIOS.find((item) => !choiceMap[item.id]);
    const id = unused?.id || preferred;
    setActiveId(id);
    const item = SYSTEMS.find((entry) => entry.scenario === id);
    if (item) setOrganId(item.id);
    setStage("recovery");
  };

  const again = () => {
    reset();
    round.current = 0;
    setActiveId("water");
    setFlow(null);
    setBeat(-1);
    setLog([]);
    setStage("living");
    api?.setMode("system");
    api?.setEmphasis(null);
  };

  const readings = READINGS.map(([key, label]) => ({
    key,
    label,
    value: key === "resilience" ? decision.resilience : decision.metrics[key],
  }));

  return (
    <div className={`install ${stage === "boot" ? "is-boot" : ""}`}>
      <div className="install-stage">
        <AnatomicalViewer bare orchestrated onReady={onReady} onStatus={onStatus} />
      </div>

      {stage === "boot" && (
        <div className="boot">
          <p className="kicker">{online ? "System status" : bootLabel}</p>
          <h1>Living Oman 2040</h1>
          <p>Designing resilient systems by learning from the human body.</p>
          {online && (
            <>
              <p className="online"><i /> Online</p>
              <button type="button" className="enter" onClick={enter}>Enter the system</button>
            </>
          )}
        </div>
      )}

      {stage !== "boot" && (
        <>
          <aside className={`panel ${stage === "outcome" ? "is-outcome" : ""}`}>
            {stage === "living" && (
              <>
                <p className="kicker">Living system</p>
                <h2>The environment is the subject. The body is the interface.</h2>
                <p>Water, energy, air, materials, and heat move through one system. Select a part of it, or test the whole system.</p>
                <button type="button" className="enter" onClick={() => setStage("stress")}>Run a stress test</button>
                <ul className="system-list">
                  {SYSTEMS.map((item) => (
                    <li key={item.id}>
                      <button type="button" aria-pressed={organId === item.id} onClick={() => openSystem(item.id)}>
                        <strong>{item.env}</strong>
                        <span>{item.organ}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {stage === "mechanisms" && (
              <>
                <p className="kicker">{system.env}</p>
                <h2>{system.env} system</h2>
                <p className="fine">Read through the {system.organ.toLowerCase()}</p>
                <dl>
                  <div>
                    <dt>Biological principle</dt>
                    <dd>{system.principle}</dd>
                  </div>
                  <div>
                    <dt>Environmental system</dt>
                    <dd>{system.system}</dd>
                  </div>
                  <div>
                    <dt>Oman 2040</dt>
                    <dd>{system.vision}</dd>
                  </div>
                </dl>
                <p className="reading">{system.env} on the body · {Math.round(decision.organs[system.id] ?? 0)}</p>
                {system.scenario && (
                  <button type="button" className="enter" onClick={() => runCrisis(system.scenario)}>
                    Simulate {system.env.toLowerCase()} stress
                  </button>
                )}
                <div className="row">
                  <button type="button" className="quiet" onClick={() => setStage("living")}>All systems</button>
                  <button type="button" className="quiet" onClick={() => setStage("mapping")}>Resource map</button>
                </div>
              </>
            )}

            {stage === "mapping" && (
              <>
                <p className="kicker">Environmental mapping</p>
                <h2>Watch one resource move.</h2>
                <p>The toggles below change the body. They do not open another page. Anatomy stays in place so the flow has a structure to travel through.</p>
                <p className="fine">{flow ? `Showing ${FLOWS.find(([id]) => id === flow)?.[1]}` : "All resources are visible."}</p>
                <button type="button" className="enter" onClick={() => { setFlow(null); api?.setEmphasis(null); api?.playChain(); setStage("connected"); }}>
                  See the systems connect
                </button>
              </>
            )}

            {stage === "connected" && (
              <>
                <p className="kicker">Connected system</p>
                <h2>One pressure does not stay in one organ.</h2>
                <ol className="cascade">
                  {["Climate load", "Signal to intelligence", "Energy demand", "Water recovery", "Material return", "A new balance"].map((line, index) => (
                    <li key={line}><span>{String(index + 1).padStart(2, "0")}</span>{line}</li>
                  ))}
                </ol>
                <button type="button" className="enter" onClick={() => setStage("stress")}>Apply a real stress</button>
              </>
            )}

            {stage === "stress" && (
              <>
                <p className="kicker">System stress test</p>
                <h2>The system is challenged before you decide.</h2>
                <p>Choose the pressure. The body will answer it. Then you become the brain.</p>
                <ul className="crises">
                  {CRISES.map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => runCrisis(item.id)}>
                        <span>{item.label}</span>
                        <strong>{item.mark}</strong>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {stage === "shock" && (
              <>
                <p className="kicker">System responding</p>
                <h2>{scenario.title}</h2>
                <p>{scenario.problem}</p>
                <ol className="cascade">
                  {(lastEvent?.steps || []).map((line, index) => (
                    <li key={line} className="on"><span>{String(index + 1).padStart(2, "0")}</span>{line}</li>
                  ))}
                  <li className="on"><span>{String((lastEvent?.steps?.length || 0) + 1).padStart(2, "0")}</span>Decision required</li>
                </ol>
                <button type="button" className="enter" onClick={() => setStage("decision")}>Decision required</button>
              </>
            )}

            {(stage === "decision" || stage === "recovery") && (
              <>
                <p className="kicker">{stage === "recovery" ? "Recovery" : "You are the brain"}</p>
                <h2>{stage === "recovery" ? "The last decision moved the load." : "Every solution creates another consequence."}</h2>
                <p>{scenario.problem} You have no unmarked correct answer.</p>
                <div className="choices">
                  {scenario.choices.map((choice) => (
                    <button key={choice.id} type="button" className="choice" onClick={() => choose(scenario.id, choice.id)}>
                      <strong>{choice.title}</strong>
                      <span>{choice.note}</span>
                      <span className="deltas">
                        {consequences(choice.effects).map((item) => (
                          <em key={item.text} className={item.adverse ? "down" : "up"}>{item.text}</em>
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {stage === "responding" && (
              <>
                <p className="kicker">System responding</p>
                <h2>Watch the consequence travel.</h2>
                <ol className="cascade">
                  {(lastEvent?.steps || []).map((line, index) => (
                    <li key={line} className={index <= beat ? "on" : ""}>
                      <span>{String(index + 1).padStart(2, "0")}</span>{line}
                    </li>
                  ))}
                </ol>
                {lastEvent?.because && beat >= (lastEvent.steps?.length || 1) - 1 && <p>{lastEvent.because}</p>}
              </>
            )}

            {stage === "outcome" && (
              <>
                <p className="kicker">Your Oman 2040</p>
                <h2>What did your decisions create?</h2>
                <p>{decision.verdict}</p>
                <ul className="history">
                  {log.map((item, index) => (
                    <li key={`${item.title}-${index}`}>
                      <strong>{item.scenario}</strong>
                      <span>{item.title}</span>
                      <em>{item.because}</em>
                    </li>
                  ))}
                </ul>
                <div className="row">
                  <button type="button" className="enter" onClick={followUp}>Answer another consequence</button>
                  <button type="button" className="quiet" onClick={again}>Begin again</button>
                </div>
              </>
            )}
          </aside>

          <aside className="meters" aria-label="Live system state">
            <p className="kicker">Live state</p>
            <p className={`phase is-${phase.toLowerCase()}`}>{phase}</p>
            <ul>
              {readings.map((item) => (
                <li key={item.key}>
                  <span>{item.label}</span>
                  <strong>{Math.round(item.value)}</strong>
                  <i style={{ width: `${Math.max(4, Math.min(100, item.value))}%` }} />
                </li>
              ))}
            </ul>
            {decided && (
              <div className="skills">
                <p className="kicker">Shown through the decisions</p>
                {SKILL_LABELS.map(([key, label]) => (
                  <p key={key}><span>{label}</span><i style={{ width: `${decision.skills[key]}%` }} /></p>
                ))}
                <p>
                  <span>Environmental awareness</span>
                  <i style={{ width: `${Math.round((decision.skills.systems + decision.skills.critical) / 2)}%` }} />
                </p>
              </div>
            )}
          </aside>

          <div className="flowbar" role="group" aria-label="Resource flows">
            {FLOWS.map(([id, label]) => (
              <button key={id} type="button" className={flow === id ? "is-on" : ""} aria-pressed={flow === id} onClick={() => showFlow(id)}>
                <i className={`dot-${id}`} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
