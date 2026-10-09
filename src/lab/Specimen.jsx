import { ORGANS } from "./content.js";

const SRC = `${import.meta.env.BASE_URL}img/anatomy-body.png`;
const VESSELS = `${import.meta.env.BASE_URL}img/anatomy-vessels.png`;

const FLOWS = {
  brain: ["M50 4 C46 10 48 16 50 20", "M42 12 C36 18 34 24 40 28", "M58 12 C64 18 66 24 60 28"],
  heart: ["M50 52 C34 70 30 96 36 128", "M52 52 C68 72 70 100 62 132", "M50 50 C50 78 48 96 50 118"],
  lungs: ["M28 40 C40 36 48 42 50 52", "M72 40 C60 36 52 42 50 52", "M32 48 C42 46 58 46 68 48"],
  kidneys: ["M38 68 C40 76 37 84 42 92", "M62 69 C60 77 63 85 58 93"],
  liver: ["M28 62 C36 70 40 78 36 90", "M36 90 C44 98 52 96 58 88", "M40 74 C48 80 46 88 40 92"],
  skin: ["M18 40 C14 58 16 78 22 96", "M22 48 C18 60 18 74 24 86"],
  digestive: ["M48 78 C46 90 52 100 48 114", "M48 114 C40 124 58 132 50 142", "M50 142 C58 150 44 156 48 164"],
  skeleton: ["M50 22 L50 150", "M50 48 L32 78", "M50 48 L68 78", "M50 108 L36 150", "M50 108 L64 150"],
};

export function Specimen({ organ, layer, result, onSelect, quiet }) {
  const focus = organ?.focus;
  const shortage = result?.shortage ?? 24;
  const exchange = result?.exchange ?? 55;
  const heat = result?.heatLoad ?? 40;
  const breathScore = exchange * 0.65 + (100 - heat) * 0.35;
  const breath = breathScore >= 64 ? "easy" : breathScore >= 40 ? "uneasy" : "labored";
  const beat = `${(0.48 + ((100 - shortage) / 100) * 0.7).toFixed(2)}s`;
  const zoom = layer === "innovation" || layer === "crossing" ? "scale(1.12)" : (focus?.transform ?? "scale(1.7)");

  return (
    <div
      className={`specimen ${organ ? "is-focused" : ""} ${quiet ? "is-quiet" : ""}`}
      style={{ "--beat": beat, "--origin": focus?.origin ?? "50% 42%", "--focus": organ ? zoom : "none" }}
    >
      <div className="specimen-frame">
        <img className="specimen-photo" src={SRC} alt="" draggable="false" />
        <div className={`specimen-chest is-${breath}`} aria-hidden="true"><img src={SRC} alt="" draggable="false" /></div>
        <img className="specimen-vessels" src={VESSELS} alt="" draggable="false" />
        <div className="specimen-heart" aria-hidden="true" />
        {layer === "biology" && organ && (
          <svg className="specimen-flow" viewBox="0 0 100 180" preserveAspectRatio="none" aria-hidden="true">
            {(FLOWS[organ.id] ?? []).map((d) => <path key={d} d={d} />)}
          </svg>
        )}
        {ORGANS.map((item) => (item.spots ?? [item.spot]).map((spot, index) => (
          <button
            key={`${item.id}-${index}`}
            type="button"
            className={`hotspot ${organ?.id === item.id ? "is-on" : ""}`}
            style={{ ...spot, "--spot": `var(--${item.accent})` }}
            aria-pressed={organ?.id === item.id}
            aria-label={`${item.name}. ${item.invention}`}
            onClick={() => onSelect(item.id)}
          >
            {index === 0 && <span>{item.name}</span>}
          </button>
        )))}
      </div>
    </div>
  );
}
