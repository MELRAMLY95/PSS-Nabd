import { useRef, useState } from "react";
import { LAYERS } from "../data/content.js";

const OFFSETS = {
  shell: -72,
  sensors: -48,
  control: -24,
  circulation: 0,
  recovery: 28,
  exchange: 52,
  circular: 78,
};

export function Prototype() {
  const [rot, setRot] = useState(-18);
  const [explode, setExplode] = useState(22);
  const [solo, setSolo] = useState(null);
  const drag = useRef(null);
  const active = LAYERS.find((layer) => layer.id === solo) ?? null;

  const onPointerDown = (event) => {
    drag.current = { x: event.clientX, rot };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!drag.current) return;
    setRot(drag.current.rot + (event.clientX - drag.current.x) * 0.35);
  };
  const endDrag = () => {
    drag.current = null;
  };

  const resetView = () => {
    setRot(-18);
    setExplode(22);
    setSolo(null);
  };

  return (
    <section id="prototype" className="section" aria-labelledby="prototype-title">
      <p className="kicker">
        <span>11</span>
        <span>Physical prototype</span>
      </p>
      <h2 id="prototype-title">The body is the machine.</h2>
      <p className="prose">
        The proposed prototype is a human figure with transparent sections, so visitors can see circulation, recovery, exchange, and waste transformation working together. This view opens that architecture. It is a study model, not an operating plant.
      </p>

      <div className="proto-layout">
        <div
          className="stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="stage-inner" style={{ transform: `rotateY(${rot}deg)` }}>
            {LAYERS.map((layer) => (
              <div
                key={layer.id}
                className={`proto-layer ${solo && solo !== layer.id ? "is-dim" : ""}`}
                style={{ transform: `translateY(${(explode / 100) * OFFSETS[layer.id]}px)` }}
              >
                <LayerArt id={layer.id} />
              </div>
            ))}
          </div>
        </div>

        <div className="proto-controls">
          <label>
            <span>Separation</span>
            <span>{explode}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={explode}
              onChange={(event) => setExplode(Number(event.target.value))}
            />
          </label>
          <div className="proto-actions">
            <button type="button" onClick={() => setRot((value) => value - 18)}>
              Rotate left
            </button>
            <button type="button" onClick={() => setRot((value) => value + 18)}>
              Rotate right
            </button>
            <button type="button" onClick={resetView}>
              Reset the view
            </button>
          </div>
          <ul>
            {LAYERS.map((layer) => (
              <li key={layer.id}>
                <button
                  type="button"
                  className={solo === layer.id ? "is-active" : ""}
                  aria-pressed={solo === layer.id}
                  onClick={() => setSolo((current) => (current === layer.id ? null : layer.id))}
                >
                  {layer.name}
                </button>
              </li>
            ))}
          </ul>
          <p>{active ? active.text : "Select a layer to read its role in the model. Select it again to show every layer."}</p>
        </div>
      </div>
    </section>
  );
}

function LayerArt({ id }) {
  return <div className={`study-plate plate-${id}`} aria-hidden="true" />;
}
