import { useState } from "react";
import { MODULES } from "../data/content.js";
import { useSystem } from "../simulation/SystemContext.jsx";

const YS = [70, 210, 350, 490, 630];

export function Architecture() {
  const { steady } = useSystem();
  const [active, setActive] = useState(MODULES[0].id);
  const current = MODULES.find((item) => item.id === active) ?? MODULES[0];
  const slowed = steady.phase === "stressed" || steady.phase === "critical";

  return (
    <section id="architecture" className="section" aria-labelledby="architecture-title">
      <p className="kicker">
        <span>05</span>
        <span>System architecture</span>
      </p>
      <h2 id="architecture-title">One pressure becomes a chain.</h2>
      <p className="prose">
        Sense, decide, distribute, recover, adapt — then sense again. A rise in water demand is read by the kidney system. The brain increases recovery. That asks more of the energy circulation. If heat rises as well, the outer layer increases cooling. Sustainability problems are interconnected, so the response has to be too.
      </p>

      <div className={`arch ${slowed ? "is-slow" : ""}`}>
        <svg viewBox="0 0 360 700" aria-hidden="true">
          <path className="arch-down" d="M120 70 V630" />
          <path className="arch-back" d="M120 630 C 28 630 28 70 120 70" />
          <circle className="bead bead-down" r="3.2">
            <animateMotion dur={slowed ? "14s" : "8s"} repeatCount="indefinite" path="M120 70 V630" />
          </circle>
          <circle className="bead bead-back" r="2.6">
            <animateMotion dur={slowed ? "14s" : "8s"} repeatCount="indefinite" path="M120 630 C 28 630 28 70 120 70" />
          </circle>
          {YS.map((y, index) => (
            <circle
              key={y}
              cx="120"
              cy={y}
              r={MODULES[index].id === active ? 7 : 4}
              className={MODULES[index].id === active ? "is-active" : ""}
            />
          ))}
        </svg>
        <ol>
          {MODULES.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={item.id === active ? "is-active" : ""}
                aria-pressed={item.id === active}
                onClick={() => setActive(item.id)}
              >
                <span>{item.role}</span>
                <strong>{item.title}</strong>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <p className="arch-read">
        <span>{current.role}</span>
        {current.text}
      </p>
    </section>
  );
}
