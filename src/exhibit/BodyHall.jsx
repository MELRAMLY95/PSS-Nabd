import { useEffect, useMemo, useRef, useState } from "react";
import { startLabMusic } from "./labMusic.js";
import { ORGANS as LAB_ORGANS } from "../lab/content.js";
import { Workbench } from "../lab/Exhibit.jsx";
import { INITIAL, simulate } from "../lab/engine.js";
import { Roadmap } from "../nabd/Roadmap.jsx";
import { sitePath } from "../nabd/site.js";
import { mountMuseum } from "./museum.js";
import "./bodyhall.css";

const FIGURES = [
  {
    id: "brain",
    file: "figure-brain.jpg",
    name: "Brain",
    title: "Environmental intelligence",
    inspiration: "The brain senses, processes, makes decisions and adapts.",
    principle: "Sense, process, decide, respond.",
    oman: "Monitoring that can change a decision when heat, water and energy arrive together.",
  },
  {
    id: "lungs",
    file: "figure-lungs.jpg",
    name: "Lungs",
    title: "Air exchange and purification",
    inspiration: "Lungs filter, exchange gases and clear harmful particles.",
    principle: "A large surface, selective exchange, filtration.",
    oman: "Exchange for dust, humidity and fouled air.",
  },
  {
    id: "heart",
    file: "figure-heart.jpg",
    name: "Heart",
    title: "Clean energy circulation",
    inspiration: "The heart pumps and keeps resources moving.",
    principle: "Continuous flow, adaptive distribution, storage.",
    oman: "Clean energy sent toward the place under load.",
  },
  {
    id: "skin",
    file: "figure-skin.jpg",
    name: "Skin",
    title: "Adaptive buildings",
    inspiration: "Skin protects, regulates heat and adapts.",
    principle: "Respond, regulate, protect.",
    oman: "An envelope that closes against the sun, then eases.",
  },
  {
    id: "liver",
    file: "figure-liver.jpg",
    name: "Liver",
    title: "Zero waste and resource recovery",
    inspiration: "The liver transforms, detoxifies and recovers what is useful.",
    principle: "Process, separate, recover.",
    oman: "A mixed stream split into recovery and a named remainder.",
  },
  {
    id: "kidneys",
    file: "figure-kidneys.jpg",
    name: "Kidneys",
    title: "Water recovery",
    inspiration: "Kidneys filter, reabsorb and recover what is needed.",
    principle: "Selective filtration, recovery, a smaller remainder.",
    oman: "Used water split so more of what is useful can return.",
  },
  {
    id: "digestive",
    file: "figure-digestive.jpg",
    name: "Digestive system",
    title: "Food and circularity",
    inspiration: "Digestion breaks material down, absorbs and recovers.",
    principle: "Input, process, absorb, recover.",
    oman: "A return path for food and organic material.",
  },
  {
    id: "skeleton",
    file: "figure-skeleton.jpg",
    name: "Skeleton",
    title: "Resilient infrastructure",
    inspiration: "The skeleton gives structure, flexibility and resilience.",
    principle: "Distribute the load, adapt, repair.",
    oman: "Infrastructure that shares stress when heat and demand arrive together.",
  },
];

function LabMusic() {
  const [on, setOn] = useState(false);
  const stopRef = useRef(null);

  useEffect(() => () => stopRef.current?.(), []);

  function toggle() {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
      setOn(false);
      return;
    }
    stopRef.current = startLabMusic();
    setOn(true);
  }

  return (
    <button type="button" className={`hul-music${on ? " is-on" : ""}`} aria-pressed={on} onClick={toggle}>
      {on ? "Music on" : "Music off"}
    </button>
  );
}

function Mark({ id }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };
  if (id === "lungs") return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M12 4v6M8 10c-3 1-4 6-2 9 2-2 4-2 6-1M16 10c3 1 4 6 2 9-2-2-4-2-6-1" /></svg>;
  if (id === "heart") return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" /></svg>;
  if (id === "skin") return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M5 8h14M5 12h14M5 16h14M7 5v14M17 5v14" /></svg>;
  if (id === "liver") return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M5 14c2-6 6-8 10-6 3 1 4 4 4 6-3 3-8 4-14 0z" /></svg>;
  if (id === "kidneys") return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M9 6c-3 2-3 10 0 12 2-2 2-8 0-12zM15 6c3 2 3 10 0 12-2-2-2-8 0-12zM12 7v10" /></svg>;
  if (id === "digestive") return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M9 5c4 0 5 3 3 5s-4 2-2 5 4 4 4 6" /></svg>;
  if (id === "skeleton") return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M12 4v16M8 8h8M8 12h8M7 18c2-2 8-2 10 0" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M8 14c1-4 3-6 4-6s3 2 4 6M8 14c1 2 7 2 8 0M9 11h.1M15 11h.1" /></svg>;
}

export default function BodyHall() {
  const canvasRef = useRef(null);
  const pickRef = useRef(() => {});
  const [openId, setOpenId] = useState(null);
  const [local, setLocal] = useState(() => ({ ...INITIAL, systems: { ...INITIAL.systems } }));
  const figure = FIGURES.find((item) => item.id === openId) ?? null;
  const controls = LAB_ORGANS.find((item) => item.id === openId)?.controls ?? [];
  const result = useMemo(() => simulate(local), [local]);
  const bare = useMemo(() => simulate({ ...local, systems: { ...INITIAL.systems } }), [local]);

  useEffect(() => {
    const previous = document.title;
    document.title = "The Human Body: Nature's Innovation Lab";
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    return mountMuseum(canvas, {
      figures: FIGURES,
      onPick: (id) => pickRef.current(id),
    });
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function approach(id) {
    setOpenId(id);
    setLocal({ ...INITIAL, systems: { ...INITIAL.systems, [id]: true } });
  }
  pickRef.current = approach;

  return (
    <div className={`hul${figure ? " is-approached" : ""}`}>
      <nav className="hul-nav">
        <a href={sitePath("/")}>← Nabd</a>
        <Roadmap />
        <span className="hul-nav-end">
          <LabMusic />
          <a href={sitePath("/experience")}>Become the brain</a>
        </span>
      </nav>
      <header className="hul-sign">
        <p>The body already keeps heat, water and waste in balance. We study those methods, and build them for Oman.</p>
        <div>
          <h1>The Human Body<span>Nature’s Innovation Lab</span></h1>
          <p className="hul-sub">A living system, carried into 2040.</p>
        </div>
        <ol>
          <li><span>01</span> <b>Observe</b> <em>how the system works</em></li>
          <li><span>02</span> <b>Extract</b> <em>the principle worth keeping</em></li>
          <li><span>03</span> <b>Innovate</b> <em>an engineered response</em></li>
          <li><span>04</span> <b>Apply</b> <em>where Oman is under strain</em></li>
        </ol>
      </header>
      <div className="hul-stage">
        <canvas ref={canvasRef} className="hul-gl" aria-label="The Human Body: Nature's Innovation Lab. Choose an organ." />
        <button type="button" className="hul-turn hul-turn-prev" aria-label="Previous specimen">‹</button>
        <button type="button" className="hul-turn hul-turn-next" aria-label="Next specimen">›</button>
        <p className="hul-phone-caption"><b></b><span></span></p>
      </div>
      {figure && (
        <section className="hul-approach" aria-label={`${figure.name} simulation`}>
          <button type="button" className="hul-back-link" onClick={() => setOpenId(null)}>Return to the hall</button>
          <div className="hul-approach-specimen">
            <img src={`${import.meta.env.BASE_URL}img/figures/${figure.file}`} alt="" />
            <span className="hul-stand" />
          </div>
          <div className="hul-approach-board">
            <p className="hul-kicker"><Mark id={figure.id} /> {figure.name}</p>
            <h2>{figure.title}</h2>
            <p className="hul-label">Biological inspiration</p>
            <p className="hul-lead">{figure.inspiration}</p>
            <p className="hul-label">Principle</p>
            <p>{figure.principle}</p>
            <p className="hul-label">Oman solution</p>
            <p>{figure.oman}</p>
            <p className="hul-state">Model state · {result.state}</p>
            <Workbench
              organId={figure.id}
              controls={controls}
              result={result}
              bare={bare}
              local={local}
              onChange={(key, value) => setLocal((state) => ({ ...state, [key]: value }))}
              onToggle={() => setLocal((state) => ({ ...state, systems: { ...state.systems, [figure.id]: !state.systems[figure.id] } }))}
            />
          </div>
        </section>
      )}
    </div>
  );
}
