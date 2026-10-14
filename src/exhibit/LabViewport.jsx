import { useEffect, useRef, useState } from "react";
import { mountLab } from "./labKit.js";

const DEFAULT_VIEWS = [
  ["overview", "Overview"],
  ["detail", "Close"],
  ["side", "Side"],
];

export function Face({ kicker, value, unit, detail }) {
  return (
    <div className="lab-face">
      <p>{kicker}</p>
      <strong>{value}{unit ? <small>{unit}</small> : null}</strong>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}

export function LabViewport({ kind, state, note, onAction, hint, views = DEFAULT_VIEWS, meters = null }) {
  const host = useRef(null);
  const lab = useRef(null);
  const stateRef = useRef(state);
  const actionRef = useRef(onAction);
  const [view, setView] = useState("overview");
  const [pointer, setPointer] = useState("");
  const [live, setLive] = useState("");
  const [log, setLog] = useState([]);
  const viewRef = useRef("overview");
  stateRef.current = state;
  actionRef.current = onAction;
  viewRef.current = view;

  useEffect(() => {
    const node = host.current;
    const onHover = (event) => setPointer(event.detail || "");
    const onDrag = (event) => setLive(event.detail || "");
    const onDragEnd = (event) => {
      const text = event.detail || "";
      setLive("");
      if (!text) return;
      setLog((current) => [{ id: `${Date.now()}`, text }, ...current].slice(0, 4));
    };
    node.addEventListener("lab-hover", onHover);
    node.addEventListener("lab-drag", onDrag);
    node.addEventListener("lab-drag-end", onDragEnd);
    const mounted = mountLab(node, kind, {
      getState: () => ({ ...stateRef.current, camera: viewRef.current }),
      onAction: (action) => actionRef.current?.(action),
    });
    lab.current = mounted;
    return () => {
      node.removeEventListener("lab-hover", onHover);
      node.removeEventListener("lab-drag", onDrag);
      node.removeEventListener("lab-drag-end", onDragEnd);
      mounted.dispose();
      lab.current = null;
    };
  }, [kind]);

  return (
    <div className="lab-view">
      <div className="lab-viewport">
        <div ref={host} className="lab-viewport-host" />
        <p className={`lab-bench${live ? " is-live" : ""}`}>{live || pointer || hint || "Drag a marked part up or down. Drag empty space to look around."}</p>
        <div className="lab-views" role="group" aria-label="Camera">
          {views.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => {
                setView(id);
                lab.current?.setView(id);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {meters?.length ? (
        <dl className="lab-meters">
          {meters.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {note ? <p className="lab-caption">{note}</p> : null}
      {log.length ? (
        <ol className="lab-log">
          {log.map((item) => <li key={item.id}>{item.text}</li>)}
        </ol>
      ) : null}
    </div>
  );
}
