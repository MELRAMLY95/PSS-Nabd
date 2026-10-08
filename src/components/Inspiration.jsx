import { ORGANS } from "../data/content.js";
import { useSystem } from "../simulation/SystemContext.jsx";

export function Inspiration() {
  const { organId, setOrganId } = useSystem();
  const organ = ORGANS.find((item) => item.id === organId) ?? ORGANS[1];

  return (
    <section id="inspiration" className="section" aria-labelledby="inspiration-title">
      <div>
        <p className="kicker">
          <span>03</span>
          <span>Biological inspiration</span>
        </p>
        <h2 id="inspiration-title">
          Nature already
          <br />
          solved this
          <br />
          kind of problem.
        </h2>
        <p className="prose">
          The body does not simply consume. It senses what is happening, moves resources to where they are needed, recovers what it can, and keeps competing demands in balance.
        </p>
        <p className="prose">
          Comparing living systems with cities is not new. The proposal here is specific: a body-inspired resource system for Oman’s conditions, built as one interconnected prototype.
        </p>
        <p className="organ-read">
          <span>{organ.name}</span>
          {organ.principle}
        </p>
      </div>
    </section>
  );
}
