import { colorFor } from "./engine.js";

const SPOTS = {
  brain: { top: "3%", left: "36%", width: "28%", height: "16%" },
  lungs: { top: "18%", left: "30%", width: "32%", height: "16%" },
  heart: { top: "24%", left: "40%", width: "18%", height: "12%" },
  liver: { top: "33%", left: "28%", width: "22%", height: "12%" },
  kidneys: { top: "40%", left: "34%", width: "28%", height: "10%" },
  blood: { top: "62%", left: "36%", width: "18%", height: "14%" },
  skeleton: { top: "50%", left: "42%", width: "14%", height: "22%" },
  skin: { top: "18%", left: "16%", width: "16%", height: "28%" },
};

const LABELS = {
  brain: { x: "72%", y: "8%", text: "Brain · decides" },
  lungs: { x: "4%", y: "28%", text: "Lungs · exchange" },
  heart: { x: "68%", y: "32%", text: "Heart · energy" },
  liver: { x: "2%", y: "42%", text: "Liver · transforms" },
  kidneys: { x: "64%", y: "48%", text: "Kidneys · recover" },
  blood: { x: "66%", y: "60%", text: "Blood · circulates" },
  skeleton: { x: "2%", y: "64%", text: "Skeleton · supports" },
  skin: { x: "66%", y: "78%", text: "Skin · adapts" },
};

export function Body({
  organs,
  health,
  highlight = [],
  selected = null,
  onSelect,
  labels = false,
  className = "",
  status = "",
}) {
  const breathScore = organs.lungs * 0.7 + health * 0.3;
  const breathMode = breathScore >= 64 ? "easy" : breathScore >= 40 ? "uneasy" : "labored";
  const breathEase = breathMode === "easy" ? 1 : breathMode === "uneasy" ? 0.45 : Math.max(0, breathScore / 40);
  const breath = `${(breathMode === "labored" ? 1.35 + breathEase * 0.7 : breathMode === "uneasy" ? 2.8 : 5.4).toFixed(2)}s`;
  const breathX = (breathMode === "easy" ? 1.065 : breathMode === "uneasy" ? 1.03 : 1.012 + breathEase * 0.01).toFixed(3);
  const breathY = (breathMode === "easy" ? 1.04 : breathMode === "uneasy" ? 1.018 : 1.008).toFixed(3);
  const breathLift = breathMode === "easy" ? "-1.15%" : breathMode === "uneasy" ? "-0.4%" : "-0.12%";
  const beat = `${(0.42 + (organs.heart / 100) * 0.78).toFixed(2)}s`;
  const beatScale = (1.05 + (organs.heart / 100) * 0.18).toFixed(3);
  const beatGlow = (0.28 + (organs.heart / 100) * 0.62).toFixed(2);
  const failing = health < 24;
  const wash = health >= 68 ? 0 : Math.min(0.55, (68 - health) / 120);
  const breathWord = breathMode === "easy" ? "easy and deep" : breathMode === "uneasy" ? "short" : "labored and shallow";

  const activate = (organ) => {
    if (!onSelect) return {};
    return {
      role: "button",
      tabIndex: 0,
      "aria-label": LABELS[organ].text,
      "aria-pressed": selected === organ,
      onClick: () => onSelect(organ),
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(organ);
        }
      },
    };
  };

  return (
    <div
      className={`nabd-live ${failing ? "failing" : ""} ${className}`}
      style={{
        "--breath": breath,
        "--breath-x": breathX,
        "--breath-y": breathY,
        "--breath-lift": breathLift,
        "--beat": beat,
        "--beat-scale": beatScale,
        "--beat-glow": beatGlow,
      }}
      role="img"
      aria-label={`Living system prototype. System health ${health} out of 100. Breathing is ${breathWord}.${status ? ` ${status}` : ""}`}
    >
      <img className="nabd-live-base" src={`${import.meta.env.BASE_URL}img/anatomy-body.png`} alt="" draggable="false" />
      <div className={`nabd-chest is-${breathMode}`} aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}img/anatomy-body.png`} alt="" draggable="false" />
      </div>
      <div className="nabd-heart-layer" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}img/anatomy-body.png`} alt="" draggable="false" />
      </div>
      <div className="nabd-heart-glow" aria-hidden="true" />
      <img className="nabd-vessels" src={`${import.meta.env.BASE_URL}img/anatomy-vessels.png`} alt="" draggable="false" />
      <div className="nabd-live-wash" style={{ opacity: wash, background: colorFor(health) }} />
      {Object.entries(SPOTS).map(([organ, box]) => {
        if (typeof organs[organ] !== "number") return null;
        const active = highlight.includes(organ) || selected === organ;
        return (
          <div
            key={organ}
            data-organ={organ}
            className={`nabd-spot${active ? " is-on" : ""}`}
            style={{
              ...box,
              "--spot": colorFor(organs[organ]),
              zIndex: organ === "skin" ? 1 : organ === "heart" ? 4 : organ === "skeleton" ? 2 : 3,
              cursor: onSelect ? "pointer" : undefined,
            }}
            {...activate(organ)}
          />
        );
      })}
      {labels && Object.entries(LABELS).filter(([organ]) => typeof organs[organ] === "number").map(([organ, label]) => (
        <span
          key={organ}
          className="nabd-live-label"
          style={{ left: label.x, top: label.y, opacity: selected && selected !== organ ? 0.35 : 1 }}
        >
          {label.text}
        </span>
      ))}
    </div>
  );
}
