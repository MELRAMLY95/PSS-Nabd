import { SKILLS } from "../data/content.js";
import { SKILL_LABELS } from "../simulation/decisions.js";
import { useSystem } from "../simulation/SystemContext.jsx";

export function GreenSkills() {
  const { skillId, setSkillId, decision } = useSystem();
  const skill = SKILLS.find((item) => item.id === skillId);

  const useSkill = (id) => {
    setSkillId(id);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("challenge")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <p className="kicker">
        <span>09</span>
        <span>Green skills</span>
      </p>
      <h2 id="skills-title">The skills are the interface.</h2>
      <p className="prose">
        These levels come from the decisions already made on the body. A choice that sees the next organ raises systems thinking. A choice that spends the future to protect the present lowers it.
      </p>
      <ul className="skill-bars">
        {SKILL_LABELS.map(([key, label]) => (
          <li key={key}>
            <span>{label}</span>
            <span>
              <i style={{ width: `${decision.skills[key]}%` }} />
            </span>
            <strong>{Math.round(decision.skills[key])}</strong>
          </li>
        ))}
      </ul>
      <ul className="skills">
        {SKILLS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={skillId === item.id ? "is-active" : ""}
              aria-pressed={skillId === item.id}
              onClick={() => setSkillId(item.id)}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
      {skill && (
        <div className="skill-read">
          <p>{skill.effect}</p>
          <button type="button" onClick={() => useSkill(skill.id)}>
            Use this in the challenge
          </button>
          <button type="button" onClick={() => setSkillId(null)}>
            Clear the lens
          </button>
        </div>
      )}
    </section>
  );
}
