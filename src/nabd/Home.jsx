import { useEffect, useState } from "react";
import { Body } from "./Body.jsx";
import { STAGES, colorFor, previewOrgans, stageFor, toneClass, toneMark } from "./engine.js";
import { Header } from "./Header.jsx";

const ORGANS = [
  { id: "brain", name: "The Brain", role: "Intelligence & decision-making", principle: "The brain receives signals from every part of the body and coordinates a single response.", technology: "A central intelligence layer that reads water, energy, temperature and waste data and decides where resources are most urgently needed.", monitors: ["Water availability", "Energy demand", "Temperature", "Waste levels", "Consumption"], oman: "Data-led planning for a more innovative, knowledge-based economy." },
  { id: "heart", name: "The Heart", role: "Resource circulation", principle: "The heart and blood vessels deliver resources according to the body’s needs.", technology: "A circulation network that keeps water, energy and recovered materials flowing to where they are needed instead of being supplied once and lost.", monitors: ["Flow rates", "Distribution balance", "Food & material supply"], oman: "Resources should flow through a system, not into a system and disappear." },
  { id: "kidneys", name: "The Kidneys", role: "Selective water recovery", principle: "Kidneys don’t remove everything — they carefully decide what to keep and what to remove.", technology: "A selective recovery system that separates used water into reusable water, recoverable materials and concentrated waste.", monitors: ["Water quality", "Recovery rate", "Brine & residue"], oman: "Water security for one of the most water-stressed regions on Earth." },
  { id: "lungs", name: "The Lungs", role: "Air & carbon management", principle: "A vast exchange surface folded into a compact space makes the lungs extremely efficient.", technology: "High-surface-area exchange systems — from mangroves to green corridors — that monitor air quality, CO₂ and emissions and respond to them.", monitors: ["Air quality", "Carbon dioxide", "Emissions"], oman: "Cleaner cities and progress toward Oman’s net-zero ambitions." },
  { id: "skin", name: "The Skin", role: "Protection & temperature regulation", principle: "Skin protects the body and constantly helps keep its internal temperature stable.", technology: "An adaptive outer layer for buildings: more cooling and shading when it is hot, less when it is not — instead of running at maximum all the time.", monitors: ["Temperature", "Sunlight intensity", "Cooling load"], oman: "Designed for Oman’s extreme heat, where cooling drives energy demand." },
  { id: "liver", name: "The Liver", role: "Waste transformation", principle: "The liver processes and detoxifies harmful substances so the body can use or remove them.", technology: "A waste stream that is separated into useful and unusable parts — compost, biogas and recovered materials — so waste becomes a resource.", monitors: ["Waste volume", "Separation quality", "Recovered material"], oman: "A circular economy that reduces landfill and creates new industries." },
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
  { organ: ["brain", "heart", "lungs", "kidneys", "liver", "skin"], tag: "Balance", text: "One environmental problem has created a chain of decisions through the whole body." },
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
  const [selected, setSelected] = useState("kidneys");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [cycleLive, setCycleLive] = useState(true);
  const [picked, setPicked] = useState("Resilience");
  const stage = stageFor(health);
  const organ = ORGANS.find((item) => item.id === selected);
  const organReading = previewOrgans(74)[selected];
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
      <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-12 lg:grid-cols-[1.25fr_1fr] lg:pt-20">
        <div className="relative z-10 flex flex-col">
          <p className="rise font-mono text-xs uppercase tracking-[0.3em] text-sand" style={{ animationDelay: "0.05s" }}>A biomimetic sustainability system · Oman Vision 2040</p>
          <h1 className="rise mt-6 font-display text-[clamp(2.6rem,6.2vw,5.6rem)] font-light leading-[0.95] tracking-tight" style={{ animationDelay: "0.15s" }}>
            What if Oman 2040 could <em className="nabd-shine font-normal text-bio">think</em>, <em className="nabd-shine font-normal text-sand">adapt</em> and <em className="nabd-shine font-normal text-bone">heal</em> like a human body?
          </h1>
          <p className="rise mt-8 max-w-xl text-lg leading-relaxed text-mist" style={{ animationDelay: "0.3s" }}>
            Nabd — Arabic for <span className="text-bone">pulse</span> — is a self-regulating resource system for water, energy and waste. It borrows the mechanisms the human body uses to stay alive and turns them into infrastructure that senses, decides, circulates, recovers and adapts.
          </p>
          <div className="rise mt-10 flex flex-wrap items-center gap-4" style={{ animationDelay: "0.45s" }}>
            <a href="/experience" className="rounded-full bg-bio px-6 py-3 font-semibold text-ink transition hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(75,227,180,0.55)]">Enter the system — become the brain</a>
            <a href="#concept" className="rounded-full border border-line px-6 py-3 text-mist hover:border-bone hover:text-bone">How it works</a>
          </div>
          <div className="rise mt-8 max-w-xl" style={{ animationDelay: "0.55s" }}>
            <CycleWords cycle={cycle} onChoose={chooseCycle} />
          </div>
        </div>
        <div className="rise relative" style={{ animationDelay: "0.25s" }}>
          <div
            className="nabd-chamber nabd-stage relative mx-auto max-w-[380px]"
            onMouseMove={(event) => {
              if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
              const tilt = event.currentTarget.querySelector(".nabd-tilt");
              if (!tilt) return;
              const box = event.currentTarget.getBoundingClientRect();
              const x = (event.clientX - box.left) / box.width - 0.5;
              const y = (event.clientY - box.top) / box.height - 0.5;
              tilt.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`;
            }}
            onMouseLeave={(event) => {
              const tilt = event.currentTarget.querySelector(".nabd-tilt");
              if (tilt) tilt.style.transform = "rotateX(0deg) rotateY(0deg)";
            }}
          >
            <div className="nabd-tilt">
              <Body organs={previewOrgans(health)} health={health} highlight={CYCLE[cycle].organs} labels className="h-auto w-full" />
              <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-sand">{CYCLE[cycle].word} · the highlighted organs</p>
            </div>
          </div>
          <div className="mx-auto mt-2 max-w-sm rounded-2xl border border-line bg-ink-2/80 p-4 backdrop-blur">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em]">
              <span className="text-dim">System health</span>
              <span className={toneClass(stage.tone)}>{toneMark(stage.tone)} {stage.name} · {health}</span>
            </div>
            <div className="nabd-meter" aria-hidden="true"><i style={{ width: `${health}%`, background: colorFor(health) }} /></div>
            <input
              type="range"
              min="5"
              max="95"
              value={health}
              onChange={(event) => setHealth(Number(event.target.value))}
              className="nabd-range mt-3 w-full"
              style={{ background: `linear-gradient(90deg, ${colorFor(health)} ${((health - 5) / 90) * 100}%, var(--color-ink-3) ${((health - 5) / 90) * 100}%)` }}
              aria-label="Preview system health"
            />
            <p className="mt-2 text-xs text-dim">Drag to see the body stressed or thriving.</p>
            <p className="mt-1 text-xs text-mist">{stage.description}</p>
            <div className="nabd-organs font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
              {Object.entries(previewOrgans(health)).map(([organ, value]) => (
                <div key={organ}>
                  {organ.charAt(0).toUpperCase() + organ.slice(1)}
                  <span><i style={{ width: `${value}%`, background: colorFor(value) }} /></span>
                </div>
              ))}
            </div>
          </div>
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

      <section id="organs" className="mx-auto max-w-7xl px-5 py-24">
        <Kicker>02 · Six organs, six technologies</Kicker>
        <h2 className="mt-4 max-w-3xl font-display text-4xl font-light leading-tight md:text-5xl">Biological mechanisms, translated into infrastructure.</h2>
        <p className="mt-4 max-w-2xl text-mist">Select an organ on the body or in the list.</p>
        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,340px)_1fr]">
          <div className="mx-auto w-full max-w-[340px] lg:sticky lg:top-24">
            <Body organs={previewOrgans(74)} health={74} selected={selected} highlight={[selected]} onSelect={setSelected} className="h-auto w-full" />
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              {ORGANS.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelected(item.id)} className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] transition ${selected === item.id ? "border-bio bg-bio/10 text-bio" : "border-line text-mist hover:border-bone hover:text-bone"}`}>
                  {item.name.replace("The ", "")}
                </button>
              ))}
            </div>
            <article key={organ.id} className="rise mt-8 rounded-3xl border border-line bg-ink-2/70 p-8 md:p-10" style={{ boxShadow: `0 0 0 1px ${colorFor(previewOrgans(74)[selected])}55, 0 20px 50px rgba(0,0,0,0.28)` }}>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-sand">{organ.role}</p>
              <h3 className="mt-2 font-display text-4xl md:text-5xl">{organ.name}</h3>
              <div className="nabd-bridge mt-8">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">Biological principle</p>
                  <p className="mt-2 text-lg leading-relaxed text-bone">{organ.principle}</p>
                </div>
                <div className="nabd-bridge-mark" aria-hidden="true">→</div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-bio">Our technology</p>
                  <p className="mt-2 text-lg leading-relaxed text-bone">{organ.technology}</p>
                </div>
              </div>
              <div className="mt-6 max-w-xs">
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
                  <span>Organ reading</span>
                  <span className="text-bone">{organReading}</span>
                </div>
                <div className="nabd-meter" aria-hidden="true"><i style={{ width: `${organReading}%`, background: colorFor(organReading) }} /></div>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {organ.monitors.map((item) => (
                  <span key={item} className="rounded-md bg-ink-3 px-3 py-1 font-mono text-xs text-mist">senses: {item}</span>
                ))}
              </div>
              <p className="mt-8 border-l-2 border-sand pl-4 text-mist"><span className="text-sand">Why it matters for Oman — </span>{organ.oman}</p>
            </article>
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
            <a href="/experience" className="mt-8 self-start rounded-full bg-ember px-6 py-3 font-semibold text-ink transition hover:-translate-y-0.5">Run the simulation</a>
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
            <img src={`${import.meta.env.BASE_URL}img/original-prototype.png`} alt="Our first exhibition model: a human-shaped figure with glowing organs, labelled as parts of the planet." loading="lazy" width="900" height="960" className="h-auto w-full opacity-90" />
            <figcaption className="bg-ink-3 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-dim">Where we started — our first model</figcaption>
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
        <p className="mx-auto mt-16 max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          If the human body can survive by working as one interconnected system, <em className="text-bio">why shouldn’t our future do the same?</em>
        </p>
        <a href="/experience" className="mt-12 inline-block rounded-full bg-bio px-8 py-4 font-semibold text-ink transition hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(75,227,180,0.55)]">Become the brain of Oman 2040</a>
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
