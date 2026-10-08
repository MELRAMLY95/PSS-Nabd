import { useEffect, useId, useMemo, useState } from "react";
import { Body } from "./Body.jsx";
import {
  BASE,
  FAILURE,
  JOURNEY,
  METRICS,
  PRECRISIS,
  STAGES,
  STRATEGIES,
  add,
  colorFor,
  findStrategy,
  forecast,
  formatEffects,
  organHealth,
  shockSteps,
  stageFor,
  systemHealth,
  SYNERGIES,
  toneClass,
  toneMark,
  weakest,
  wellness,
  DRIFT,
} from "./engine.js";
import { Header } from "./Header.jsx";

const PHASES = { sense: "Sense", decide: "Decide", distribute: "Distribute", recover: "Recover", adapt: "Adapt" };
const ORGAN_COLOR = { brain: "#3eefc0", heart: "#ff5470", lungs: "#7eebda", kidneys: "#c6e48a", liver: "#f2c56a", skin: "#ff7d55" };
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
            <stop offset="0%" stopColor="#3eefc0" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#3eefc0" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line x1={pad.l} x2={width - pad.r} y1={y(tick)} y2={y(tick)} stroke="#3d6d5e" strokeWidth="1" />
            <text x={pad.l - 8} y={y(tick) + 3} textAnchor="end" fontSize="10" fill="#97b3a6" fontFamily="JetBrains Mono">{tick}</text>
          </g>
        ))}
        {guides.map((stage) => (
          <g key={stage.name}>
            <line x1={pad.l} x2={width - pad.r} y1={y(stage.min)} y2={y(stage.min)} stroke="#d5e3db" strokeOpacity="0.35" strokeDasharray="2 4" />
            <text x={width - pad.r} y={y(stage.min) - 4} textAnchor="end" fontSize="9" fill="#d5e3db" fontFamily="JetBrains Mono">{stage.name.toUpperCase()} {stage.min}</text>
          </g>
        ))}
        {points.length > 1 && <path d={`${line} L${x(points.length - 1).toFixed(1)} ${(pad.t + innerH).toFixed(1)} L${x(0).toFixed(1)} ${(pad.t + innerH).toFixed(1)} Z`} fill={`url(#${fillId})`} />}
        {points.slice(1).map((point, index) => (
          <line key={`seg-${point.label}`} x1={x(index)} y1={y(points[index].health)} x2={x(index + 1)} y2={y(point.health)} stroke={colorFor(point.health)} strokeWidth="2.5" strokeLinecap="round" />
        ))}
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={x(index)} cy={y(point.health)} r={hover === index ? 6 : 4} fill={colorFor(point.health)} stroke="#0b1a17" strokeWidth="2" />
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
            <text key={`label-${point.label}`} x={x(index)} y={height - 12} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} fontSize="10" fill="#6c8079" fontFamily="JetBrains Mono">{point.label}</text>
          ) : null
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + innerH} stroke="#a9b8b1" strokeOpacity="0.4" />}
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
          <p className="rise font-mono text-xs uppercase tracking-[0.3em] text-sand">Live simulation</p>
          <h1 className="rise mt-4 font-display text-5xl font-light leading-[1.02] md:text-7xl" style={{ animationDelay: "0.1s" }}>You are the <em className="text-bio">brain</em> of Oman 2040.</h1>
          <p className="rise mt-6 max-w-xl text-lg text-mist" style={{ animationDelay: "0.2s" }}>You’ll receive real challenges, a limited budget and a deck of strategies. Every decision travels through the body — sense, decide, distribute, recover, adapt — and every decision has a consequence. There is no perfect single solution.</p>
          <ol className="rise mt-6 flex flex-wrap gap-2" style={{ animationDelay: "0.25s" }}>
            {[["2028", "Water"], ["2032", "Energy"], ["2036", "Waste"], ["2040", "Crisis"]].map(([year, label]) => (
              <li key={year} className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${year === "2040" ? "border-ember/60 text-ember" : "border-line text-mist"}`}>{year} {label}</li>
            ))}
          </ol>
          <div className="rise mt-10 grid gap-4 md:grid-cols-2" style={{ animationDelay: "0.3s" }}>
            <div className="flex flex-col rounded-3xl border border-line bg-ink-2/70 p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-bio">Visitor journey</p>
              <h2 className="mt-2 font-display text-2xl">Three challenges + the 2040 crisis</h2>
              <p className="mt-2 flex-1 text-sm text-mist">2028 water surge, 2032 energy squeeze, 2036 waste growth — then the system fails in 2040. Decisions you make early shape how well the body survives.</p>
              <button type="button" onClick={() => onStart("solo")} className="mt-6 rounded-full bg-bio px-5 py-3 font-semibold text-ink transition hover:-translate-y-0.5">Start the journey</button>
            </div>
            <div className="flex flex-col rounded-3xl border border-ember/50 bg-ember/5 p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ember">Judging panel</p>
              <h2 className="mt-2 font-display text-2xl">2040: System failure</h2>
              <p className="mt-2 text-sm text-mist">Straight to the crisis. Three judges, three decisions — and all three must agree on each one.</p>
              <div className="mt-4 grid gap-2">
                {names.map((name, index) => (
                  <input key={index} value={name} maxLength={24} placeholder={`Judge ${index + 1} name (optional)`} onChange={(event) => setNames(names.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))} className="rounded-lg border border-line bg-ink px-3 py-2 text-sm text-bone placeholder:text-dim focus:border-ember focus:outline-none" />
                ))}
              </div>
              <button type="button" onClick={() => onStart("panel")} className="mt-6 rounded-full bg-ember px-5 py-3 font-semibold text-ink transition hover:-translate-y-0.5">Trigger the crisis</button>
            </div>
          </div>
        </div>
        <div className="rise mx-auto w-full max-w-[340px]" style={{ animationDelay: "0.2s" }}>
          <Body organs={organHealth(BASE)} health={systemHealth(BASE)} labels className="h-auto w-full" />
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
        <ul className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-2 text-left font-mono text-sm">
          {ALERTS.map(([label, mark]) => (
            <li key={label} className="flex justify-between rounded-md bg-ink-3 px-3 py-1.5">
              <span className="text-mist">{label}</span>
              <span className="text-blood">{mark}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-mist">Three decisions. Cooperate — or watch the body fail.</p>
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
                <span className="nabd-ghost" style={{ left: `${Math.min(value, projected)}%`, width: `${Math.abs(projected - value)}%`, background: helpful ? "#3eefc0" : "#ff7d55" }} />
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
        <li key={scenario.id} className={`flex-1 rounded-full border px-3 py-1.5 text-center font-mono text-[11px] tracking-[0.14em] ${index === round ? (scenario.id === FAILURE.id ? "border-ember text-ember" : "border-bio text-bio") : index < round ? "border-line text-mist" : "border-line/50 text-dim"}`} style={{ background: index === round ? (scenario.id === FAILURE.id ? "#2a1612" : "#102820") : "#06100e" }}>
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

function Card({ strategy, on, disabled, quiet, intensity, installed, onClick, onHover }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on} onMouseEnter={() => onHover?.(strategy.id)} onMouseLeave={() => onHover?.(null)} onFocus={() => onHover?.(strategy.id)} onBlur={() => onHover?.(null)} className={`group flex flex-col rounded-2xl border border-t-[3px] p-4 text-left transition ${quiet ? "nabd-quiet" : ""} ${on ? "border-bio bg-bio/10 shadow-[0_0_24px_rgba(75,227,180,0.18)]" : disabled ? "cursor-not-allowed border-line/50 opacity-40" : "border-line bg-ink-2/60 hover:-translate-y-0.5 hover:border-mist"}`} style={{ borderTopColor: ORGAN_COLOR[strategy.organ] }}>
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

function Cascade({ steps, revealed, held, onHold, onReplay }) {
  if (!steps.length) return null;
  return (
    <div className="mt-6 rounded-2xl border border-line bg-ink/70 p-5 font-mono text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-dim">Signal through the body</p>
        {revealed >= steps.length && (
          <button type="button" onClick={onReplay} className="text-[11px] uppercase tracking-[0.16em] text-mist hover:text-bio">Replay</button>
        )}
      </div>
      <ol className="mt-3 space-y-1.5">
        {steps.slice(0, revealed).map((step, index) => (
          <li key={`${step.text}-${index}`}>
            <button type="button" onClick={() => onHold(index)} aria-pressed={held === index} className={`rise flex w-full gap-3 rounded-lg px-2 py-1 text-left transition hover:bg-ink-3 ${held === index || (held == null && index === revealed - 1) ? "nabd-now" : ""}`} style={{ animationDuration: "0.4s" }}>
              <span className="w-24 shrink-0 text-[11px] uppercase tracking-[0.14em] text-dim">{PHASES[step.phase]}</span>
              <span className={step.tone === "good" ? "text-bio" : step.tone === "bad" ? "text-ember" : "text-bone"}>{step.tone === "good" ? "● " : step.tone === "bad" ? "▲ " : ""}{step.text}</span>
            </button>
          </li>
        ))}
        {revealed < steps.length && <li className="animate-pulse text-dim">…</li>}
      </ol>
    </div>
  );
}

function Response({ metrics, previous, done, isLast, nextIsFinal, onNext }) {
  const before = systemHealth(previous);
  const after = systemHealth(metrics);
  const weak = weakest(metrics);
  return (
    <div className={`mt-6 rounded-3xl border border-line bg-ink-2/70 p-6 transition md:p-8 ${done ? "opacity-100" : "opacity-40"}`}>
      <div className="flex flex-wrap items-baseline gap-4">
        <p className="font-display text-3xl">Health {before} → <span className="text-bone">{after}</span></p>
        <p className={`font-mono text-sm ${after >= before ? "text-bio" : "text-ember"}`}>{after >= before ? "▲" : "▼"} {Math.abs(after - before)} · {stageFor(before).name} → {stageFor(after).name}</p>
      </div>
      <p className="mt-3 text-mist">Weakest system now: <span className="text-bone">{METRICS[weak.key].label}</span> ({weak.value}/100 wellness). The body is only as strong as its most stressed organ — {isLast ? "that’s where it would break first." : "protect it next."}</p>
      <button type="button" onClick={onNext} disabled={!done} className={`mt-6 rounded-full px-6 py-3 font-semibold text-ink transition disabled:opacity-30 ${nextIsFinal ? "bg-ember" : "bg-bio"}`}>
        {isLast ? "See what the body became" : nextIsFinal ? "Advance to 2040 →" : "Next challenge →"}
      </button>
    </div>
  );
}

function Ending({ metrics, history, log, mode, onRestart }) {
  const health = systemHealth(metrics);
  const stage = stageFor(health);
  const verdict = health >= 58
    ? { title: "The ecosystem comes alive.", text: "Your decisions worked together. Each solved the problem the last one created, and the body regenerated under pressure." }
    : health >= 42
      ? { title: "The body survived — barely.", text: "The crisis was contained, but some organs are still stressed. A connected decision earlier could have saved one of them." }
      : { title: "The system is deteriorating.", text: "Decisions fixed one problem while creating others elsewhere. In a living system, nothing happens in isolation." };
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
          <Body organs={organHealth(metrics)} health={health} labels className="h-auto w-full" />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-sand">2040 · Final state</p>
          <h1 className="rise mt-3 font-display text-5xl font-light leading-tight md:text-6xl">{verdict.title}</h1>
          <p className={`mt-4 font-display text-3xl ${toneClass(stage.tone)}`}>{toneMark(stage.tone)} {stage.name} · {health}</p>
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
          <button type="button" onClick={() => onRestart(mode === "solo" ? "panel" : "solo")} className="rounded-full border border-line px-6 py-3 text-mist hover:border-bone hover:text-bone">{mode === "solo" ? "Try the judging-panel crisis" : "Try the full visitor journey"}</button>
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
  const [agreed, setAgreed] = useState([false, false, false]);
  const [cascade, setCascade] = useState([]);
  const [revealed, setRevealed] = useState(0);
  const [history, setHistory] = useState([]);
  const [log, setLog] = useState([]);
  const [alert, setAlert] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const [focusOrgan, setFocusOrgan] = useState(null);
  const [held, setHeld] = useState(null);

  const scenarios = mode === "solo" ? [...JOURNEY, FAILURE] : [FAILURE];
  const scenario = scenarios[round];
  const crisis = scenario?.id === FAILURE.id;
  const health = systemHealth(metrics);
  const judges = names.map((name, index) => name.trim() || `Judge ${index + 1}`);

  useEffect(() => {
    setRevealed(0);
    setHeld(null);
    if (!cascade.length) return undefined;
    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      setRevealed(tick);
      if (tick >= cascade.length) clearInterval(timer);
    }, 750);
    return () => clearInterval(timer);
  }, [cascade]);

  const currentStep = revealed > 0 && revealed <= cascade.length ? cascade[revealed - 1] : null;
  const highlight = currentStep ? (currentStep.phase === "decide" ? ["brain"] : [currentStep.organ]) : [];
  const hovered = hoverId ? findStrategy(hoverId) : null;

  function begin(nextMode) {
    const baseline = nextMode === "solo" ? BASE : PRECRISIS;
    setMode(nextMode);
    setInstalled([]);
    setLog([]);
    setHistory([{ label: nextMode === "solo" ? "Today" : "2039", health: systemHealth(baseline) }]);
    openRound(nextMode === "solo" ? [...JOURNEY, FAILURE] : [FAILURE], 0, baseline);
  }

  function openRound(list, index, incoming) {
    const next = list[index];
    const drifted = index > 0 ? add(incoming, DRIFT) : incoming;
    const shocked = add(drifted, next.shock);
    const steps = shockSteps(next);
    if (index > 0) {
      steps.unshift({ phase: "sense", organ: "skin", text: "Years pass: the climate warms and water tables fall (Heat +3 · Water −3)", tone: "bad" });
    }
    setRound(index);
    setPrevious(incoming);
    setMetrics(shocked);
    setChosen([]);
    setAgreed([false, false, false]);
    setCascade(steps);
    setFocusOrgan(null);
    setHistory((points) => [...points, { label: `${next.year} shock`, health: systemHealth(shocked) }]);
    setScreen("deciding");
    setAlert(next.id === FAILURE.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function send() {
    const result = forecast(metrics, chosen, installed, scenario.intensity ?? 1, crisis);
    const next = result.metrics;
    const steps = result.cascade;
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
      setCascade([]);
      setScreen("end");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function toggle(id) {
    setAgreed([false, false, false]);
    setChosen((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  if (screen === "intro") return <Intro names={names} setNames={setNames} onStart={begin} />;

  const spent = chosen.reduce((total, id) => total + findStrategy(id).cost, 0);
  const slotsFull = scenario.slots != null && chosen.length >= scenario.slots;
  const hoverAdds = Boolean(
    hovered && !chosen.includes(hovered.id) && spent + hovered.cost <= scenario.budget && !(scenario.slots != null && chosen.length >= scenario.slots),
  );
  const draft = hoverAdds ? [...chosen, hovered.id] : chosen;
  const outlook = screen === "deciding" && draft.length ? forecast(metrics, draft, installed, scenario.intensity ?? 1, crisis) : null;
  const ghost = outlook
    ? Object.fromEntries(Object.keys(METRICS).map((key) => [key, outlook.metrics[key] - metrics[key]]))
    : null;
  const forecastOrgans = outlook ? [...new Set(outlook.cascade.map((step) => step.organ))] : [];
  const shockPlaying = revealed < cascade.length && screen === "deciding";
  const previewing = screen === "deciding" && !shockPlaying && outlook;
  const shownMetrics = previewing ? outlook.metrics : metrics;
  const shownHealth = systemHealth(shownMetrics);
  const stepFocus = held != null && cascade[held] ? [cascade[held].organ] : null;
  const liveFocus = screen !== "deciding" || shockPlaying
    ? highlight
    : (hovered ? [hovered.organ, ...forecastOrgans] : forecastOrgans);
  const focus = [...new Set([...(stepFocus ?? liveFocus), ...(focusOrgan ? [focusOrgan] : [])])];
  const strains = (outlook?.cascade ?? []).filter((step) => step.phase === "adapt" && step.tone === "bad" && !step.text.startsWith("Chain reaction"));
  const needsAgreement = crisis && mode === "panel";
  const canSend = chosen.length > 0 && (scenario.slots == null || chosen.length === scenario.slots) && (!needsAgreement || agreed.every(Boolean));
  const linkIds = draft;
  const links = SYNERGIES.filter((item) => {
    const present = linkIds.includes(item.pair[0]) || installed.includes(item.pair[0]);
    const other = linkIds.includes(item.pair[1]) || installed.includes(item.pair[1]);
    const touched = linkIds.includes(item.pair[0]) || linkIds.includes(item.pair[1]);
    const already = installed.includes(item.pair[0]) && installed.includes(item.pair[1]);
    return present && other && touched && !already;
  });

  return (
    <div className="grain min-h-screen">
      <Header variant="experience" />
      {alert && <Alert onClose={() => setAlert(false)} />}
      {screen === "end" ? (
        <Ending metrics={metrics} history={history} log={log} mode={mode} onRestart={begin} />
      ) : (
        <main className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[minmax(0,360px)_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <HealthBadge health={health} forecast={previewing ? shownHealth : null} />
            {installed.length > 0 && (
              <div className="mt-3 rounded-2xl border border-line bg-ink-2/70 px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim">Already in place</p>
                <ul className="mt-2 space-y-1">
                  {installed.map((id) => (
                    <li key={id}>
                      <button type="button" onClick={() => setFocusOrgan(findStrategy(id).organ)} className="text-left text-sm text-mist hover:text-bone">{findStrategy(id).name}</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mx-auto mt-2 max-w-[320px]">
              <Body
                organs={organHealth(shownMetrics)}
                health={shownHealth}
                highlight={focus}
                selected={focusOrgan}
                onSelect={screen === "deciding" && !shockPlaying ? ((organ) => setFocusOrgan((current) => (current === organ ? null : organ))) : undefined}
                labels
                status={previewing ? "Showing the forecast if these decisions are sent." : ""}
                className="h-auto w-full"
              />
              {screen === "deciding" && !shockPlaying && (
                <p className="mt-1 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Select an organ to focus strategies</p>
              )}
            </div>
            <MetricList metrics={metrics} previous={previous} ghost={screen === "deciding" ? ghost : null} focus={focusOrgan} onFocus={screen === "deciding" ? ((organ) => setFocusOrgan((current) => (current === organ ? null : organ))) : undefined} />
          </aside>
          <section>
            <Timeline scenarios={scenarios} round={round} />
            <div className={`mt-6 rounded-3xl border p-6 md:p-8 ${crisis ? "border-ember/60 bg-ember/5" : "border-line bg-ink-2/70"}`}>
              <p className={`font-mono text-xs uppercase tracking-[0.25em] ${crisis ? "text-ember" : "text-sand"}`}>{scenario.year} · {crisis ? "Final challenge" : `Challenge ${round + 1}`}</p>
              <h1 className="mt-2 font-display text-4xl md:text-5xl">{crisis ? `${scenario.year}: System failure` : scenario.title}</h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-mist">{scenario.brief}</p>
              <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs">
                {Object.entries(scenario.shock).map(([key, value]) => (
                  <span key={key} className="rounded-md bg-ink-3 px-2.5 py-1 text-mist">{METRICS[key].label} <span className="text-ember">{value > 0 ? "↑" : "↓"}</span></span>
                ))}
              </div>
            </div>
            <Cascade steps={cascade} revealed={revealed} held={held} onHold={setHeld} onReplay={() => setCascade((steps) => [...steps])} />
            {screen === "deciding" && (
              <>
                <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl">{crisis ? "Choose three decisions" : "Choose your strategies"}</h2>
                    <p className="text-sm text-dim">{crisis ? "Crisis decisions are national-scale: every effect is amplified ×1.5." : "Every card helps somewhere and costs something elsewhere. Look for combinations."}</p>
                  </div>
                  <Budget total={scenario.budget} spent={spent} />
                </div>
                {focusOrgan && (
                  <button type="button" onClick={() => setFocusOrgan(null)} className="mt-3 rounded-full border border-bio/50 bg-bio/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-bio">
                    Focused on {focusOrgan} · show every strategy
                  </button>
                )}
                {crisis && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[0, 1, 2].map((index) => {
                      const id = chosen[index];
                      return (
                        <div key={index} className={`rounded-2xl border border-dashed p-4 ${id ? "border-ember/60 bg-ink-2" : "border-line"}`}>
                          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim">Decision {index + 1}{mode === "panel" ? ` · ${judges[index]}` : ""}</p>
                          <p className="mt-1 text-bone">{id ? findStrategy(id).name : "— empty —"}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {STRATEGIES.map((strategy) => {
                    const selected = chosen.includes(strategy.id);
                    const blocked = !selected && (spent + strategy.cost > scenario.budget || slotsFull);
                    const related = !focusOrgan || strategy.circulate || strategy.organ === focusOrgan || Object.keys(strategy.effects).some((key) => METRICS[key].organ === focusOrgan);
                    return (
                      <Card
                        key={strategy.id}
                        strategy={strategy}
                        on={selected}
                        disabled={blocked}
                        quiet={Boolean(focusOrgan) && !related && !selected}
                        intensity={scenario.intensity ?? 1}
                        installed={installed.includes(strategy.id)}
                        onClick={() => toggle(strategy.id)}
                        onHover={setHoverId}
                      />
                    );
                  })}
                </div>
                <div className="sticky bottom-4 z-30 mt-8 rounded-2xl border border-line bg-ink-2/95 p-4 shadow-2xl backdrop-blur">
                  {outlook && (
                    <p className="mb-3 text-sm text-mist">
                      <span className="text-dim">Forecast · </span>
                      <span className="text-bone">{hoverAdds ? hovered.name : "Selected decisions"}</span>
                      {` · health ${health} → ${systemHealth(outlook.metrics)} · ${formatEffects(ghost) || "no further change"}`}
                    </p>
                  )}
                  {strains.length > 0 && (
                    <ul className="mb-3 space-y-1">
                      {strains.slice(0, 2).map((step) => (
                        <li key={step.text} className="text-sm text-ember">{step.text}</li>
                      ))}
                    </ul>
                  )}
                  {links.length > 0 && (
                    <ul className="mb-3 space-y-2">
                      {links.map((item) => (
                        <li key={item.title} className={`rounded-xl border px-3 py-2 text-sm ${item.good ? "border-bio/50 bg-bio/10 text-bio" : "border-ember/50 bg-ember/10 text-ember"}`}>
                          {item.good ? "Connected solution" : "Chain reaction"}: {item.title}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 text-sm text-mist">
                      {chosen.length === 0 ? <span className="text-dim">No strategies selected yet.</span> : <span><span className="text-dim">Selected: </span>{chosen.map((id) => findStrategy(id).name).join(" + ")}</span>}
                    </div>
                    {needsAgreement && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">Panel agrees:</span>
                        {judges.map((judge, index) => (
                          <button key={judge} type="button" disabled={chosen.length !== 3} onClick={() => setAgreed((flags) => flags.map((flag, flagIndex) => (flagIndex === index ? !flag : flag)))} className={`rounded-full border px-3 py-1 text-xs transition disabled:opacity-40 ${agreed[index] ? "border-bio bg-bio/15 text-bio" : "border-line text-mist hover:border-bone"}`}>
                            {agreed[index] ? "✓ " : ""}{judge}
                          </button>
                        ))}
                      </div>
                    )}
                    <button type="button" disabled={!canSend} onClick={send} className={`rounded-full px-6 py-3 font-semibold text-ink transition disabled:cursor-not-allowed disabled:opacity-30 ${crisis ? "bg-ember" : "bg-bio"}`}>
                      {crisis ? "Stabilise the system" : "Send decisions through the body"}
                    </button>
                  </div>
                </div>
              </>
            )}
            {screen === "response" && (
              <Response metrics={metrics} previous={previous} done={revealed >= cascade.length} isLast={round === scenarios.length - 1} nextIsFinal={scenarios[round + 1]?.id === FAILURE.id} onNext={advance} />
            )}
          </section>
        </main>
      )}
    </div>
  );
}
