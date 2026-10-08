const POINTS = [
  "This is a student concept and an exhibition prototype, not an operating utility.",
  "The comparison between living systems and cities already exists in biomimicry research. That analogy is not claimed as new.",
  "The proposal is a specific one: a body-inspired, interconnected resource system for Oman’s future pressures, demonstrated as a responsive prototype and operated through green-skill decisions.",
  "The human body is the biological inspiration. The innovation is the system designed from those principles.",
  "A built version would still need engineering research, environmental modelling, economic analysis, and specialist review.",
];

export function Limitations() {
  return (
    <section id="limits" className="section limits" aria-labelledby="limits-title">
      <p className="kicker">
        <span>14</span>
        <span>Limitations</span>
      </p>
      <h2 id="limits-title">We are not claiming we have solved Oman’s sustainability challenges.</h2>
      <ul>
        {POINTS.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
}
