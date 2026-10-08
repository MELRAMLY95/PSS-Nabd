import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_ORGANS, DECISION_SCENARIOS, METRIC_LABELS } from "../simulation/decisions.js";
import { useSystem } from "../simulation/SystemContext.jsx";
import { AnatomicalViewer } from "./AnatomicalViewer.jsx";

const ORGANS = [
  { id: "brain", name: "Brain", env: "Green skills", role: "decides", kicker: "Decisions", principle: "The brain is how this environment thinks. It reads water, energy, heat, waste and conditions, then sends the response to the system that is failing.", technology: "You are this decision centre. A green skill is not a label. It is a choice the rest of the environment has to live with." },
  { id: "heart", name: "Heart", env: "Energy", role: "circulates", kicker: "Energy", principle: "The heart is the energy of the environment. Demand shows up here, and circulation carries that energy to water, air, climate and materials.", technology: "Renewable supply strengthens the whole body. More combustion feeds energy and injures the air." },
  { id: "kidneys", name: "Kidneys", env: "Water", role: "recovers", kicker: "Water", principle: "The kidneys are Oman’s water. They keep what can return and release only what cannot. A shortage here is a shortage in the environment, not a diagram of an organ.", technology: "Used water separates into water that returns, material that can be recovered, and waste that leaves." },
  { id: "lungs", name: "Lungs", env: "Atmosphere", role: "exchanges", kicker: "Atmosphere", principle: "The lungs are the air. What the atmosphere takes in, energy, climate and the rest of the body have to carry.", technology: "Cleaner air lowers the load on energy and heat. Ignoring emissions darkens the lungs and the systems that depend on them." },
  { id: "skin", name: "Skin", env: "Climate", role: "adapts", kicker: "Climate", principle: "The skin is the climate this environment lives in. Heat and sun are not outside the body. They are the outer system.", technology: "High heat increases cooling. When the load falls, cooling eases. Strong sun increases protection." },
  { id: "liver", name: "Liver", env: "Materials", role: "transforms", kicker: "Materials", principle: "The liver is waste becoming resource. The environment asks whether a discarded stream can return to use.", technology: "A stream enters, is processed, and useful material returns through the circulation of the body." },
];

const SKILLS = [
  { id: "innovate", label: "Innovate", line: "Shift energy toward a cleaner supply.", costs: "Does not create water.", scenario: "energy", choice: "energy-renew", organ: "heart" },
  { id: "conserve", label: "Conserve", line: "Recover water instead of extracting more.", costs: "Treatment draws energy.", scenario: "water", choice: "water-recover", organ: "kidneys" },
  { id: "circularise", label: "Circularise", line: "Return waste to use.", costs: "Recovery takes effort.", scenario: "waste", choice: "waste-return", organ: "liver" },
  { id: "adapt", label: "Adapt", line: "Match cooling to the heat.", costs: "Comfort is not maximised.", scenario: "heat", choice: "heat-adapt", organ: "skin" },
  { id: "collaborate", label: "Collaborate", line: "Recover useful food and material together.", costs: "The process is slower.", scenario: "food", choice: "food-recover", organ: "digestive" },
  { id: "restore", label: "Restore", line: "Repair whichever system is most stressed.", costs: "It follows the damage, not a favourite.", scenario: null, choice: null, organ: null },
];

const PRESSURES = [
  { id: "burn", label: "Burn more", line: "Meet energy demand by combustion.", scenario: "energy", choice: "energy-burn", organ: "heart" },
  { id: "draw", label: "Draw more water", line: "Increase extraction. Cut recovery.", scenario: "water", choice: "water-consume", organ: "kidneys" },
  { id: "dump", label: "Discard waste", line: "Move the problem out of sight.", scenario: "waste", choice: "waste-dump", organ: "liver" },
  { id: "emit", label: "Keep emitting", line: "Protect output. Load the air.", scenario: "air", choice: "air-ignore", organ: "lungs" },
  { id: "defer", label: "Defer the structure", line: "Spend less now. Weaken every path.", scenario: "infrastructure", choice: "infra-defer", organ: "skeleton" },
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

const CHAIN = [
  ["kidneys", "Water", "Water demand rises. The water system — the kidneys — detects that availability is falling."],
  ["brain", "Decision", "Green skills, the brain of this environment, receive the warning."],
  ["brain", "Choose", "The decision is to recover water rather than extract more."],
  ["heart", "Energy", "Energy is redirected toward recovery. The heart of the system takes a new load."],
  ["brain", "Consequence", "That recovery creates an energy demand. The decision centre has to answer it."],
  ["lungs", "Air", "Renewable supply protects the atmosphere. The lungs stay clearer."],
  ["skin", "Climate", "Heat rises. The climate layer — the skin — increases cooling, and that asks for water again."],
  ["heart", "One system", "One pressure has moved through water, decisions, energy, air and climate. The environment is the body."],
];

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

export function LivingPage() {
  const { organId, setOrganId, decision, lastEvent, commitChoice, reset } = useSystem();
  const [api, setApi] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(1);
  const onReady = useCallback((next) => {
    setApi(next);
    if (next) {
      next.setBackdrop(0x06100e);
      next.setMode("environment");
    }
  }, []);
  const shown = useSmooth(decision.resilience);
  const [level, setLevel] = useState(decision.resilience);
  useEffect(() => {
    setLevel(decision.resilience);
  }, [decision.resilience]);
  const organ = ORGANS.find((item) => item.id === organId) ?? ORGANS[2];
  const tone = decision.phase === "critical" || decision.phase === "stressed"
    ? "Strained"
    : decision.phase === "recovering"
      ? "Recovering"
      : decision.phase === "thriving"
        ? "Thriving"
        : "In balance";
  const healthStage = decision.phase === "critical" || decision.resilience < 48
    ? "failure"
    : decision.phase === "stressed" && decision.resilience < 55
      ? "imbalance"
      : decision.phase === "stressed" && decision.resilience < 64
        ? "shortage"
        : decision.phase === "stressed"
          ? "stress"
          : decision.phase === "recovering"
            ? "recovery"
            : decision.resilience >= 80
              ? "thriving"
              : decision.resilience >= 74
                ? "resilience"
                : "balance";

  const focus = (id) => {
    setOrganId(id);
    api?.setMode("environment");
    api?.setOrgan(id, { focus: true });
  };

  const act = (action) => {
    let scenario = action.scenario;
    let choice = action.choice;
    let organKey = action.organ;
    if (action.id === "restore") {
      const ranked = [...RESTORE_FOR].sort((a, b) => decision.organs[a[0]] - decision.organs[b[0]]);
      [organKey, scenario, choice] = ranked[0];
    }
    commitChoice(scenario, choice);
    if (organKey === "digestive" || organKey === "skeleton") {
      api?.setMode("decision");
      api?.showPath(DECISION_SCENARIOS.find((item) => item.id === scenario)?.choices.find((item) => item.id === choice)?.chain ?? [organKey], []);
      return;
    }
    focus(organKey);
    api?.setMode("decision");
  };

  const runChain = () => {
    setPlaying(true);
    api?.setMode("system");
    let index = 0;
    const tick = () => {
      setStep(index);
      const [id] = CHAIN[index];
      api?.setOrgan(id, { focus: true });
      setOrganId(id);
      index += 1;
      if (index < CHAIN.length) window.setTimeout(tick, 1500);
      else setPlaying(false);
    };
    tick();
  };

  const preview = (value) => {
    const resilience = Number(value);
    setLevel(resilience);
    const pull = resilience - decision.resilience;
    const organs = Object.fromEntries(
      Object.entries(decision.organs).map(([key, health]) => [key, Math.max(8, Math.min(98, health + pull * 0.85))]),
    );
    api?.setCondition({
      resilience,
      phase: resilience < 48 ? "critical" : resilience < 64 ? "stressed" : resilience > 80 ? "thriving" : "resilient",
      organs,
    });
  };

  const pairFor = (id) => {
    const table = {
      brain: [SKILLS[3], { id: "heat-load", scenario: "heat", choice: "heat-max", organ: "skin" }],
      heart: [SKILLS[0], PRESSURES[0]],
      kidneys: [SKILLS[1], PRESSURES[1]],
      lungs: [{ id: "air-good", scenario: "air", choice: "air-exchange", organ: "lungs" }, PRESSURES[3]],
      skin: [SKILLS[3], { id: "heat-load", scenario: "heat", choice: "heat-max", organ: "skin" }],
      liver: [SKILLS[2], PRESSURES[2]],
    };
    return table[id] ?? table.kidneys;
  };

  return (
    <div className="pulse" id="top">
      <header className="topbar">
        <a className="mark" href="#top">Living <small>OMAN · 2040</small></a>
        <nav>
          <a href="#idea">Concept</a>
          <a href="#organs">Systems</a>
          <a href="#connected">Connected</a>
          <a href="#health">System health</a>
          <a href="#brain">Vision 2040</a>
        </nav>
        <a className="pill" href="#brain">Become the brain →</a>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Humanity: the living planet · Oman Vision 2040</p>
          <h1>The human body <em>is</em> the environment.</h1>
          <p>
            Water is the kidneys. Air is the lungs. Energy is the heart. Climate is the skin. Materials are the liver. Decisions are the brain. Stress one, and the environment shows it on the body.
          </p>
          <div className="hero-actions">
            <a className="pill" href="#brain">Enter the system — become the brain</a>
            <a className="ghost" href="#idea">How it works</a>
          </div>
          <div className="hero-live">
            <p className="eyebrow">Shown on the body as the {organ.name.toLowerCase()}</p>
            <h2>{organ.env}</h2>
            <p>{organ.principle}</p>
            <div className="hero-actions">
              <button type="button" className="pill" onClick={() => act(pairFor(organ.id)[0])}>Restore {organ.env.toLowerCase()}</button>
              <button type="button" className="ghost" onClick={() => act(pairFor(organ.id)[1])}>Stress {organ.env.toLowerCase()}</button>
            </div>
            {lastEvent?.because && <p className="result">{lastEvent.because}</p>}
          </div>
        </div>
        <div className="hero-figure">
          <AnatomicalViewer bare onReady={onReady} />
          <ul className="callouts">
            {ORGANS.map((item) => (
              <li key={item.id} className={`at-${item.id} ${organ.id === item.id ? "is-on" : ""}`}>
                <button type="button" onClick={() => focus(item.id)}>
                  <strong>{item.env}</strong>
                  <em>{item.name}</em>
                </button>
              </li>
            ))}
          </ul>
          <label className="meter">
            <span>System health</span>
            <strong>{Math.abs(level - decision.resilience) > 1 ? (level < 48 ? "Failure" : level < 64 ? "Strained" : level > 80 ? "Thriving" : "In balance") : tone} · {Math.round(level)}</strong>
            <input
              type="range"
              min="20"
              max="96"
              value={Math.round(level)}
              aria-label="Drag to see the environment stressed or thriving"
              onChange={(event) => preview(event.target.value)}
            />
            <small>Drag to stress the environment. It stays that way until you restore or stress a system.</small>
          </label>
        </div>
      </section>

      <section id="idea" className="band">
        <div>
          <p className="eyebrow">01 · The idea</p>
          <h2>You are not looking at an anatomy lesson. You are looking at <em>Oman</em>.</h2>
          <p>The figure is realistic so the systems are unmistakable. The meaning is environmental. Kidneys failing means water is failing. Lungs darkening means the air is under load. The heart labouring means energy is being spent in the wrong place.</p>
          <p>A choice does not stay in one organ. Water, energy, air, climate and materials are one environment, so a decision in one shows up in the others.</p>
        </div>
        <div>
          <p className="eyebrow">How most systems work today</p>
          <p className="flow struck">consume → use → waste</p>
          <p className="eyebrow">How a living system works</p>
          <p className="flow">sense → decide → distribute → recover → adapt</p>
          <div className="notes">
            <p>If an area needs more, the system detects it and redirects resources.</p>
            <p>If resources run low, it cuts unnecessary consumption.</p>
            <p>If waste is produced, it tries to recover useful material first.</p>
            <p>If conditions change, it adapts instead of running at maximum.</p>
          </div>
        </div>
      </section>

      <section id="organs" className="band organs">
        <div className="organs-intro">
          <p className="eyebrow">02 · The environment, read on the body</p>
          <h2>One body. One environment. Every system is visible.</h2>
          <p>Choose a system. The figure shows where that part of the environment lives.</p>
          <div className="pills" role="tablist">
            {ORGANS.map((item) => (
              <button key={item.id} type="button" aria-selected={organ.id === item.id} onClick={() => focus(item.id)}>{item.env}</button>
            ))}
          </div>
        </div>
        <article className="sheet">
          <p className="eyebrow">Shown as the {organ.name.toLowerCase()}</p>
          <h3>{organ.env}</h3>
          <div className="sheet-cols">
            <div>
              <p className="eyebrow">What it is in the environment</p>
              <p>{organ.principle}</p>
            </div>
            <div>
              <p className="eyebrow">What a decision does to it</p>
              <p>{organ.technology}</p>
            </div>
          </div>
          <p className="oman">{organ.env} on the body is at {Math.round(decision.organs[organ.id] ?? 0)}%.</p>
        </article>
      </section>

      <section id="connected" className="band stack">
        <p className="eyebrow">03 · Everything is connected</p>
        <h2>Sustainability problems are interconnected — so the solutions must be too.</h2>
        <ol className="sequence">
          {CHAIN.map(([, title, line], index) => (
            <li key={title} className={step === index ? "is-on" : ""}>
              <button type="button" onClick={() => { setStep(index); focus(CHAIN[index][0]); }}>
                <span>{String(index + 1).padStart(2, "0")} {title}</span>
                <span>{line}</span>
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="text-btn" onClick={runChain}>{playing ? "Pause sequence" : "Run the sequence"}</button>
      </section>

      <section id="health" className="band stack">
        <p className="eyebrow">04 · System health, not a quiz score</p>
        <h2>A poor choice is not a red stamp. The environment struggles, and you see it.</h2>
        <div className="pair">
          <article>
            <p className="eyebrow mint">Good decisions</p>
            <ol>
              {[
                ["balance", "Balance", "Demands are met — just. There is little margin for the next crisis."],
                ["resilience", "Resilience", "The system can absorb a shock without collapsing."],
                ["recovery", "Recovery", "Stressed systems are healing. Flows are strengthening across the body."],
                ["thriving", "Thriving", "Every organ is supplied, waste is becoming resource, and the system regenerates."],
              ].map(([id, title, line]) => (
                <li key={id} className={healthStage === id ? "is-now" : ""}>
                  <strong>{title}</strong><span>{line}</span>
                </li>
              ))}
            </ol>
            <p>Flows strengthen. The environment is {tone.toLowerCase()}, at {Math.round(shown)}.</p>
          </article>
          <article>
            <p className="eyebrow warn">Poor decisions</p>
            <ol>
              {[
                ["stress", "Stress", "One or more organs are working beyond their capacity."],
                ["shortage", "Resource shortage", "Critical resources are running low and flows are weakening."],
                ["imbalance", "System imbalance", "Organs are competing. Fixing one problem is creating another."],
                ["failure", "Failure", "The system can no longer sustain itself."],
              ].map(([id, title, line]) => (
                <li key={id} className={healthStage === id ? "is-now" : ""}>
                  <strong>{title}</strong><span>{line}</span>
                </li>
              ))}
            </ol>
            <p>Organs dull and circulation slows.</p>
          </article>
        </div>
      </section>

      <section id="brain" className="band brain">
        <div>
          <p className="eyebrow">05 · Green skills as the control interface</p>
          <h2>The visitor becomes the brain.</h2>
          <p>Water demand has increased while energy is under pressure. You must improve water security without creating an unsustainable rise in energy use. There is no perfect single move.</p>
          <div className="example">
            <p>// the second problem</p>
            <button type="button" onClick={() => act(SKILLS[1])}>Increase water recovery</button>
            <p className="up">→ more water stays in the system</p>
            <p className="down">→ higher energy demand</p>
            <p>How do you solve the energy problem you just created?</p>
            <button type="button" onClick={() => act(SKILLS[0])}>Shift that energy to renewable supply</button>
          </div>
          <div className="skill-board">
            {SKILLS.map((item) => (
              <button key={item.id} type="button" className={`tone-${item.id}`} onClick={() => act(item)}>
                <strong>{item.label}</strong>
                <span>{item.line}</span>
              </button>
            ))}
          </div>
          {lastEvent?.because && <p className="result">{lastEvent.because}</p>}
          <button type="button" className="ghost" onClick={reset}>Clear the record</button>
        </div>
        <article className="challenge">
          <p className="eyebrow warn">The ultimate challenge</p>
          <h3>2040: System failure</h3>
          <ul>
            {METRIC_LABELS.slice(0, 5).map(([key, label]) => (
              <li key={key}><span>{label}</span><span>{Math.round(decision.metrics[key])}%</span></li>
            ))}
          </ul>
          <p>Water availability falls. Temperature rises. Energy demand rises. Waste rises. Food security falls. The panel has connected decisions, and must agree. Poor choices and the model deteriorates. Intelligent choices and the system comes back.</p>
          <div className="challenge-actions">
            <button type="button" onClick={() => act(PRESSURES[1])}>Draw more water</button>
            <button type="button" onClick={() => act(PRESSURES[0])}>Burn more fuel</button>
            <button type="button" onClick={() => act(PRESSURES[2])}>Discard the waste</button>
            <button type="button" className="run" onClick={() => { act(SKILLS[1]); }}>Recover water</button>
            <button type="button" className="run" onClick={() => act(SKILLS[0])}>Renew the supply</button>
            <button type="button" className="run" onClick={() => act(SKILLS[2])}>Return the waste</button>
          </div>
        </article>
      </section>

      <section id="metabolism" className="band stack">
        <p className="eyebrow">The Oman metabolism</p>
        <h2>A city designed to behave more like a living organism.</h2>
        <p>A body takes resources, processes them, uses them, recycles what it can, removes waste, and adapts. Many cities take, use, and throw away. Here, resources circulate.</p>
        <div className="notes">
          <p><strong>Water.</strong> Sea, treatment, the city, wastewater, recovery, then reuse.</p>
          <p><strong>Energy.</strong> Sun and wind, storage, the city, then redistribution.</p>
          <p><strong>Materials.</strong> Products, use, waste, recovery, new products.</p>
          <p><strong>Organic waste.</strong> Food, consumption, bioprocessing, useful outputs.</p>
        </div>
      </section>

      <section id="claim" className="band stack">
        <p className="eyebrow">What we claim</p>
        <h2>The body is the environment you are deciding for.</h2>
        <p>Anatomy is only the form. Water, atmosphere, energy, climate, materials and green skills are what the organs mean. Vessels are resource flows. When the environment is stressed, the body shows it. When a decision restores a system, the body recovers.</p>
        <p className="quote">Nature has already solved many problems that humanity is still trying to solve. Instead of simply studying the body, we can learn from how it works and use those principles to design a more resilient future for Oman.</p>
      </section>

      <section id="vision" className="close">
        <h2>If the human body can survive by working as one interconnected system, why shouldn’t our future do the same?</h2>
        <p>How can Oman design systems that stay resilient as environmental and resource challenges change toward 2040 and beyond?</p>
        <p>{decision.verdict}</p>
      </section>
    </div>
  );
}
