import { BOARDS } from "./boardCopy.js";

export function OrganBoard({ id, name }) {
  const copy = BOARDS[id];

  return (
    <article className="organ-stage" data-organ={id} aria-label={name}>
      <header className="organ-stage-head">
        <p>Sustainable Oman 2040</p>
        <h2>{copy.organ}</h2>
        <p>{copy.subtitle}</p>
      </header>
      <div className="organ-sections">
        {copy.sections.map((section) => (
          <section key={section.title}>
            <h3><span>{section.n}</span>{section.title}</h3>
            {section.text ? <p>{section.text}</p> : null}
            {section.points ? (
              <ul>
                {section.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            ) : null}
            {section.note ? <p className="organ-note">{section.note}</p> : null}
          </section>
        ))}
      </div>
      <p className="organ-key">{copy.key}</p>
    </article>
  );
}
