import { useEffect, useId, useMemo, useState } from "react";
import { Body } from "./Body.jsx";
import {
  BASE,
  FAILURE,
  JOURNEY,
  METRICS,
  STAGES,
  add,
  colorFor,
  findStrategy,
  forecast,
  organHealth,
  shockSteps,
  stageFor,
  systemHealth,
  toneClass,
  toneMark,
  wellness,
} from "./engine.js";
import { Header } from "./Header.jsx";

function ratePlay(beforeMetrics, result, streak) {
  const before = systemHealth(beforeMetrics);
  const after = systemHealth(result.metrics);
  const good = (result.synergies ?? []).filter((item) => item.good).length;
  const bad = (result.synergies ?? []).filter((item) => !item.good).length;
  const strain = (result.cascade ?? []).filter((step) => step.phase === "adapt" && step.tone === "bad" && !step.text.startsWith("Chain reaction") && !step.text.startsWith("Connected")).length;
  const multiplier = 1 + Math.min(2, streak) * 0.5;
  const gained = Math.round(((after - before) * 10 + good * 50 - bad * 30 - strain * 10) * multiplier);
  return { before, after, good, bad, strain, multiplier, gained };
}

const RANKS = [
  { xp: 0, name: "Observer" },
  { xp: 80, name: "Analyst" },
  { xp: 180, name: "Planner" },
  { xp: 320, name: "Strategist" },
  { xp: 480, name: "Living system" },
];

function progressFor(xp) {
  let index = 0;
  RANKS.forEach((rank, item) => {
    if (xp >= rank.xp) index = item;
  });
  const current = RANKS[index];
  const next = RANKS[index + 1];
  const span = next ? next.xp - current.xp : 120;
  return {
    level: index + 1,
    name: current.name,
    fill: Math.min(100, ((xp - current.xp) / span) * 100),
  };
}
const ORGAN_COLOR = { brain: "#c6a56a", heart: "#d4656a", lungs: "#c6a56a", kidneys: "#c6a56a", liver: "#c6a56a", skin: "#c6a56a" };
const ROUNDS = {
  water: {
    ask: "The taps are running low.",
    situation: "Summer demand is up. Pick the decision you would make for the city’s water.",
    options: [
      { id: "desal", mark: "A", line: "Make more water from the sea. Fast, but it spends a lot of energy and leaves brine." },
      { id: "recovery", mark: "B", line: "Clean used water and keep what is still useful, the way a kidney does." },
      { id: "conserve", mark: "C", line: "Find leaks and use less. Careful, and it will not fill a big gap alone." },
    ],
  },
  energy: {
    ask: "The grid is straining.",
    situation: "Demand is ahead of supply, and the air is getting worse. How do you keep the city powered?",
    options: [
      { id: "diesel", mark: "A", line: "Switch on diesel generators. Power comes back tonight. The lungs pay for it." },
      { id: "solar", mark: "B", line: "Build solar fields and storage. Clean power, if you can wait for it." },
      { id: "skin", mark: "C", line: "Shade the buildings so they need less cooling in the first place." },
    ],
  },
  waste: {
    ask: "The city is filling up with waste.",
    situation: "More people, more rubbish, less food in reserve. What should happen to the waste?",
    options: [
      { id: "landfill", mark: "A", line: "Open another landfill. The streets look clear. The problem moves outside the city." },
      { id: "biorefinery", mark: "B", line: "Turn organic waste into compost and gas, the way a liver turns waste into something useful." },
      { id: "farms", mark: "C", line: "Grow food indoors. It feeds people, and it asks for water and electricity." },
    ],
  },
  failure: {
    ask: "Everything hits at once.",
    situation: "A heatwave lands in a drought. You get one decision. Choose what the city should protect.",
    options: [
      { id: "ac", mark: "A", line: "Run every air conditioner. Rooms cool down. Energy and the air outside get worse." },
      { id: "grid", mark: "B", line: "Send water and energy to whichever system is failing, the way blood moves to where it is needed." },
      { id: "recovery", mark: "C", line: "Recover water before making more. It costs some energy, and it wastes less." },
    ],
  },
};
const ALERTS = [["Water availability", "↓"], ["Temperature", "↑"], ["Energy demand", "↑"], ["Waste", "↑"], ["Food security", "↓"]];

function HealthChart({ points }) {
  const [hover, setHover] = useState(null);
  const fillId = useId().replace(/:/g, "");
  const width = 640;
  const height = 220;
  const pad = { l: 36, r: 16, t: 16, b: 34 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const x = (index) => pad.l + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
  const y = (value) => pad.t + innerH - (value / 100) * innerH;
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)} ${y(point.health).toFixed(1)}`).join(" ");
  const active = hover !== null ? points[hover] : null;
  const guides = STAGES.filter((stage) => stage.name === "Resilience" || stage.name === "Stress");

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="System health over time">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6d3a4" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#e6d3a4" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line x1={pad.l} x2={width - pad.r} y1={y(tick)} y2={y(tick)} stroke="#3e3a34" strokeWidth="1" />
            <text x={pad.l - 8} y={y(tick) + 3} textAnchor="end" fontSize="10" fill="#8f897e" fontFamily="JetBrains Mono">{tick}</text>
          </g>
        ))}
        {guides.map((stage) => (
          <g key={stage.name}>
            <line x1={pad.l} x2={width - pad.r} y1={y(stage.min)} y2={y(stage.min)} stroke="#cfc8bc" strokeOpacity="0.35" strokeDasharray="2 4" />
            <text x={width - pad.r} y={y(stage.min) - 4} textAnchor="end" fontSize="9" fill="#cfc8bc" fontFamily="JetBrains Mono">{stage.name.toUpperCase()} {stage.min}</text>
          </g>
        ))}
        {points.length > 1 && <path d={`${line} L${x(points.length - 1).toFixed(1)} ${(pad.t + innerH).toFixed(1)} L${x(0).toFixed(1)} ${(pad.t + innerH).toFixed(1)} Z`} fill={`url(#${fillId})`} />}
        {points.slice(1).map((point, index) => (
          <line key={`seg-${point.label}`} x1={x(index)} y1={y(points[index].health)} x2={x(index + 1)} y2={y(point.health)} stroke={colorFor(point.health)} strokeWidth="2.5" strokeLinecap="round" />
        ))}
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={x(index)} cy={y(point.health)} r={hover === index ? 6 : 4} fill={colorFor(point.health)} stroke="#101218" strokeWidth="2" />
            <rect
              x={x(index) - innerW / Math.max(points.length - 1, 1) / 2}
              y={pad.t}
              width={innerW / Math.max(points.length - 1, 1)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
        {points.map((point, index) => (
          index === 0 || index === points.length - 1 || points.length <= 5 ? (
            <text key={`label-${point.label}`} x={x(index)} y={height - 12} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} fontSize="10" fill="#8f897e" fontFamily="JetBrains Mono">{point.label}</text>
          ) : null
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + innerH} stroke="#cfc8bc" strokeOpacity="0.4" />}
      </svg>
      {active && hover !== null && (
        <div className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-line bg-ink-3 px-3 py-2 font-mono text-xs shadow-xl" style={{ left: `${(x(hover) / width) * 100}%`, top: 0 }}>
          <p className="text-dim">{active.label}</p>
          <p className="text-bone">Health {active.health} · <span className={toneClass(stageFor(active.health).tone)}>{toneMark(stageFor(active.health).tone)} {stageFor(active.health).name}</span></p>
        </div>
      )}
      <table className="sr-only">
        <caption>System health by stage</caption>
        <tbody>
          {points.map((point) => (
            <tr key={point.label}><th>{point.label}</th><td>{point.health}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Intro({ names, setNames, onStart }) {
  return (
    <div className="grain min-h-screen">
      <Header variant="experience" />
      <main className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[1fr_minmax(0,340px)]">
        <div>
          <p className="rise font-mono text-xs uppercase tracking-[0.3em] text-sand">Decision game</p>
          <h1 className="rise mt-4 font-display text-5xl font-light leading-[1.02] md:text-7xl" style={{ animationDelay: "0.1s" }}>You are the <em className="nabd-shine text-bio">brain</em> of Oman 2040.</h1>
          <p className="rise mt-6 max-w-xl text-lg text-mist" style={{ animationDelay: "0.2s" }}>Four short challenges. Each one, you make a single decision. A quick fix can help one part of the body and hurt another. A careful choice earns more XP.</p>
          <ol className="rise mt-6 flex flex-wrap gap-2" style={{ animationDelay: "0.25s" }}>
            {[["2028", "Water"], ["2032", "Energy"], ["2036", "Waste"], ["2040", "Crisis"]].map(([year, label]) => (
              <li key={year} className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${year === "2040" ? "border-ember/60 text-ember" : "border-line text-mist"}`}>{year} {label}</li>
            ))}
          </ol>
          <div className="rise mt-10 grid gap-4 md:grid-cols-2" style={{ animationDelay: "0.3s" }}>
            <div className="flex flex-col rounded-3xl border border-line bg-ink-2/70 p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-bio">Play</p>
              <h2 className="mt-2 font-display text-2xl">Four decisions</h2>
              <p className="mt-2 flex-1 text-sm text-mist">Water, then energy, then waste, then 2040. One choice each time. Helpful decisions in a row earn extra XP.</p>
              <button type="button" onClick={() => onStart("solo")} className="mt-6 rounded-full bg-bio px-5 py-3 font-semibold text-ink transition hover:-translate-y-0.5">Start the game</button>
            </div>
            <div className="flex flex-col rounded-3xl border border-ember/50 bg-ember/5 p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ember">Judging panel</p>
              <h2 className="mt-2 font-display text-2xl">Same game, three names</h2>
              <p className="mt-2 text-sm text-mist">The panel plays the same four decisions and puts their names on the score.</p>
              <div className="mt-4 grid gap-2">
                {names.map((name, index) => (
                  <input key={index} value={name} maxLength={24} placeholder={`Judge ${index + 1} name (optional)`} onChange={(event) => setNames(names.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))} className="rounded-lg border border-line bg-ink px-3 py-2 text-sm text-bone placeholder:text-dim focus:border-ember focus:outline-none" />
                ))}
              </div>
              <button type="button" onClick={() => onStart("panel")} className="mt-6 rounded-full bg-ember px-5 py-3 font-semibold text-ink transition hover:-translate-y-0.5">Play as a panel</button>
            </div>
          </div>
        </div>
        <div className="rise mx-auto w-full max-w-[340px]" style={{ animationDelay: "0.2s" }}>
          <Body organs={organHealth(BASE)} health={systemHealth(BASE)} className="h-auto w-full" />
        </div>
      </main>
    </div>
  );
}

function Alert({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-5 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,84,112,0.28),transparent_60%)]" />
      <div className="rise relative max-w-xl rounded-3xl border border-blood/60 bg-ink-2 p-8 text-center md:p-12">
        <p className="failing font-mono text-xs uppercase tracking-[0.4em] text-blood">✕ Alert · all systems</p>
        <h2 className="mt-4 font-display text-5xl md:text-7xl">2040: System failure</h2>
        <ul className="nabd-alert mx-auto mt-8 grid max-w-sm grid-cols-2 gap-2 text-left font-mono text-sm">
          {ALERTS.map(([label, mark]) => (
            <li key={label} className="flex justify-between rounded-md bg-ink-3 px-3 py-1.5">
              <span className="text-mist">{label}</span>
              <span className={mark === "↑" ? "is-up text-blood" : "is-down text-blood"}>{mark}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-mist">One decision. Choose what the body should protect.</p>
        <button type="button" onClick={onClose} className="mt-8 rounded-full bg-ember px-6 py-3 font-semibold text-ink">Take control</button>
      </div>
    </div>
  );
}

function HealthBadge({ health, forecast = null }) {
  const shown = forecast ?? health;
  const stage = stageFor(shown);
  const delta = forecast == null ? 0 : forecast - health;
  return (
    <div className="rounded-2xl border border-line bg-ink-2/80 p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">{forecast == null ? "System health" : "Forecast health"}</span>
        <span className="font-display text-3xl text-bone">{shown}</span>
      </div>
      <p className={`mt-1 font-display text-2xl ${toneClass(stage.tone)}`}>{toneMark(stage.tone)} {stage.name}</p>
      {forecast != null && delta !== 0 && (
        <p className={`mt-1 font-mono text-[11px] uppercase tracking-[0.14em] ${delta > 0 ? "text-bio" : "text-ember"}`}>
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} from {health} if you send this
        </p>
      )}
      {forecast != null && delta === 0 && (
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-sand">Score holds · the tradeoff shows in the organs</p>
      )}
      <p className="mt-1 text-xs text-mist">{stage.description}</p>
      <div className="nabd-meter" aria-hidden="true"><i style={{ width: `${shown}%`, background: colorFor(shown) }} /></div>
    </div>
  );
}

function MetricList({ metrics, previous, ghost, focus, onFocus }) {
  return (
    <ul className="mt-4 space-y-2.5 rounded-2xl border border-line bg-ink-2/60 p-4">
      {ghost && <li className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Forecast · awareness, connections and body strain</li>}
      {onFocus && <li className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Select a system to focus the deck</li>}
      {Object.keys(METRICS).map((key) => {
        const value = metrics[key];
        const delta = value - previous[key];
        const improved = METRICS[key].inverse ? delta < 0 : delta > 0;
        const shift = ghost?.[key] ?? 0;
        const projected = Math.max(0, Math.min(100, value + shift));
        const helpful = METRICS[key].inverse ? shift < 0 : shift > 0;
        const row = (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-mist">{METRICS[key].label}{METRICS[key].inverse && <span className="text-dim"> · lower is better</span>}</span>
              <span className="font-mono text-bone">
                {delta !== 0 && <span className={`mr-1.5 ${improved ? "text-bio" : "text-ember"}`}>{delta > 0 ? "▲" : "▼"}{Math.abs(delta)}</span>}
                {value}
                {shift !== 0 && <span className={`ml-1.5 ${helpful ? "text-bio" : "text-ember"}`}>({shift > 0 ? "+" : ""}{shift})</span>}
              </span>
            </div>
            <div className="nabd-track mt-1 h-1.5 overflow-hidden rounded-full bg-ink-3">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: colorFor(wellness(key, value)) }} />
              {shift !== 0 && (
                <span className="nabd-ghost" style={{ left: `${Math.min(value, projected)}%`, width: `${Math.abs(projected - value)}%`, background: helpful ? "#e6d3a4" : "#e08a55" }} />
              )}
            </div>
          </>
        );
        return (
          <li key={key}>
            {onFocus ? (
              <button type="button" onClick={() => onFocus(METRICS[key].organ)} aria-pressed={focus === METRICS[key].organ} className={`w-full rounded-lg px-2 py-1 text-left transition ${focus === METRICS[key].organ ? "bg-bio/10" : "hover:bg-ink-3"}`}>
                {row}
              </button>
            ) : row}
          </li>
        );
      })}
    </ul>
  );
}

function Timeline({ scenarios, round }) {
  return (
    <ol className="nabd-timeline flex gap-2">
      {scenarios.map((scenario, index) => (
        <li key={scenario.id} className={`flex-1 rounded-full border px-3 py-1.5 text-center font-mono text-[11px] tracking-[0.14em] ${index === round ? (scenario.id === FAILURE.id ? "border-ember text-ember" : "border-bio text-bio") : index < round ? "border-line text-mist" : "border-line/50 text-dim"}`} style={{ background: index === round ? (scenario.id === FAILURE.id ? "#2a1612" : "#1c1812") : "#07080c" }}>
          {index < round ? "✓ " : ""}{scenario.year}
        </li>
      ))}
    </ol>
  );
}

function Budget({ total, spent }) {
  return (
    <div className="text-right">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim">Resources {total - spent}/{total} left</p>
      <div className="mt-1.5 flex justify-end gap-1.5">
        {Array.from({ length: total }).map((_, index) => (
          <span key={index} className={`h-3 w-6 rounded-sm transition ${index < spent ? "bg-ink-3 ring-1 ring-line" : "bg-sand"}`} />
        ))}
      </div>
    </div>
  );
}

function effectLine(strategy) {
  if (strategy.circulate) return "Supports the weakest part of the environment";
  return strategy.consequence;
}

function Environment({ metrics, preview }) {
  const keys = ["water", "energy", "heat", "air", "waste", "food"];
  return (
    <div className="nabd-env" aria-label="Environment">
      {keys.map((key) => {
        const shown = preview ?? metrics;
        const raw = shown[key] - metrics[key];
        const helpful = METRICS[key].inverse ? raw < 0 : raw > 0;
        const level = wellness(key, shown[key]);
        return (
          <p key={key}>
            <span>{METRICS[key].short}</span>
            <i><b style={{ width: `${level}%`, background: colorFor(level) }} /></i>
            <em className={raw === 0 ? "" : helpful ? "is-up" : "is-down"}>{raw === 0 ? "" : helpful ? "up" : "down"}</em>
          </p>
        );
      })}
    </div>
  );
}

function Move({ strategy, line, mark, on, onClick, onHover }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      onMouseEnter={() => onHover?.(strategy.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(strategy.id)}
      onBlur={() => onHover?.(null)}
      className={`nabd-move${on ? " is-on" : ""}`}
    >
      <span className="nabd-move-organ">{mark}</span>
      <span>
        <b>{strategy.name}</b>
        <em>{line}</em>
      </span>
    </button>
  );
}

function Card({ strategy, on, disabled, quiet, intensity, installed, onClick, onHover }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on} onMouseEnter={() => onHover?.(strategy.id)} onMouseLeave={() => onHover?.(null)} onFocus={() => onHover?.(strategy.id)} onBlur={() => onHover?.(null)} className={`group flex flex-col rounded-2xl border border-t-[3px] p-4 text-left transition ${quiet ? "nabd-quiet" : ""} ${on ? "border-bio bg-bio/10" : disabled ? "cursor-not-allowed border-line/50 opacity-40" : "border-line bg-ink-2/60 hover:border-mist"}`} style={{ borderTopColor: ORGAN_COLOR[strategy.organ] }}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">{strategy.organ}{installed && <span className="text-sand"> · in place</span>}</span>
        <span className="flex gap-1" aria-label={`Costs ${strategy.cost}`}>
          {Array.from({ length: strategy.cost }).map((_, index) => <span key={index} className="h-2 w-4 rounded-sm bg-sand" />)}
        </span>
      </div>
      <h3 className="mt-2 font-display text-lg leading-tight text-bone">{strategy.name}</h3>
      <p className="mt-1 text-xs leading-relaxed text-mist">{strategy.blurb}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {strategy.circulate ? (
          <span className="rounded bg-ink-3 px-1.5 py-0.5 font-mono text-[10px] text-bio">▲ weakest system</span>
        ) : Object.entries(strategy.effects).map(([key, value]) => {
          const helpful = METRICS[key].inverse ? value < 0 : value > 0;
          return <span key={key} className={`rounded bg-ink-3 px-1.5 py-0.5 font-mono text-[10px] ${helpful ? "text-bio" : "text-ember"}`}>{helpful ? "▲" : "▼"} {METRICS[key].short} {value > 0 ? "+" : ""}{Math.round(value * intensity)}</span>;
        })}
      </div>
      <p className="mt-3 border-t border-line pt-2 text-[11px] leading-snug text-sand/90">{strategy.consequence}</p>
    </button>
  );
}

function shiftLine(before, after) {
  const parts = Object.keys(METRICS).flatMap((key) => {
    if (key === "insight") return [];
    const raw = after[key] - before[key];
    if (raw === 0) return [];
    const helpful = METRICS[key].inverse ? raw < 0 : raw > 0;
    return [{ mag: Math.abs(raw), helpful, text: METRICS[key].short }];
  }).sort((a, b) => b.mag - a.mag);
  const improved = parts.filter((item) => item.helpful).slice(0, 2).map((item) => item.text);
  const strained = parts.filter((item) => !item.helpful).slice(0, 2).map((item) => item.text);
  const bits = [];
  if (improved.length) bits.push(`${improved.join(" and ")} improved`);
  if (strained.length) bits.push(`${strained.join(" and ")} took the strain`);
  return bits.length ? `${bits.join(". ")}.` : "The body barely moved.";
}

function Response({ metrics, previous, score, lesson, isLast, nextIsFinal, onNext }) {
  const gained = score?.gained ?? 0;
  return (
    <div className="nabd-pop mt-6 rounded-3xl border border-line bg-ink-2/70 p-6 md:p-8">
      <p className={`nabd-score ${gained >= 0 ? "text-bio" : "text-ember"}`}>{gained > 0 ? "+" : ""}{gained} XP</p>
      <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-dim">{shiftLine(previous, metrics)}{score?.multiplier > 1 ? " · streak bonus" : ""}</p>
      <p className="mt-4 text-lg text-bone">{lesson}</p>
      <button type="button" onClick={onNext} className={`mt-6 rounded-full px-6 py-3 font-semibold text-ink ${nextIsFinal ? "bg-ember" : "bg-bio"}`}>
        {isLast ? "See the body in 2040" : nextIsFinal ? "Face 2040" : "Next decision"}
      </button>
    </div>
  );
}

function Ending({ metrics, history, log, mode, points, onRestart }) {
  const health = systemHealth(metrics);
  const stage = stageFor(health);
  const verdict = health >= 58
    ? { title: "The ecosystem comes alive.", text: "Your decisions worked together. The body had enough water, energy and recovery to keep going." }
    : health >= 48
      ? { title: "The body held.", text: "Careful decisions kept the organs from pulling each other down. A few systems are still working hard." }
      : { title: "The system is deteriorating.", text: "Quick fixes solved one problem and strained another. In a living system, that second problem comes back." };
  const skills = useMemo(() => {
    const counts = new Map();
    log.forEach((entry) => {
      entry.ids.forEach((id) => {
        findStrategy(id).skills.forEach((skill) => counts.set(skill, (counts.get(skill) ?? 0) + 1));
      });
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [log]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,360px)_1fr]">
        <div className="mx-auto w-full max-w-[340px]">
          <Body organs={organHealth(metrics)} health={health} className="h-auto w-full" />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand">2040 · Final state</p>
          <p className="nabd-score mt-3 text-bone">{points} XP</p>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-sand">Level {progressFor(points).level} · {progressFor(points).name}</p>
          <h1 className="rise mt-4 font-display text-5xl font-light leading-tight md:text-6xl">{verdict.title}</h1>
          <p className={`mt-4 font-display text-3xl ${toneClass(stage.tone)}`}>{toneMark(stage.tone)} {stage.name} · health {health}</p>
          <p className="mt-3 max-w-xl text-lg text-mist">{verdict.text}</p>
          <div className="mt-8 rounded-2xl border border-line bg-ink-2/70 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">System health over time</p>
            <div className="mt-2"><HealthChart points={history} /></div>
          </div>
        </div>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-ink-2/60 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">Your decisions</p>
          <ol className="mt-4 space-y-4">
            {log.map((entry) => (
              <li key={`${entry.year}-${entry.title}`}>
                <p className="font-mono text-xs text-sand">{entry.year} · {entry.title}</p>
                <p className="text-bone">{entry.ids.map((id) => findStrategy(id).name).join(" + ")}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-3xl border border-line bg-ink-2/60 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">Green skills you practised</p>
          <ul className="mt-4 space-y-2">
            {skills.map(([skill, count]) => (
              <li key={skill} className="flex items-center gap-3">
                <span className="w-44 shrink-0 text-sm text-mist">{skill}</span>
                <span className="h-2 rounded-full bg-bio" style={{ width: `${Math.min(100, count * 18)}%` }} />
                <span className="font-mono text-xs text-bone">{count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-line pt-4 text-sm text-dim">Systems thinking means asking: what second problem did my last decision create — and which decision solves both?</p>
        </div>
      </div>
      <div className="mt-16 text-center">
        <p className="mx-auto max-w-3xl font-display text-3xl leading-tight md:text-5xl">If the human body can survive by working as one interconnected system, <em className="text-bio">why shouldn’t our future do the same?</em></p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button type="button" onClick={() => onRestart(mode)} className="rounded-full bg-bio px-6 py-3 font-semibold text-ink">Run it again</button>
          <button type="button" onClick={() => onRestart(mode === "solo" ? "panel" : "solo")} className="rounded-full border border-line px-6 py-3 text-mist hover:border-bone hover:text-bone">{mode === "solo" ? "Play as a panel" : "Play solo"}</button>
        </div>
      </div>
    </main>
  );
}

export default function Experience() {
  const [mode, setMode] = useState("solo");
  const [names, setNames] = useState(["", "", ""]);
  const [screen, setScreen] = useState("intro");
  const [round, setRound] = useState(0);
  const [metrics, setMetrics] = useState(BASE);
  const [previous, setPrevious] = useState(BASE);
  const [installed, setInstalled] = useState([]);
  const [chosen, setChosen] = useState([]);
  const [cascade, setCascade] = useState([]);
  const [revealed, setRevealed] = useState(0);
  const [history, setHistory] = useState([]);
  const [log, setLog] = useState([]);
  const [alert, setAlert] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastScore, setLastScore] = useState(null);

  const scenarios = [...JOURNEY, FAILURE];
  const scenario = scenarios[round];
  const crisis = scenario?.id === FAILURE.id;
  const roundPlay = scenario ? ROUNDS[scenario.id] : null;
  const judges = names.map((name, index) => name.trim() || `Judge ${index + 1}`);

  useEffect(() => {
    setRevealed(cascade.length);
  }, [cascade]);

  const currentStep = revealed > 0 && revealed <= cascade.length ? cascade[revealed - 1] : null;
  const highlight = currentStep ? (currentStep.phase === "decide" ? ["brain"] : [currentStep.organ]) : [];
  const hovered = hoverId ? findStrategy(hoverId) : null;

  function begin(nextMode) {
    const baseline = BASE;
    setMode(nextMode);
    setPoints(0);
    setStreak(0);
    setLastScore(null);
    setInstalled([]);
    setLog([]);
    setHistory([{ label: "Today", health: systemHealth(baseline) }]);
    openRound([...JOURNEY, FAILURE], 0, baseline);
  }

  function openRound(list, index, incoming) {
    const next = list[index];
    const shock = Object.fromEntries(Object.entries(next.shock).map(([key, value]) => [key, Math.round(value * 0.45)]));
    const shocked = add(incoming, shock);
    const steps = shockSteps({ ...next, shock });
    setRound(index);
    setPrevious(incoming);
    setMetrics(shocked);
    setChosen([]);
    setHoverId(null);
    setCascade(steps);
    setHistory((points) => [...points, { label: `${next.year} shock`, health: systemHealth(shocked) }]);
    setScreen("deciding");
    setAlert(next.id === FAILURE.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function send() {
    const result = forecast(metrics, chosen, installed, scenario.intensity ?? 1, false);
    const next = result.metrics;
    const steps = result.cascade;
    const scored = ratePlay(metrics, result, streak);
    setLastScore(scored);
    setPoints((current) => Math.max(0, current + scored.gained));
    setStreak(scored.after > scored.before ? streak + 1 : 0);
    setPrevious(metrics);
    setMetrics(next);
    setCascade(steps);
    setInstalled((ids) => Array.from(new Set([...ids, ...chosen])));
    setLog((entries) => [...entries, { year: scenario.year, title: scenario.title, ids: [...chosen] }]);
    setHistory((points) => [...points, { label: `${scenario.year} response`, health: systemHealth(next) }]);
    setScreen("response");
  }

  function advance() {
    if (round < scenarios.length - 1) openRound(scenarios, round + 1, metrics);
    else {
      const closing = systemHealth(metrics);
      const bonus = closing >= 68 ? 80 : closing >= 50 ? 30 : 0;
      if (bonus) {
        setPoints((current) => current + bonus);
        setLastScore({ gained: bonus, finale: true, before: closing, after: closing, good: 0, bad: 0, strain: 0, multiplier: 1 });
      }
      setCascade([]);
      setScreen("end");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function pick(id) {
    setChosen((current) => (current[0] === id ? [] : [id]));
  }

  if (screen === "intro") return <Intro names={names} setNames={setNames} onStart={begin} />;

  const draft = hovered && hovered.id !== chosen[0] ? [hovered.id] : chosen;
  const outlook = screen === "deciding" && draft.length ? forecast(metrics, draft, installed, scenario.intensity ?? 1, false) : null;
  const previewing = screen === "deciding" && outlook;
  const shownMetrics = previewing ? outlook.metrics : metrics;
  const shownHealth = systemHealth(shownMetrics);
  const liveFocus = screen === "deciding"
    ? (hovered ? [hovered.organ] : (chosen[0] ? [findStrategy(chosen[0]).organ] : []))
    : highlight;
  const canSend = chosen.length === 1;
  const rank = progressFor(points);
  const lesson = chosen[0] ? findStrategy(chosen[0]).consequence : "";

  return (
    <div className="grain min-h-screen">
      <Header variant="experience" />
      {alert && <Alert onClose={() => setAlert(false)} />}
      {screen === "end" ? (
        <Ending metrics={metrics} history={history} log={log} mode={mode} points={points} onRestart={begin} />
      ) : (
        <main className="nabd-play-page">
          <div className="nabd-play">
          <aside className="nabd-play-side">
            <div className="nabd-play-body">
              <Body
                organs={organHealth(shownMetrics)}
                health={shownHealth}
                highlight={liveFocus}
                status={previewing ? "The body is showing what this decision would do." : ""}
              />
            </div>
            {screen === "deciding" && (
              <p className="nabd-play-hint">Watch the body. A bright organ is coping. A dim one is under strain.</p>
            )}
          </aside>
          <section className="nabd-play-round">
            <div className="nabd-hud">
              <div><span>Body</span><strong className={toneClass(stageFor(shownHealth).tone)}>{shownHealth}</strong></div>
              <div><span>XP</span><strong>{points}</strong></div>
              <div><span>Level</span><strong>{rank.level}</strong></div>
              <div><span>Year</span><strong>{scenario.year}</strong></div>
            </div>
            <div className="nabd-xp" aria-label={`${rank.name}, level ${rank.level}`}>
              <span>{rank.name}</span>
              <i><b style={{ width: `${rank.fill}%` }} /></i>
            </div>
            <Environment
              metrics={screen === "response" ? previous : metrics}
              preview={previewing ? outlook.metrics : screen === "response" ? metrics : null}
            />
            <Timeline scenarios={scenarios} round={round} />
            <header key={scenario.id} className="nabd-round nabd-enter">
              <p className={crisis ? "is-crisis" : ""}>{scenario.year} · {crisis ? "Final decision" : `Decision ${round + 1} of 4`}{mode === "panel" ? ` · ${judges.join(" · ")}` : ""}</p>
              <h1>{roundPlay.ask}</h1>
              <p className="nabd-brief">{roundPlay.situation}</p>
            </header>
            {screen === "deciding" && (
              <>
                <div className="nabd-hand-head">
                  <h2>What do you do?</h2>
                  <div className="nabd-hand-actions">
                    <button type="button" disabled={!canSend} onClick={send} className={`nabd-apply rounded-full px-5 py-2.5 font-semibold text-ink ${crisis ? "bg-ember" : "bg-bio"}`}>
                      {chosen.length === 0 ? "Pick one" : "See what happens"}
                    </button>
                  </div>
                </div>
                <p className="nabd-forecast">{chosen.length === 0 ? "Pick A, B or C. The bars show the tradeoff." : "This is your decision."}</p>
                <div key={scenario.id} className="nabd-moves mt-6">
                  {roundPlay.options.map((option) => (
                    <Move
                      key={option.id}
                      strategy={findStrategy(option.id)}
                      line={option.line}
                      mark={option.mark}
                      on={chosen[0] === option.id}
                      onClick={() => pick(option.id)}
                      onHover={setHoverId}
                    />
                  ))}
                </div>
              </>
            )}
            {screen === "response" && (
              <Response metrics={metrics} previous={previous} score={lastScore} lesson={lesson} isLast={round === scenarios.length - 1} nextIsFinal={scenarios[round + 1]?.id === FAILURE.id} onNext={advance} />
            )}
          </section>
          </div>
        </main>
      )}
    </div>
  );
}
