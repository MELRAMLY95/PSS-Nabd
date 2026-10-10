import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { currentRoute, sitePath } from "./site.js";

const STOPS = [
  {
    id: "opening",
    room: "Read",
    title: "The opening",
    text: "Read the question. The two links under it are the game and the lab.",
    href: sitePath("/"),
    label: "Back to the opening",
  },
  {
    id: "concept",
    room: "Read",
    title: "The idea",
    text: "Press sense, decide, distribute, recover and adapt.",
    href: `${sitePath("/")}#concept`,
    label: "Open the idea",
  },
  {
    id: "connected",
    room: "Read",
    title: "The chain",
    text: "Let it play, or press an organ on the figure to jump.",
    href: `${sitePath("/")}#connected`,
    label: "Follow the chain",
  },
  {
    id: "health",
    room: "Read",
    title: "System health",
    text: "Press a stage. The body brightens or dims. This is not a score.",
    href: `${sitePath("/")}#health`,
    label: "See the stages",
  },
  {
    id: "lab",
    room: "Study",
    title: "The body lab",
    text: "Click a glass case. Start with the heart, move the controls, then return to the hall.",
    href: sitePath("/body"),
    label: "Enter the lab",
  },
  {
    id: "game",
    room: "Decide",
    title: "Become the brain",
    text: "Four rounds. Rest on a choice and watch the body, then commit. Play alone or as a panel.",
    href: sitePath("/experience"),
    label: "Play the game",
  },
  {
    id: "vision",
    room: "Close",
    title: "Vision 2040",
    text: "Read the six aims last, after the lab and the game.",
    href: `${sitePath("/")}#vision`,
    label: "Read the aims",
  },
];

const NOTES = {
  opening: "Stay on this page and read downward. The story is the design brief.",
  concept: "Each word is one job a living system does, and the reason an invention is built that way.",
  connected: "One water problem moves through the whole body. Pause the sequence if you want to stay on a step.",
  health: "Good decisions brighten the body. Poor ones dim it. Nothing here is a pass or a fail.",
  lab: "Each case is biology, then a principle, then an Oman idea. The heart powers the other inventions. Kidneys are water. The liver is waste. Skin is the building envelope.",
  game: "Water in 2028, energy in 2032, waste in 2036, then the 2040 crisis. One choice each round.",
  vision: "You have reached the close. The lab and the game are where the ideas get used.",
};

const NEXT = {
  opening: "concept",
  concept: "connected",
  connected: "health",
  health: "lab",
  lab: "game",
  game: "vision",
  vision: "game",
};

function locate() {
  const route = currentRoute();
  if (route === "/body") return "lab";
  if (route === "/experience") return "game";
  const line = window.innerHeight * 0.42;
  for (const id of ["vision", "health", "connected", "concept"]) {
    const node = document.getElementById(id);
    if (node && node.getBoundingClientRect().top <= line) return id;
  }
  return "opening";
}

export function Roadmap() {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [here, setHere] = useState("opening");

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
    const next = new URL(href, window.location.href);
    const same = next.pathname.replace(/\/$/, "") === window.location.pathname.replace(/\/$/, "");
    if (!same) {
      window.location.assign(href);
      return;
    }
    window.history.pushState(null, "", href);
    const id = next.hash.slice(1);
    if (!id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const node = document.getElementById(id);
    if (!node) return;
    const header = document.querySelector("header");
    const offset = header ? header.getBoundingClientRect().height + 16 : 0;
    const top = node.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }

  const current = STOPS.find((stop) => stop.id === here) ?? STOPS[0];
  const upcoming = STOPS.find((stop) => stop.id === NEXT[here]) ?? STOPS[1];
  const rooms = ["Read", "Study", "Decide", "Close"];

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
            <h2 id={titleId}>Walk Nabd in order</h2>
          </div>
          <button type="button" className="nabd-map-close" onClick={() => setOpen(false)}>Close</button>
        </div>
        <p className="nabd-map-lead">Three rooms. The story explains the system, the lab shows where each idea comes from, and the game is where you run it.</p>
        <div className="nabd-map-now">
          <p className="nabd-map-kicker">You are here</p>
          <strong>{current.title}</strong>
          <span>{NOTES[here]}</span>
        </div>
        <a className="nabd-map-next" href={upcoming.href} onClick={(event) => go(event, upcoming.href)}>
          {here === "vision" ? upcoming.label : `Next — ${upcoming.title}`}
        </a>
        {rooms.map((room) => (
          <section key={room}>
            <h3 className="nabd-map-room">{room}</h3>
            <ol className="nabd-map-list">
              {STOPS.filter((stop) => stop.room === room).map((stop) => {
                const index = STOPS.findIndex((item) => item.id === stop.id);
                return (
                  <li key={stop.id} className={stop.id === here ? "is-here" : undefined}>
                    <a href={stop.href} aria-current={stop.id === here ? "true" : undefined} onClick={(event) => go(event, stop.href)}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span>
                        <strong>{stop.title}</strong>
                        <em>{stop.text}</em>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </dialog>
  );

  return (
    <>
      <button
        type="button"
        className="nabd-map-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setHere(locate());
          setOpen(true);
        }}
      >
        Road map
      </button>
      {createPortal(guide, document.body)}
    </>
  );
}
