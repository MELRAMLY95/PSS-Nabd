import { FIELDS } from "./content.js";

function Dot({ path, color, dur = "4.8s", begin = "0s" }) {
  return (
    <circle r="4" fill={color}>
      <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} />
    </circle>
  );
}

function KidneyScene({ result, local }) {
  const demand = Math.max(1, local.waterDemand);
  const kept = result.recoveredWater / demand;
  const recoverWidth = 3 + kept * 14;
  const wasteWidth = 3 + (1 - kept) * 12;
  return (
    <svg className="drawing" viewBox="0 0 860 520" role="img" aria-label="Selective recovery: inflow splits into recovered water and a concentrated remainder.">
      <text x="40" y="48" className="draw-kicker">Engineering mechanism</text>
      <text x="40" y="88" className="draw-title">Select. Recover. Leave less behind.</text>
      <path d="M40 250 H270 C320 250 360 220 450 210" stroke="#7ec8d6" strokeWidth="8" fill="none" />
      <path d="M270 250 C330 270 380 300 450 300" stroke="rgba(243,239,230,0.35)" strokeWidth="6" fill="none" />
      <Dot path="M40 250 H270 C320 250 360 220 450 210" color="#7ec8d6" dur="3.4s" />
      {Array.from({ length: 10 }, (_, index) => (
        <line key={index} x1={278 + index * 16} y1="168" x2={278 + index * 16} y2="332" stroke="rgba(228,210,168,0.75)" strokeWidth="2" />
      ))}
      <text x="286" y="156" className="draw-note">selective field</text>
      <path d="M450 210 H820" stroke="#7ec8d6" strokeWidth={recoverWidth} fill="none" />
      <path d="M450 300 H760" stroke="rgba(243,239,230,0.28)" strokeWidth={wasteWidth} fill="none" />
      <Dot path="M450 210 H820" color="#7ec8d6" dur="3.2s" />
      <Dot path="M450 300 H760" color="rgba(243,239,230,0.55)" dur="4.4s" begin="0.4s" />
      <text x="560" y="196" className="draw-note">recovered water</text>
      <text x="520" y="340" className="draw-note">concentrated remainder</text>
      <path d="M40 420 H820" stroke="#c4525a" strokeWidth="2" fill="none" opacity={0.35 + result.shortage / 140} />
      <text x="40" y="408" className="draw-note">energy drawn by the recovery · model reading {result.shortage}</text>
      <text x="40" y="470" className="draw-note">Inflow {local.waterDemand} · recovered {result.recoveredWater} · still unmet {result.waterGap}</text>
    </svg>
  );
}

function HeartScene({ result, local }) {
  const fill = Math.min(146, result.storage * 1.4);
  const store = 226 - fill;
  const stressed = result.shortage > 18;
  return (
    <svg className="drawing" viewBox="0 0 860 520" role="img" aria-label="Circulation network: generation, storage, and demand.">
      <text x="40" y="48" className="draw-kicker">Engineering mechanism</text>
      <text x="40" y="88" className="draw-title">Generate. Move. Store. Send it where the load is.</text>
      <circle cx="110" cy="270" r={22 + local.sun * 0.28} fill="rgba(228,210,168,0.18)" stroke="#e4d2a8" />
      <text x="78" y="360" className="draw-note">generation</text>
      <circle cx="360" cy="270" r="46" fill="none" stroke="#c4525a" strokeWidth="2" />
      <text x="332" y="274" className="draw-note">circulate</text>
      <path d="M150 270 H310" stroke="#c4525a" fill="none" strokeWidth="2" />
      <path d="M406 270 H560" stroke="#c4525a" fill="none" strokeWidth="2" />
      <path d="M560 270 V150 H680" stroke="#e4d2a8" fill="none" strokeWidth="2" />
      <path d="M620 270 H760" stroke={stressed ? "#d4894a" : "#c4525a"} fill="none" strokeWidth={stressed ? 1.4 : 3} />
      <path d="M560 270 V400 H760" stroke="#c4525a" fill="none" strokeWidth="2" />
      <Dot path="M150 270 H310" color="#c4525a" dur="2.4s" />
      <Dot path="M406 270 H620" color="#c4525a" dur="2.6s" begin="0.2s" />
      <Dot path="M620 270 H760" color={stressed ? "#d4894a" : "#c4525a"} dur="3s" />
      <rect x="690" y="80" width="36" height="150" fill="none" stroke="#e4d2a8" />
      <rect x="694" y={store} width="28" height={fill} fill="rgba(228,210,168,0.85)" />
      <text x="690" y="250" className="draw-note">storage</text>
      <text x="760" y="258" className="draw-note">cooling load</text>
      <text x="760" y="424" className="draw-note">other demand</text>
      <text x="40" y="470" className="draw-note">
        {result.surplus > result.shortage ? "Supply is ahead of this demand. Storage takes the difference." : "Demand is ahead of supply. Circulation moves what it can. A gap remains."}
        {` · gap ${result.shortage}`}
      </text>
    </svg>
  );
}

function BrainScene({ result, local }) {
  const hot = local.temperature >= 65;
  const thirsty = result.waterGap >= 35;
  const loaded = result.coolingDemand >= 48 || result.shortage >= 12;
  const active = (on) => (on ? "#e4d2a8" : "rgba(243,239,230,0.28)");
  return (
    <svg className="drawing" viewBox="0 0 860 520" role="img" aria-label="A decision network. Signals move from conditions to a response.">
      <text x="40" y="48" className="draw-kicker">Engineering mechanism</text>
      <text x="40" y="88" className="draw-title">Sense. Decide. Then the other systems move.</text>
      {[
        [120, 180, "heat", hot],
        [120, 270, "water", thirsty],
        [120, 360, "energy", loaded],
      ].map(([x, y, label, on]) => (
        <g key={label}>
          <circle cx={x} cy={y} r="22" fill="none" stroke={active(on)} />
          <text x={x - 18} y={y + 48} className="draw-note">{label}</text>
          <path d={`M${x + 24} ${y} H300`} stroke={active(on)} fill="none" />
          {on && <Dot path={`M${x + 24} ${y} H300`} color="#e4d2a8" dur="2.2s" />}
        </g>
      ))}
      <circle cx="390" cy="270" r="54" fill="none" stroke="#e4d2a8" strokeWidth="1.5" />
      <text x="358" y="274" className="draw-note">decide</text>
      <path d="M444 270 H620" stroke="#e4d2a8" fill="none" />
      <Dot path="M444 270 H620" color="#e4d2a8" dur="2s" begin="0.6s" />
      <path d="M620 270 V160 H740" stroke={active(hot || loaded)} fill="none" />
      <path d="M620 270 H760" stroke={active(thirsty)} fill="none" />
      <path d="M620 270 V390 H740" stroke={active(loaded)} fill="none" />
      <text x="740" y="150" className="draw-note">cooling</text>
      <text x="760" y="258" className="draw-note">water</text>
      <text x="740" y="412" className="draw-note">allocation</text>
      {(hot || loaded) && <Dot path="M620 270 V160 H740" color="#d4894a" dur="2.8s" />}
      {thirsty && <Dot path="M620 270 H760" color="#7ec8d6" dur="2.8s" />}
    </svg>
  );
}

function LungScene({ result, local }) {
  const passing = Math.max(2, Math.round(result.exchange / 14));
  const stalled = Math.max(0, Math.round(local.dust / 28));
  return (
    <svg className="drawing" viewBox="0 0 860 520" role="img" aria-label="Exchange across a large folded surface.">
      <text x="40" y="48" className="draw-kicker">Engineering mechanism</text>
      <text x="40" y="88" className="draw-title">More surface. Managed flow. Exchange that answers the air.</text>
      {Array.from({ length: 7 }, (_, index) => {
        const y = 150 + index * 42;
        const d = `M60 ${y} Q 430 ${y - 28} 800 ${y}`;
        return <path key={y} d={d} stroke="rgba(126,200,214,0.45)" fill="none" />;
      })}
      {Array.from({ length: passing }, (_, index) => (
        <Dot key={index} path={`M60 ${150 + (index % 7) * 42} Q 430 ${122 + (index % 7) * 42} 800 ${150 + (index % 7) * 42}`} color="#7ec8d6" dur={`${3.2 + index * 0.3}s`} begin={`${index * 0.4}s`} />
      ))}
      {Array.from({ length: stalled }, (_, index) => (
        <circle key={index} cx={180 + index * 70} cy={210 + (index % 3) * 40} r="5" fill="rgba(212,137,74,0.8)" />
      ))}
      <text x="40" y="470" className="draw-note">Exchange reading {result.exchange}. Dust that does not cross stays on the surface. This is a model, not a measured filter.</text>
    </svg>
  );
}

function LiverScene({ result, local }) {
  const leave = Math.max(1, Math.round((result.disposed / Math.max(1, local.wasteMix)) * 6));
  return (
    <svg className="drawing" viewBox="0 0 860 520" role="img" aria-label="A material loop: separate, transform, recover, and a remainder that leaves.">
      <text x="40" y="48" className="draw-kicker">Engineering mechanism</text>
      <text x="40" y="88" className="draw-title">Separate. Transform. Recover. Reuse.</text>
      <ellipse cx="390" cy="290" rx="180" ry="110" fill="none" stroke="#7d9a72" strokeWidth="2" />
      <Dot path="M390 180 A180 110 0 1 1 389 180" color="#7d9a72" dur="7s" />
      <Dot path="M390 180 A180 110 0 1 1 389 180" color="#e4d2a8" dur="7s" begin="2s" />
      <path d="M570 290 H800" stroke="rgba(243,239,230,0.35)" fill="none" strokeWidth={2 + leave} />
      <text x="250" y="168" className="draw-note">separate</text>
      <text x="470" y="200" className="draw-note">transform</text>
      <text x="250" y="430" className="draw-note">recover</text>
      <text x="620" y="276" className="draw-note">remainder leaves</text>
      <text x="40" y="470" className="draw-note">Recovered in the model {result.recoveredMaterial}. Still disposed {result.disposed}. Hazardous material is not erased.</text>
    </svg>
  );
}

function SkinScene({ result, local }) {
  const day = local.hour >= 6 && local.hour <= 18;
  const along = Math.min(1, Math.max(0, (local.hour - 5) / 14));
  const sunX = 80 + along * 620;
  const sunY = 150 - Math.sin(along * Math.PI) * 80;
  const closing = !local.systems.skin || !day || local.temperature < 55
    ? 0.04
    : Math.min(1, (local.sun / 100) * (0.45 + local.orientation / 150));
  const angle = 68 - closing * 62;
  return (
    <svg className="drawing" viewBox="0 0 860 540" role="img" aria-label="A building with an outer layer that closes as sun and heat rise.">
      <text x="40" y="42" className="draw-kicker">Engineering mechanism</text>
      <text x="40" y="78" className="draw-title">The outer layer changes. The heat admitted changes with it.</text>
      <circle cx={sunX} cy={sunY} r={16 + local.sun / 10} fill="#e4d2a8" opacity={day ? 0.9 : 0.2} />
      <rect x="300" y="120" width="200" height="340" fill="#12141a" stroke="rgba(243,239,230,0.4)" />
      <rect x="300" y="120" width="200" height="340" fill={`rgba(212,137,74,${result.heatLoad / 160})`} />
      {Array.from({ length: 15 }, (_, index) => {
        const y = 132 + index * 21;
        return (
          <rect key={y} x="500" y={y} width="150" height="7" fill="#e7e1d6" transform={`rotate(${angle} 500 ${y + 3})`} />
        );
      })}
      <text x="300" y="490" className="draw-note">Heat load {result.heatLoad} · cooling demand {result.coolingDemand}</text>
      <text x="40" y="522" className="draw-note">No energy-saving percentage is claimed. The façade position and the heat reading are both inside the model.</text>
    </svg>
  );
}

function DigestiveScene({ result }) {
  return (
    <svg className="drawing" viewBox="0 0 860 520" role="img" aria-label="Input is processed, useful material returns, a remainder leaves.">
      <text x="40" y="48" className="draw-kicker">Engineering mechanism</text>
      <text x="40" y="88" className="draw-title">Take it in. Absorb what can return. Let the rest leave.</text>
      <path d="M120 160 V400" stroke="#7d9a72" fill="none" strokeWidth="8" />
      <path d="M120 400 H420 V200 H120" stroke="#e4d2a8" fill="none" strokeWidth="3" />
      <path d="M120 400 H700" stroke="rgba(243,239,230,0.3)" fill="none" strokeWidth="4" />
      <Dot path="M120 160 V400" color="#7d9a72" dur="3.5s" />
      <Dot path="M120 400 H420 V200 H120" color="#e4d2a8" dur="6s" />
      <Dot path="M120 400 H700" color="rgba(243,239,230,0.7)" dur="4s" begin="0.5s" />
      <text x="140" y="180" className="draw-note">input</text>
      <text x="250" y="188" className="draw-note">returns to use</text>
      <text x="520" y="386" className="draw-note">remainder</text>
      <text x="40" y="470" className="draw-note">Recovered material in the model {result.recoveredMaterial}. This is not a yield from a real farm.</text>
    </svg>
  );
}

function BloodScene({ result, local }) {
  const on = local.systems.blood;
  const pace = result.shortage > 28 ? "5.2s" : "2.8s";
  const streams = [
    ["water", "#7ec8d6", 168],
    ["energy", "#c4525a", 228],
    ["materials", "#e4d2a8", 288],
    ["signals", "rgba(243,239,230,0.8)", 348],
  ];
  return (
    <svg className="drawing" viewBox="0 0 860 520" role="img" aria-label="Resource circulation. Separate streams join and move toward demand.">
      <text x="40" y="48" className="draw-kicker">Engineering mechanism</text>
      <text x="40" y="88" className="draw-title">{on ? "One circulation. The short place can be reached." : "Separate streams. A shortage stays where it starts."}</text>
      {streams.map(([label, color, y]) => (
        <g key={label}>
          <text x="40" y={y - 14} className="draw-note">{label}</text>
          <path d={on ? `M40 ${y} H250 C340 ${y} 360 250 470 250 H820` : `M40 ${y} H820`} stroke={color} strokeWidth={on ? 3 : 1.4} fill="none" opacity={on ? 1 : 0.45} />
          {on && <Dot path={`M40 ${y} H250 C340 ${y} 360 250 470 250 H820`} color={color} dur={pace} />}
        </g>
      ))}
      <circle cx="470" cy="250" r="28" fill="none" stroke="#c4525a" />
      <text x="40" y="450" className="draw-note">Circulation in the model {result.flow}. Shortage still showing {result.shortage}. Neither figure is a measured national flow.</text>
    </svg>
  );
}

function SkeletonScene({ result, local }) {
  const shared = local.systems.skeleton;
  const hot = result.structuralStress > 68 ? "#d4894a" : result.structuralStress > 42 ? "#e4d2a8" : "#f3efe6";
  return (
    <svg className="drawing" viewBox="0 0 860 520" role="img" aria-label="A structure under load. Sharing the load changes where the stress sits.">
      <text x="40" y="48" className="draw-kicker">Engineering mechanism</text>
      <text x="40" y="88" className="draw-title">{shared ? "The load is shared across the frame." : "The load is landing on one member."}</text>
      <line x1="430" y1="150" x2="430" y2={170 + local.structuralLoad * 0.4} stroke={hot} strokeWidth="3" />
      {shared ? (
        <g stroke={hot} fill="none" strokeWidth="2">
          <path d="M250 420 H610" />
          <path d="M300 200 H560" />
          <path d="M300 200 L250 420" />
          <path d="M560 200 L610 420" />
          <path d="M300 200 L430 420" />
          <path d="M560 200 L430 420" />
          <path d="M360 200 L330 420" />
          <path d="M500 200 L530 420" />
        </g>
      ) : (
        <path d="M410 200 H450 V420 H410 Z" fill="rgba(212,137,74,0.25)" stroke={hot} strokeWidth="3" />
      )}
    </svg>
  );
}

const SCENES = {
  kidneys: KidneyScene,
  heart: HeartScene,
  brain: BrainScene,
  lungs: LungScene,
  liver: LiverScene,
  skin: SkinScene,
  digestive: DigestiveScene,
  skeleton: SkeletonScene,
  blood: BloodScene,
};

export function Invention({ organ, result, local, onShare }) {
  const Scene = SCENES[organ.id];
  return <Scene result={result} local={local} onShare={onShare} />;
}

export function Slider({ field, value, onChange }) {
  const [label, low, high] = FIELDS[field];
  const max = field === "hour" ? 23 : 100;
  return (
    <label className="instrument">
      <span>{label}<b>{value}</b></span>
      <input type="range" min="0" max={max} value={value} aria-valuetext={`${value}. ${low} to ${high}`} onChange={(event) => onChange(field, Number(event.target.value))} />
    </label>
  );
}

export function Plinth({ organ }) {
  return (
    <svg className="drawing plinth" viewBox="0 0 640 420" role="img" aria-label={`Planned physical model for ${organ.invention}.`}>
      <rect x="70" y="300" width="500" height="18" fill="#1a1c22" />
      <rect x="110" y="318" width="18" height="70" fill="#23262e" />
      <rect x="512" y="318" width="18" height="70" fill="#23262e" />
      <g stroke={`var(--${organ.accent})`} fill="none" strokeWidth="2">
        {organ.id === "skin" && <path d="M180 260 H460 M200 150 V260 M420 150 V260 M200 150 H420 M230 170 H390 M230 200 H390 M230 230 H390" />}
        {organ.id === "heart" && <path d="M160 200 H300 M300 120 V280 M300 160 H470 M300 230 H430" />}
        {organ.id === "kidneys" && <path d="M150 200 H280 M300 140 V270 M430 170 H520 M430 240 H500" />}
        {organ.id === "brain" && <path d="M160 160 H260 M160 210 H260 M160 260 H260 M280 210 H470" />}
        {organ.id === "lungs" && <path d="M160 150 Q320 120 480 150 M160 190 Q320 160 480 190 M160 230 Q320 200 480 230" />}
        {organ.id === "liver" && <ellipse cx="320" cy="200" rx="140" ry="70" />}
        {organ.id === "digestive" && <path d="M220 120 V280 H420 V160 H260" />}
        {organ.id === "skeleton" && <path d="M200 280 H440 M230 140 H410 M230 140 L200 280 M410 140 L440 280 M320 140 L320 280" />}
      </g>
      <text x="70" y="40" className="draw-kicker">Planned physical model</text>
      <text x="70" y="78" className="draw-title">{organ.invention}</text>
    </svg>
  );
}
