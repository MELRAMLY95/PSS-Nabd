const LINES = [
  "Sense, instead of only consuming.",
  "Circulate, instead of discarding.",
  "Recover, instead of treating every output as waste.",
  "Adapt, when the conditions change.",
];

export function WhyItMatters() {
  return (
    <section id="matters" className="section matters" aria-labelledby="matters-title">
      <p className="kicker">
        <span>13</span>
        <span>Why it matters</span>
      </p>
      <h2 id="matters-title" className="sr">
        Why it matters
      </h2>
      <ul>
        {LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="closing">
        Sustainability problems are interconnected.
        <br />
        The response has to be interconnected too.
      </p>
    </section>
  );
}
