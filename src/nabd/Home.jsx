import { useEffect, useState } from "react";
import { Body } from "./Body.jsx";
import { STAGES, previewOrgans, toneClass, toneMark } from "./engine.js";
import { Header } from "./Header.jsx";
import { sitePath } from "./site.js";

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
  return <p className="nabd-kicker font-mono text-xs uppercase tracking-[0.25em] text-sand">{children}</p>;
}

function HealthCards({ title, items, accent, note, picked, onPick }) {
  return (
    <div className="nabd-float rounded-3xl border border-line bg-ink-2/60 p-8">
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
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [cycleLive, setCycleLive] = useState(true);
  const [picked, setPicked] = useState("Resilience");
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
      <div className="nabd-first">
      <Header />
      <section id="organs" className="nabd-install nabd-enter">
        <h1 className="nabd-hero-title font-display font-light uppercase">
          What if Oman 2040<br />
          could <em className="nabd-shine font-normal text-bio">think</em>, <em className="nabd-shine font-normal text-sand">adapt</em><br />
          and <em className="nabd-shine font-normal text-bone">heal</em> like<br />
          a human body?
        </h1>
        <div className="nabd-install-body">
          <Body organs={previewOrgans(72)} health={72} className="nabd-hero-figure h-auto w-full" />
        </div>
        <div className="nabd-hero-copy">
          <div className="nabd-hero-lead">
            <p className="text-lg leading-relaxed text-mist">Nabd — Arabic for <span className="text-bone">pulse</span> — is a living system for Oman’s water, energy and waste.</p>
          </div>
          <div className="nabd-hero-close">
            <div className="flex flex-wrap gap-3">
              <a href={sitePath("/experience")} className="rounded-full bg-bio px-6 py-3 font-semibold text-ink">Play — become the brain</a>
              <a href={sitePath("/body")} className="rounded-full border border-line px-6 py-3 text-bone hover:border-bone">The Human Body</a>
            </div>
          </div>
        </div>
      </section>
      </div>

      <section id="concept" className="nabd-reveal border-y border-line/60 bg-ink-2/50">
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
                <div className="nabd-dead mt-3 flex flex-wrap items-center gap-3 font-display text-2xl text-dim line-through decoration-ember/70 md:text-3xl">
                  <span>extract</span>→<span>consume</span>→<span>discard</span>
                </div>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-bio">How a living system works</p>
                <div className="mt-3">
                  <CycleWords cycle={cycle} onChoose={chooseCycle} />
                  <p key={cycle} className="nabd-cycle-line mt-3 text-lg leading-relaxed text-bone" role="tabpanel">{CYCLE[cycle].line}</p>
                </div>
              </div>
              <ul className="grid gap-4 text-sm text-mist sm:grid-cols-2">
                <li className="nabd-float rounded-xl border border-line p-4"><span className="text-bone">If an area needs more,</span> the system detects it and redirects resources.</li>
                <li className="nabd-float rounded-xl border border-line p-4"><span className="text-bone">If resources run low,</span> it cuts unnecessary consumption.</li>
                <li className="nabd-float rounded-xl border border-line p-4"><span className="text-bone">If waste is produced,</span> it recovers useful materials first.</li>
                <li className="nabd-float rounded-xl border border-line p-4"><span className="text-bone">If conditions change,</span> it adapts instead of running at maximum.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="connected" className="nabd-reveal border-y border-line/60 bg-ink-2/50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 lg:grid-cols-[1fr_minmax(0,320px)]">
          <div>
            <Kicker>02 · Everything is connected</Kicker>
            <h2 className="mt-4 font-display text-4xl font-light leading-tight md:text-5xl">Sustainability problems are interconnected — so the solutions must be too.</h2>
            <ol className="mt-10 space-y-2">
              {CHAIN.map((item, index) => (
                <li key={item.tag}>
                  <button type="button" onClick={() => { setPlaying(false); setStep(index); }} className={`nabd-step flex w-full items-start gap-4 rounded-xl px-4 py-3 text-left transition ${index === step ? "is-now bg-ink-3 text-bone" : index < step ? "text-mist" : "text-dim hover:text-mist"}`}>
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

      <section id="health" className="nabd-reveal mx-auto max-w-7xl px-5 py-24">
        <Kicker>03 · System health, not a quiz score</Kicker>
        <h2 className="mt-4 max-w-3xl font-display text-4xl font-light leading-tight md:text-5xl">Visitors don’t get told a choice was bad. They watch the body struggle.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <HealthCards title="Good decisions" items={[...STAGES.slice(0, 4)].reverse()} accent="text-bio" note="Lights brighten, flows quicken, the ground turns green." picked={picked} onPick={setPicked} />
          <HealthCards title="Poor decisions" items={STAGES.slice(4)} accent="text-ember" note="Organs dim, circulation slows, the ground cracks — and at failure, the body flickers." picked={picked} onPick={setPicked} />
        </div>
        <div className="nabd-readout">
          <p key={pickedStage.name} className={`nabd-cycle-line font-display text-5xl ${toneClass(pickedStage.tone)}`}>{stageBand(pickedStage)}</p>
          <div>
            <p className={`font-display text-3xl ${toneClass(pickedStage.tone)}`}>{toneMark(pickedStage.tone)} {pickedStage.name}</p>
            <p className="mt-1 text-mist">{pickedStage.description}</p>
          </div>
        </div>
      </section>

      <section className="nabd-reveal relative overflow-hidden border-y border-line/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_400px_at_80%_50%,rgba(240,106,75,0.12),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-2">
          <div>
            <Kicker>04 · Green skills as the control interface</Kicker>
            <h2 className="mt-4 font-display text-4xl font-light leading-tight md:text-5xl">The visitor becomes the brain.</h2>
            <p className="mt-6 text-mist">Each visitor receives a realistic Oman 2040 challenge and a limited budget. Every strategy card helps somewhere and costs something elsewhere. There is no perfect single solution — only connected ones.</p>
            <div className="mt-8 rounded-2xl border border-line bg-ink-2/70 p-6 font-mono text-sm">
              <p className="text-dim">// example</p>
              <p className="mt-2 text-bone">Increase water production</p>
              <p className="text-bio">→ more water</p>
              <p className="text-ember">→ higher energy demand</p>
              <p className="mt-3 text-sand">How do you solve the second problem you just created?</p>
            </div>
            <div className="nabd-skills mt-8 flex flex-wrap gap-2">
              {SKILLS.map((skill) => <span key={skill} className="rounded-full border border-line px-3 py-1 text-xs text-mist">{skill}</span>)}
            </div>
          </div>
          <div className="nabd-float flex flex-col justify-center rounded-3xl border border-ember/40 bg-ink-2/80 p-8 md:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">The ultimate challenge</p>
            <p className="mt-3 font-display text-5xl md:text-6xl">2040: System failure</p>
            <ul className="nabd-alert mt-8 grid grid-cols-2 gap-3 font-mono text-sm">
              {FAILURE_SIGNS.map(([label, mark]) => (
                <li key={label} className="flex items-center justify-between rounded-lg bg-ink-3 px-3 py-2">
                  <span className="text-mist">{label}</span>
                  <span className={mark === "↑" ? "is-up text-ember" : "is-down text-ember"}>{mark}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-mist">The judging panel has <span className="text-bone">three decisions</span> to stabilise the system, and must agree on each one. Poor choices and the model visibly deteriorates. Intelligent, connected choices and the whole ecosystem comes alive.</p>
            <a href={sitePath("/experience")} className="mt-8 self-start rounded-full bg-ember px-6 py-3 font-semibold text-ink transition hover:-translate-y-0.5">Run the simulation</a>
          </div>
        </div>
      </section>

      <section id="vision" className="nabd-reveal mx-auto max-w-7xl px-5 py-24">
        <Kicker>05 · Oman Vision 2040</Kicker>
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

      <section className="nabd-reveal border-y border-line/60 bg-ink-2/50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 lg:grid-cols-2">
          <figure className="overflow-hidden rounded-3xl border border-line">
            <img src={`${import.meta.env.BASE_URL}img/vision-lab.jpg`} alt="The Human Body: Nature's Innovation Lab, with organ specimens arranged around a glass body." loading="lazy" width="1024" height="682" className="h-auto w-full" />
            <figcaption className="bg-ink-3 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-dim">The Human Body: Nature's Innovation Lab</figcaption>
          </figure>
          <div>
            <Kicker>06 · From model to invention</Kicker>
            <h2 className="mt-4 font-display text-4xl font-light leading-tight">We stopped making a model of the planet, and started designing a system.</h2>
            <div className="mt-8 space-y-4">
              <div className="nabd-float rounded-2xl border border-line p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">Original idea</p>
                <p className="mt-2 text-mist">Human body → represents the environment → people make sustainable choices.</p>
              </div>
              <div className="nabd-float rounded-2xl border border-bio/50 bg-bio/5 p-5">
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

      <section className="nabd-reveal mx-auto max-w-5xl px-5 py-28 text-center">
        <blockquote className="font-display text-2xl font-light leading-relaxed text-mist md:text-3xl">
          “Nature has already solved many problems that humanity is still trying to solve. Instead of simply studying the body, we can learn from <span className="text-bone">how it works</span> and use those principles to design a more resilient future for Oman.”
        </blockquote>
        <p className="mx-auto mt-10 max-w-3xl text-lg leading-relaxed text-mist">
          Survival, and leaving enough that the next generation can also survive, is the minimum. The ambition is past that: to strive, to enjoy, and to develop quickly, while harm to any generation is not part of the plan. The heart of Nabd is energy that could support that pace. The kidneys, lungs, liver and skin are the inventions that run on it.
        </p>
        <p className="mx-auto mt-16 max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          If the human body can survive by working as one interconnected system, <em className="nabd-shine text-bio">why shouldn’t our future do the same?</em>
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
