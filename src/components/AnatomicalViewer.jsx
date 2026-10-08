import { useEffect, useRef, useState } from "react";
import { ORGANS, PHASES, SYSTEM_MAP } from "../data/content.js";
import { DECISION_SCENARIOS } from "../simulation/decisions.js";
import { createAnatomyViewer } from "../anatomy/viewer.js";
import { useSystem } from "../simulation/SystemContext.jsx";
import { NephronStudy } from "./NephronStudy.jsx";

const TOGGLES = [
  ["body", "Skin"],
  ["skeleton", "Skeleton"],
  ["organs", "Organs"],
  ["vascular", "Vascular"],
];

const STRESS_FOR = {
  kidneys: "water",
  skin: "heat",
  heart: "energy",
  lungs: "air",
  liver: "waste",
  digestive: "food",
  skeleton: "infrastructure",
  brain: "heat",
};

const LINK = {
  brain: "Heat, water, air, and waste all report here before a response.",
  heart: "Water, energy, and materials move through the vessels.",
  lungs: "Air quality and emissions change what the circulation must carry.",
  kidneys: "Water → heat → energy → resilience.",
  liver: "Waste → process → recover → return to circulation.",
  digestive: "Input → absorb → recover → output.",
  skin: "Heat raises cooling, then water, then energy.",
  skeleton: "If the structure weakens, every flow loses its path.",
};

function layerOn(layers, key) {
  if (!layers) return false;
  if (key === "body") return layers.body > 0.35;
  if (key === "skeleton") return layers.skeleton > 0.5;
  if (key === "organs") return layers.organs > 0.5;
  if (key === "vascular") return layers.vascular > 0.5;
  return layers.system > 0;
}

export function AnatomicalViewer({ bare = false, orchestrated = false, onReady, onStatus }) {
  const canvasRef = useRef(null);
  const apiRef = useRef(null);
  const readyRef = useRef(onReady);
  const statusRef = useRef(onStatus);
  const focused = useRef(false);
  readyRef.current = onReady;
  statusRef.current = onStatus;
  const { organId, setOrganId, sim, decision, lastEvent, openStress } = useSystem();
  const [status, setStatus] = useState(orchestrated ? "Initialising the system" : "Preparing the anatomical model");
  const [hover, setHover] = useState(null);
  const [layers, setLayers] = useState(null);
  const [nephron, setNephron] = useState(false);
  const [nephronStep, setNephronStep] = useState(0);
  const organ = ORGANS.find((item) => item.id === organId) ?? ORGANS[0];
  const hoverOrgan = ORGANS.find((item) => item.id === hover?.organ);
  const phase = PHASES[sim.phase];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const api = createAnatomyViewer(canvas, {
      onStatus: (message) => {
        setStatus(message);
        statusRef.current?.(message);
      },
      onLayers: (next) => setLayers({ ...next }),
      onHover: (info) => {
        if (info?.select && info.organ) {
          focused.current = true;
          setOrganId(info.organ);
          setHover(null);
          if (info.organ === "kidneys") setNephron(false);
          return;
        }
        setHover(info);
      },
    });
    apiRef.current = api;
    readyRef.current?.(api);
    return () => {
      readyRef.current?.(null);
      api.dispose();
      apiRef.current = null;
    };
  }, [setOrganId]);

  useEffect(() => {
    apiRef.current?.setPhase(decision.events.length ? decision.phase : sim.phase);
  }, [decision.events.length, decision.phase, sim.phase]);

  useEffect(() => {
    apiRef.current?.setCondition(decision);
  }, [decision]);

  useEffect(() => {
    if (orchestrated || !lastEvent) return;
    apiRef.current?.showPath(lastEvent.chain, lastEvent.steps);
  }, [lastEvent, orchestrated]);

  useEffect(() => {
    if (orchestrated) return;
    const shouldFocus = focused.current;
    focused.current = true;
    apiRef.current?.setOrgan(organId, { focus: shouldFocus });
  }, [organId, orchestrated]);

  const toggleLayer = (key) => {
    const on = layerOn(layers, key);
    if (key === "body") apiRef.current?.setLayers({ body: on ? 0 : 1 });
    else apiRef.current?.setLayers({ [key]: on ? 0 : 1 });
  };

  return (
    <div className="study-view">
      <canvas ref={canvasRef} aria-label="Environmental system visualised through a human body" />
      {!bare && <div className="anatomy-bar">
        <button type="button" onClick={() => apiRef.current?.nudge(-1)}>Rotate</button>
        <button type="button" onClick={() => apiRef.current?.zoom(0.82)}>Zoom</button>
        <button type="button" onClick={() => apiRef.current?.zoom(1.22)}>Zoom out</button>
        <button type="button" onClick={() => apiRef.current?.reset()}>Reset</button>
        {TOGGLES.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={layerOn(layers, key)}
            onClick={() => toggleLayer(key)}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={() => apiRef.current?.playSequence()}>Reveal</button>
        {layers?.mode === "system" && (
          <button type="button" onClick={() => apiRef.current?.playChain()}>Run the response</button>
        )}
      </div>}
      {!bare && <div className="mode-switch" role="group" aria-label="How to read the body">
        {[
          ["anatomy", "Anatomy"],
          ["environment", "Environment"],
          ["system", "System"],
          ["decision", "Decision"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={(layers?.mode || "anatomy") === id}
            onClick={() => apiRef.current?.setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>}
      {!bare && layers?.map && (
        <div className="system-map-wrap">
          <p>One body. One system. Every decision matters.</p>
          <ul className="system-map">
            {SYSTEM_MAP.map(([name, role]) => (
              <li key={name}>
                <span>{name}</span>
                <span>{role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!bare && (layers?.mode === "decision" || layers?.mode === "system") && (
        <p className="resilience-float">
          Resilience <strong>{Math.round(decision.resilience)}</strong>
        </p>
      )}

      {status && <p className="anatomy-status">{status}</p>}

      {hoverOrgan && hover && (
        <div className="anatomy-label" style={{ left: Math.min(hover.x + 16, 420), top: Math.max(hover.y - 12, 72) }}>
          <strong>{hoverOrgan.environment}</strong>
          <span>Shown on the body as the {hoverOrgan.name.toLowerCase()}</span>
        </div>
      )}

      {!bare && <aside className="anatomy-panel" aria-live="polite">
        <p className="anatomy-kicker">{phase.label}</p>
        <h2>{organ.name}</h2>
        <dl>
          <div>
            <dt>Biology</dt>
            <dd>{organ.biological}</dd>
          </div>
          <div>
            <dt>Environment</dt>
            <dd>{organ.environment}</dd>
          </div>
          <div>
            <dt>Future system</dt>
            <dd>{organ.future}</dd>
          </div>
        </dl>
        <p className="organ-link">{LINK[organ.id]}</p>
        <button
          type="button"
          onClick={() => {
            focused.current = true;
            apiRef.current?.explore(organ.id);
          }}
        >
          Explore
        </button>
        {STRESS_FOR[organ.id] && (
          <button type="button" onClick={() => openStress(STRESS_FOR[organ.id])}>
            {organ.id === "brain"
              ? "Send a heat warning"
              : `Simulate ${DECISION_SCENARIOS.find((item) => item.id === STRESS_FOR[organ.id])?.title ?? "stress"}`}
          </button>
        )}
        {organ.id === "kidneys" && (
          <button
            type="button"
            onClick={() => {
              setNephron(true);
              setNephronStep(0);
              apiRef.current?.focus("kidneys");
            }}
          >
            Open the nephron study
          </button>
        )}
        {organ.id === "heart" && (
          <button type="button" onClick={() => apiRef.current?.setLayers({ vascular: 1, system: 1, organs: 1, body: 0.08 })}>
            Show circulation
          </button>
        )}
        {organ.id === "lungs" && (
          <button type="button" onClick={() => apiRef.current?.setLayers({ organs: 1, system: 1, body: 0.08 })}>
            Show airflow
          </button>
        )}
        <p className="anatomy-credit">Z-Anatomy and BodyParts3D. CC BY-SA. Not a clinical image.</p>
      </aside>}

      {nephron && organ.id === "kidneys" && (
        <NephronStudy step={nephronStep} onStep={setNephronStep} onClose={() => setNephron(false)} />
      )}
    </div>
  );
}
