import { MAP, linksFor } from "../simulation/living.js";

const byId = Object.fromEntries(MAP.map((item) => [item.id, item]));

function tone(value) {
  if (value >= 75) return "is-steady";
  if (value >= 62) return "is-watch";
  return "is-strain";
}

export function SystemMap({ health, active, flow, onPick }) {
  const links = linksFor(flow);
  return (
    <figure className="map">
      <svg viewBox="0 0 220 390" role="img" aria-label="A human silhouette used as a map of the sustainability system">
        <g className="silhouette">
          <circle cx="110" cy="42" r="16" />
          <path d="M78 92h64c8 0 14 6 14 14v96c0 10-8 16-16 16H80c-8 0-16-6-16-16V106c0-8 6-14 14-14z" />
          <path d="M80 108 L52 176" />
          <path d="M140 108 L168 176" />
          <path d="M96 218 L88 330" />
          <path d="M124 218 L132 330" />
        </g>
        {links.map(([from, to, kind]) => {
          const a = byId[from];
          const b = byId[to];
          if (!a || !b) return null;
          return (
            <line
              key={`${from}-${to}-${kind}`}
              className={`flow flow-${kind} ${flow && flow !== kind ? "is-dim" : ""}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
            />
          );
        })}
        {MAP.map((item) => (
          <g key={item.id} className={`node ${tone(health[item.id] ?? 70)} ${active === item.id ? "is-on" : ""}`}>
            <circle cx={item.x} cy={item.y} r={active === item.id ? 7 : 5} />
          </g>
        ))}
      </svg>
      <ul>
        {MAP.map((item) => (
          <li key={item.id}>
            <button type="button" className={active === item.id ? "is-on" : ""} onClick={() => onPick?.(item.id)}>
              <strong>{item.env}</strong>
              <span>{Math.round(health[item.id] ?? 0)}</span>
            </button>
          </li>
        ))}
      </ul>
    </figure>
  );
}
