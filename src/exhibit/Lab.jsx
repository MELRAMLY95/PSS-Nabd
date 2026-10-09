import { useEffect, useState } from "react";
import { INITIAL } from "../lab/engine.js";
import { STATIONS } from "./copy.js";
import { Hall } from "./Hall.jsx";
import { Station } from "./Station.jsx";
import { Build, Oman, Prototypes, Research } from "./Wings.jsx";
import "./exhibit.css";

const NAV = [
  ["hall", "Lab"],
  ["systems", "Biological systems"],
  ["research", "Innovation lab"],
  ["build", "Simulations"],
  ["oman", "Oman 2040"],
  ["prototypes", "Prototypes"],
];

function freshBench(id) {
  return { ...INITIAL, systems: { ...INITIAL.systems, [id]: true } };
}

export default function Lab() {
  const [entered, setEntered] = useState(false);
  const [arrivalGone, setArrivalGone] = useState(false);
  const [wing, setWing] = useState("hall");
  const [stationId, setStationId] = useState(null);
  const [mode, setMode] = useState("biology");
  const [bench, setBench] = useState(() => freshBench("kidneys"));
  const station = STATIONS.find((item) => item.id === stationId) ?? null;
  const inHall = wing === "hall" || wing === "systems";

  useEffect(() => {
    document.title = "Nature's Innovation Lab";
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (stationId) setStationId(null);
      else if (wing !== "hall") setWing("hall");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stationId, wing]);

  function enter() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEntered(true);
    window.setTimeout(() => setArrivalGone(true), reduce ? 0 : 1100);
  }

  function openStation(id) {
    setStationId(id);
    setMode("biology");
    setWing("hall");
    setBench(freshBench(id));
  }

  return (
    <div className={`nil${entered && inHall ? " is-hall" : ""}`}>
      <div className="nil-room" aria-hidden="true">
        <div className="nil-horizon" />
      </div>
      {entered && (
        <>
          <header className="nil-bar">
            <button type="button" className="nil-mark" onClick={() => { setWing("hall"); setStationId(null); }}>
              <span>Nature’s</span>
              <b>Innovation Lab</b>
            </button>
            <nav aria-label="Facility">
              {NAV.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-current={((id === "hall" || id === "systems") ? inHall && !stationId && wing === id : wing === id) ? "true" : undefined}
                  onClick={() => {
                    setWing(id === "systems" ? "systems" : id);
                    if (id !== "hall" && id !== "systems") setStationId(null);
                    if (id === "hall") setStationId(null);
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
          </header>
          {inHall && (
            <main className="nil-stage">
              <Hall station={stationId} mode={mode} onPick={openStation} />
              {!station && (
                <div className="nil-index nil-float">
                  {STATIONS.map((item) => (
                    <button key={item.id} type="button" aria-pressed={item.id === stationId} onClick={() => openStation(item.id)}>
                      <span>{item.index}</span>{item.name}
                    </button>
                  ))}
                </div>
              )}
              {station && (
                <Station station={station} mode={mode} onMode={setMode} bench={bench} onBench={setBench} onClose={() => setStationId(null)} />
              )}
              {!station && (
                <p className="nil-invite">Approach a system. The organ is the teacher. The invention is the work.</p>
              )}
            </main>
          )}
          {wing === "research" && <Research onOpen={openStation} />}
          {wing === "build" && <Build />}
          {wing === "oman" && <Oman onOpen={openStation} />}
          {wing === "prototypes" && <Prototypes onOpen={openStation} />}
        </>
      )}
      {!arrivalGone && (
        <section className={`nil-arrive${entered ? " is-out" : ""}`}>
          <img src={`${import.meta.env.BASE_URL}img/anatomy-body.png`} alt="" className="nil-silhouette" />
          <div className="nil-arrive-copy">
            <p className="nil-kicker">A biomimicry research facility</p>
            <h1>Nature’s<br />Innovation Lab</h1>
            <p>Where biology becomes inspiration for the future.</p>
            <button type="button" className="nil-enter" onClick={enter}>Explore the lab</button>
          </div>
        </section>
      )}
    </div>
  );
}
