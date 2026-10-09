import { useEffect, useMemo, useState } from "react";
import { EXHIBITS, ORGANS as LAB_ORGANS } from "../lab/content.js";
import { INITIAL, simulate } from "../lab/engine.js";
import { Workbench } from "../lab/Exhibit.jsx";
import { Body } from "./Body.jsx";
import { STAGES, colorFor, previewOrgans, stageFor, toneClass, toneMark } from "./engine.js";
import { Header } from "./Header.jsx";
import { sitePath } from "./site.js";

const ORGANS = [
  {
    id: "brain",
    name: "The Brain",
    system: "Decision intelligence",
    role: "Intelligence & decision-making",
    message: "Green skills control the future, just as the brain controls the body.",
    insight: "Many signals, one revised decision.",
    inspiration: "Sense, compare, decide, then change the decision.",
    challenge: "Heat, water and energy planned as separate problems.",
    path: "A thinking layer that retimes demand. It does not create the resource.",
    impact: "People, policy and intelligent systems decide together. Technology alone is not the brain.",
    principle: "The brain receives signals from every part of the body and coordinates a single response.",
    technology: "A central intelligence layer that reads water, energy, temperature and waste data and decides where resources are most urgently needed.",
    monitors: ["Water availability", "Energy demand", "Temperature", "Waste levels", "Consumption"],
    oman: "Data-led planning for a more innovative, knowledge-based economy.",
  },
  {
    id: "heart",
    name: "The Heart",
    system: "Clean energy",
    role: "Resource circulation",
    message: "The future needs energy that powers life without damaging the systems that sustain life.",
    insight: "A continuous pump, with rhythm and storage in the flow.",
    inspiration: "Generate cleanly, hold surplus, send it where the load is.",
    challenge: "Every other invention stops if the energy that feeds it causes harm.",
    path: "Clean energy that powers recovery, exchange, cooling and circulation.",
    impact: "Survival is the minimum. This energy is meant to let a society strive, enjoy and develop, without putting a later generation at risk.",
    principle: "The heart and blood vessels deliver resources according to the body’s needs.",
    technology: "A circulation network that keeps water, energy and recovered materials flowing to where they are needed instead of being supplied once and lost.",
    monitors: ["Flow rates", "Distribution balance", "Food & material supply"],
    oman: "Resources should flow through a system, not into a system and disappear.",
  },
  {
    id: "blood",
    name: "Blood",
    system: "Resource flow",
    role: "Circulation of water, energy, food and materials",
    message: "A healthy future depends on circulation, not isolated systems.",
    insight: "Blood carries supply, signals and waste between every tissue.",
    inspiration: "Connect the streams, then move them toward the place under stress.",
    challenge: "A city can hold water in one sector and a shortage in another.",
    path: "One circulation for resources that already exist. It does not create them.",
    impact: "In the model a shortage can ease when the streams are allowed to meet. That is a simulation assumption, not a measured national flow.",
    principle: "Blood carries oxygen, nutrients, signals and waste so one part of the body can supply another.",
    technology: "A circulation layer for water, energy, food, materials and recoverable waste. The heart’s clean energy is what keeps that flow moving.",
    monitors: ["Where demand is short", "What can be moved", "What must not be interrupted"],
    oman: "Sectors that never meet cannot answer a shortage somewhere else in the country.",
  },
  {
    id: "kidneys",
    name: "The Kidneys",
    system: "Water intelligence",
    role: "Selective water recovery",
    message: "Water security depends on systems that filter, regulate and reuse — just like kidneys.",
    insight: "Filter, take back what is still useful, release a smaller remainder.",
    inspiration: "Do not treat every used drop as waste.",
    challenge: "Water used once is often lost in a region that cannot afford to lose it.",
    path: "Selective recovery: useful water returns, a concentrate leaves, and the recovery spends energy.",
    impact: "The model shows recovered water and the energy that recovery draws. Those readings are assumptions, not a measured saving.",
    principle: "Kidneys don’t remove everything — they carefully decide what to keep and what to remove.",
    technology: "A selective recovery system that separates used water into reusable water, recoverable materials and concentrated waste.",
    monitors: ["Water quality", "Recovery rate", "Brine & residue"],
    oman: "Water security for one of the most water-stressed regions on Earth.",
  },
  {
    id: "lungs",
    name: "The Lungs",
    system: "Air exchange",
    role: "Air & carbon management",
    message: "Exchange must stay balanced, or the whole system suffers.",
    insight: "A vast folded surface, with air moving across it.",
    inspiration: "Exchange across a large surface, and change the exchange when the air changes.",
    challenge: "Dust, humidity and fouled air in a hot city.",
    path: "An exchange surface for air that has to be renewed. It is not a waste organ, and it does not claim to clean a city.",
    impact: "Raised dust or still air weakens the exchange in the model. The lung-inspired surface resists that. It does not erase it.",
    principle: "A vast exchange surface folded into a compact space makes the lungs extremely efficient.",
    technology: "High-surface-area exchange systems — from mangroves to green corridors — that monitor air quality, CO₂ and emissions and respond to them.",
    monitors: ["Air quality", "Carbon dioxide", "Emissions"],
    oman: "Cleaner cities and progress toward Oman’s net-zero ambitions.",
  },
  {
    id: "skin",
    name: "The Skin",
    system: "Climate envelope",
    role: "Protection & temperature regulation",
    message: "Protection and temperature control are essential for survival in extreme climates.",
    insight: "An outer layer that changes how much heat it lets through.",
    inspiration: "A responding skin, not a fixed shell.",
    challenge: "Cooling is what makes extreme heat expensive.",
    path: "An outer layer for houses that is less open to summer heat, so the building asks less of air conditioning.",
    impact: "No share of energy saved is claimed. In the model, heat getting in and cooling demand fall when the layer responds. That fall is a simulation assumption.",
    principle: "Skin protects the body and constantly helps keep its internal temperature stable.",
    technology: "An adaptive outer layer for buildings: more cooling and shading when it is hot, less when it is not — instead of running at maximum all the time.",
    monitors: ["Temperature", "Sunlight intensity", "Cooling load"],
    oman: "Designed for Oman’s extreme heat, where cooling drives energy demand.",
  },
  {
    id: "liver",
    name: "The Liver",
    system: "Circular waste",
    role: "Waste transformation",
    message: "In a healthy system, waste is managed before it becomes poison.",
    insight: "Sort, transform, recover, and let only the true remainder leave.",
    inspiration: "Detoxify by changing the material, not by hiding it.",
    challenge: "Mixed waste accumulates, and hazardous material cannot be wished away.",
    path: "Use, separate, transform, recover, reuse — a hope of zero waste, with hazardous material still named.",
    impact: "Nothing here is a measured diversion rate. The model only shows a stream being split into recovery and remainder.",
    principle: "The liver processes and detoxifies harmful substances so the body can use or remove them.",
    technology: "A waste stream that is separated into useful and unusable parts — compost, biogas and recovered materials — so waste becomes a resource.",
    monitors: ["Waste volume", "Separation quality", "Recovered material"],
    oman: "A circular economy that reduces landfill and creates new industries.",
  },
  {
    id: "skeleton",
    name: "The Skeleton",
    system: "Resilient infrastructure",
    role: "Structure, support and long-term stability",
    message: "No living system can function without strong, intelligent support.",
    insight: "Bone shares a load. One point is not asked to hold the body.",
    inspiration: "Distribute stress through a frame instead of thickening a single member.",
    challenge: "Heat and structural demand arrive together on buildings, transport and infrastructure.",
    path: "A frame that shares load. The same stress reads lower in the model when it is shared.",
    impact: "This is a study of the logic, not a structural certificate. Raise the load or the heat and the stress climbs again.",
    principle: "The skeleton gives the body structure, support and the ability to keep standing as stress changes.",
    technology: "Infrastructure that shares load across a frame — buildings, transport and the structure the other systems depend on — instead of concentrating stress in one place.",
    monitors: ["Structural load", "Heat on the structure", "Where stress concentrates"],
    oman: "The framework that has to hold every other sustainable system up, in heat, over decades.",
  },
];

const VISION = [
  { title: "Environmental protection", text: "A system that protects ecosystems by consuming less and recovering more." },
  { title: "Efficient resource use", text: "Resources circulate and are reused instead of being extracted and discarded." },
  { title: "Innovation & technology", text: "Sensing, data and adaptive materials working together as one system." },
  { title: "Future-ready skills", text: "Visitors practise systems thinking, problem solving and decision-making." },
  { title: "Economic diversification", text: "Water recovery, circular materials and clean energy as new sectors." },
  { title: "Responsible use of nature", text: "Learning from biology — the oldest sustainable system we know." },
];

const CHAIN = [
  { organ: ["kidneys"], tag: "Sense", text: "Water demand rises across Oman. The kidney system detects water availability falling." },
  { organ: ["brain"], tag: "Signal", text: "The brain receives the signal from the kidneys." },
  { organ: ["brain", "kidneys"], tag: "Decide", text: "It decides that water recovery needs to increase." },
  { organ: ["heart", "kidneys"], tag: "Distribute", text: "The heart redirects more energy toward water recovery." },
  { organ: ["heart", "brain"], tag: "Sense again", text: "But that creates a new energy demand — and the brain detects it." },
  { organ: ["heart", "lungs"], tag: "Adapt", text: "The energy system responds by prioritising renewable solar power, protecting the air." },
  { organ: ["skin"], tag: "Regulate", text: "Meanwhile the temperature climbs. The skin increases its cooling and shading response." },
  { organ: ["blood", "skeleton"], tag: "Support", text: "Blood keeps water, energy and recovered material in one circulation. The skeleton keeps the structure standing while that load moves." },
  { organ: [], tag: "Balance", text: "One environmental problem has created a chain of decisions through the whole body." },
];

const CYCLE = [
  { word: "sense", organs: ["kidneys", "lungs"], line: "The system detects what is changing — water, energy, heat and waste." },
  { word: "decide", organs: ["brain"], line: "One intelligence layer chooses where the next response should go." },
  { word: "distribute", organs: ["heart"], line: "Resources move toward the part of the system under the most stress." },
  { word: "recover", organs: ["kidneys", "liver"], line: "Useful material is separated from waste before anything is discarded." },
  { word: "adapt", organs: ["skin", "lungs"], line: "The response changes when conditions change, instead of running at maximum." },
];
const SKILLS = ["Critical thinking", "Problem solving", "Systems thinking", "Innovation", "Decision-making", "Adaptability", "Environmental awareness"];
const FAILURE_SIGNS = [["Water availability", "↓"], ["Temperature", "↑"], ["Energy demand", "↑"], ["Waste", "↑"], ["Food security", "↓"]];

function Kicker({ children }) {
  return <p className="font-mono text-xs uppercase tracking-[0.25em] text-sand">{children}</p>;
}

function HealthCards({ title, items, accent, note, picked, onPick }) {
  return (
    <div className="rounded-3xl border border-line bg-ink-2/60 p-8">
      <p className={`font-mono text-xs uppercase tracking-[0.2em] ${accent}`}>{title}</p>
      <ol className="mt-6 space-y-2">
        {items.map((item, index) => (
          <li key={item.name}>
            <button type="button" onClick={() => onPick(item.name)} aria-pressed={picked === item.name} className={`nabd-stage-btn flex gap-4 ${picked === item.name ? "is-on" : ""}`}>
              <span className="mt-1 font-mono text-xs text-dim">{index + 1}</span>
              <span className="nabd-stage-copy">
                <span className={`nabd-stage-name font-display text-2xl ${toneClass(item.tone)}`}>{toneMark(item.tone)} {item.name}</span>
                <span className="nabd-stage-note text-mist">{item.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-6 border-t border-line pt-4 text-sm text-dim">{note}</p>
    </div>
  );
}

function stageBand(stage) {
  const index = STAGES.findIndex((item) => item.name === stage.name);
  const top = index <= 0 ? 100 : STAGES[index - 1].min - 1;
  return `${stage.min}–${top}`;
}

function CycleWords({ cycle, onChoose }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="How a living system works">
      {CYCLE.map((item, index) => (
        <button key={item.word} type="button" role="tab" aria-selected={cycle === index} onClick={() => onChoose(index)} className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] transition ${cycle === index ? "border-bio bg-bio/10 text-bio" : "border-line text-dim hover:text-mist"}`}>
          {item.word}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [health, setHealth] = useState(72);
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [cycleLive, setCycleLive] = useState(true);
  const [picked, setPicked] = useState("Resilience");
  const stage = stageFor(health);
  const organ = ORGANS.find((item) => item.id === selected) ?? null;
  const exhibit = selected ? EXHIBITS[selected] : null;
  const controls = LAB_ORGANS.find((item) => item.id === selected)?.controls ?? [];
  const [local, setLocal] = useState(() => ({ ...INITIAL, systems: { ...INITIAL.systems, kidneys: true } }));
  const played = useMemo(() => simulate(local), [local]);
  const bare = useMemo(() => simulate({ ...local, systems: { ...INITIAL.systems } }), [local]);
  useEffect(() => {
    if (!selected) return;
    setLocal({ ...INITIAL, systems: { ...INITIAL.systems, [selected]: true } });
  }, [selected]);
  const pickedStage = STAGES.find((item) => item.name === picked) ?? STAGES[2];

  useEffect(() => {
    if (!cycleLive || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = setInterval(() => setCycle((current) => (current + 1) % CYCLE.length), 4200);
    return () => clearInterval(timer);
  }, [cycleLive]);

  function chooseCycle(index) {
    setCycleLive(false);
    setCycle(index);
  }

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => setStep((current) => (current + 1) % CHAIN.length), 3200);
    return () => clearInterval(timer);
  }, [playing]);

  return (
    <div className="grain overflow-x-clip">
      <Header />
      <section id="organs" className="nabd-install">
        <div className="nabd-install-body">
          <Body organs={previewOrgans(health)} health={health} selected={selected} onSelect={setSelected} className="h-auto w-full" />
          <div className="mx-auto mt-3 max-w-sm">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
              <span>Body</span>
              <span className={toneClass(stage.tone)}>{stage.name} · {health}</span>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              value={health}
              onChange={(event) => setHealth(Number(event.target.value))}
              className="nabd-range mt-2 w-full"
              style={{ background: `linear-gradient(90deg, ${colorFor(health)} ${((health - 5) / 90) * 100}%, var(--color-ink-3) ${((health - 5) / 90) * 100}%)` }}
              aria-label="Preview system health"
            />
          </div>
        </div>
        <div className="nabd-organ-list" role="list">
          {ORGANS.map((item) => (
            <button key={item.id} type="button" role="listitem" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>
              {item.name.replace("The ", "")}
            </button>
          ))}
        </div>
        <div>
          {organ && exhibit ? (
            <article key={organ.id}>
              <button type="button" onClick={() => setSelected(null)} className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim hover:text-bone">← The living planet</button>
              <p className="mt-5 font-mono text-xs uppercase tracking-[0.22em] text-sand">{organ.name}</p>
              <h2 className="mt-2 font-display text-4xl font-light leading-tight md:text-5xl">{organ.system}</h2>
              <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-bio">The technology</p>
              <p className="mt-3 max-w-xl text-lg leading-relaxed text-bone">{organ.technology}</p>
              <p className="mt-4 max-w-xl leading-relaxed text-mist">{exhibit.invention}</p>
              <p className="mt-6 max-w-xl leading-relaxed text-mist"><span className="text-bone">From the organ. </span>{organ.principle}</p>
              <p className="mt-3 max-w-xl leading-relaxed text-mist"><span className="text-sand">For Oman. </span>{organ.oman}</p>
              {exhibit.beyond && <p className="mt-4 max-w-xl leading-relaxed text-bone">{exhibit.beyond}</p>}
              <details className="nabd-fold max-w-xl">
                <summary>Try the model</summary>
                <div className="mt-4">
                  <Workbench
                    organId={organ.id}
                    controls={controls}
                    result={played}
                    bare={bare}
                    local={local}
                    onChange={(key, value) => setLocal((state) => ({ ...state, [key]: value }))}
                    onToggle={() => setLocal((state) => ({ ...state, systems: { ...state.systems, [organ.id]: !state.systems[organ.id] } }))}
                  />
                </div>
              </details>
            </article>
          ) : (
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-sand">A biomimetic sustainability system · Oman Vision 2040</p>
              <p className="mt-5 font-display text-3xl font-light text-sand md:text-4xl">Humanity: The Living Planet</p>
              <h1 className="mt-3 font-display text-[clamp(2.3rem,4.6vw,4.4rem)] font-light leading-[0.95]">
                What if Oman 2040 could <em className="nabd-shine font-normal text-bio">think</em>, <em className="nabd-shine font-normal text-sand">adapt</em> and <em className="nabd-shine font-normal text-bone">heal</em> like a human body?
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">
                Nabd — Arabic for <span className="text-bone">pulse</span> — is a self-regulating resource system for water, energy and waste. Press an organ. The technology it inspired opens here.
              </p>
              <p className="mt-3 max-w-xl leading-relaxed text-mist">Surviving is the minimum. The aim is to keep developing — with comfort, innovation and prosperity — while harm to any generation is not part of the plan.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={sitePath("/experience")} className="rounded-full bg-bio px-6 py-3 font-semibold text-ink">Play — become the brain</a>
                <a href={sitePath("/body")} className="rounded-full border border-line px-6 py-3 text-bone hover:border-bone">The Human Body</a>
                <a href="#concept" className="rounded-full border border-line px-6 py-3 text-mist hover:border-bone hover:text-bone">How it works</a>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="concept" className="border-y border-line/60 bg-ink-2/50">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <Kicker>01 · The idea</Kicker>
              <h2 className="mt-4 font-display text-4xl font-light leading-tight md:text-5xl">The body isn’t a symbol of the environment. It’s our <em className="text-bio">design brief</em>.</h2>
              <p className="mt-6 text-mist">The human body doesn’t simply consume. It senses what is happening, moves resources to where they are needed, removes waste, adapts to change and keeps itself in balance. We asked: what if future infrastructure worked the same way?</p>
            </div>
            <div className="flex flex-col justify-center gap-8">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">How most systems work today</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 font-display text-2xl text-dim line-through decoration-ember/70 md:text-3xl">
                  <span>extract</span>→<span>consume</span>→<span>discard</span>
                </div>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-bio">How a living system works</p>
                <div className="mt-3">
                  <CycleWords cycle={cycle} onChoose={chooseCycle} />
                  <p className="mt-3 text-lg leading-relaxed text-bone" role="tabpanel">{CYCLE[cycle].line}</p>
                </div>
              </div>
              <ul className="grid gap-4 text-sm text-mist sm:grid-cols-2">
                <li className="rounded-xl border border-line p-4"><span className="text-bone">If an area needs more,</span> the system detects it and redirects resources.</li>
                <li className="rounded-xl border border-line p-4"><span className="text-bone">If resources run low,</span> it cuts unnecessary consumption.</li>
                <li className="rounded-xl border border-line p-4"><span className="text-bone">If waste is produced,</span> it recovers useful materials first.</li>
                <li className="rounded-xl border border-line p-4"><span className="text-bone">If conditions change,</span> it adapts instead of running at maximum.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="connected" className="border-y border-line/60 bg-ink-2/50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 lg:grid-cols-[1fr_minmax(0,320px)]">
          <div>
            <Kicker>03 · Everything is connected</Kicker>
            <h2 className="mt-4 font-display text-4xl font-light leading-tight md:text-5xl">Sustainability problems are interconnected — so the solutions must be too.</h2>
            <ol className="mt-10 space-y-2">
              {CHAIN.map((item, index) => (
                <li key={item.tag}>
                  <button type="button" onClick={() => { setPlaying(false); setStep(index); }} className={`nabd-step flex w-full items-start gap-4 rounded-xl px-4 py-3 text-left transition ${index === step ? "bg-ink-3 text-bone" : index < step ? "text-mist" : "text-dim hover:text-mist"}`}>
                    <span className={`mt-0.5 w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] ${index === step ? "text-bio" : ""}`}>{String(index + 1).padStart(2, "0")} {item.tag}</span>
                    <span className="text-[15px] leading-snug">{item.text}</span>
                    {index === step && playing && <span className="nabd-fill" />}
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => setPlaying((value) => !value)} className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-dim hover:text-bio">{playing ? "❚❚ Pause sequence" : "▶ Play sequence"}</button>
          </div>
          <div className="mx-auto w-full max-w-[320px]">
            <Body
              organs={previewOrgans(70)}
              health={70}
              highlight={CHAIN[step].organ}
              onSelect={(organ) => {
                const upcoming = CHAIN.findIndex((item, index) => index >= step && item.organ.includes(organ));
                const any = CHAIN.findIndex((item) => item.organ.includes(organ));
                const next = upcoming >= 0 ? upcoming : any;
                if (next >= 0) {
                  setPlaying(false);
                  setStep(next);
                }
              }}
              className="h-auto w-full"
            />
            <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-dim">Select an organ to jump the sequence</p>
          </div>
        </div>
      </section>

      <section id="health" className="mx-auto max-w-7xl px-5 py-24">
        <Kicker>04 · System health, not a quiz score</Kicker>
        <h2 className="mt-4 max-w-3xl font-display text-4xl font-light leading-tight md:text-5xl">Visitors don’t get told a choice was bad. They watch the body struggle.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <HealthCards title="Good decisions" items={[...STAGES.slice(0, 4)].reverse()} accent="text-bio" note="Lights brighten, flows quicken, the ground turns green." picked={picked} onPick={setPicked} />
          <HealthCards title="Poor decisions" items={STAGES.slice(4)} accent="text-ember" note="Organs dim, circulation slows, the ground cracks — and at failure, the body flickers." picked={picked} onPick={setPicked} />
        </div>
        <div className="nabd-readout">
          <p className={`font-display text-5xl ${toneClass(pickedStage.tone)}`}>{stageBand(pickedStage)}</p>
          <div>
            <p className={`font-display text-3xl ${toneClass(pickedStage.tone)}`}>{toneMark(pickedStage.tone)} {pickedStage.name}</p>
            <p className="mt-1 text-mist">{pickedStage.description}</p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-line/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_400px_at_80%_50%,rgba(240,106,75,0.12),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-2">
          <div>
            <Kicker>05 · Green skills as the control interface</Kicker>
            <h2 className="mt-4 font-display text-4xl font-light leading-tight md:text-5xl">The visitor becomes the brain.</h2>
            <p className="mt-6 text-mist">Each visitor receives a realistic Oman 2040 challenge and a limited budget. Every strategy card helps somewhere and costs something elsewhere. There is no perfect single solution — only connected ones.</p>
            <div className="mt-8 rounded-2xl border border-line bg-ink-2/70 p-6 font-mono text-sm">
              <p className="text-dim">// example</p>
              <p className="mt-2 text-bone">Increase water production</p>
              <p className="text-bio">→ more water</p>
              <p className="text-ember">→ higher energy demand</p>
              <p className="mt-3 text-sand">How do you solve the second problem you just created?</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {SKILLS.map((skill) => <span key={skill} className="rounded-full border border-line px-3 py-1 text-xs text-mist">{skill}</span>)}
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-3xl border border-ember/40 bg-ink-2/80 p-8 md:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">The ultimate challenge</p>
            <p className="mt-3 font-display text-5xl md:text-6xl">2040: System failure</p>
            <ul className="mt-8 grid grid-cols-2 gap-3 font-mono text-sm">
              {FAILURE_SIGNS.map(([label, mark]) => (
                <li key={label} className="flex items-center justify-between rounded-lg bg-ink-3 px-3 py-2">
                  <span className="text-mist">{label}</span>
                  <span className="text-ember">{mark}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-mist">The judging panel has <span className="text-bone">three decisions</span> to stabilise the system, and must agree on each one. Poor choices and the model visibly deteriorates. Intelligent, connected choices and the whole ecosystem comes alive.</p>
            <a href={sitePath("/experience")} className="mt-8 self-start rounded-full bg-ember px-6 py-3 font-semibold text-ink transition hover:-translate-y-0.5">Run the simulation</a>
          </div>
        </div>
      </section>

      <section id="vision" className="mx-auto max-w-7xl px-5 py-24">
        <Kicker>06 · Oman Vision 2040</Kicker>
        <h2 className="mt-4 max-w-4xl font-display text-4xl font-light leading-tight md:text-5xl">How can Oman design systems that stay resilient as environmental and resource challenges change toward 2040 and beyond?</h2>
        <p className="mt-4 text-mist">Nabd is our proposed biomimetic answer.</p>
        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {VISION.map((item, index) => (
            <div key={item.title} className="nabd-vision bg-ink p-8">
              <p className="font-mono text-xs text-sand">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 font-display text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line/60 bg-ink-2/50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 lg:grid-cols-2">
          <figure className="overflow-hidden rounded-3xl border border-line">
            <img src={`${import.meta.env.BASE_URL}img/vision-lab.jpg`} alt="The Human Body: Nature's Innovation Lab, with organ specimens arranged around a glass body." loading="lazy" width="1024" height="682" className="h-auto w-full" />
            <figcaption className="bg-ink-3 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-dim">The Human Body: Nature's Innovation Lab</figcaption>
          </figure>
          <div>
            <Kicker>07 · From model to invention</Kicker>
            <h2 className="mt-4 font-display text-4xl font-light leading-tight">We stopped making a model of the planet, and started designing a system.</h2>
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-line p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">Original idea</p>
                <p className="mt-2 text-mist">Human body → represents the environment → people make sustainable choices.</p>
              </div>
              <div className="rounded-2xl border border-bio/50 bg-bio/5 p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-bio">Nabd</p>
                <p className="mt-2 text-bone">Human body → provides biological mechanisms → mechanisms inspire a technological system → a working prototype shows how it could run in Oman.</p>
              </div>
            </div>
            <div className="mt-8 border-l-2 border-sand pl-5 text-sm leading-relaxed text-mist">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sand">What we claim — honestly</p>
              <p className="mt-2">Comparing cities to the human body isn’t new; it already exists in research and biomimicry. Our originality is the specific invention: a human-body-inspired, interconnected, adaptive sustainability system designed around Oman’s future challenges, physically demonstrated as a responsive prototype and operated through green-skill decision-making.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-28 text-center">
        <blockquote className="font-display text-2xl font-light leading-relaxed text-mist md:text-3xl">
          “Nature has already solved many problems that humanity is still trying to solve. Instead of simply studying the body, we can learn from <span className="text-bone">how it works</span> and use those principles to design a more resilient future for Oman.”
        </blockquote>
        <p className="mx-auto mt-10 max-w-3xl text-lg leading-relaxed text-mist">
          Survival, and leaving enough that the next generation can also survive, is the minimum. The ambition is past that: to strive, to enjoy, and to develop quickly, while harm to any generation is not part of the plan. The heart of Nabd is energy that could support that pace. The kidneys, lungs, liver and skin are the inventions that run on it.
        </p>
        <p className="mx-auto mt-16 max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          If the human body can survive by working as one interconnected system, <em className="text-bio">why shouldn’t our future do the same?</em>
        </p>
        <a href={sitePath("/experience")} className="mt-12 inline-block rounded-full bg-bio px-8 py-4 font-semibold text-ink transition hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(198,165,106,0.45)]">Become the brain of Oman 2040</a>
      </section>

      <footer className="border-t border-line/60">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-5 py-8 font-mono text-[11px] uppercase tracking-[0.18em] text-dim sm:flex-row">
          <span>Nabd · a living sustainability system</span>
          <span className="text-mist">{CYCLE.map((item) => item.word).join(" · ")}</span>
          <span>Designed for Oman Vision 2040</span>
        </div>
      </footer>
    </div>
  );
}
