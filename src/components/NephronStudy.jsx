import { NEPHRON_STEPS } from "../data/content.js";

export function NephronStudy({ step, onStep, onClose }) {
  const current = NEPHRON_STEPS[step] ?? NEPHRON_STEPS[0];
  const showFilter = step >= 2;
  const showRecover = step >= 3;
  const showWaste = step >= 4;
  const showDesign = step >= 5;

  return (
    <div className="nephron" role="dialog" aria-label="Nephron study">
      <svg viewBox="0 0 420 230" aria-hidden="true">
        <path d="M40 40 H150" className="nephron-vessel" />
        <path d="M40 150 H150" className="nephron-vessel dim" />
        <circle cx="168" cy="78" r="34" className={showFilter ? "is-on" : ""} />
        <path d="M188 96 C168 120 150 112 156 78" className="nephron-capsule" />
        <path
          d="M198 96 C250 96 248 36 292 42 C336 48 348 118 312 150 C276 182 360 196 390 168"
          className={`nephron-tubule ${showRecover ? "is-on" : ""}`}
        />
        {showFilter && <text x="168" y="82">Filter</text>}
        {showRecover && <text x="292" y="36">Recover</text>}
        {showWaste && <text x="360" y="188">Waste</text>}
        {showDesign && <text x="40" y="24">Water recovery</text>}
        <text x="150" y="214">Glomerulus and tubule — a simplified nephron</text>
      </svg>
      <p className="nephron-kicker">
        Kidney → nephron → filtration → reabsorption → waste
      </p>
      <h3>{current.title}</h3>
      <p>{current.text}</p>
      <div className="nephron-steps">
        {NEPHRON_STEPS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === step ? "is-active" : ""}
            aria-pressed={index === step}
            onClick={() => onStep(index)}
          >
            {item.title}
          </button>
        ))}
      </div>
      <button type="button" onClick={onClose}>
        Return to the kidneys
      </button>
    </div>
  );
}
