import { useEffect, useRef, useState } from "react";
import { startLabMusic } from "./labMusic.js";
import { OrganBoard } from "./OrganBoard.jsx";
import { CrisisPanel, useCrisisState } from "./ExhibitExtras.jsx";
import { Roadmap } from "../nabd/Roadmap.jsx";
import { sitePath } from "../nabd/site.js";
import { mountMuseum } from "./museum.js";
import "./bodyhall.css";

const FIGURES = [
  {
    id: "brain",
    file: "figure-brain.jpg",
    name: "Brain",
    title: "OMAN NEXUS",
    inspiration: "The brain compares many signals, then can change its decision.",
    principle: "Sense, compare, decide, revise.",
    oman: "OMAN NEXUS coordinates a limited response when heat, water and energy arrive together.",
  },
  {
    id: "lungs",
    file: "figure-lungs.jpg",
    name: "Lungs",
    title: "AIRFLOW",
    inspiration: "Lungs exchange across a large surface while air keeps moving.",
    principle: "Flow delivers particles. The filter decides what is caught.",
    oman: "AIRFLOW is a fan-and-filter concept for dust and indoor air.",
  },
  {
    id: "heart",
    file: "figure-heart.jpg",
    name: "Heart",
    title: "NABD HEART — CLEAN ENERGY CIRCULATION",
    inspiration: "The heart keeps a coordinated flow. Local vessels decide what each tissue receives.",
    principle: "Measure the kilowatts, serve the building, share only real surplus, then store what the battery can take.",
    oman: "Four modelled facilities. Sharing moves electricity. It does not create any.",
  },
  {
    id: "skin",
    file: "figure-skin.jpg",
    name: "Skin",
    title: "THERMOSKIN",
    inspiration: "Skin changes how much heat the body gains as the sun changes.",
    principle: "Shade, insulation and ventilation change heat gain.",
    oman: "THERMOSKIN is an outer layer compared with a fixed shell.",
  },
  {
    id: "liver",
    file: "figure-liver.jpg",
    name: "Liver",
    title: "REGENCORE",
    inspiration: "The liver tells a mixture apart and changes what it can.",
    principle: "Sort first. A wrong bin contaminates the useful stream.",
    oman: "REGENCORE sorts recovery, organic, hazardous and a true remainder.",
  },
  {
    id: "kidneys",
    file: "figure-kidneys.jpg",
    name: "Kidneys",
    title: "NEOFLOW",
    inspiration: "Kidneys filter, take back what is useful, and leave a smaller remainder.",
    principle: "More contact recovers more. Flow that is too fast loses quality.",
    oman: "NEOFLOW is a filter train for water that has already been used.",
  },
  {
    id: "digestive",
    file: "figure-digestive.jpg",
    name: "Digestive system",
    title: "NOURISH LOOP",
    inspiration: "Digestion absorbs what can still be used before the rest is discarded.",
    principle: "Storage and a deadline decide what is rescued.",
    oman: "NOURISH LOOP holds surplus meals and moves them before they expire.",
  },
  {
    id: "skeleton",
    file: "figure-skeleton.jpg",
    name: "Skeleton",
    title: "RESILIENT OMAN",
    inspiration: "Bone shares load so one point is not asked to hold the body.",
    principle: "Water follows low ground. Sharing moves load off the worst point.",
    oman: "RESILIENT OMAN compares plot height, drainage and a shared path.",
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

export default function BodyHall() {
  const canvasRef = useRef(null);
  const pickRef = useRef(() => {});
  const [openId, setOpenId] = useState(null);
  const [crisis, setCrisis] = useState(false);
  const shared = useCrisisState();
  const figure = FIGURES.find((item) => item.id === openId) ?? null;

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
      if (event.key === "Escape") {
      setOpenId(null);
      setCrisis(false);
    }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function approach(id) {
    setCrisis(false);
    setOpenId(id);
  }
  pickRef.current = approach;

  return (
    <div className={`hul${figure || crisis ? " is-approached" : ""}`}>
      <nav className="hul-nav">
        <a href={sitePath("/")}>← Nabd</a>
        <Roadmap />
        <span className="hul-nav-end">
          <LabMusic />
          <button type="button" className="hul-text" onClick={() => { setOpenId(null); setCrisis(true); }}>Crisis</button>
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
            <OrganBoard id={figure.id} name={figure.name} crisis={shared} onCrisis={() => { setOpenId(null); setCrisis(true); }} />
          </div>
        </section>
      )}
      {crisis && !figure && (
        <section className="hul-approach is-crisis" aria-label="NABD crisis challenge">
          <button type="button" className="hul-back-link" onClick={() => setCrisis(false)}>Return to the hall</button>
          <div className="hul-approach-board">
            <CrisisPanel crisis={shared} />
          </div>
        </section>
      )}
    </div>
  );
}
