import { useEffect, useRef, useState } from "react";
import { sitePath } from "../nabd/site.js";
import { mountCity } from "./cityWorld.js";
import { prototypeDefaults, prototypeStep, PROTOTYPE_DISTRICTS } from "./citySims.js";

const SYSTEMS = [
  { id: "brain", n: "1", name: "Brain", role: "Smart city control", place: "Central civic building", points: ["The mast reads temperature and soil", "It decides when shade and the pump run", "One lit line leaves this entrance and reaches every system"] },
  { id: "heart", n: "2", name: "Heart", role: "Energy circulation", place: "Solar hub and district power", points: ["The panels face the sun and turn its light into power", "That power runs from the canopies out to the other systems", "A closed road switches that district's lamp off"] },
  { id: "lungs", n: "3", name: "Lungs", role: "Air quality", place: "Air filter station", points: ["The fan draws air through the glass channel", "Dust stops at the filter cartridge", "The ribbon shows whether air is moving"] },
  { id: "skin", n: "4", name: "Skin", role: "Heat protection", place: "Adjustable shade canopy", points: ["Louvre roofs open when the city is hot", "A servo on each roof drives the slats", "The shade panel deploys over the hall"] },
  { id: "kidneys", n: "5", name: "Kidney", role: "Water conservation and purification", place: "Reservoir, filters and irrigation", points: ["The tower stores water and the level falls as it is used", "Sediment, carbon, then membrane clean the flow", "The clear line carries it to the beds", "Drips wet the soil only while the pump has power"] },
  { id: "digestive", n: "6", name: "Digestive system", role: "Efficient local agriculture", place: "Protected growing and drip irrigation", points: ["Crops grow inside a shaded greenhouse, out of the heat", "A drip line feeds each row at the soil", "Drops fall only while the pump is on", "The open bed beside it uses the same drip lines"] },
  { id: "liver", n: "7", name: "Liver", role: "Zero waste", place: "Waste sorting pavilion", points: ["The belt reads each item as it arrives", "Recycling goes to blue, organic to yellow, general to green", "The matching lid opens and the item drops in", "Each bay keeps only its own stream"] },
  { id: "skeleton", n: "8", name: "Skeleton", role: "Infrastructure", place: "Streets built for heat and water", points: ["A shaded walkway keeps people cool", "A separated cycle lane runs beside the road", "Water, power and drainage sit in one ordered duct", "Pale paving, deep curbs and a storm grate are built for local heat and rain"] },
];

const WASTE = [
  { id: "bottle", name: "Clean bottle", bin: "recyclable" },
  { id: "peel", name: "Fruit peel", bin: "organic" },
  { id: "wrapper", name: "Food wrapper", bin: "general" },
];

export function PrototypeCity() {
  const [selected, setSelected] = useState("brain");
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(prototypeDefaults);
  const [report, setReport] = useState(null);
  const [item, setItem] = useState(0);
  const [wasteBin, setWasteBin] = useState("recyclable");
  const [sorted, setSorted] = useState({ right: 0, wrong: 0 });
  const [focusTick, setFocusTick] = useState(0);
  const system = SYSTEMS.find((entry) => entry.id === selected);
  const host = useRef(null);
  const view = useRef({});
  view.current = { ...state, selected, live: report, waste: wasteBin, focusTick };

  useEffect(() => {
    const city = mountCity(host.current, {
      getState: () => view.current,
      onSelect: (id) => {
        setSelected(id);
        setFocusTick((value) => value + 1);
      },
    });
    return () => city.dispose();
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setState((current) => {
        const next = prototypeStep(current);
        setReport(next);
        return {
          temp: next.temp,
          moisture: next.moisture,
          shadeAt: next.shadeAt,
          dryAt: next.dryAt,
          target: next.target,
          pumpWas: next.pumpWas,
          solar: next.solar,
          fan: next.fan,
          demands: next.demands,
          roads: next.roads,
          reservoir: next.reservoir,
          particles: next.particles,
          growth: next.growth,
        };
      });
    }, 900);
    return () => clearInterval(id);
  }, [running]);

  function stepOnce() {
    const next = prototypeStep(state);
    setReport(next);
    setState({
      temp: next.temp,
      moisture: next.moisture,
      shadeAt: next.shadeAt,
      dryAt: next.dryAt,
      target: next.target,
      pumpWas: next.pumpWas,
      solar: next.solar,
      fan: next.fan,
      demands: next.demands,
      roads: next.roads,
      reservoir: next.reservoir,
      particles: next.particles,
      growth: next.growth,
    });
  }

  function reset() {
    setRunning(false);
    setState(prototypeDefaults());
    setReport(null);
    setSorted({ right: 0, wrong: 0 });
    setItem(0);
    setWasteBin("recyclable");
  }

  function sort(bin) {
    setWasteBin(bin);
    const sample = WASTE[item];
    setSorted((current) => ({
      right: current.right + (bin === sample.bin ? 1 : 0),
      wrong: current.wrong + (bin === sample.bin ? 0 : 1),
    }));
    setItem((current) => (current + 1) % WASTE.length);
  }

  const live = report;

  return (
    <div className="city-screen">
      <div ref={host} className="city-view" />
      <a className="city-back" href={sitePath("/")}>← Nabd</a>
      <a className="city-lab" href={sitePath("/body")}>Human lab</a>
      <aside className="city-ui">
        <div className="city-systems">
          {SYSTEMS.map((entry) => (
            <button key={entry.id} type="button" aria-pressed={selected === entry.id} onClick={() => { setSelected(entry.id); setFocusTick((value) => value + 1); }}>
              {entry.n}
            </button>
          ))}
        </div>
        <div className="city-card">
          <h2>{system.n}. {system.name}</h2>
          <p>{system.role}. {system.place}.</p>
          <ul>
            {system.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
          {selected === "heart" ? (
            <label className="lab-range"><span>Solar supply<b>{state.solar.toFixed(1)} kW</b></span>
              <input type="range" min={0} max={4} step={0.1} value={state.solar} onChange={(event) => setState({ ...state, solar: Number(event.target.value) })} />
            </label>
          ) : null}
          {selected === "brain" || selected === "skin" ? (
            <label className="lab-range"><span>Shade at<b>{state.shadeAt}°</b></span>
              <input type="range" min={25} max={45} value={state.shadeAt} onChange={(event) => setState({ ...state, shadeAt: Number(event.target.value) })} />
            </label>
          ) : null}
          {selected === "kidneys" || selected === "digestive" ? (
            <label className="lab-range"><span>Dry soil below<b>{state.dryAt}%</b></span>
              <input type="range" min={15} max={60} value={state.dryAt} onChange={(event) => setState({ ...state, dryAt: Number(event.target.value) })} />
            </label>
          ) : null}
          {selected === "lungs" ? (
            <button type="button" className="lab-jump" aria-pressed={state.fan} onClick={() => setState({ ...state, fan: !state.fan })}>{state.fan ? "Fan requested" : "Fan off"}</button>
          ) : null}
          {selected === "liver" ? (
            <div className="lab-choice">
              <button type="button" onClick={() => sort("recyclable")}>Recyclable</button>
              <button type="button" onClick={() => sort("organic")}>Organic</button>
              <button type="button" onClick={() => sort("general")}>General waste</button>
            </div>
          ) : null}
          {selected === "skeleton" ? (
            <div className="lab-choice">
              {PROTOTYPE_DISTRICTS.map((district) => (
                <button key={district.id} type="button" aria-pressed={state.roads[district.id]} onClick={() => setState({ ...state, roads: { ...state.roads, [district.id]: !state.roads[district.id] } })}>
                  {district.name}
                </button>
              ))}
            </div>
          ) : null}
          <div className="lab-testbar">
            <button type="button" aria-pressed={running} onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Run the city"}</button>
            <button type="button" onClick={stepOnce}>One hour</button>
            <button type="button" onClick={reset}>Reset</button>
          </div>
          <p>{live?.shade ? "Shade down" : "Shade up"} · Pump {live?.pump ? "on" : "off"} · Reservoir {state.reservoir} L · Ribbon {live?.fanOn ? "moving" : "still"} · Growth {state.growth}{selected === "liver" ? ` · Sort ${WASTE[item].name}: ${sorted.right} right` : ""}</p>
          <p>{live?.reasons?.[0] || "The model keeps moving. Drag to look around it. Run the city to drive shade, water and power."}</p>
        </div>
      </aside>
    </div>
  );
}
