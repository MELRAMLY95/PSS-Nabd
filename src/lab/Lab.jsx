import { useEffect, useMemo, useState } from "react";
import { CHAPTERS, ORGANS } from "./content.js";
import { INITIAL, simulate } from "./engine.js";
import { Exhibit } from "./Exhibit.jsx";
import { Plinth, Slider } from "./Scenes.jsx";
import { Specimen } from "./Specimen.jsx";

const SRC = `${import.meta.env.BASE_URL}img/anatomy-body.png`;
const PHOTO = `${import.meta.env.BASE_URL}img/original-prototype.png`;

function fresh(id) {
  return { ...INITIAL, hour: INITIAL.hour, systems: { ...INITIAL.systems, [id]: true } };
}

export default function Lab() {
  const [chapter, setChapter] = useState("question");
  const [organId, setOrganId] = useState(null);
  const [study, setStudy] = useState(null);
  const [model, setModel] = useState(() => structuredClone(INITIAL));
  const [plinth, setPlinth] = useState(-1);
  const [scale, setScale] = useState(0);
  const [scaleRun, setScaleRun] = useState(0);
  const [shown, setShown] = useState(0);

  const organ = ORGANS.find((item) => item.id === organId) ?? null;
  const studyResult = useMemo(() => (study ? simulate(study) : null), [study]);
  const bare = useMemo(() => (study ? simulate({ ...study, systems: { ...INITIAL.systems } }) : null), [study]);
  const systemResult = useMemo(() => simulate(model), [model]);
  const calm = useMemo(() => simulate(INITIAL), []);

  useEffect(() => {
    if (chapter !== "system") return undefined;
    const total = systemResult.chain.length;
    setShown(Math.min(1, total));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || total <= 1) {
      setShown(total);
      return undefined;
    }
    let count = 1;
    const timer = window.setInterval(() => {
      count += 1;
      setShown(count);
      if (count >= total) window.clearInterval(timer);
    }, 700);
    return () => window.clearInterval(timer);
  }, [chapter, systemResult.chain]);

  useEffect(() => {
    if (chapter !== "future") return undefined;
    setScale(0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setScale(4);
      return undefined;
    }
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setScale(step);
      if (step >= 4) window.clearInterval(timer);
    }, 1100);
    return () => window.clearInterval(timer);
  }, [chapter, scaleRun]);

  function openOrgan(id) {
    setOrganId(id);
    setStudy(fresh(id));
    setChapter("investigation");
  }

  function release() {
    setOrganId(null);
    setStudy(null);
  }

  const specimenResult = studyResult ?? (chapter === "system" ? systemResult : calm);

  return (
    <div className={`lab tone-${organ?.accent ?? "quiet"} chapter-${chapter}`}>
      <p className="mark">Living Oman 2040</p>
      <section className={`chapter ${chapter === "question" ? "is-on" : ""}`} aria-label="The question">
        <div className="question-block">
          <p className="whisper">Biomimetic innovation lab</p>
          <h1>What if Oman 2040 could think, adapt, circulate resources and heal like a human body?</h1>
          <button type="button" className="next" onClick={() => setChapter("teacher")}>Meet the teacher</button>
        </div>
      </section>

      <section className={`chapter ${chapter === "teacher" ? "is-on" : ""}`} aria-label="The teacher">
        <div className="teacher">
          <Specimen organ={null} layer="browse" result={calm} onSelect={openOrgan} />
          <div className="caption">
            <p className="whisper">The teacher</p>
            <p className="voice">The body has already solved circulation, filtration, adaptation, exchange and recovery. The inventions come after we learn how.</p>
            <button type="button" className="next" onClick={() => setChapter("investigation")}>Study how</button>
          </div>
        </div>
      </section>

      <section className={`chapter ${chapter === "investigation" ? "is-on" : ""}`} aria-label="The investigation">
        <div className={`room ${organ ? "is-exhibit" : "is-browse"}`}>
          {!organ && <Specimen organ={null} layer="browse" result={specimenResult} onSelect={openOrgan} />}
          {!organ && (
            <div className="caption invite">
              <p className="whisper">The investigation</p>
              <p className="voice">Touch a system. It becomes a small model, with a board beside it: what we took from that organ, and the invention that follows for Oman.</p>
            </div>
          )}
          {organ && (
            <Exhibit
              organ={organ}
              result={studyResult}
              bare={bare}
              local={study}
              onChange={(key, value) => setStudy((state) => ({ ...state, [key]: value }))}
              onToggle={() => setStudy((state) => ({ ...state, systems: { ...state.systems, [organ.id]: !state.systems[organ.id] } }))}
              onShare={() => setStudy((state) => ({ ...state, systems: { ...state.systems, skeleton: !state.systems.skeleton } }))}
            />
          )}
          {organ && (
            <div className="beat-bar">
              <button type="button" className="text" onClick={release}>Return to the specimen</button>
              <button type="button" className="next" onClick={() => setChapter("system")}>See them work together</button>
            </div>
          )}
        </div>
      </section>

      <section className={`chapter ${chapter === "system" ? "is-on" : ""}`} aria-label="The system">
        <div className="system-room">
          <div className="system-stage">
            <Specimen organ={null} layer="browse" result={systemResult} onSelect={openOrgan} />
            {ORGANS.map((item) => (
              <button
                key={item.id}
                type="button"
                data-id={item.id}
                className={`orbit tone-${item.accent} ${model.systems[item.id] ? "is-on" : ""}`}
                aria-pressed={model.systems[item.id]}
                onClick={() => setModel((state) => ({ ...state, systems: { ...state.systems, [item.id]: !state.systems[item.id] } }))}
              >
                <small>{item.name}</small>
                {item.invention}
              </button>
            ))}
          </div>
          <div className="system-read">
            <p className="whisper">System resilience · {systemResult.state}</p>
            <p className="state">{systemResult.state}</p>
            <ol className="chain">
              {systemResult.chain.slice(0, shown).map((line) => <li key={line}>{line}</li>)}
              {!systemResult.chain.length && <li>The day is moderate. Raise the heat, or wake a system, and watch who answers.</li>}
            </ol>
          </div>
          <div className="bench system-bench">
            {["temperature", "sun", "waterDemand", "energyDemand", "dust", "wasteMix"].map((field) => (
              <Slider key={field} field={field} value={model[field]} onChange={(key, value) => setModel((state) => ({ ...state, [key]: value }))} />
            ))}
            <button type="button" className="text" onClick={() => setModel((state) => ({ ...state, temperature: 88, sun: 84, hour: 13, energyDemand: 74, waterDemand: 80 }))}>Extreme heat</button>
            <button type="button" className="text" onClick={() => setModel(structuredClone(INITIAL))}>Reset</button>
          </div>
          <p className="fine center">The heart is the energy the other inventions run on. Recovery, exchange, the building skin and waste transformation all draw from that circulation. Every number here is a simulation assumption. The aim is past mere survival: a place that can develop quickly without putting any generation at risk.</p>
        </div>
      </section>

      <section className={`chapter ${chapter === "prototype" ? "is-on" : ""}`} aria-label="From biology to a physical prototype">
        <div className="proto">
          {plinth < 0 ? (
            <figure>
              <img src={PHOTO} alt="The first exhibition model: a human figure used to explain the project." />
              <figcaption>
                <p className="whisper">From biology to a physical prototype</p>
                <p className="voice">The figure was the first object. Each system is meant to leave it and become its own model. These next objects are planned. They are not finished machines.</p>
                <button type="button" className="next" onClick={() => setPlinth(0)}>Walk the models</button>
              </figcaption>
            </figure>
          ) : (
            <div className="proto-step">
              <Plinth organ={ORGANS[plinth]} />
              <div>
                <p className="whisper">{ORGANS[plinth].name}</p>
                <p className="voice">{ORGANS[plinth].principle}</p>
                <p className="fine">{ORGANS[plinth].concept}</p>
                <div className="proto-nav">
                  <button type="button" className="text" onClick={() => setPlinth(plinth - 1)} disabled={plinth === 0}>Previous model</button>
                  <button type="button" className="next" onClick={() => setPlinth(plinth === ORGANS.length - 1 ? -1 : plinth + 1)}>
                    {plinth === ORGANS.length - 1 ? "Return to the figure" : "Next model"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className={`chapter ${chapter === "future" ? "is-on" : ""}`} aria-label="The future">
        <div className="future">
          <img src={SRC} alt="" className="future-body" />
          {["The body", "A building", "A neighbourhood", "A city", "Oman"].map((label, index) => (
            <div key={label} className={`ring ring-${index} ${scale >= index ? "is-on" : ""}`}><span>{label}</span></div>
          ))}
          <p className={`future-line ${scale >= 4 ? "is-on" : ""}`}>The body is not Oman. The same principles have been translated outward, into systems that could serve a place.</p>
          <button type="button" className="text" onClick={() => setScaleRun((value) => value + 1)}>Play the expansion again</button>
        </div>
      </section>

      <section className={`chapter ${chapter === "close" ? "is-on" : ""}`} aria-label="Close">
        <div className="question-block">
          <p className="whisper">Biology, principle, innovation, Oman, system, future</p>
          <h1>What if Oman 2040 could think, adapt, circulate resources and heal like a human body?</h1>
          <p className="voice">Survival, and leaving enough that the next generation can also survive, is the minimum. The ambition is past that: to strive, to enjoy, and to develop quickly, while harm to any generation is not part of the plan. The body is where we learn the principles. The models and the boards are where those principles become inventions.</p>
          <p className="end">Living Oman 2040<small>From biological principles to regenerative systems for Oman.</small></p>
          <button type="button" className="text" onClick={() => { setChapter("question"); release(); }}>Begin again</button>
        </div>
      </section>

      <nav className="story" aria-label="The visit">
        {CHAPTERS.map(([id, index, label]) => (
          <button key={id} type="button" aria-current={chapter === id} onClick={() => setChapter(id)}>
            <small>{index}</small>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
