import { ORGANS } from "../data/content.js";
import { useSystem } from "../simulation/SystemContext.jsx";

export function BodyMap() {
  const { organId, setOrganId } = useSystem();
  const organ = ORGANS.find((item) => item.id === organId) ?? ORGANS[0];

  return (
    <section id="body" className="section" aria-labelledby="body-title">
      <div>
        <p className="kicker">
          <span>04</span>
          <span>The body as architecture</span>
        </p>
        <h2 id="body-title">Each organ becomes a function.</h2>
        <p className="prose">
          The human figure is the physical form of the invention. Inside it, biological mechanisms become technological ones. They do not work as separate machines.
        </p>
        <ul className="organ-list">
          {ORGANS.map((item) => {
            const open = item.id === organ.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  className={open ? "is-active" : ""}
                  onClick={() => setOrganId(item.id)}
                >
                  <span>{item.name}</span>
                  <span>{item.principle}</span>
                </button>
                {open && (
                  <div className="organ-detail">
                    <p>{item.biology}</p>
                    <p>{item.interpretation}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
