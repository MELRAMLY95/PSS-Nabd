import { useRef } from "react";
import { BOARDS } from "./boardCopy.js";

const PATHS = { lungs: true };

function kindOf(title) {
  if (/biolog/i.test(title)) return "bio";
  if (/problem/i.test(title)) return "problem";
  if (/solution/i.test(title)) return "solution";
  if (/prototype/i.test(title)) return "proto";
  if (/^how/i.test(title)) return "how";
  if (/material/i.test(title)) return "materials";
  return "plain";
}

function Points({ kind, points, path }) {
  const steps = points.every((point) => /^\d+\.\s/.test(point));
  if (steps) {
    return (
      <ol className="ob-steps">
        {points.map((point) => {
          const [, n, label] = point.match(/^(\d+)\.\s(.*)$/);
          return <li key={point}><b>{n}</b><span>{label}</span></li>;
        })}
      </ol>
    );
  }
  if (kind === "bio") {
    return (
      <ol className={`ob-anatomy${path ? " is-path" : ""}`}>
        {points.map((point) => <li key={point}>{point}</li>)}
      </ol>
    );
  }
  if (kind === "proto") {
    return (
      <ol className="ob-parts">
        {points.map((point, index) => (
          <li key={point}><b>{String(index + 1).padStart(2, "0")}</b><span>{point}</span></li>
        ))}
      </ol>
    );
  }
  return (
    <ul className={`ob-list ob-list-${kind}`}>
      {points.map((point) => <li key={point}>{point}</li>)}
    </ul>
  );
}

export function OrganBoard({ id, name }) {
  const copy = BOARDS[id];
  const sectionRefs = useRef([]);
  const kinds = copy.sections.map((section) => kindOf(section.title));

  const wide = (index) => {
    const kind = kinds[index];
    if (kind === "solution" || kind === "materials" || kind === "plain") return true;
    if (kind === "proto") return kinds[index + 1] !== "how";
    if (kind === "how") return kinds[index - 1] !== "proto";
    return false;
  };

  const jump = (index) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <article className="ob" data-organ={id} aria-label={name}>
      <header className="ob-head">
        <p>Sustainable Oman 2040</p>
        <h2>{copy.organ}</h2>
        <p>{copy.subtitle}</p>
      </header>
      <nav className="ob-contents" aria-label={`${copy.organ} sections`}>
        {copy.sections.map((section, index) => (
          <button type="button" key={section.title} onClick={() => jump(index)}>
            <b>{section.n}</b>
            <span>{section.title}</span>
          </button>
        ))}
      </nav>
      <div className="ob-sections">
        {copy.sections.map((section, index) => (
          <section
            key={section.title}
            ref={(node) => { sectionRefs.current[index] = node; }}
            className={`ob-card ob-${kinds[index]}${wide(index) ? " is-wide" : ""}`}
            style={{ "--ob-delay": `${index * 70}ms` }}
          >
            <h3><span>{section.n}</span>{section.title}</h3>
            {section.text ? <p className="ob-text">{section.text}</p> : null}
            {section.points ? <Points kind={kinds[index]} points={section.points} path={Boolean(PATHS[id]) && kinds[index] === "bio"} /> : null}
            {section.note ? <p className="ob-note">{section.note}</p> : null}
          </section>
        ))}
      </div>
      <blockquote className="ob-key">{copy.key}</blockquote>
    </article>
  );
}
