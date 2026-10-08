import { PRESSURES } from "../data/content.js";
import { useSystem } from "../simulation/SystemContext.jsx";

const TRADITIONAL = ["Consume", "Use", "Waste"];
const LIVING = ["Sense", "Decide", "Distribute", "Recover", "Adapt"];

export function Problem() {
  const { organId, setOrganId } = useSystem();

  return (
    <section id="problem" className="section problem" aria-labelledby="problem-title">
      <p className="kicker">
        <span>02</span>
        <span>The problem</span>
      </p>
      <h2 id="problem-title">
        We built systems
        <br />
        that consume.
      </h2>
      <p className="shift">What if future infrastructure worked more like the human body?</p>
      <p className="prose">
        The body is not a picture of the environment. It is the source of the mechanisms: sense, transport, recover, adapt, and keep balance.
      </p>

      <div className="compare">
        <div>
          <p className="compare-label">Traditional system</p>
          <ol className="stack dead">
            {TRADITIONAL.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <p className="compare-label">Living system</p>
          <ol className="stack live-loop">
            {LIVING.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="pressures">
        <h3>Pressures the concept is built to face</h3>
        <ul>
          {PRESSURES.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={organId === item.organ ? "is-active" : ""}
                aria-pressed={organId === item.organ}
                onClick={() => setOrganId(item.organ)}
              >
                <strong>{item.label}</strong>
                <span>{item.line}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="aside">
          No national statistics are shown here. These are the conditions the concept is designed around, not measured claims.
        </p>
      </div>
    </section>
  );
}
