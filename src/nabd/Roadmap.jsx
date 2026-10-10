import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { sitePath } from "./site.js";

const STOPS = [
  {
    title: "The opening",
    text: "Read the question and watch the body breathe. The two links under the sentence are the two ways in: the decision game, or the body lab.",
    href: sitePath("/"),
    label: "Back to the opening",
  },
  {
    title: "The idea",
    text: "Press sense, decide, distribute, recover and adapt. Each word is one job a living system does, and the reason the invention is built that way.",
    href: `${sitePath("/")}#concept`,
    label: "Open the idea",
  },
  {
    title: "Everything is connected",
    text: "Let the sequence play, or pause it and choose a step. On the diagram, press an organ to jump to the moment it matters.",
    href: `${sitePath("/")}#connected`,
    label: "Follow the chain",
  },
  {
    title: "System health",
    text: "Press the stages. Good decisions brighten the body. Poor ones dim it. This is not a score you pass or fail.",
    href: `${sitePath("/")}#health`,
    label: "See the stages",
  },
  {
    title: "The body lab",
    text: "Click an organ in its glass case. Read the biology, the principle and the Oman idea, then move the controls. Start with the heart: it is the energy the other inventions run on. Escape, or Return to the hall, brings you back.",
    href: sitePath("/body"),
    label: "Enter the lab",
  },
  {
    title: "Become the brain",
    text: "Four decisions: water in 2028, energy in 2032, waste in 2036, then the 2040 crisis. Rest on a choice and watch the body before you commit. Play alone, or as a panel of three. One choice each round.",
    href: sitePath("/experience"),
    label: "Play the game",
  },
  {
    title: "Vision 2040",
    text: "Read the six aims after the lab and the game, so they sit on what you have already tried.",
    href: `${sitePath("/")}#vision`,
    label: "Read the aims",
  },
];

export function Roadmap() {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return undefined;
  }, [open]);

  function go(event, href) {
    event.preventDefault();
    setOpen(false);
    window.location.assign(href);
  }

  const guide = (
    <dialog
      ref={dialogRef}
      className="nabd-map"
      aria-labelledby={titleId}
      onClose={() => setOpen(false)}
      onClick={(event) => {
        if (event.target === dialogRef.current) setOpen(false);
      }}
    >
      <div className="nabd-map-scroll">
        <div className="nabd-map-head">
          <div>
            <p className="nabd-map-kicker">Guide</p>
            <h2 id={titleId}>How to get everything from Nabd</h2>
          </div>
          <button type="button" className="nabd-map-close" onClick={() => setOpen(false)}>Close</button>
        </div>
        <p className="nabd-map-lead">Follow the stops in order. The story explains the system, the lab shows where each idea comes from, and the game is where you run it.</p>
        <ol className="nabd-map-list">
          {STOPS.map((stop, index) => (
            <li key={stop.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{stop.title}</h3>
                <p>{stop.text}</p>
                <a href={stop.href} onClick={(event) => go(event, stop.href)}>{stop.label}</a>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </dialog>
  );

  return (
    <>
      <button type="button" className="nabd-map-button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        Road map
      </button>
      {createPortal(guide, document.body)}
    </>
  );
}
