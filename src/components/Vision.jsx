import { useState } from "react";
import { VISION } from "../data/content.js";
import { useSystem } from "../simulation/SystemContext.jsx";

export function Vision() {
  const { setOrganId } = useSystem();
  const [active, setActive] = useState(VISION[1].id);
  const current = VISION.find((item) => item.id === active) ?? VISION[0];

  return (
    <section id="vision" className="section" aria-labelledby="vision-title">
      <p className="kicker">
        <span>10</span>
        <span>Context</span>
      </p>
      <h2 id="vision-title">Why this invention exists.</h2>
      <p className="prose">
        How can Oman design systems that stay resilient as resource and environmental pressures change toward 2040? Vision 2040 is a reason for the work, not a logo on the model. The concept is aimed at these directions. It does not claim to deliver them.
      </p>
      <div className="vision">
        <ul>
          {VISION.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={item.id === active ? "is-active" : ""}
                aria-pressed={item.id === active}
                onClick={() => {
                  setActive(item.id);
                  setOrganId(item.organ);
                }}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>
        <p>{current.text}</p>
      </div>
    </section>
  );
}
