import { useEffect, useMemo, useRef, useState } from "react";
import { Roadmap } from "../nabd/Roadmap.jsx";
import { sitePath } from "../nabd/site.js";
import { LabMusic } from "./LabMusic.jsx";
import { mountCity } from "./cityWorld.js";
import { advanceHour, dayConditions, louvreState, prototypeDefaults, prototypeStep, PROTOTYPE_DISTRICTS, WEATHER } from "./citySims.js";

const SYSTEMS = [
  { id: "brain", n: "1", name: "Brain", role: "Smart city control", place: "Central civic building", points: ["The mast reads temperature and soil", "It decides when shade and the pump run", "One lit line leaves this entrance and reaches every system"] },
  { id: "heart", n: "2", name: "Heart", role: "Energy circulation", place: "Solar hub and district power", points: ["The panels face the sun and turn its light into power", "That power runs from the canopies out to the other systems", "Spare sun charges the battery cabinet beside the hub", "After sunset the battery runs the city until it is empty", "A closed road switches that district's lamp off"] },
  { id: "lungs", n: "3", name: "Lungs", role: "Air quality", place: "Air filter station", points: ["The fan draws air through the glass channel", "Dust stops at the filter cartridge", "The ribbon shows whether air is moving"] },
  { id: "skin", n: "4", name: "Skin", role: "Heat protection", place: "Adjustable shade canopy", points: ["Louvres on every roof close in step with the heat, not just on or off", "A servo and push rod tilt the slats one after another", "At night they open so the roofs can release the day's heat", "The roof surface warms when bare and cools under the slats", "The status light shows the mode: white open, amber closing, green shading, blue night"] },
  { id: "kidneys", n: "5", name: "Kidney", role: "Water conservation and purification", place: "Reservoir, filters and irrigation", points: ["The tower stores water and the level falls as it is used", "Sediment, carbon, then membrane clean the flow", "The clear line carries it to the beds", "Drips wet the soil only while the pump has power", "Greywater from the buildings is recovered into the tower, for irrigation only, never for drinking"] },
  { id: "digestive", n: "6", name: "Digestive system", role: "Efficient local agriculture", place: "Protected growing and drip irrigation", points: ["Crops grow inside a shaded greenhouse, out of the heat", "A drip line feeds each row at the soil", "Drops fall only while the pump is on", "The open bed beside it uses the same drip lines"] },
  { id: "liver", n: "7", name: "Liver", role: "Zero waste", place: "Waste sorting pavilion", points: ["Mixed waste drops from the hopper onto a moving belt", "The scanner arch reads each item and lights its stream colour", "A pusher sweeps it into its bay: blue recycling, yellow organic, green general", "The gauge on each bay rises as it fills", "A full recycling bay becomes a strapped bale beside the pavilion", "Organic waste feeds the compost drum, and the compost heap grows", "Your own choice drops into the bay you pick. A wrong one shows red contamination"] },
  { id: "skeleton", n: "8", name: "Skeleton", role: "Infrastructure", place: "Streets built for heat and water", points: ["A shaded walkway keeps people cool", "A separated cycle lane runs beside the road", "Water, power and drainage sit in one ordered duct", "Pale paving, deep curbs and a storm grate are built for local heat and rain"] },
];

const WASTE = [
  { id: "bottle", name: "Clean bottle", bin: "recyclable" },
  { id: "peel", name: "Fruit peel", bin: "organic" },
  { id: "wrapper", name: "Food wrapper", bin: "general" },
];

const clockText = (hour) => `${String(hour).padStart(2, "0")}:00`;
const TOUR_STEP_MS = 11000;
const TOUR_STEPS = [
  { id: "intro", kicker: "Living Oman 2040", title: "Welcome to Nabd City", ms: 9000, watch: "Eight systems borrowed from the human body keep this desert city cool, powered, watered and clean. Each stop sets up a moment so you can watch one of them work." },
  { id: "brain", system: "brain", setup: { hour: 13 }, watch: "The mast on the civic roof reads the heat and the soil. Past the heat line it lowers the shade, and when the soil dries it starts the pump. Follow the lit line from its door to every system." },
  { id: "heart", system: "heart", setup: { hour: 12, battery: 1.5 }, watch: "Sun rays strike the solar canopies and power flows into the hub. The spare sun charges the battery cabinet beside it. Watch its cells fill." },
  { id: "lungs", system: "lungs", setup: { hour: 11, weather: "dust", particles: 95 }, watch: "A dust storm rolls in. The fan pulls air through the filter, the ribbons lean into the hood, and the cartridge darkens as it catches dust." },
  { id: "skin", system: "skin", setup: { hour: 14, peakHeat: 46 }, watch: "A 46 degree afternoon. The roof louvres tilt shut one after another, and the roof stays far cooler than a bare one." },
  { id: "kidneys", system: "kidneys", setup: { hour: 10, moisture: 22, reservoir: 14 }, watch: "Dry soil starts the pump. Water leaves the tower through three filters, and lilac drops of recovered greywater top the tank back up." },
  { id: "digestive", system: "digestive", setup: { hour: 10, moisture: 22 }, watch: "Drip lines feed each row at the root. Drops fall only while the pump runs, so no water is sprayed into the hot air." },
  { id: "liver", system: "liver", setup: { hour: 11 }, demo: "sort", watch: "Waste rides the belt, the scanner lights its colour, and a pusher sweeps it into its bay. Full bays become bales and compost." },
  { id: "skeleton", system: "skeleton", setup: { hour: 10, roads: { north: true, east: true, south: false } }, watch: "The south road closes. Its lamp goes dark and water can no longer reach the beds. Every system depends on the city's frame." },
  { id: "outro", kicker: "Explore", title: "Over to you", ms: 9000, watch: "Click the city, run the day, or try a scenario. Every change is explained in the panel." },
];

function tourStepState(setup = {}) {
  const base = { ...prototypeDefaults(), ...setup };
  return { ...base, ...dayConditions(base.hour, base.capacity, base.peakHeat, base.weather) };
}

function tourCopy(step) {
  const system = SYSTEMS.find((entry) => entry.id === step.system);
  return {
    kicker: step.kicker || `${system.role} · ${system.place}`,
    title: step.title || `${system.n}. ${system.name}`,
    watch: step.watch,
  };
}

function tourDuration(step, narrate) {
  const base = step.ms || TOUR_STEP_MS;
  if (!narrate) return base;
  const words = `${tourCopy(step).title} ${step.watch}`.split(/\s+/).length;
  return Math.max(base, words * 430 + 1800);
}

const SCENARIOS = [
  { id: "noon", name: "Summer noon", system: "skin", set: { hour: 13, peakHeat: 46 }, watch: "Summer noon at 46°. Watch the louvres close and the roof stay cooler than a bare one." },
  { id: "dust", name: "Dust storm", system: "lungs", set: { hour: 11, weather: "dust", particles: 95 }, watch: "Dust storm. Solar output drops and the filter darkens as it catches dust." },
  { id: "dusk", name: "After sunset", system: "heart", set: { hour: 17, battery: 3.6 }, run: true, watch: "Sunset with a nearly full battery. Watch it carry the lamps into the night, then run out." },
  { id: "dry", name: "Dry spell", system: "kidneys", set: { hour: 9, moisture: 12, reservoir: 6 }, watch: "Dry soil and a low tower. The pump starts. Click the tower to refill it before it runs dry." },
  { id: "works", name: "Road works", system: "skeleton", set: { hour: 10, moisture: 20, roads: { north: true, east: true, south: false } }, watch: "The south road is cut. Water leaves the tower but never reaches the bed, and the south lamp goes dark." },
];

function scenarioState(scenario) {
  const base = { ...prototypeDefaults(), ...scenario.set };
  return { ...base, ...dayConditions(base.hour, base.capacity, base.peakHeat, base.weather) };
}

const CHART_LINES = [
  { key: "sun", label: "Sun", color: "#e6c06a" },
  { key: "battery", label: "Battery", color: "#7ec8a4" },
  { key: "soil", label: "Soil", color: "#7fb3d1" },
];

function DayChart({ history }) {
  const width = 240;
  const height = 64;
  const x = (index) => (index / 23) * width;
  const y = (value) => height - 4 - Math.max(0, Math.min(1, value)) * (height - 8);
  return (
    <figure className="city-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sun, battery and soil over the last hours">
        {history.map((entry, index) => (entry.sun === 0 ? <rect key={`n${entry.stamp}`} x={x(index) - width / 46} y="0" width={width / 23} height={height} className="is-night" /> : null))}
        {CHART_LINES.map((line) => (
          <polyline
            key={line.key}
            fill="none"
            stroke={line.color}
            strokeWidth="2"
            strokeLinejoin="round"
            points={history.map((entry, index) => `${x(index).toFixed(1)},${y(entry[line.key]).toFixed(1)}`).join(" ")}
          />
        ))}
      </svg>
      <figcaption>
        {CHART_LINES.map((line) => <span key={line.key} style={{ "--swatch": line.color }}>{line.label}</span>)}
        <span className="is-night">Night</span>
      </figcaption>
    </figure>
  );
}

function dayReport(history) {
  if (history.length < 24) return null;
  const day = history.slice(-24);
  const allLit = day.filter((entry) => entry.lamps === PROTOTYPE_DISTRICTS.length).length;
  const water = day.reduce((sum, entry) => sum + entry.water, 0);
  const cooler = Math.max(...day.map((entry) => entry.roofOpen - entry.roof));
  const low = Math.min(...day.map((entry) => entry.batteryKwh));
  return `Last 24 hours: every lamp lit for ${allLit} h · ${water.toFixed(1)} L reached the beds · roofs up to ${cooler.toFixed(0)}° cooler · battery low point ${low.toFixed(1)} kWh`;
}

function Range({ label, value, min, max, step = 1, unit = "", onChange }) {
  return (
    <label className="lab-range">
      <span>{label}<b>{value}{unit}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function litDistricts(state, live) {
  return PROTOTYPE_DISTRICTS.filter((district) => state.roads[district.id] && (live.served[district.id] ?? 0) + 0.05 >= state.demands[district.id]);
}

const LOUVRE_MODES = [["auto", "Automatic"], ["track", "Follow the sun"], ["manual", "Manual"]];

function louvreWord(closure) {
  return closure > 0.6 ? "closed" : closure > 0.05 ? "part-closed" : "open";
}

function readout(selected, state, live, sorted, item, louvre) {
  if (selected === "skin") return `Louvres ${Math.round(louvre.closure * 100)}% closed · roof ${louvre.roofTemp}° (open roof ${louvre.roofOpen}°) · ${louvre.blocked}% of sun heat blocked`;
  if (selected === "brain") return `${state.temp}° outside · soil ${state.moisture}% · shade ${live.shade ? "down" : "up"} · pump ${live.pump ? "on" : "off"}`;
  if (selected === "heart") {
    const store = live.storage ? `battery ${state.battery.toFixed(1)} of ${state.batteryMax} kWh${live.charged > 0 ? `, charging ${live.charged.toFixed(2)}` : live.drawn > 0 ? `, giving ${live.drawn.toFixed(2)}` : ""}` : "battery off";
    return `Sun ${live.solar.toFixed(2)} kW · using ${live.used.toFixed(2)} · ${store} · short ${live.unmet.toFixed(2)}`;
  }
  if (selected === "lungs") return `Fan ${live.fanOn ? "running" : "off"} · ribbon ${live.fanOn ? "moving" : "still"} · ${Math.round(live.caught)} of ${state.particles} dust caught`;
  if (selected === "kidneys") return `Reservoir ${state.reservoir} of 20 L · pump ${live.pump ? "on" : "off"} · ${live.delivered} L reach the bed · ${state.recovery ? `+${live.recovered} L greywater recovered` : "recovery off"}`;
  if (selected === "digestive") return `Soil ${state.moisture}% · growth ${state.growth} of 8 · drip ${live.delivered > 0 ? "flowing" : "dry"}`;
  if (selected === "liver") return `Next item: ${WASTE[item].name} · ${sorted.right} right, ${sorted.wrong} wrong`;
  return PROTOTYPE_DISTRICTS.map((district) => `${district.name} ${state.roads[district.id] ? "open" : "closed"}`).join(" · ");
}

function reasonFor(selected, live, state, louvre) {
  const [heat, soil, ...problems] = live.reasons;
  const about = (word) => problems.find((line) => line.includes(word));
  if (selected === "skin") {
    if (louvre.sun === 0) return "Night. Every louvre rests open so the roofs can release the day's heat to the sky.";
    if (!louvre.powered) return "The servos have no power, so the louvres rest open.";
    if (state.louvreMode === "manual") return `You set the slats to ${state.louvreManual}%. The servos hold that angle.`;
    if (state.louvreMode === "track") return "The slats follow the sun's height, and close further if the heat passes the threshold.";
    return state.temp >= state.shadeAt - 3
      ? `${state.temp}° is near or past ${state.shadeAt}°, so the slats close in step with the heat.`
      : `${state.temp}° is well under ${state.shadeAt}°, so the slats stay open for daylight.`;
  }
  if (live.solar === 0 && selected !== "liver") {
    if (live.drawn > 0) return `The sun is down. The battery is running the city on ${live.drawn.toFixed(2)} kW it stored during the day.`;
    if (!live.storage) return "The sun is down and storage is switched off, so pumps, fans and lamps wait for sunrise.";
    return "The sun is down and the battery is empty. Pumps, fans and lamps wait for sunrise.";
  }
  if (selected === "brain") return `${heat} ${soil}`;
  if (selected === "kidneys" || selected === "digestive") {
    const problem = about("running dry") || about("pump stayed off") || about("south road");
    if (problem) return problem;
    if (selected === "kidneys" && state.recovery) return `${soil} Recovered greywater tops up the tower for irrigation only, never for drinking.`;
    return soil;
  }
  if (selected === "lungs") return about("fan") || (live.fanOn ? "The fan has power, so air is drawn through the filter." : "The fan is switched off, so the ribbon hangs still.");
  if (selected === "heart" || selected === "skeleton") {
    const closed = about("dark") || about("hub");
    if (closed) return closed;
    if (live.unmet > 0.01) {
      return live.drawn > 0
        ? `The battery is giving its full ${live.drawn.toFixed(2)} kW and the city is still ${live.unmet.toFixed(2)} kW short. Add panels, a bigger battery, or lower a demand.`
        : "The sun cannot cover every district. Raise the panels, switch storage on, or lower a demand.";
    }
    if (live.drawn > 0) return `The battery covers the ${live.drawn.toFixed(2)} kW the panels cannot, so every open district stays lit.`;
    if (live.charged > 0) return `Every open district is lit, and the spare ${live.charged.toFixed(2)} kW is charging the battery.`;
    return "Every open district gets the power it asks for.";
  }
  return "Choose the stream for the item on the belt. The matching lid opens in the pavilion.";
}

function changes(before, after, state, beforeState, louvreBefore, louvreAfter) {
  const lines = [];
  if (!before) return lines;
  const wasLouvre = louvreWord(louvreBefore.closure);
  const nowLouvre = louvreWord(louvreAfter.closure);
  if (wasLouvre !== nowLouvre) {
    lines.push(louvreAfter.closure > louvreBefore.closure
      ? { tone: "good", text: `Roof louvres ${nowLouvre}. The roofs drop to ${louvreAfter.roofTemp}°.` }
      : { tone: louvreAfter.sun === 0 ? "info" : "bad", text: louvreAfter.sun === 0 ? "Roof louvres open for the night so the roofs can cool." : `Roof louvres ${nowLouvre}. The roofs warm to ${louvreAfter.roofTemp}°.` });
  }
  if (before.drawn === 0 && after.drawn > 0) lines.push({ tone: "info", text: `Battery takes over. It gives ${after.drawn.toFixed(2)} kW the panels cannot.` });
  if (beforeState.battery > 0.01 && state.battery <= 0.01 && after.storage) lines.push({ tone: "bad", text: "Battery empty. Only the sun can power the city now." });
  if (beforeState.battery < beforeState.batteryMax - 0.01 && state.battery >= state.batteryMax - 0.01 && state.batteryMax > 0) lines.push({ tone: "good", text: "Battery full. Extra sun is now spare." });
  if (beforeState.reservoir > 0.05 && state.reservoir <= 0.05) lines.push({ tone: "bad", text: "Reservoir empty. Click the tower to refill it." });
  if (beforeState.solar === 0 && after.solar > 0) lines.push({ tone: "good", text: "Sunrise. The panels start producing power." });
  if (beforeState.solar > 0 && after.solar === 0) lines.push({ tone: "bad", text: "Sunset. Solar output falls to zero." });
  if (after.shade !== before.shade) {
    const unpowered = !after.shade && state.temp >= state.shadeAt;
    lines.push(after.shade
      ? { tone: "good", text: `Shade deployed. ${state.temp}° reached the ${state.shadeAt}° line.` }
      : unpowered
        ? { tone: "bad", text: "Shade retracted. The servo has no power to hold it." }
        : { tone: "info", text: `Shade retracted. ${state.temp}° is under ${state.shadeAt}°.` });
  }
  if (after.pump !== before.pump) {
    const starved = after.reasons.some((line) => line.includes("pump stayed off"));
    lines.push(after.pump
      ? { tone: "good", text: `Pump on. Soil at ${state.moisture}% is drier than ${state.dryAt}%.` }
      : { tone: starved ? "bad" : "info", text: starved ? "Pump off. The hub had no power left for it." : `Pump off. The soil reached ${state.target}%.` });
  }
  if (after.fanOn !== before.fanOn) {
    lines.push(after.fanOn
      ? { tone: "good", text: "Fan on. Air moves through the filter." }
      : { tone: state.fan ? "bad" : "info", text: state.fan ? "Fan off. Not enough power for it." : "Fan switched off." });
  }
  PROTOTYPE_DISTRICTS.forEach((district) => {
    const was = (before.served[district.id] ?? 0) + 0.05 >= beforeState.demands[district.id] && beforeState.roads[district.id];
    const now = (after.served[district.id] ?? 0) + 0.05 >= state.demands[district.id] && state.roads[district.id];
    if (was === now) return;
    lines.push(now
      ? { tone: "good", text: `${district.name} lamp on.` }
      : { tone: "bad", text: `${district.name} lamp off. ${state.roads[district.id] ? "Not enough power reached it." : "Its road is closed."}` });
  });
  return lines;
}

export function PrototypeCity() {
  const [selected, setSelected] = useState("brain");
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(prototypeDefaults);
  const [item, setItem] = useState(0);
  const [wasteBin, setWasteBin] = useState("recyclable");
  const [sorted, setSorted] = useState({ right: 0, wrong: 0 });
  const [sortEvent, setSortEvent] = useState({ tick: 0, item: 0, bay: 0, right: true });
  const [focusTick, setFocusTick] = useState(0);
  const [homeTick, setHomeTick] = useState(0);
  const [hover, setHover] = useState(null);
  const [log, setLog] = useState([]);
  const [history, setHistory] = useState([]);
  const [tour, setTour] = useState(null);
  const [narrate, setNarrate] = useState(false);
  const [panelMin, setPanelMin] = useState(() => {
    try {
      return window.localStorage.getItem("nabd-city-panel") === "min";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("nabd-city-panel", panelMin ? "min" : "open");
    } catch {
      // Storage can be blocked; the panel still toggles for this visit.
    }
  }, [panelMin]);
  const tourRef = useRef(null);
  const baselineRef = useRef(null);
  const tourStep = tour ? tour.step : -1;
  const system = SYSTEMS.find((entry) => entry.id === selected);
  const live = useMemo(() => prototypeStep(state), [state]);
  const louvre = useMemo(() => louvreState({
    mode: state.louvreMode,
    manual: state.louvreManual,
    temp: state.temp,
    shadeAt: state.shadeAt,
    hour: state.hour,
    solar: state.solar,
  }), [state]);
  const host = useRef(null);
  const view = useRef({});
  const last = useRef(null);
  const actionRef = useRef(() => {});
  const hourRef = useRef(state.hour);
  const steppedRef = useRef(false);

  useEffect(() => {
    view.current = { ...state, selected, live, louvre, waste: wasteBin, sortEvent, focusTick, homeTick };
    hourRef.current = state.hour;
  }, [state, selected, live, louvre, wasteBin, sortEvent, focusTick, homeTick]);

  useEffect(() => {
    const before = last.current;
    last.current = { live, state, louvre };
    if (!before) return;
    const lines = changes(before.live, live, state, before.state, before.louvre, louvre);
    if (!lines.length) return;
    const stamped = lines.map((line, index) => ({ ...line, id: `${Date.now()}-${index}`, hour: state.hour }));
    setLog((current) => [...stamped.reverse(), ...current].slice(0, 4));
  }, [live, state, louvre]);

  useEffect(() => {
    if (!steppedRef.current) return;
    steppedRef.current = false;
    const entry = {
      stamp: `${Date.now()}-${state.hour}`,
      hour: state.hour,
      sun: state.capacity > 0 ? live.solar / state.capacity : 0,
      battery: state.batteryMax > 0 ? state.battery / state.batteryMax : 0,
      batteryKwh: state.battery,
      soil: state.moisture / 100,
      lamps: litDistricts(state, live).length,
      water: live.delivered,
      roof: louvre.roofTemp,
      roofOpen: louvre.roofOpen,
    };
    setHistory((current) => [...current, entry].slice(-24));
  }, [state, live, louvre]);

  useEffect(() => {
    const city = mountCity(host.current, {
      getState: () => view.current,
      onSelect: (id) => {
        setSelected(id);
        setFocusTick((value) => value + 1);
      },
      onHover: setHover,
      onAction: (action) => actionRef.current(action),
    });
    return () => city.dispose();
  }, []);

  function step() {
    steppedRef.current = true;
    setState((current) => advanceHour(current));
  }

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(step, 1100);
    return () => clearInterval(id);
  }, [running]);

  function focusSystem(id) {
    setSelected(id);
    setFocusTick((value) => value + 1);
  }

  function choose(id) {
    leaveTour();
    focusSystem(id);
  }

  function showStep(index) {
    const stop = TOUR_STEPS[index];
    last.current = null;
    setState(tourStepState(stop.setup));
    if (stop.system) focusSystem(stop.system);
    else setHomeTick((value) => value + 1);
    setTour({ step: index, paused: false });
  }

  function startTour() {
    baselineRef.current = { state: view.current, selected: view.current.selected, running };
    setRunning(false);
    showStep(0);
  }

  function silence() {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function leaveTour() {
    if (!tourRef.current) return;
    baselineRef.current = null;
    silence();
    setTour(null);
  }

  function endTour() {
    const saved = baselineRef.current;
    baselineRef.current = null;
    silence();
    setTour(null);
    if (!saved) return;
    const { live: _live, louvre: _louvre, selected: _selected, waste: _waste, sortEvent: _sort, focusTick: _focus, homeTick: _home, ...restored } = saved.state;
    last.current = null;
    setState(restored);
    setSelected(saved.selected);
    setRunning(saved.running);
    setHomeTick((value) => value + 1);
  }

  function nextStep() {
    const current = tourRef.current;
    if (!current) return;
    if (current.step + 1 >= TOUR_STEPS.length) endTour();
    else showStep(current.step + 1);
  }

  function previousStep() {
    const current = tourRef.current;
    if (current && current.step > 0) showStep(current.step - 1);
  }

  function togglePause() {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (synth && tourRef.current) {
      if (tourRef.current.paused) synth.resume();
      else synth.pause();
    }
    setTour((current) => (current ? { ...current, paused: !current.paused } : current));
  }

  function pauseTour() {
    if (!tourRef.current || tourRef.current.paused) return;
    togglePause();
  }

  useEffect(() => {
    tourRef.current = tour;
  }, [tour]);

  useEffect(() => {
    if (!tour || tour.paused) return undefined;
    const id = setTimeout(nextStep, tourDuration(TOUR_STEPS[tour.step], narrate));
    return () => clearTimeout(id);
  }, [tour, narrate]);

  useEffect(() => {
    if (tourStep < 0 || TOUR_STEPS[tourStep].demo !== "sort") return undefined;
    const id = setTimeout(() => setSortEvent((current) => ({ tick: current.tick + 1, item: 0, bay: 0, right: true })), 2200);
    return () => clearTimeout(id);
  }, [tourStep]);

  useEffect(() => {
    if (tourStep < 0 || !narrate || typeof window === "undefined" || !window.speechSynthesis) {
      silence();
      return;
    }
    const copy = tourCopy(TOUR_STEPS[tourStep]);
    window.speechSynthesis.cancel();
    const line = new SpeechSynthesisUtterance(`${copy.title}. ${copy.watch}`);
    line.lang = "en-GB";
    line.rate = 1;
    window.speechSynthesis.speak(line);
  }, [tourStep, narrate]);

  useEffect(() => silence, []);

  function patch(changesToApply) {
    setState((current) => ({ ...current, ...changesToApply }));
  }

  function setClock(hour) {
    setState((current) => ({ ...current, hour, ...dayConditions(hour, current.capacity, current.peakHeat, current.weather) }));
  }

  function note(tone, text) {
    setLog((current) => [{ id: `${Date.now()}-${Math.random()}`, hour: hourRef.current, tone, text }, ...current].slice(0, 4));
  }

  function setWeather(weather) {
    setState((current) => ({
      ...current,
      weather,
      particles: WEATHER[weather].dust ?? (current.weather === "dust" ? 40 : current.particles),
      ...dayConditions(current.hour, current.capacity, current.peakHeat, weather),
    }));
    const lines = {
      clear: "The sky clears. The panels reach full output again.",
      cloudy: "Cloud cover. Solar output falls by more than half.",
      dust: "Dust storm. Panels lose output and the air filter works harder.",
      heatwave: "Heatwave. Outdoor heat climbs 6° above normal.",
    };
    note(weather === "clear" ? "good" : "bad", lines[weather]);
  }

  function sort(bin) {
    setWasteBin(bin);
    const sample = WASTE[item];
    const right = bin === sample.bin;
    setSorted((current) => ({ right: current.right + (right ? 1 : 0), wrong: current.wrong + (right ? 0 : 1) }));
    setSortEvent((current) => ({ tick: current.tick + 1, item, bay: ["recyclable", "organic", "general"].indexOf(bin), right }));
    note(right ? "good" : "bad", right ? `${sample.name} sorted into ${bin}.` : `${sample.name} does not belong in ${bin}. It contaminates that stream.`);
    setItem((current) => (current + 1) % WASTE.length);
  }

  function handleAction(action) {
    const now = view.current;
    leaveTour();
    if (action.type === "road") {
      const open = !now.roads[action.road];
      setSelected("skeleton");
      patch({ roads: { ...now.roads, [action.road]: open } });
      note(open ? "good" : "bad", `${PROTOTYPE_DISTRICTS.find((d) => d.id === action.road)?.name || "Road"} road ${open ? "reopened" : "closed"} from the city.`);
    } else if (action.type === "refill") {
      setSelected("kidneys");
      patch({ reservoir: 20 });
      note("good", "Reservoir refilled to 20 L.");
    } else if (action.type === "fan") {
      setSelected("lungs");
      patch({ fan: !now.fan });
      note("info", now.fan ? "Air fan switched off from the station." : "Air fan switched on from the station.");
    } else if (action.type === "louvreMode") {
      const order = LOUVRE_MODES.map(([id]) => id);
      const next = order[(order.indexOf(now.louvreMode) + 1) % order.length];
      setSelected("skin");
      patch({ louvreMode: next });
      note("info", `Roof louvres set to ${LOUVRE_MODES.find(([id]) => id === next)[1].toLowerCase()}.`);
    } else if (action.type === "sort") {
      setSelected("liver");
      sort(action.bin);
    } else if (action.type === "district") {
      const on = now.demands[action.district] > 0;
      setSelected("heart");
      patch({ demands: { ...now.demands, [action.district]: on ? 0 : prototypeDefaults().demands[action.district] } });
      note("info", `${PROTOTYPE_DISTRICTS.find((d) => d.id === action.district)?.name} load ${on ? "switched off" : "switched back on"}.`);
    } else if (action.type === "battery") {
      setSelected("heart");
      patch({ storage: !now.storage });
      note("info", now.storage ? "Battery storage switched off from the cabinet." : "Battery storage switched on from the cabinet.");
    }
  }

  function playScenario(scenario) {
    leaveTour();
    setState(scenarioState(scenario));
    setRunning(Boolean(scenario.run));
    setHistory([]);
    setSorted({ right: 0, wrong: 0 });
    last.current = null;
    setSelected(scenario.system);
    setFocusTick((value) => value + 1);
    setLog(() => [{ id: `${Date.now()}-scenario`, hour: scenario.set.hour, tone: "info", text: scenario.watch }]);
  }

  useEffect(() => {
    actionRef.current = handleAction;
  });

  function reset() {
    setRunning(false);
    leaveTour();
    setState(prototypeDefaults());
    setSorted({ right: 0, wrong: 0 });
    setItem(0);
    setWasteBin("recyclable");
    setLog([]);
    setHistory([]);
    last.current = null;
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.target instanceof Element && event.target.closest("input, textarea, select, dialog")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (tourRef.current) {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          nextStep();
          return;
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          previousStep();
          return;
        }
        if (event.key === " ") {
          event.preventDefault();
          togglePause();
          return;
        }
        if (event.key === "Escape") {
          endTour();
          return;
        }
        leaveTour();
      }
      const match = SYSTEMS.find((entry) => entry.n === event.key);
      if (match) {
        choose(match.id);
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        setRunning((value) => !value);
      } else if (event.key === "s" || event.key === "S") {
        step();
      } else if (event.key === "r" || event.key === "R") {
        reset();
      } else if (event.key === "m" || event.key === "M") {
        setPanelMin((value) => !value);
      } else if (event.key === "o" || event.key === "O" || event.key === "Escape") {
        setHomeTick((value) => value + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hovered = hover ? SYSTEMS.find((entry) => entry.id === hover.id) : null;
  const night = live.solar === 0;
  const lit = litDistricts(state, live).length;
  const chips = [
    { label: `${state.weather !== "clear" ? `${WEATHER[state.weather].name} · ` : ""}${night ? "Night" : `Sun ${live.solar.toFixed(1)} kW`}`, tone: state.weather !== "clear" ? "bad" : night ? "off" : "on" },
    { label: `Louvres ${Math.round(louvre.closure * 100)}%`, tone: louvre.closure > 0.05 ? "on" : "off" },
    { label: live.pump ? "Pump on" : "Pump off", tone: live.pump ? "on" : "off" },
    { label: live.fanOn ? "Fan on" : "Fan off", tone: live.fanOn ? "on" : state.fan && !night ? "bad" : "off" },
    { label: `Lamps ${lit} of ${PROTOTYPE_DISTRICTS.length}`, tone: lit === PROTOTYPE_DISTRICTS.length ? "on" : "bad" },
    {
      label: !live.storage || state.batteryMax <= 0 ? "Battery off" : `Battery ${Math.round((state.battery / state.batteryMax) * 100)}%${live.charged > 0 ? " ↑" : live.drawn > 0 ? " ↓" : ""}`,
      tone: !live.storage || state.batteryMax <= 0 ? "off" : state.battery <= 0.01 && live.drawn === 0 ? "bad" : "on",
    },
  ];
  const report = dayReport(history);

  return (
    <div className={`city-screen${tour ? " is-touring" : ""}`}>
      <div ref={host} className="city-view" onPointerDown={pauseTour} />
      {tour ? (
        <section className={`city-tour${tour.paused ? " is-paused" : ""}`} aria-live="polite" aria-label="Guided tour">
          <header>
            <span>Guided tour · {tour.step + 1} of {TOUR_STEPS.length}</span>
            <div className="city-tour-tools">
              {typeof window !== "undefined" && window.speechSynthesis ? (
                <button type="button" aria-pressed={narrate} onClick={() => setNarrate((value) => !value)}>{narrate ? "Voice on" : "Voice off"}</button>
              ) : null}
              <button type="button" onClick={endTour}>End tour</button>
            </div>
          </header>
          <p className="city-tour-kicker">{tourCopy(TOUR_STEPS[tour.step]).kicker}</p>
          <h2>{tourCopy(TOUR_STEPS[tour.step]).title}</h2>
          <p className="city-tour-watch">{TOUR_STEPS[tour.step].system ? <b>Watch</b> : null}{TOUR_STEPS[tour.step].watch}</p>
          <div className="city-tour-nav">
            <button type="button" onClick={previousStep} disabled={tour.step === 0} aria-label="Previous stop">‹</button>
            <button type="button" className="city-tour-play" onClick={togglePause} aria-label={tour.paused ? "Resume tour" : "Pause tour"}>{tour.paused ? "▶" : "❚❚"}</button>
            <ol aria-label="Tour stops">
              {TOUR_STEPS.map((stop, index) => (
                <li key={stop.id}>
                  <button type="button" aria-current={index === tour.step ? "step" : undefined} className={index < tour.step ? "is-done" : ""} onClick={() => showStep(index)} aria-label={`Go to ${tourCopy(stop).title}`} />
                </li>
              ))}
            </ol>
            <button type="button" onClick={nextStep} aria-label={tour.step + 1 >= TOUR_STEPS.length ? "Finish tour" : "Next stop"}>{tour.step + 1 >= TOUR_STEPS.length ? "Finish" : "›"}</button>
          </div>
          {tour.paused ? <p className="city-tour-hint">Paused. Look around, then press play or use the arrow keys.</p> : null}
          <i key={tour.step} style={{ "--tour-ms": `${tourDuration(TOUR_STEPS[tour.step], narrate)}ms` }} />
        </section>
      ) : (
        <button type="button" className="city-tour-cta" onClick={startTour}>
          <span aria-hidden="true">▶</span>
          <span>
            <b>Start the guided tour</b>
            <small>About 2 minutes · all 8 systems shown live</small>
          </span>
        </button>
      )}
      {hovered ? (
        <p className="city-tip" style={{ left: hover.x + 14, top: hover.y + 14 }} aria-hidden="true">
          <b>{hovered.n}. {hovered.name}</b> {hover.hint || hovered.role}
        </p>
      ) : null}
      <a className="city-back" href={sitePath("/")}>← Nabd</a>
      <nav className="city-nav" aria-label="Prototype">
        <Roadmap />
        <LabMusic />
        <a className="city-lab" href={sitePath("/body")}>Human lab</a>
      </nav>
      <aside className="city-ui">
        <div className="city-systems">
          {SYSTEMS.map((entry) => (
            <button key={entry.id} type="button" aria-pressed={selected === entry.id} aria-label={`${entry.n}. ${entry.name}`} title={`${entry.name} · ${entry.role}`} onClick={() => choose(entry.id)}>
              {entry.n}
            </button>
          ))}
        </div>
        <div className={`city-card${panelMin ? " is-min" : ""}`} id="city-panel">
          <div className="city-card-head">
            <h2>{system.n}. {system.name}</h2>
            <span className={`city-clock${night ? " is-night" : ""}`}>{night ? "☾" : "☀"} {clockText(state.hour)}</span>
            <button
              type="button"
              className="city-min"
              aria-controls="city-panel"
              aria-expanded={!panelMin}
              aria-label={panelMin ? "Show the full panel" : "Minimise the panel"}
              title={panelMin ? "Show the full panel (M)" : "Minimise the panel (M)"}
              onClick={() => setPanelMin((value) => !value)}
            >
              {panelMin ? "+" : "–"}
            </button>
          </div>
          <p className="city-role">{system.role} · {system.place}</p>
          <ul className="city-chips" aria-label="City status">
            {chips.map((chip) => <li key={chip.label} className={`is-${chip.tone}`}>{chip.label}</li>)}
          </ul>
          <Range label="Time of day" value={state.hour} min={0} max={23} unit=":00" onChange={setClock} />
          <div className="lab-choice city-weather" role="group" aria-label="Weather">
            {Object.entries(WEATHER).map(([id, sky]) => (
              <button key={id} type="button" aria-pressed={state.weather === id} onClick={() => setWeather(id)}>{sky.name}</button>
            ))}
          </div>
          {selected === "brain" || selected === "skin" ? (
            <>
              <Range label={`Peak heat · now ${state.temp}°`} value={state.peakHeat} min={30} max={50} unit="°" onChange={(peakHeat) => setState((current) => ({ ...current, peakHeat, ...dayConditions(current.hour, current.capacity, peakHeat, current.weather) }))} />
              <Range label="Shade at" value={state.shadeAt} min={25} max={45} unit="°" onChange={(shadeAt) => patch({ shadeAt })} />
            </>
          ) : null}
          {selected === "skin" ? (
            <>
              <div className="lab-choice" role="group" aria-label="Louvre mode">
                {LOUVRE_MODES.map(([id, label]) => (
                  <button key={id} type="button" aria-pressed={state.louvreMode === id} onClick={() => patch({ louvreMode: id })}>{label}</button>
                ))}
              </div>
              {state.louvreMode === "manual" ? (
                <Range label="Slat angle" value={state.louvreManual} min={0} max={100} unit="% closed" onChange={(louvreManual) => patch({ louvreManual })} />
              ) : null}
              <div className="city-gauge" aria-label={`Roof ${louvre.roofTemp} degrees, open roof ${louvre.roofOpen} degrees`}>
                <span>Roof surface</span>
                <b style={{ "--level": `${Math.max(0, Math.min(100, ((louvre.roofOpen - 25) / 45) * 100))}%` }} className="is-open" />
                <b style={{ "--level": `${Math.max(0, Math.min(100, ((louvre.roofTemp - 25) / 45) * 100))}%` }} />
                <em>{louvre.roofTemp}° with louvres · {louvre.roofOpen}° bare</em>
              </div>
            </>
          ) : null}
          {selected === "brain" || selected === "kidneys" || selected === "digestive" ? (
            <>
              <Range label="Soil moisture" value={state.moisture} min={0} max={100} unit="%" onChange={(moisture) => patch({ moisture })} />
              <Range label="Water below" value={state.dryAt} min={15} max={60} unit="%" onChange={(dryAt) => patch({ dryAt })} />
            </>
          ) : null}
          {selected === "heart" ? (
            <>
              <Range label={`Panel size · now ${live.solar.toFixed(2)} kW`} value={state.capacity} min={0} max={5} step={0.1} unit=" kW" onChange={(capacity) => setState((current) => ({ ...current, capacity, ...dayConditions(current.hour, capacity, current.peakHeat, current.weather) }))} />
              <button type="button" className="lab-jump" aria-pressed={state.storage} onClick={() => patch({ storage: !state.storage })}>{state.storage ? "Battery storage on" : "Battery storage off"}</button>
              <Range label={`Battery size · holds ${state.battery.toFixed(1)}`} value={state.batteryMax} min={0} max={10} step={0.5} unit=" kWh" onChange={(batteryMax) => setState((current) => ({ ...current, batteryMax, battery: Math.min(current.battery, batteryMax) }))} />
              {PROTOTYPE_DISTRICTS.map((district) => (
                <Range
                  key={district.id}
                  label={`${district.name} · gets ${(live.served[district.id] ?? 0).toFixed(2)}`}
                  value={state.demands[district.id]}
                  min={0}
                  max={1.5}
                  step={0.1}
                  unit=" kW"
                  onChange={(need) => patch({ demands: { ...state.demands, [district.id]: need } })}
                />
              ))}
            </>
          ) : null}
          {selected === "lungs" ? (
            <>
              <button type="button" className="lab-jump" aria-pressed={state.fan} onClick={() => patch({ fan: !state.fan })}>{state.fan ? "Fan requested" : "Fan off"}</button>
              <Range label="Dust in the air" value={state.particles} min={0} max={100} onChange={(particles) => patch({ particles })} />
            </>
          ) : null}
          {selected === "kidneys" ? (
            <>
              <button type="button" className="lab-jump" onClick={() => patch({ reservoir: 20 })}>Refill the reservoir</button>
              <button type="button" className="lab-jump" aria-pressed={state.recovery} onClick={() => patch({ recovery: !state.recovery })}>{state.recovery ? "Greywater recovery on" : "Greywater recovery off"}</button>
            </>
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
                <button key={district.id} type="button" aria-pressed={state.roads[district.id]} onClick={() => patch({ roads: { ...state.roads, [district.id]: !state.roads[district.id] } })}>
                  {district.name}
                </button>
              ))}
            </div>
          ) : null}
          <p className="city-readout" aria-live="polite">{readout(selected, state, live, sorted, item, louvre)}</p>
          <p className="city-why">{reasonFor(selected, live, state, louvre)}</p>
          {log.length ? (
            <ol className="city-log" aria-label="What just changed">
              {log.map((entry) => <li key={entry.id} className={`is-${entry.tone}`}><time>{clockText(entry.hour)}</time>{entry.text}</li>)}
            </ol>
          ) : null}
          {history.length >= 2 ? <DayChart history={history} /> : <p className="city-chart-hint">Run the day or add hours to draw the 24-hour chart.</p>}
          {report ? <p className="city-report">{report}</p> : null}
          <div className="lab-testbar">
            <button type="button" aria-pressed={running} onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Run the day"}</button>
            <button type="button" onClick={step}>+1 hour</button>
            <button type="button" onClick={() => setHomeTick((value) => value + 1)}>Overview</button>
            <button type="button" onClick={reset}>Reset</button>
            <button type="button" aria-pressed={Boolean(tour)} onClick={() => (tour ? endTour() : startTour())}>{tour ? "End tour" : "Guided tour"}</button>
          </div>
          <div className="city-scenarios" role="group" aria-label="Try a scenario">
            <span>Try a scenario</span>
            {SCENARIOS.map((scenario) => (
              <button key={scenario.id} type="button" onClick={() => playScenario(scenario)}>{scenario.name}</button>
            ))}
          </div>
          <details className="city-how">
            <summary>How it works</summary>
            <ul>
              {system.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </details>
          <p className="city-keys">Click roads, the water tower, the air fan, roofs, bins, district lamps or the battery to use them · 1–8 systems · Space runs · S adds an hour · O overview · R reset · M minimises this panel</p>
        </div>
      </aside>
    </div>
  );
}
