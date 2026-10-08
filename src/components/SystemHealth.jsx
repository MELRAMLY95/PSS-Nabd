import { PHASES } from "../data/content.js";
import { warnings } from "../simulation/model.js";
import { useSystem } from "../simulation/SystemContext.jsx";
import { ModelStatus } from "./ModelStatus.jsx";

export function SystemHealth() {
  const { sim } = useSystem();
  const phase = PHASES[sim.phase];
  const notes = warnings(sim);

  return (
    <section id="health" className={`section health phase-${sim.phase}`} aria-labelledby="health-title">
      <p className="kicker">
        <span>08</span>
        <span>System health</span>
      </p>
      <div className="health-grid">
        <div>
          <h2 id="health-title" aria-live="polite">
            {phase.label}
          </h2>
          <p className="prose">
            {phase.line} The prototype would show this in the body: stronger or weaker flows, not a quiz score.
          </p>
          <ModelStatus />
          {notes.length === 0 ? (
            <p className="calm">No pathway is calling for correction.</p>
          ) : (
            <ul className="warnings">
              {notes.map((note) => (
                <li key={note.id}>{note.text}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
