import { useEffect, useRef, useState } from "react";
import { LabMusic } from "./LabMusic.jsx";
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
    title: "The intelligence behind Oman 2040",
    inspiration: "The brain reads signals and coordinates a response.",
    principle: "A threshold can deploy shade or start a pump.",
    oman: "The controller is a rule on the page, not a live board.",
  },
  {
    id: "lungs",
    file: "figure-lungs.jpg",
    name: "Lungs",
    title: "Breathing cleaner air in Oman 2040",
    inspiration: "The lungs exchange gases while air keeps moving.",
    principle: "A filter can catch only particles that reach it.",
    oman: "The paper ribbon shows airflow, not a pollution reading.",
  },
  {
    id: "heart",
    file: "figure-heart.jpg",
    name: "Heart",
    title: "How Oman 2040 can circulate clean energy",
    inspiration: "The heart moves a limited supply to places that need it at different moments.",
    principle: "Share only energy the roofs and the battery already hold.",
    oman: "District LEDs indicate a path. They are not a solar measurement.",
  },
  {
    id: "skin",
    file: "figure-skin.jpg",
    name: "Skin",
    title: "Protecting Oman from extreme heat",
    inspiration: "Skin changes how much heat the body gains.",
    principle: "External shade acts before the heat is inside.",
    oman: "The indoor figure is a model index, not a thermometer.",
  },
  {
    id: "liver",
    file: "figure-liver.jpg",
    name: "Liver",
    title: "Turning waste into resources",
    inspiration: "The liver processes a mixed input. It does not sort rubbish.",
    principle: "Sort first. A wrong bin contaminates the useful stream.",
    oman: "Three compartments: recyclable, organic, and general waste.",
  },
  {
    id: "kidneys",
    file: "figure-kidneys.jpg",
    name: "Kidneys",
    title: "Water conservation and smart irrigation",
    inspiration: "Kidneys recover what is still useful and let a remainder go.",
    principle: "Do not pump more than the reservoir holds.",
    oman: "Collected water in this model is not drinking water.",
  },
  {
    id: "digestive",
    file: "figure-digestive.jpg",
    name: "Digestive system",
    title: "Growing food for Oman 2040",
    inspiration: "Digestion processes food. It does not grow it.",
    principle: "A crop fits only the water and salinity it can use.",
    oman: "The bed is a demonstration, not a harvest forecast.",
  },
  {
    id: "skeleton",
    file: "figure-skeleton.jpg",
    name: "Skeleton",
    title: "Building the framework of Oman 2040",
    inspiration: "The skeleton shares load and can be reached for repair.",
    principle: "A closed road drops out of the path.",
    oman: "Costs are model units, not a project estimate.",
  },
];

export default function BodyHall() {
  const canvasRef = useRef(null);
  const pickRef = useRef(() => {});
  const [openId, setOpenId] = useState(null);
  const [seen, setSeen] = useState([]);
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
      if (event.target instanceof Element && event.target.closest("input, textarea, select")) return;
      if (event.key === "Escape") {
        setOpenId(null);
        setCrisis(false);
      }
      if (!openId) return;
      const index = FIGURES.findIndex((item) => item.id === openId);
      if (event.key === "ArrowRight") approach(FIGURES[(index + 1) % FIGURES.length].id);
      if (event.key === "ArrowLeft") approach(FIGURES[(index - 1 + FIGURES.length) % FIGURES.length].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  function approach(id) {
    setCrisis(false);
    setOpenId(id);
    setSeen((current) => (current.includes(id) ? current : [...current, id]));
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
        <section className="hul-approach" aria-label={`${figure.name} board`}>
          <button type="button" className="hul-back-link" onClick={() => setOpenId(null)}>Return to the hall</button>
          <div className="hul-organ-nav">
            <button type="button" onClick={() => approach(FIGURES[(FIGURES.findIndex((item) => item.id === figure.id) - 1 + FIGURES.length) % FIGURES.length].id)}>Previous organ</button>
            <button type="button" onClick={() => approach(FIGURES[(FIGURES.findIndex((item) => item.id === figure.id) + 1) % FIGURES.length].id)}>Next organ</button>
          </div>
          <div className="hul-approach-specimen">
            <img src={`${import.meta.env.BASE_URL}img/figures/${figure.file}`} alt="" />
            <span className="hul-stand" />
          </div>
          <div className="hul-approach-board">
            <p className="hul-seen">Explored {seen.length} of {FIGURES.length}: {FIGURES.filter((item) => seen.includes(item.id)).map((item) => item.name).join(", ")}</p>
            <OrganBoard id={figure.id} name={figure.name} crisis={shared} />
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
